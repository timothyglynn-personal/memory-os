"use client";

import { useState } from "react";
import { Task } from "@/lib/types";

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksCreated: (tasks: Partial<Task>[]) => void;
}

export default function QuickCapture({
  isOpen,
  onClose,
  onTasksCreated,
}: QuickCaptureProps) {
  const [text, setText] = useState("");
  const [model, setModel] = useState<"claude" | "gpt-4">("claude");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleProcess = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, model }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process");
      }

      const { tasks } = await res.json();
      onTasksCreated(tasks);
      setText("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gold font-semibold">Quick Capture</h2>
          <div className="flex items-center gap-3">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as "claude" | "gpt-4")}
              className="bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-gold"
            >
              <option value="claude">Claude</option>
              <option value="gpt-4">GPT-4</option>
            </select>
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground"
            >
              Esc
            </button>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste messy notes, brain dumps, meeting notes... AI will parse them into tasks."
          autoFocus
          rows={8}
          className="w-full bg-background border border-border rounded-lg p-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-gold resize-none"
        />

        {error && (
          <p className="text-high text-sm mt-2">{error}</p>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={handleProcess}
            disabled={loading || !text.trim()}
            className="bg-gold text-background font-medium px-4 py-2 rounded-lg hover:bg-gold-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Processing..." : "Process with AI"}
          </button>
        </div>
      </div>
    </div>
  );
}
