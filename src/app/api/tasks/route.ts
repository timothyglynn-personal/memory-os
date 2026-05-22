import { NextRequest } from "next/server";

// API routes ready for Supabase connection.
// Currently, the app uses localStorage on the client side.
// When Supabase is connected, these routes will handle persistence.

export async function GET() {
  // TODO: Fetch from Supabase
  // const { data, error } = await supabase.from('tasks').select('*').order('sort_order');
  return Response.json({ tasks: [], message: "Connect Supabase to enable server-side storage" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, bucket, priority, parent_id } = body;

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  // TODO: Insert into Supabase
  // const { data, error } = await supabase.from('tasks').insert({
  //   title, bucket, priority, parent_id
  // }).select().single();

  return Response.json({
    task: { title, bucket, priority, parent_id },
    message: "Connect Supabase to persist",
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return Response.json({ error: "Task ID is required" }, { status: 400 });
  }

  // TODO: Update in Supabase
  // const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();

  return Response.json({ task: { id, ...updates }, message: "Connect Supabase to persist" });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Task ID is required" }, { status: 400 });
  }

  // TODO: Delete from Supabase
  // await supabase.from('tasks').delete().eq('id', id);

  return Response.json({ deleted: id, message: "Connect Supabase to persist" });
}
