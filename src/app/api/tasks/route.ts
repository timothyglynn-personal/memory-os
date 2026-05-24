import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("memory_tasks")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ tasks: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, bucket, sub_bucket, priority, parent_id, type, notes } = body;

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("memory_tasks")
    .insert({ title, bucket: bucket || "Personal", sub_bucket: sub_bucket || "", priority: priority || "medium", parent_id: parent_id || null, type: type || "task", notes: notes || "" })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ task: data });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return Response.json({ error: "Task ID is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("memory_tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ task: data });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Task ID is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("memory_tasks").delete().eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ deleted: id });
}
