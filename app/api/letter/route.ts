import { NextResponse } from "next/server";
import { templateLetter, type LetterFacts } from "@/lib/letter";


const PROMPT = (facts: LetterFacts) => `You are writing a short, warm monthly money letter for a personal finance app called Kit.
Write it as a letter from "future you" to ${facts.name}.

RULES:
- Use ONLY the numbers in the JSON below. Never invent, estimate, or recalculate numbers.
- Under 170 words. Plain, friendly language. No jargon.
- Structure: greeting, 1-2 sentences on the month, "The win:" line, "The risk:" line, "Three moves for this month:" as a numbered list (rewrite the provided actions, keep their dollar values), a one-line encouraging sign-off from "Future you".
- No markdown, no emojis. Start those two lines with exactly "The win:" and "The risk:".

FACTS (JSON):
${JSON.stringify(facts, null, 2)}`;

export async function POST(req: Request) {
  const facts = (await req.json()) as LetterFacts;
  const prompt = PROMPT(facts);
  const model = process.env.LLM_MODEL;

  try {
    if (process.env.ANTHROPIC_API_KEY) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: model || "claude-haiku-5-5",
          max_tokens: 700,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const j = await r.json();
      const text = j?.content?.[0]?.text;
      if (text) return NextResponse.json({ letter: text, source: "ai" });
      throw new Error(JSON.stringify(j).slice(0, 300));
    }
    if (process.env.OPENAI_API_KEY) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: model || "gpt-4o-mini", messages: [{ role: "user", content: prompt }] }),
      });
      const j = await r.json();
      const text = j?.choices?.[0]?.message?.content;
      if (text) return NextResponse.json({ letter: text, source: "ai" });
      throw new Error(JSON.stringify(j).slice(0, 300));
    }
    if (process.env.GEMINI_API_KEY) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-2.0-flash"}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      );
      const j = await r.json();
      const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return NextResponse.json({ letter: text, source: "ai" });
      throw new Error(JSON.stringify(j).slice(0, 300));
    }
  } catch (e) {
    console.error("Letter AI call failed, using template:", e);
  }
  return NextResponse.json({ letter: templateLetter(facts), source: "template" });
}
