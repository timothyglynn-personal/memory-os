"use client";

import { useEffect, useState, useCallback } from "react";
import { Task, FocusItem, BUCKETS } from "@/lib/types";
import {
  loadTasks,
  loadFocus,
  saveFocus,
  loadCustomBuckets,
  saveCustomBuckets,
  createTask,
  updateTask,
  deleteTask,
  addToFocus,
  removeFromFocus,
} from "@/lib/store";
import FocusPanel from "@/components/FocusPanel";
import QuickCapture from "@/components/QuickCapture";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusItems, setFocusItems] = useState<FocusItem[]>([]);
  const [customBuckets, setCustomBuckets] = useState<string[]>([]);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedBuckets, setExpandedBuckets] = useState<Set<string>>(new Set(BUCKETS));
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [newSubBucket, setNewSubBucket] = useState<{ bucket: string } | null>(null);
  const [newSubBucketName, setNewSubBucketName] = useState("");
  const [newTaskInput, setNewTaskInput] = useState<{ bucket: string; subBucket: string } | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showFocus, setShowFocus] = useState(false);

  useEffect(() => {
    // Load from Supabase via API
    fetch("/api/tasks").then(r => r.json()).then(data => {
      if (data.tasks?.length > 0) {
        setTasks(data.tasks);
      } else {
        setTasks(loadTasks()); // fallback to localStorage
      }
    }).catch(() => setTasks(loadTasks()));

    fetch("/api/focus").then(r => r.json()).then(data => {
      if (data.focus?.length > 0) {
        setFocusItems(data.focus);
      } else {
        setFocusItems(loadFocus());
      }
    }).catch(() => setFocusItems(loadFocus()));

    setCustomBuckets(loadCustomBuckets());
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCaptureOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCreateTask = useCallback((data: Partial<Task> & { title: string }) => {
    setTasks((prev) => createTask(prev, data));
    // Also persist to Supabase
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => {});
  }, []);

  const handleUpdateTask = useCallback((id: string, data: Partial<Task>) => {
    setTasks((prev) => updateTask(prev, id, data));
    fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    }).catch(() => {});
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    setTasks((prev) => deleteTask(prev, id));
    setFocusItems((prev) => { const u = prev.filter((f) => f.task_id !== id); saveFocus(u); return u; });
    fetch(`/api/tasks?id=${id}`, { method: "DELETE" }).catch(() => {});
  }, []);

  const handleAddToFocus = useCallback((taskId: string, timeframe: "today" | "week") => {
    setFocusItems((prev) => addToFocus(prev, taskId, timeframe));
  }, []);

  const handleRemoveFromFocus = useCallback((focusId: string) => {
    setFocusItems((prev) => removeFromFocus(prev, focusId));
  }, []);

  const handleCompleteTask = useCallback((taskId: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (!task) return prev;
      return updateTask(prev, taskId, {
        status: task.status === "completed" ? "active" : "completed",
        completed_at: task.status === "completed" ? null : new Date().toISOString(),
      });
    });
  }, []);

  const handleRollOver = useCallback(() => {
    const todayFocus = focusItems.filter((f) => f.timeframe === "today");
    const incomplete = todayFocus.filter((f) => {
      const t = tasks.find((t) => t.id === f.task_id);
      return t && t.status !== "completed";
    });
    let updated = [...tasks];
    for (const item of incomplete) {
      updated = updated.map((t) => t.id === item.task_id ? { ...t, rolled_over_count: t.rolled_over_count + 1 } : t);
    }
    import("@/lib/store").then(({ saveTasks }) => saveTasks(updated));
    setTasks(updated);
  }, [tasks, focusItems]);

  const handleCaptureTasksCreated = useCallback((newTasks: Partial<Task>[]) => {
    setTasks((prev) => {
      let updated = prev;
      for (const t of newTasks) {
        updated = createTask(updated, { title: t.title || "Untitled", bucket: t.bucket, priority: t.priority });
      }
      return updated;
    });
  }, []);

  const allBuckets = [...BUCKETS, ...customBuckets];

  const getSubBuckets = (bucket: string): string[] => {
    const subs = new Set<string>();
    tasks.filter((t) => t.bucket === bucket && t.sub_bucket).forEach((t) => subs.add(t.sub_bucket));
    return Array.from(subs).sort();
  };

  const toggleBucket = (bucket: string) => {
    setExpandedBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(bucket)) next.delete(bucket); else next.add(bucket);
      return next;
    });
  };

  if (!mounted) return <div className="h-screen flex items-center justify-center"><span className="text-muted">Loading...</span></div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gold tracking-wide">MemoryOS</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowFocus(!showFocus)} className="text-xs bg-surface border border-border px-3 py-1.5 rounded hover:border-gold text-foreground transition-colors">
            {showFocus ? "Hide Focus" : "Focus Panel"}
          </button>
          <button onClick={() => setCaptureOpen(true)} className="text-xs bg-gold/20 text-gold px-3 py-1.5 rounded hover:bg-gold/30 transition-colors">
            Quick Capture (⌘K)
          </button>
          <button onClick={() => {
            const name = prompt("New bucket name:");
            if (name?.trim()) { setCustomBuckets((prev) => { const u = [...prev, name.trim()]; saveCustomBuckets(u); return u; }); }
          }} className="text-xs bg-surface border border-border px-3 py-1.5 rounded hover:border-gold text-muted transition-colors">
            + Bucket
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Main content — vertical bucket layout */}
        <main className={`flex-1 px-6 py-6 space-y-6 ${showFocus ? "mr-80" : ""}`}>
          {allBuckets.map((bucket) => {
            const bucketTasks = tasks.filter((t) => t.bucket === bucket && t.status === "active");
            const subBuckets = getSubBuckets(bucket);
            const unassignedTasks = bucketTasks.filter((t) => !t.sub_bucket);
            const isExpanded = expandedBuckets.has(bucket);

            return (
              <section key={bucket} className="bg-surface/30 border border-border rounded-lg overflow-hidden">
                {/* Bucket header */}
                <div className="flex items-center justify-between px-5 py-3 hover:bg-surface/50 transition-colors">
                  <button onClick={() => toggleBucket(bucket)} className="flex items-center gap-3">
                    <span className="text-muted text-sm">{isExpanded ? "▾" : "▸"}</span>
                    <h2 className="text-sm font-semibold text-gold uppercase tracking-wider">{bucket}</h2>
                    <span className="text-xs text-muted">{bucketTasks.length} tasks</span>
                  </button>
                  <button
                    onClick={() => setNewSubBucket({ bucket })}
                    className="text-xs text-muted hover:text-gold px-2 py-1 rounded hover:bg-surface"
                  >
                    + Sub-bucket
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-4">
                    {/* New sub-bucket input */}
                    {newSubBucket?.bucket === bucket && (
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={newSubBucketName}
                          onChange={(e) => setNewSubBucketName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newSubBucketName.trim()) {
                              handleCreateTask({ title: "—", bucket, sub_bucket: newSubBucketName.trim(), type: "project" });
                              setNewSubBucketName("");
                              setNewSubBucket(null);
                            }
                            if (e.key === "Escape") setNewSubBucket(null);
                          }}
                          placeholder="Sub-bucket name (e.g. Marketplaces)"
                          autoFocus
                          className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-gold"
                        />
                        <button onClick={() => setNewSubBucket(null)} className="text-xs text-muted">Cancel</button>
                      </div>
                    )}

                    {/* Sub-buckets as columns */}
                    {subBuckets.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {subBuckets.map((sub) => {
                          const subTasks = bucketTasks.filter((t) => t.sub_bucket === sub && t.type === "task");
                          return (
                            <div key={sub} className="bg-surface/50 border border-border/50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">{sub}</h3>
                                <button
                                  onClick={() => { setNewTaskInput({ bucket, subBucket: sub }); setNewTaskTitle(""); }}
                                  className="text-xs text-muted hover:text-gold"
                                >+</button>
                              </div>
                              <div className="space-y-1">
                                {subTasks.map((task) => (
                                  <TaskRow key={task.id} task={task} onComplete={handleCompleteTask} onDelete={handleDeleteTask} onUpdate={handleUpdateTask} onAddToFocus={handleAddToFocus} editingTask={editingTask} setEditingTask={setEditingTask} editNotes={editNotes} setEditNotes={setEditNotes} allSubBuckets={subBuckets} bucket={bucket} />
                                ))}
                                {newTaskInput?.bucket === bucket && newTaskInput?.subBucket === sub && (
                                  <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && newTaskTitle.trim()) {
                                        handleCreateTask({ title: newTaskTitle.trim(), bucket, sub_bucket: sub });
                                        setNewTaskTitle("");
                                        setNewTaskInput(null);
                                      }
                                      if (e.key === "Escape") setNewTaskInput(null);
                                    }}
                                    autoFocus
                                    placeholder="New task..."
                                    className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-gold"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Unassigned tasks (no sub-bucket) */}
                    {unassignedTasks.filter((t) => t.type === "task").length > 0 && (
                      <div className="space-y-1">
                        {subBuckets.length > 0 && <p className="text-xs text-muted mb-1">General</p>}
                        {unassignedTasks.filter((t) => t.type === "task").map((task) => (
                          <TaskRow key={task.id} task={task} onComplete={handleCompleteTask} onDelete={handleDeleteTask} onUpdate={handleUpdateTask} onAddToFocus={handleAddToFocus} editingTask={editingTask} setEditingTask={setEditingTask} editNotes={editNotes} setEditNotes={setEditNotes} allSubBuckets={subBuckets} bucket={bucket} />
                        ))}
                      </div>
                    )}

                    {/* Add task to bucket directly */}
                    <button
                      onClick={() => { setNewTaskInput({ bucket, subBucket: "" }); setNewTaskTitle(""); }}
                      className="mt-2 text-xs text-muted hover:text-gold"
                    >
                      + Add task
                    </button>
                    {newTaskInput?.bucket === bucket && newTaskInput?.subBucket === "" && (
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newTaskTitle.trim()) {
                            handleCreateTask({ title: newTaskTitle.trim(), bucket });
                            setNewTaskTitle("");
                            setNewTaskInput(null);
                          }
                          if (e.key === "Escape") setNewTaskInput(null);
                        }}
                        autoFocus
                        placeholder="New task..."
                        className="mt-1 w-full max-w-md bg-surface border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-gold"
                      />
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </main>

        {/* Focus panel (right side) */}
        {showFocus && (
          <aside className="fixed right-0 top-[53px] bottom-0 w-80 border-l border-border bg-background overflow-y-auto">
            <FocusPanel
              tasks={tasks}
              focusItems={focusItems}
              onRemoveFromFocus={handleRemoveFromFocus}
              onCompleteTask={handleCompleteTask}
              onRollOver={handleRollOver}
            />
          </aside>
        )}
      </div>

      <QuickCapture isOpen={captureOpen} onClose={() => setCaptureOpen(false)} onTasksCreated={handleCaptureTasksCreated} />
    </div>
  );
}

function TaskRow({ task, onComplete, onDelete, onUpdate, onAddToFocus, editingTask, setEditingTask, editNotes, setEditNotes, allSubBuckets, bucket }: {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
  onAddToFocus: (id: string, tf: "today" | "week") => void;
  editingTask: string | null;
  setEditingTask: (id: string | null) => void;
  editNotes: string;
  setEditNotes: (s: string) => void;
  allSubBuckets?: string[];
  bucket?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const priorityColors = { high: "bg-red-400", medium: "bg-yellow-400", low: "bg-green-400" };
  const isEditing = editingTask === task.id;

  return (
    <div className={`rounded-lg border transition-colors ${task.status === "completed" ? "opacity-40 border-border/30" : task.status === "archived" ? "opacity-30 border-border/20" : "border-border/50 hover:border-border"} ${expanded || isEditing ? "bg-background/50 border-border" : ""}`}>
      {/* Main row */}
      <div className="flex items-center gap-2 py-2 px-3">
        <button onClick={() => onComplete(task.id)} className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${task.status === "completed" ? "bg-gold border-gold" : "border-border hover:border-gold"}`}>
          {task.status === "completed" && <span className="text-background text-xs font-bold">✓</span>}
        </button>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[task.priority]}`} />
        <button onClick={() => setExpanded(!expanded)} className={`flex-1 text-left text-sm ${task.status === "completed" ? "line-through text-muted" : "text-foreground"}`}>
          {task.title}
        </button>
        {task.notes && <span className="text-xs text-muted/60">📝</span>}
        <button onClick={() => onUpdate(task.id, { status: "archived" })} className="text-xs text-muted hover:text-orange-400 px-1" title="Not relevant">✕</button>
      </div>

      {/* Expanded detail view */}
      {(expanded || isEditing) && (
        <div className="px-3 pb-3 pt-1 border-t border-border/30 space-y-2">
          {/* Notes */}
          <div>
            <label className="text-[10px] text-muted uppercase tracking-wide">Notes / Context</label>
            <textarea
              value={isEditing ? editNotes : (task.notes || "")}
              onChange={(e) => {
                if (!isEditing) { setEditingTask(task.id); setEditNotes(e.target.value); }
                else { setEditNotes(e.target.value); }
              }}
              onFocus={() => { if (!isEditing) { setEditingTask(task.id); setEditNotes(task.notes || ""); }}}
              placeholder="What needs to be done? Any context..."
              rows={2}
              className="w-full mt-1 bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-gold resize-none"
            />
          </div>

          {/* Move to sub-bucket */}
          {allSubBuckets && allSubBuckets.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-muted">Move to:</label>
              <select
                value={task.sub_bucket || ""}
                onChange={(e) => onUpdate(task.id, { sub_bucket: e.target.value })}
                className="text-[10px] bg-background border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-gold"
              >
                <option value="">General (no sub-bucket)</option>
                {allSubBuckets.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {isEditing && (
              <button onClick={() => { onUpdate(task.id, { notes: editNotes }); setEditingTask(null); }} className="text-[10px] bg-gold/20 text-gold px-2 py-1 rounded hover:bg-gold/30">Save Notes</button>
            )}
            <button onClick={() => onComplete(task.id)} className="text-[10px] bg-green-900/30 text-green-400 px-2 py-1 rounded hover:bg-green-900/50">
              {task.status === "completed" ? "Reopen" : "Mark Done"}
            </button>
            <button onClick={() => onUpdate(task.id, { status: "archived" })} className="text-[10px] bg-orange-900/30 text-orange-400 px-2 py-1 rounded hover:bg-orange-900/50">Not Relevant</button>
            <button onClick={() => { const next = task.priority === "high" ? "medium" : task.priority === "medium" ? "low" : "high"; onUpdate(task.id, { priority: next }); }} className="text-[10px] bg-surface text-muted px-2 py-1 rounded hover:text-foreground">Priority: {task.priority}</button>
            <button onClick={() => onAddToFocus(task.id, "today")} className="text-[10px] bg-surface text-muted px-2 py-1 rounded hover:text-foreground">Focus Today</button>
            <button onClick={() => onDelete(task.id)} className="text-[10px] text-red-400/60 px-2 py-1 rounded hover:text-red-400">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
