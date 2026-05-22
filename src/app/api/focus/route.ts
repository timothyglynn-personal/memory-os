import { NextRequest } from "next/server";

export async function GET() {
  // TODO: Fetch from Supabase
  // const { data } = await supabase.from('focus_layers').select('*');
  return Response.json({ focus: [], message: "Connect Supabase to enable server-side storage" });
}

export async function POST(request: NextRequest) {
  const { task_id, timeframe } = await request.json();

  if (!task_id || !timeframe) {
    return Response.json({ error: "task_id and timeframe required" }, { status: 400 });
  }

  if (!["today", "week"].includes(timeframe)) {
    return Response.json({ error: "timeframe must be 'today' or 'week'" }, { status: 400 });
  }

  // TODO: Insert into Supabase
  // const { data } = await supabase.from('focus_layers').insert({ task_id, timeframe }).select().single();

  return Response.json({ focus: { task_id, timeframe }, message: "Connect Supabase to persist" });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Focus item ID required" }, { status: 400 });
  }

  // TODO: Delete from Supabase
  // await supabase.from('focus_layers').delete().eq('id', id);

  return Response.json({ deleted: id, message: "Connect Supabase to persist" });
}
