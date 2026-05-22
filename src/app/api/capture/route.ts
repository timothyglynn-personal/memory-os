import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `Parse these notes into structured tasks. For each task, determine:
- title: clear, actionable task title
- bucket: one of Professional, Career, Personal, Family, Health, Ideas, Someday
- priority: high, medium, or low

Return ONLY a JSON array of objects with those three fields. No other text.
Example: [{"title": "Schedule dentist appointment", "bucket": "Health", "priority": "medium"}]`;

export async function POST(request: NextRequest) {
  const { text, model } = await request.json();

  if (!text) {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  try {
    let tasks;

    if (model === "gpt-4") {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.3,
      });
      const content = completion.choices[0]?.message?.content || "[]";
      tasks = JSON.parse(content);
    } else {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: text }],
      });
      const content =
        message.content[0].type === "text" ? message.content[0].text : "[]";
      tasks = JSON.parse(content);
    }

    // TODO: When Supabase is connected, insert tasks here
    // for (const task of tasks) {
    //   await supabase.from('tasks').insert({ title: task.title, bucket: task.bucket, priority: task.priority });
    // }

    return Response.json({ tasks });
  } catch (error) {
    console.error("Capture error:", error);
    return Response.json(
      { error: "Failed to process text. Check API keys." },
      { status: 500 }
    );
  }
}
