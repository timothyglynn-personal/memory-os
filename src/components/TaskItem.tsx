"use client";

import { Task } from "@/lib/types";
import { useState } from "react";

interface TaskItemProps {
  task: Task;
  children: Task[];
  allTasks: Task[];
  depth?: number;
  onUpdate: (id: string, data: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onAddSubtask: (parentId: string) => void;
  onAddToFocus: (taskId: string, timeframe: "today" | "week") => void;
}

const priorityColors = {
  high: "bg-high",
  medium: "bg-medium",
  low: "bg-low",
};

export default function TaskItem({
  task,
  children,
  allTasks,
  depth = 0,
  onUpdate,
  onDelete,
  onAddSubtask,
  onAddToFocus,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showMenu, setShowMenu] = useState(false);

  const handleComplete = () => {
    onUpdate(task.id, {
      status: task.status === "completed" ? "active" : "completed",
      completed_at:
        task.status === "completed" ? null : new Date().toISOString(),
    });
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onUpdate(task.id, { title: editTitle.trim() });
    }
    setEditing(false);
  };

  const handleDoubleClick = () => {
    setEditing(true);
    setEditTitle(task.title);
  };

  const isProject = task.type === "project";

  return (
    <div className={`${depth > 0 ? "ml-6 border-l border-border/50 pl-3" : ""}`}>
      <div
        className={`group flex items-center gap-2 py-1.5 px-2 rounded hover:bg-surface transition-colors ${
          task.status === "completed" ? "opacity-50" : ""
        } ${isProject ? "mt-3 mb-1" : ""}`}
      >
        {/* Expand toggle */}
        {children.length > 0 || isProject ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted hover:text-foreground text-xs w-4 flex-shrink-0"
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        {/* Checkbox (not for projects) */}
        {isProject ? (
          <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-gold text-sm">◆</span>
        ) : (
          <button
            onClick={handleComplete}
            className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
              task.status === "completed"
                ? "bg-gold border-gold"
                : "border-border hover:border-gold"
            }`}
          >
            {task.status === "completed" && (
              <span className="text-background text-xs font-bold">✓</span>
            )}
          </button>
        )}

        {/* Priority dot (not for projects) */}
        {isProject ? null : (
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[task.priority]}`}
          />
        )}

        {/* Title */}
        {editing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") setEditing(false);
            }}
            onBlur={handleSaveEdit}
            autoFocus
            className="flex-1 bg-surface border border-border rounded px-2 py-0.5 text-sm text-foreground focus:outline-none focus:border-gold"
          />
        ) : (
          <span
            onDoubleClick={handleDoubleClick}
            className={`flex-1 text-sm cursor-default select-none ${
              task.status === "completed" ? "line-through text-muted" : ""
            } ${isProject ? "font-semibold text-gold/90 uppercase tracking-wide text-xs" : ""}`}
          >
            {task.title}
          </span>
        )}

        {/* Rollover badge */}
        {task.rolled_over_count > 0 && (
          <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded">
            {task.rolled_over_count}x
          </span>
        )}

        {/* Action menu */}
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-muted hover:text-foreground text-sm px-1"
          >
            ...
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 z-20 bg-surface border border-border rounded shadow-lg py-1 min-w-[140px]">
              <button
                onClick={() => { onAddSubtask(task.id); setShowMenu(false); }}
                className="block w-full text-left px-3 py-1.5 text-xs hover:bg-surface-hover"
              >
                Add subtask
              </button>
              <button
                onClick={() => { onAddToFocus(task.id, "today"); setShowMenu(false); }}
                className="block w-full text-left px-3 py-1.5 text-xs hover:bg-surface-hover"
              >
                Focus: Today
              </button>
              <button
                onClick={() => { onAddToFocus(task.id, "week"); setShowMenu(false); }}
                className="block w-full text-left px-3 py-1.5 text-xs hover:bg-surface-hover"
              >
                Focus: This Week
              </button>
              <button
                onClick={() => {
                  const next = task.priority === "high" ? "medium" : task.priority === "medium" ? "low" : "high";
                  onUpdate(task.id, { priority: next });
                  setShowMenu(false);
                }}
                className="block w-full text-left px-3 py-1.5 text-xs hover:bg-surface-hover"
              >
                Cycle priority
              </button>
              <button
                onClick={() => { onDelete(task.id); setShowMenu(false); }}
                className="block w-full text-left px-3 py-1.5 text-xs text-high hover:bg-surface-hover"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded &&
        children.map((child) => (
          <TaskItem
            key={child.id}
            task={child}
            children={allTasks.filter((t) => t.parent_id === child.id)}
            allTasks={allTasks}
            depth={depth + 1}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAddSubtask={onAddSubtask}
            onAddToFocus={onAddToFocus}
          />
        ))}
    </div>
  );
}
