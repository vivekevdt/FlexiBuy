// app/api/chat/route.ts
import { NextResponse } from "next/server";

const GEMINI_API_BASE = process.env.GEMINI_API_BASE!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_TEMPERATURE = Number(process.env.GEMINI_TEMPERATURE || 0.0);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

type ToolResp = { ok?: boolean; reply?: string; [k: string]: any };

function parseLLM(resp: any, fallback: string) {
  return (
    resp?.choices?.[0]?.message?.content ||
    resp?.choices?.[0]?.text ||
    fallback
  ).toString();
}

async function callGemini(messages: any[], temperature = GEMINI_TEMPERATURE) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

  const payload = {
    model: GEMINI_MODEL,
    messages,
    temperature,
    max_tokens: 1024,
  };

  const res = await fetch(`${GEMINI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Gemini Error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

function buildMessages({
  history,
  system,
  extraSystem,
  userMsg,
  maxHistory = 12,
}: {
  history?: any[];
  system: any;
  extraSystem?: any;
  userMsg: any;
  maxHistory?: number;
}) {
  if (history?.length) {
    const hasSystem = history.some((m) => m.role === "system");
    const base = hasSystem ? [...history] : [system, ...history];

    if (extraSystem) base.push(extraSystem);
    base.push(userMsg);

    const sys = base.find((m) => m.role === "system")!;
    const rest = base.filter((m) => m.role !== "system").slice(-maxHistory);

    return [sys, ...rest];
  }

  return extraSystem
    ? [system, extraSystem, userMsg]
    : [system, userMsg];
}

async function runTool(path: string, payload: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const history = Array.isArray(body?.messages) ? body.messages : undefined;
    const message = body?.message?.trim();

    if (!message)
      return NextResponse.json({ ok: false, error: "message required" });

    const lower = message.toLowerCase();

    // Quick greeting handler
    const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"];
    if (greetings.some((g) => lower === g || lower.startsWith(g + " "))) {
      const reply =
        "Hi! I'm your product assistant — ask about any product or say 'Compare Phone A and Phone B'.";
      return NextResponse.json({
        ok: true,
        reply,
        assistantMessage: { role: "assistant", content: reply },
      });
    }

    // =====================
    //  PRODUCT COMPARISON
    // =====================
    const compareMatch = message.match(/compare\s+(.+?)\s+(and|vs|v)\s+(.+)/i);
    if (compareMatch) {
      const left = compareMatch[1].trim();
      const right = compareMatch[3].trim();

      const tool = await runTool("/api/tool/compare", {
        aName: left,
        bName: right,
      });

      if (!tool.ok) {
        return NextResponse.json({ ok: false, error: "compare tool error" });
      }

      const system = {
        role: "system",
        content:
          "You are a helpful shopping assistant. Use TOOL_RESULT as factual and produce a concise comparison.",
      };

      const toolMsg = {
        role: "system",
        content: `TOOL_RESULT:\nA:${tool.a.name}\nB:${tool.b.name}\nA_specs:${JSON.stringify(tool.a)}\nB_specs:${JSON.stringify(tool.b)}\nDIFFS:${JSON.stringify(tool.comparison.diffs)}\nRECOMMENDATION:${tool.comparison.recommendation}`,
      };

      const userMsg = {
        role: "user",
        content: `User asked: Compare ${left} and ${right}.`,
      };

      const msgs = buildMessages({
        history,
        system,
        userMsg,
        extraSystem: toolMsg,
      });

      const llm = await callGemini(msgs);
      const finalText = parseLLM(llm, tool.comparison.recommendation);

      return NextResponse.json({
        ok: true,
        reply: finalText,
        assistantMessage: { role: "assistant", content: finalText },
      });
    }

    // =====================
    //  PRODUCT DETAILS
    // =====================
    const askMatch = message.match(
      /(tell me about|about|details|specs|price|battery|ram|storage|rating|what is)\s+(.+)/i
    );

    if (askMatch) {
      const query = askMatch[2].trim();

      const tool = await runTool("/api/tool/getData", { query });

      if (!tool.ok)
        return NextResponse.json({ ok: false, error: "getData tool error" });

      // Found exact product
      if (tool.product) {
        const p = tool.product;

        const system = {
          role: "system",
          content:
            "You are a helpful shopping assistant. Use TOOL output as factual. Keep answer concise.",
        };

        const toolMsg = { role: "system", content: JSON.stringify({ product: p }) };
        const userMsg = {
          role: "user",
          content: `User asked: "${message}". Provide a brief product summary + quick recommendation.`,
        };

        const msgs = buildMessages({
          history,
          system,
          userMsg,
          extraSystem: toolMsg,
        });

        const llm = await callGemini(msgs);
        const finalText = parseLLM(llm, `${p.name} — $${p.price}`);

        return NextResponse.json({
          ok: true,
          reply: finalText,
          assistantMessage: { role: "assistant", content: finalText },
        });
      }

      // Multiple possible products
      const results = tool.results || [];
      if (results.length === 0) {
        return NextResponse.json({
          ok: true,
          reply: "No matching product found.",
          assistantMessage: { role: "assistant", content: "No matching product found." },
        });
      }

      const reply =
        "I found these products:\n" +
        results.slice(0, 3).map((p: any) => `• ${p.name} — $${p.price}`).join("\n");

      return NextResponse.json({
        ok: true,
        reply,
        assistantMessage: { role: "assistant", content: reply },
      });
    }

    // =====================
    //  FALLBACK CHAT
    // =====================
    const system = {
      role: "system",
      content: "You are a friendly shopping assistant.",
    };

    const userMsg = { role: "user", content: message };

    const msgs = buildMessages({ history, system, userMsg });

    const llm = await callGemini(msgs, 0.7);
    const finalText = parseLLM(llm, "I can help with product info.");

    return NextResponse.json({
      ok: true,
      reply: finalText,
      assistantMessage: { role: "assistant", content: finalText },
    });
  } catch (err: any) {
    console.error("chat route error", err);
    return NextResponse.json({ ok: false, error: err.message || "Error" });
  }
}
