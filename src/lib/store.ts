"use client";

import { Task, FocusItem } from "./types";

const TASKS_KEY = "memoryos_tasks";
const FOCUS_KEY = "memoryos_focus";
const BUCKETS_KEY = "memoryos_custom_buckets";

function generateId(): string {
  return crypto.randomUUID();
}

export function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(TASKS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function loadFocus(): FocusItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(FOCUS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveFocus(items: FocusItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FOCUS_KEY, JSON.stringify(items));
}

export function loadCustomBuckets(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(BUCKETS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveCustomBuckets(buckets: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BUCKETS_KEY, JSON.stringify(buckets));
}

export function createTask(
  tasks: Task[],
  data: Partial<Task> & { title: string }
): Task[] {
  const task: Task = {
    id: generateId(),
    title: data.title,
    notes: data.notes || "",
    bucket: data.bucket || "Personal",
    sub_bucket: data.sub_bucket || "",
    priority: data.priority || "medium",
    status: "active",
    type: data.type || "task",
    parent_id: data.parent_id || null,
    sort_order: data.sort_order || tasks.length,
    rolled_over_count: 0,
    created_at: new Date().toISOString(),
    completed_at: null,
  };
  const updated = [...tasks, task];
  saveTasks(updated);
  return updated;
}

export function updateTask(
  tasks: Task[],
  id: string,
  data: Partial<Task>
): Task[] {
  const updated = tasks.map((t) => (t.id === id ? { ...t, ...data } : t));
  saveTasks(updated);
  return updated;
}

export function deleteTask(tasks: Task[], id: string): Task[] {
  // Also delete children
  const childIds = tasks.filter((t) => t.parent_id === id).map((t) => t.id);
  let updated = tasks.filter((t) => t.id !== id && t.parent_id !== id);
  // Recursively delete grandchildren
  for (const childId of childIds) {
    updated = updated.filter((t) => t.parent_id !== childId);
  }
  saveTasks(updated);
  return updated;
}

export function addToFocus(
  focusItems: FocusItem[],
  taskId: string,
  timeframe: "today" | "week"
): FocusItem[] {
  // Don't add duplicates
  if (focusItems.some((f) => f.task_id === taskId && f.timeframe === timeframe))
    return focusItems;
  const item: FocusItem = {
    id: generateId(),
    task_id: taskId,
    timeframe,
    created_at: new Date().toISOString(),
  };
  const updated = [...focusItems, item];
  saveFocus(updated);
  return updated;
}

export function removeFromFocus(
  focusItems: FocusItem[],
  id: string
): FocusItem[] {
  const updated = focusItems.filter((f) => f.id !== id);
  saveFocus(updated);
  return updated;
}
