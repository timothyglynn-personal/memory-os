"use client";

import { Task, BUCKETS } from "@/lib/types";
import TaskItem from "./TaskItem";
import { useState } from "react";

interface TaskListProps {
  tasks: Task[];
  selectedBucket: string | null;
  onUpdate: (id: string, data: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onCreateTask: (data: Partial<Task> & { title: string }) => void;
  onAddToFocus: (taskId: string, timeframe: "today" | "week") => void;
}

export default function TaskList({
  tasks,
  selectedBucket,
  onUpdate,
  onDelete,
  onCreateTask,
  onAddToFocus,
}: TaskListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [showProjectInput, setShowProjectInput] = useState(false);

  const filteredTasks = selectedBucket
    ? tasks.filter((t) => t.bucket === selectedBucket)
    : tasks;

  // Get root-level tasks (no parent)
  const rootTasks = filteredTasks.filter((t) => !t.parent_id);

  const handleAddTask = () => {
    if (!newTitle.trim()) return;
    onCreateTask({
      title: newTitle.trim(),
      bucket: selectedBucket || "Personal",
      priority: newPriority,
    });
    setNewTitle("");
    setNewPriority("medium");
  };

  const handleAddSubtask = (parentId: string) => {
    setAddingSubtaskTo(parentId);
    setSubtaskTitle("");
  };

  const handleSubmitSubtask = () => {
    if (!subtaskTitle.trim() || !addingSubtaskTo) return;
    const parent = tasks.find((t) => t.id === addingSubtaskTo);
    onCreateTask({
      title: subtaskTitle.trim(),
      bucket: parent?.bucket || selectedBucket || "Personal",
      priority: "medium",
      parent_id: addingSubtaskTo,
    });
    setSubtaskTitle("");
    setAddingSubtaskTo(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">
          {selectedBucket || "All Tasks"}
        </h1>
        {selectedBucket && (
          <button
            onClick={() => setShowProjectInput(true)}
            className="text-xs bg-gold/20 text-gold px-3 py-1.5 rounded hover:bg-gold/30 transition-colors"
          >
            + Project
          </button>
        )}
      </div>

      {/* New project input */}
      {showProjectInput && (
        <div className="px-6 py-3 border-b border-border bg-surface/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newProjectTitle.trim()) {
                  onCreateTask({ title: newProjectTitle.trim(), bucket: selectedBucket || "Professional", type: "project" });
                  setNewProjectTitle("");
                  setShowProjectInput(false);
                }
                if (e.key === "Escape") setShowProjectInput(false);
              }}
              placeholder="Project name..."
              autoFocus
              className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-gold"
            />
            <button
              onClick={() => {
                if (newProjectTitle.trim()) {
                  onCreateTask({ title: newProjectTitle.trim(), bucket: selectedBucket || "Professional", type: "project" });
                  setNewProjectTitle("");
                  setShowProjectInput(false);
                }
              }}
              className="bg-gold text-background font-medium px-3 py-1.5 rounded text-sm hover:bg-gold-dim"
            >
              Create
            </button>
            <button onClick={() => setShowProjectInput(false)} className="text-muted text-sm hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {rootTasks.length === 0 ? (
          <p className="text-muted text-sm italic mt-8 text-center">
            No tasks yet. Add one below or use Cmd+K to quick capture.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {rootTasks.map((task) => (
              <div key={task.id}>
                <TaskItem
                  task={task}
                  children={tasks.filter((t) => t.parent_id === task.id)}
                  allTasks={tasks}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onAddSubtask={handleAddSubtask}
                  onAddToFocus={onAddToFocus}
                />
                {addingSubtaskTo === task.id && (
                  <div className="ml-12 mt-1 mb-2 flex gap-2">
                    <input
                      type="text"
                      value={subtaskTitle}
                      onChange={(e) => setSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSubmitSubtask();
                        if (e.key === "Escape") setAddingSubtaskTo(null);
                      }}
                      placeholder="Subtask title..."
                      autoFocus
                      className="flex-1 bg-surface border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-gold"
                    />
                    <button
                      onClick={handleSubmitSubtask}
                      className="text-xs bg-gold/20 text-gold px-2 py-1 rounded hover:bg-gold/30"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New task input */}
      <div className="border-t border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as "high" | "medium" | "low")}
            className="bg-surface border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-gold"
          >
            <option value="high">High</option>
            <option value="medium">Med</option>
            <option value="low">Low</option>
          </select>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            placeholder="Add a task..."
            className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-gold"
          />
          <button
            onClick={handleAddTask}
            disabled={!newTitle.trim()}
            className="bg-gold text-background font-medium px-3 py-1.5 rounded text-sm hover:bg-gold-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
