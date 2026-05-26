"use client";

import { Task, FocusItem } from "@/lib/types";

interface FocusPanelProps {
  tasks: Task[];
  focusItems: FocusItem[];
  onRemoveFromFocus: (focusId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onRollOver: () => void;
}

export default function FocusPanel({
  tasks,
  focusItems,
  onRemoveFromFocus,
  onCompleteTask,
  onRollOver,
}: FocusPanelProps) {
  const todayItems = focusItems.filter((f) => f.timeframe === "today");
  const weekItems = focusItems.filter((f) => f.timeframe === "week");

  const getTask = (taskId: string) => tasks.find((t) => t.id === taskId);

  const incompleteTodayCount = todayItems.filter((f) => {
    const task = getTask(f.task_id);
    return task && task.status !== "completed";
  }).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Today */}
      <div className="mb-6">
        <h3 className="text-gold font-semibold text-sm uppercase tracking-wider mb-3">
          Today
        </h3>
        {todayItems.length === 0 ? (
          <p className="text-muted text-xs italic">
            Add tasks from the ... menu
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {todayItems.map((item) => {
              const task = getTask(item.task_id);
              if (!task) return null;
              return (
                <div
                  key={item.id}
                  className={`px-3 py-2 rounded bg-surface group ${
                    task.status === "completed" ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onCompleteTask(task.id)}
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                        task.status === "completed"
                          ? "bg-gold border-gold"
                          : "border-border hover:border-gold"
                      }`}
                    >
                      {task.status === "completed" && (
                        <span className="text-background text-[9px] font-bold">✓</span>
                      )}
                    </button>
                    <span className={`text-sm flex-1 ${task.status === "completed" ? "line-through text-muted" : ""}`}>
                      {task.title}
                    </span>
                    <button
                      onClick={() => onRemoveFromFocus(item.id)}
                      className="text-muted hover:text-high text-xs"
                    >✕</button>
                  </div>
                  <div className="ml-6 mt-0.5 flex gap-1">
                    <span className="text-[10px] text-gold/60">{task.bucket}</span>
                    {task.sub_bucket && <span className="text-[10px] text-muted">/ {task.sub_bucket}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {incompleteTodayCount > 0 && (
          <button
            onClick={onRollOver}
            className="mt-3 text-xs text-gold/70 hover:text-gold transition-colors"
          >
            Roll over incomplete ({incompleteTodayCount})
          </button>
        )}
      </div>

      {/* This Week */}
      <div>
        <h3 className="text-gold font-semibold text-sm uppercase tracking-wider mb-3">
          This Week
        </h3>
        {weekItems.length === 0 ? (
          <p className="text-muted text-xs italic">
            Add tasks from the ... menu
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {weekItems.map((item) => {
              const task = getTask(item.task_id);
              if (!task) return null;
              return (
                <div
                  key={item.id}
                  className={`px-3 py-2 rounded bg-surface group ${
                    task.status === "completed" ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onCompleteTask(task.id)}
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                        task.status === "completed"
                          ? "bg-gold border-gold"
                          : "border-border hover:border-gold"
                      }`}
                    >
                      {task.status === "completed" && (
                        <span className="text-background text-[9px] font-bold">✓</span>
                      )}
                    </button>
                    <span className={`text-sm flex-1 ${task.status === "completed" ? "line-through text-muted" : ""}`}>
                      {task.title}
                    </span>
                    <button
                      onClick={() => onRemoveFromFocus(item.id)}
                      className="text-muted hover:text-high text-xs"
                    >✕</button>
                  </div>
                  <div className="ml-6 mt-0.5 flex gap-1">
                    <span className="text-[10px] text-gold/60">{task.bucket}</span>
                    {task.sub_bucket && <span className="text-[10px] text-muted">/ {task.sub_bucket}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
