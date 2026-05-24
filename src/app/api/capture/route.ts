import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const SYSTEM_PROMPT = `Parse these notes into structured tasks. The input may be messy, unstructured, or stream-of-consciousness. Extract every actionable item.

For each task, determine:
- title: clear, actionable task title
- bucket: one of Professional, Career, Personal, Family, Health, Ideas, Someday
- sub_bucket: if it clearly relates to a specific project or area within the bucket, name it (e.g. "Marketplaces", "SaaS", "Fitness"). Otherwise leave empty string.
- priority: high, medium, or low
- notes: any extra context from the original text that helps understand what needs to be done

Return ONLY a JSON array of objects with those five fields. No other text.
Example: [{"title": "Schedule dentist appointment", "bucket": "Health", "sub_bucket": "", "priority": "medium", "notes": "Dr. Smith's office, need to call before Friday"}]`;

export async function POST(request: NextRequest) {
  const { text, model } = await request.json();

  if (!text) {
    return new Response(JSON.stringify({ error: "Text is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    let tasks;

    if (model === "gpt4" || model === "gpt-4") {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.3,
      });
      let content = completion.choices[0]?.message?.content || "[]";
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      tasks = JSON.parse(content);
    } else {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: text }],
      });
      let content = message.content[0].type === "text" ? message.content[0].text : "[]";
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      tasks = JSON.parse(content);
    }

    // Persist to Supabase
    const supabase = createAdminClient();
    const rows = tasks.map((t: { title: string; bucket?: string; sub_bucket?: string; priority?: string; notes?: string }, i: number) => ({
      title: t.title,
      bucket: t.bucket || "Personal",
      sub_bucket: t.sub_bucket || "",
      priority: t.priority || "medium",
      notes: t.notes || "",
      sort_order: i,
    }));
    const { error: insertError } = await supabase.from("memory_tasks").insert(rows);
    if (insertError) console.error("Supabase insert error:", insertError.message);

    return new Response(JSON.stringify({ tasks, count: tasks.length, persisted: !insertError }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("Capture error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process text. Check API keys." }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
