// app/api/chat/route.ts
import { NextResponse } from 'next/server';

const GEMINI_API_BASE = process.env.GEMINI_API_BASE;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_TEMPERATURE = Number(process.env.GEMINI_TEMPERATURE || 0.0);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

type ToolResp = { ok?: boolean; reply?: string; [k: string]: any };

async function callGemini(messages: any[], temperature = GEMINI_TEMPERATURE) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

  const url = `${GEMINI_API_BASE}/v1/chat/completions`;
  const payload = { model: GEMINI_MODEL, messages, temperature, max_tokens: 400 };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GEMINI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Gemini call failed (${resp.status}): ${body}`);
  }

  const data = await resp.json();
  return data;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message: string | undefined = body?.message;
    if (!message) return NextResponse.json({ ok: false, error: 'message required' }, { status: 400 });

    const m = message.trim().toLowerCase();
    const greetingTokens = ['hi', 'hello', 'hey', 'hiya', 'good morning', 'good afternoon', 'good evening'];
    if (greetingTokens.some(g => m === g || m.startsWith(g + ' '))) {
      return NextResponse.json({
        ok: true,
        reply: "Hi! I'm your product assistant — try 'Tell me about Phone A' or 'Compare Phone A and Phone B'."
      });
    }

    // compare detection
    const compareRegex = /compare\s+(.+?)\s+(and|vs|v|\bvs\b)\s+(.+?)[\?\.]*$/i;
    const compareMatch = message.match(compareRegex);
    if (compareMatch) {
      const left = compareMatch[1].trim();
      const right = compareMatch[3].trim();
      try {
        const toolRespRaw = await fetch(`${BASE_URL}/api/tool/compare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ aName: left, bName: right })
        });

        const toolResp = (await toolRespRaw.json()) as ToolResp;
        if (toolResp.ok) {
          const system = { role: 'system', content: 'You are a helpful shopping assistant. Use the TOOL_RESULT as factual and produce a concise user-facing comparison.' };
          const toolMsg = { role: 'tool', content: JSON.stringify(toolResp) };
          const userMsg = { role: 'user', content: `User asked: Compare ${left} and ${right}. Provide a short comparison and recommendation.` };
          const messages = [system, toolMsg, userMsg];

          const llmResp = await callGemini(messages, 0.0);
          const finalText =
            llmResp?.choices?.[0]?.message?.content ??
            llmResp?.choices?.[0]?.text ??
            JSON.stringify(toolResp);

          return NextResponse.json({ ok: true, reply: String(finalText).trim() });
        } else {
          return NextResponse.json({ ok: false, error: 'compare tool error' }, { status: 500 });
        }
      } catch (e: any) {
        console.error('chat compare error', e);
        return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
      }
    }

    // product enquiry detection
    const asksProductRegex = /(tell me about|show|details|specs|price|battery|ram|storage|rating|what is)\s+(.+)/i;
    const pm = message.match(asksProductRegex);
    if (pm) {
      const query = pm[2].trim();
      try {
        const toolRespRaw = await fetch(`${BASE_URL}/api/tool/getData`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        const toolResp = (await toolRespRaw.json()) as ToolResp;

        if (toolResp.ok) {
          if (toolResp.product) {
            const p = toolResp.product;
            const system = { role: 'system', content: 'You are a helpful shopping assistant. Use the TOOL output as factual. Keep answer concise and factual.' };
            const toolMsg = { role: 'tool', content: JSON.stringify({ product: p }) };
            const userMsg = { role: 'user', content: `User asked: "${message}". Provide a 2-3 sentence product summary and one quick recommendation.` };
            const messages = [system, toolMsg, userMsg];

            const llmResp = await callGemini(messages, 0.0);
            const finalText = llmResp?.choices?.[0]?.message?.content ?? llmResp?.choices?.[0]?.text ?? `${p.name} — $${p.price}`;
            return NextResponse.json({ ok: true, reply: String(finalText).trim() });
          } else {
            const list = toolResp.results || [];
            if (list.length === 0) return NextResponse.json({ ok: true, reply: "I couldn't find that product. Try a different name or ask to compare products." });
            const reply = 'I found these products:\n' + list.slice(0, 3).map((p: any) => `• ${p.name} — $${p.price}`).join('\n');
            return NextResponse.json({ ok: true, reply });
          }
        } else {
          return NextResponse.json({ ok: false, error: 'getData tool error' }, { status: 500 });
        }
      } catch (e: any) {
        console.error('chat getData error', e);
        return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
      }
    }

    // fallback: general chit-chat via LLM
    try {
      const system = { role: 'system', content: 'You are a friendly shopping assistant. If product-related, recommend asking product queries.' };
      const userMsg = { role: 'user', content: message };
      const messages = [system, userMsg];
      const llmResp = await callGemini(messages, 0.7);
      const finalText = llmResp?.choices?.[0]?.message?.content ?? llmResp?.choices?.[0]?.text ?? 'I can help with product info.';
      return NextResponse.json({ ok: true, reply: String(finalText).trim() });
    } catch (e: any) {
      console.error('chat fallback error', e);
      return NextResponse.json({ ok: true, reply: "I can help with product info and comparisons. Try 'Tell me about Phone A'." });
    }
  } catch (e: any) {
    console.error('chat route error', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
