"use client";

import { BUCKETS, BucketName } from "@/lib/types";
import { useState } from "react";

interface SidebarProps {
  selectedBucket: string | null;
  onSelectBucket: (bucket: string | null) => void;
  customBuckets: string[];
  onAddBucket: (name: string) => void;
  taskCounts: Record<string, number>;
}

export default function Sidebar({
  selectedBucket,
  onSelectBucket,
  customBuckets,
  onAddBucket,
  taskCounts,
}: SidebarProps) {
  const [newBucket, setNewBucket] = useState("");
  const [showInput, setShowInput] = useState(false);

  const allBuckets: BucketName[] = [...BUCKETS, ...customBuckets];

  const handleAdd = () => {
    if (newBucket.trim() && !allBuckets.includes(newBucket.trim())) {
      onAddBucket(newBucket.trim());
      setNewBucket("");
      setShowInput(false);
    }
  };

  return (
    <aside className="w-56 border-r border-border p-4 flex flex-col gap-1 overflow-y-auto">
      <h2 className="text-gold font-semibold text-sm uppercase tracking-wider mb-3">
        Buckets
      </h2>

      <button
        onClick={() => onSelectBucket(null)}
        className={`text-left px-3 py-2 rounded text-sm transition-colors ${
          selectedBucket === null
            ? "bg-surface-hover text-gold"
            : "hover:bg-surface text-foreground/80"
        }`}
      >
        All Tasks
      </button>

      {allBuckets.map((bucket) => (
        <button
          key={bucket}
          onClick={() => onSelectBucket(bucket)}
          className={`text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between ${
            selectedBucket === bucket
              ? "bg-surface-hover text-gold"
              : "hover:bg-surface text-foreground/80"
          }`}
        >
          <span>{bucket}</span>
          {(taskCounts[bucket] || 0) > 0 && (
            <span className="text-xs text-muted">
              {taskCounts[bucket]}
            </span>
          )}
        </button>
      ))}

      <div className="mt-4 pt-4 border-t border-border">
        {showInput ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={newBucket}
              onChange={(e) => setNewBucket(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Bucket name..."
              autoFocus
              className="bg-surface border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-gold"
            />
            <div className="flex gap-1">
              <button
                onClick={handleAdd}
                className="text-xs bg-gold/20 text-gold px-2 py-1 rounded hover:bg-gold/30"
              >
                Add
              </button>
              <button
                onClick={() => setShowInput(false)}
                className="text-xs text-muted px-2 py-1 rounded hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="text-sm text-muted hover:text-gold transition-colors"
          >
            + New Bucket
          </button>
        )}
      </div>
    </aside>
  );
}
