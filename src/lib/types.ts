export interface Task {
  id: string;
  title: string;
  bucket: string;
  priority: "high" | "medium" | "low";
  status: "active" | "completed" | "archived";
  parent_id: string | null;
  sort_order: number;
  rolled_over_count: number;
  created_at: string;
  completed_at: string | null;
}

export interface FocusItem {
  id: string;
  task_id: string;
  timeframe: "today" | "week";
  created_at: string;
}

export const BUCKETS = [
  "Professional",
  "Career",
  "Personal",
  "Family",
  "Health",
  "Ideas",
  "Someday",
] as const;

export type BucketName = (typeof BUCKETS)[number] | string;
