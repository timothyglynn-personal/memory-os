import { createClient } from "@supabase/supabase-js";

// Database Schema (create tables in Supabase later):
//
// tasks
// id uuid primary key default gen_random_uuid()
// title text not null
// bucket text not null default 'Personal'
// priority text default 'medium' (high/medium/low)
// status text default 'active' (active/completed/archived)
// parent_id uuid references tasks(id)
// sort_order integer default 0
// rolled_over_count integer default 0
// created_at timestamp default now()
// completed_at timestamp
//
// focus_layers
// id uuid primary key default gen_random_uuid()
// task_id uuid references tasks(id) on delete cascade
// timeframe text not null (today/week)
// created_at timestamp default now()

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
);
