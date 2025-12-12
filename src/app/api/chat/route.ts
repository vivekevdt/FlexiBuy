// app/api/chat/route.ts
import { NextResponse } from "next/server";

const GEMINI_API_BASE = process.env.GEMINI_API_BASE;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_TEMPERATURE = Number(process.env.GEMINI_TEMPERATURE || 0.0);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/** Small helper type for tool responses */
type ToolResp = { ok?: boolean; reply?: string; [k: string]: any };

/** Calls Gemini/OpenAI-like chat completions */
async function callGemini(messages: any[], temperature = GEMINI_TEMPERATURE) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const url = `${GEMINI_API_BASE}/chat/completions`;
  const payload = {
    model: GEMINI_MODEL,
    messages,
    temperature,
    max_tokens: 1024,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });


  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Gemini call failed (${resp.status}): ${body}`);
  }

  const data = await resp.json();
  return data;
}

/** Merge/construct messages to send to LLM:
 * - If clientHistory provided, use it (but ensure a system message exists).
 * - Otherwise fall back to building the minimal messages as before.
 * - Always keep history length bounded to avoid token explosion.
 */
function buildMessages({
  clientHistory,
  system,
  extraSystem, // optional tool/system message (e.g. TOOL_RESULT)
  userMsg,
  maxHistory = 12,
}: {
  clientHistory?: any[];
  system: any;
  extraSystem?: any | null;
  userMsg: any;
  maxHistory?: number;
}) {
  // prefer client history when available
  if (Array.isArray(clientHistory) && clientHistory.length > 0) {
    // ensure a system message is present at the beginning
    const hasSystem = clientHistory.some((m) => m.role === "system");
    // clone to avoid mutating caller's object
    const base = hasSystem ? [...clientHistory] : [system, ...clientHistory];

    // append extraSystem (tool/system) and user message at the end
    if (extraSystem) base.push(extraSystem);
    base.push(userMsg);

    // trim to last `maxHistory` turns but keep the first system message
    const sys = base.filter((m) => m.role === "system")[0];
    const rest = base.filter((m) => m.role !== "system");
    const trimmed = rest.slice(-maxHistory);
    return [sys, ...trimmed];
  }

  // no client history: build from scratch
  const arr = extraSystem ? [system, extraSystem, userMsg] : [system, userMsg];
  // keep last maxHistory messages (plus system)
  const sys = arr[0];
  const rest = arr.slice(1).slice(-maxHistory);
  return [sys, ...rest];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // accept optional client-provided chat history: [{role, content}, ...]
    const clientHistory: any[] | undefined = Array.isArray(body?.messages)
      ? body.messages
      : undefined;

    const message: string | undefined = body?.message;
    if (!message)
      return NextResponse.json(
        { ok: false, error: "message required" },
        { status: 400 }
      );

    const m = message.trim().toLowerCase();
    const greetingTokens = [
      "hi",
      "hello",
      "hey",
      "hiya",
      "good morning",
      "good afternoon",
      "good evening",
    ];
    if (greetingTokens.some((g) => m === g || m.startsWith(g + " "))) {
      const assistantText =
        "Hi! I'm your product assistant — try 'Tell me about Phone A' or 'Compare Phone A and Phone B'.";
      return NextResponse.json({
        ok: true,
        reply: assistantText,
        assistantMessage: { role: "assistant", content: assistantText },
      });
    }

    // --- compare detection ---
    const compareRegex = /compare\s+(.+?)\s+(and|vs|v|\bvs\b)\s+(.+?)[\?\.]*$/i;
    const compareMatch = message.match(compareRegex);
    if (compareMatch) {
      const left = compareMatch[1].trim();
      const right = compareMatch[3].trim();
      try {
        const toolRespRaw = await fetch(`${BASE_URL}/api/tool/compare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aName: left, bName: right }),
        });

        const toolResp = (await toolRespRaw.json()) as ToolResp;
        if (toolResp.ok) {
          const system = {
            role: "system",
            content:
              "You are a helpful shopping assistant. Use the TOOL_RESULT as factual and produce a concise user-facing comparison.",
          };
          const toolMsg = {
            role: "system",
            content:
              "TOOL_RESULT:\n" +
              `A: ${toolResp.a.name}\n` +
              `B: ${toolResp.b.name}\n` +
              `A_specs: price=${toolResp.a.price}, battery=${toolResp.a.battery_hours}, ram=${toolResp.a.ram_gb}, storage=${toolResp.a.storage_gb}, rating=${toolResp.a.rating}\n` +
              `B_specs: price=${toolResp.b.price}, battery=${toolResp.b.battery_hours}, ram=${toolResp.b.ram_gb}, storage=${toolResp.b.storage_gb}, rating=${toolResp.b.rating}\n` +
              `DIFFS: ${JSON.stringify(toolResp.comparison.diffs)}\n` +
              `RECOMMENDATION: ${toolResp.comparison.recommendation}`,
          };
          const userMsg = {
            role: "user",
            content: `User asked: Compare ${left} and ${right}. Provide a short comparison and recommendation.`,
          };

          // build messages using client history if provided
          const messages = buildMessages({
            clientHistory,
            system,
            extraSystem: toolMsg,
            userMsg,
            maxHistory: 12,
          });

          const llmResp = await callGemini(messages, 0.0);
          const finalText =
            llmResp?.choices?.[0]?.message?.content ??
            llmResp?.choices?.[0]?.text ??
            JSON.stringify(toolResp);


          return NextResponse.json({
            ok: true,
            reply: String(finalText).trim(),
            assistantMessage: { role: "assistant", content: String(finalText).trim() },
          });
        } else {
          return NextResponse.json(
            { ok: false, error: "compare tool error" },
            { status: 500 }
          );
        }
      } catch (e: any) {
        console.error("chat compare error", e);
        return NextResponse.json(
          { ok: false, error: e?.message || String(e) },
          { status: 500 }
        );
      }
    }

    // --- product enquiry detection ---
    const asksProductRegex =
      /(tell me about|about|show|details|specs|price|battery|ram|storage|rating|what is)\s+(.+)/i;
    const pm = message.match(asksProductRegex);
    if (pm) {
      const query = pm[2].trim();
      try {
        const toolRespRaw = await fetch(`${BASE_URL}/api/tool/getData`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const toolResp = (await toolRespRaw.json()) as ToolResp;

        if (toolResp.ok) {
          if (toolResp.product) {
            const p = toolResp.product;
            const system = {
              role: "system",
              content:
                "You are a helpful shopping assistant. Use the TOOL output as factual. Keep answer concise and factual.",
            };
            const toolMsg = {
              role: "system",
              content: JSON.stringify({ product: p }),
            };
            const userMsg = {
              role: "user",
              content: `User asked: "${message}". Provide a 2-3 sentence product summary and one quick recommendation.`,
            };

            const messages = buildMessages({
              clientHistory,
              system,
              extraSystem: toolMsg,
              userMsg,
              maxHistory: 12,
            });

            const llmResp = await callGemini(messages, 0.0);
            const finalText =
              llmResp?.choices?.[0]?.message?.content ??
              llmResp?.choices?.[0]?.text ??
              `${p.name} — $${p.price}`;
            return NextResponse.json({
              ok: true,
              reply: String(finalText).trim(),
              assistantMessage: { role: "assistant", content: String(finalText).trim() },
            });
          } else {
            const list = toolResp.results || [];
            if (list.length === 0)
              return NextResponse.json({
                ok: true,
                reply:
                  "I couldn't find that product. Try a different name or ask to compare products.",
              });
            const reply =
              "I found these products:\n" +
              list
                .slice(0, 3)
                .map((p: any) => `• ${p.name} — $${p.price}`)
                .join("\n");
            return NextResponse.json({
              ok: true,
              reply,
              assistantMessage: { role: "assistant", content: reply },
            });
          }
        } else {
          return NextResponse.json(
            { ok: false, error: "getData tool error" },
            { status: 500 }
          );
        }
      } catch (e: any) {
        console.error("chat getData error", e);
        return NextResponse.json(
          { ok: false, error: e?.message || String(e) },
          { status: 500 }
        );
      }
    }

    // --- fallback chit-chat ---
    try {
      const system = {
        role: "system",
        content:
          "You are a friendly shopping assistant. If product-related, recommend asking product queries.",
      };
      const userMsg = { role: "user", content: message };
      const messages = buildMessages({ clientHistory, system, userMsg, maxHistory: 12 });
      const llmResp = await callGemini(messages, 0.7);
      const finalText =
        llmResp?.choices?.[0]?.message?.content ??
        llmResp?.choices?.[0]?.text ??
        "I can help with product info.";
      return NextResponse.json({
        ok: true,
        reply: String(finalText).trim(),
        assistantMessage: { role: "assistant", content: String(finalText).trim() },
      });
    } catch (e: any) {
      console.error("chat fallback error", e);
      return NextResponse.json({
        ok: true,
        reply:
          "I can help with product info and comparisons. Try 'Tell me about Phone A'.",
      });
    }
  } catch (e: any) {
    console.error("chat route error", e);
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
