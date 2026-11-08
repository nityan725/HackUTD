import { NextResponse } from "next/server";
import { AI_PROMPT, describe, parseLocally, sanitize } from "@/lib/whatif";

// Body: { question, bills: string[] } → { actions, understood, source }
// AI (if a key is set) only turns the question into structured actions.
// If there's no key or the AI fails, the built-in parser is used instead.
export async function POST(req: Request) {
  const { question, bills } = await req.json().catch(() => ({}));
  const q = String(question || "").slice(0, 300);
  const billNames: string[] = Array.isArray(bills) ? bills.map(String).slice(0, 30) : [];

  const ai = await askAI(AI_PROMPT(q, billNames)).catch(() => null);
  if (ai) {
    try {
      const json = JSON.parse(ai.slice(ai.indexOf("{"), ai.lastIndexOf("}") + 1));
      const actions = sanitize(json.actions);
      if (actions.length) return NextResponse.json({ actions, understood: actions.map(describe), source: "ai" });
    } catch {
      /* fall through to the built-in parser */
    }
  }
  const local = parseLocally(q, billNames);
  return NextResponse.json({ ...local, source: "local" });
}

async function askAI(prompt: string): Promise<string | null> {
  const model = process.env.LLM_MODEL;
  if (process.env.ANTHROPIC_API_KEY) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: model || "claude-haiku-5-5", max_tokens: 400, messages: [{ role: "user", content: prompt }] }),
    });
    return (await r.json())?.content?.[0]?.text ?? null;
  }
  if (process.env.OPENAI_API_KEY) {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: model || "gpt-4o-mini", messages: [{ role: "user", content: prompt }] }),
    });
    return (await r.json())?.choices?.[0]?.message?.content ?? null;
  }
  if (process.env.GEMINI_API_KEY) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-2.0-flash"}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) },
    );
    return (await r.json())?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  }
  return null;
}
