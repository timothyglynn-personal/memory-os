"use client";

import { useEffect, useState, useCallback } from "react";
import { Task, FocusItem } from "@/lib/types";
import {
  loadTasks,
  saveTasks,
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
import Sidebar from "@/components/Sidebar";
import TaskList from "@/components/TaskList";
import FocusPanel from "@/components/FocusPanel";
import QuickCapture from "@/components/QuickCapture";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusItems, setFocusItems] = useState<FocusItem[]>([]);
  const [customBuckets, setCustomBuckets] = useState<string[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setTasks(loadTasks());
    setFocusItems(loadFocus());
    setCustomBuckets(loadCustomBuckets());
    setMounted(true);
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCaptureOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCaptureOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCreateTask = useCallback(
    (data: Partial<Task> & { title: string }) => {
      setTasks((prev) => createTask(prev, data));
    },
    []
  );

  const handleUpdateTask = useCallback(
    (id: string, data: Partial<Task>) => {
      setTasks((prev) => updateTask(prev, id, data));
    },
    []
  );

  const handleDeleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => deleteTask(prev, id));
      // Also remove from focus
      setFocusItems((prev) => {
        const updated = prev.filter((f) => f.task_id !== id);
        saveFocus(updated);
        return updated;
      });
    },
    []
  );

  const handleAddToFocus = useCallback(
    (taskId: string, timeframe: "today" | "week") => {
      setFocusItems((prev) => addToFocus(prev, taskId, timeframe));
    },
    []
  );

  const handleRemoveFromFocus = useCallback(
    (focusId: string) => {
      setFocusItems((prev) => removeFromFocus(prev, focusId));
    },
    []
  );

  const handleCompleteTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => {
        const task = prev.find((t) => t.id === taskId);
        if (!task) return prev;
        return updateTask(prev, taskId, {
          status: task.status === "completed" ? "active" : "completed",
          completed_at:
            task.status === "completed" ? null : new Date().toISOString(),
        });
      });
    },
    []
  );

  const handleRollOver = useCallback(() => {
    setTasks((prevTasks) => {
      setFocusItems((prevFocus) => {
        const todayFocus = prevFocus.filter((f) => f.timeframe === "today");
        const incompleteFocusItems = todayFocus.filter((f) => {
          const task = prevTasks.find((t) => t.id === f.task_id);
          return task && task.status !== "completed";
        });

        // Increment rolled_over_count for incomplete tasks
        let updatedTasks = [...prevTasks];
        for (const item of incompleteFocusItems) {
          updatedTasks = updatedTasks.map((t) =>
            t.id === item.task_id
              ? { ...t, rolled_over_count: t.rolled_over_count + 1 }
              : t
          );
        }
        saveTasks(updatedTasks);

        // Remove completed today items from focus
        const completedTodayIds = todayFocus
          .filter((f) => {
            const task = prevTasks.find((t) => t.id === f.task_id);
            return task && task.status === "completed";
          })
          .map((f) => f.id);

        const updatedFocus = prevFocus.filter(
          (f) => !completedTodayIds.includes(f.id)
        );
        saveFocus(updatedFocus);
        return updatedFocus;
      });
      return prevTasks;
    });
    // Force reload
    setTasks(loadTasks());
  }, []);

  const handleAddBucket = useCallback((name: string) => {
    setCustomBuckets((prev) => {
      const updated = [...prev, name];
      saveCustomBuckets(updated);
      return updated;
    });
  }, []);

  const handleCaptureTasksCreated = useCallback(
    (newTasks: Partial<Task>[]) => {
      setTasks((prev) => {
        let updated = prev;
        for (const t of newTasks) {
          updated = createTask(updated, {
            title: t.title || "Untitled task",
            bucket: t.bucket,
            priority: t.priority,
          });
        }
        return updated;
      });
    },
    []
  );

  // Compute task counts per bucket
  const taskCounts: Record<string, number> = {};
  for (const task of tasks) {
    if (task.status === "active") {
      taskCounts[task.bucket] = (taskCounts[task.bucket] || 0) + 1;
    }
  }

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="text-muted">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      <Sidebar
        selectedBucket={selectedBucket}
        onSelectBucket={setSelectedBucket}
        customBuckets={customBuckets}
        onAddBucket={handleAddBucket}
        taskCounts={taskCounts}
      />

      <TaskList
        tasks={tasks}
        selectedBucket={selectedBucket}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onCreateTask={handleCreateTask}
        onAddToFocus={handleAddToFocus}
      />

      <FocusPanel
        tasks={tasks}
        focusItems={focusItems}
        onRemoveFromFocus={handleRemoveFromFocus}
        onCompleteTask={handleCompleteTask}
        onRollOver={handleRollOver}
      />

      <QuickCapture
        isOpen={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onTasksCreated={handleCaptureTasksCreated}
      />

      {/* Cmd+K hint */}
      <div className="fixed bottom-4 right-4 text-xs text-muted/50">
        Cmd+K to capture
      </div>
    </div>
  );
}
