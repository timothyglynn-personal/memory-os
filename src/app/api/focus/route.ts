import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("memory_focus").select("*");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ focus: data });
}

export async function POST(request: NextRequest) {
  const { task_id, timeframe } = await request.json();

  if (!task_id || !timeframe) {
    return Response.json({ error: "task_id and timeframe required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("memory_focus")
    .insert({ task_id, timeframe })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ focus: data });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Focus item ID required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("memory_focus").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ deleted: id });
}
