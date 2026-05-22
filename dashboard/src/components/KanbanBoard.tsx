import { useState, useEffect, useRef, useCallback } from 'react';
import { Column } from './Column.tsx';
import { NewTaskToast } from './NewTaskToast.tsx';
import { STATUS_ORDER } from '../types.ts';
import { useTasks } from '../hooks/useTasks.ts';
import type { Task } from '../types.ts';

export function KanbanBoard() {
  const { data, loading, error, refresh, getNewlyMovedTasks } = useTasks();
  const [movedTasks, setMovedTasks] = useState<Set<string>>(new Set());
  const prevTasksRef = useRef<Task[]>([]);

  // Detect moved tasks
  useEffect(() => {
    if (!data) return;
    const newMoved = getNewlyMovedTasks(data.tasks, prevTasksRef.current);
    if (newMoved.size > 0) {
      setMovedTasks(newMoved);
      // Clear flash after animation
      const timer = setTimeout(() => setMovedTasks(new Set()), 600);
      return () => clearTimeout(timer);
    }
    prevTasksRef.current = data.tasks;
  }, [data?.updatedAt]);

  // Keyboard shortcuts for column filtering
  const [activeFilter, setActiveFilter] = useState<number | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 4) {
        e.preventDefault();
        setActiveFilter((prev) => (prev === num ? null : num));
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const visibleStatuses =
    activeFilter !== null
      ? [STATUS_ORDER[activeFilter - 1]]
      : STATUS_ORDER;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[#555570] text-sm">Loading board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#EF4444] text-sm mb-2">Error loading tasks</div>
          <div className="text-[#555570] text-xs">{error}</div>
          <button
            onClick={refresh}
            className="mt-4 px-3 py-1.5 rounded-md bg-[#1E1E2A] text-[#8A8AA3] text-xs hover:bg-[#27273A] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tasks = data?.tasks ?? [];

  return (
    <>
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-4 h-full min-w-max">
          {visibleStatuses.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={tasks.filter((t) => t.status === status)}
              movedTaskIds={movedTasks}
            />
          ))}
        </div>

        {/* Keyboard hint */}
        <div className="fixed bottom-3 right-4 text-[10px] text-[#555570] tracking-wide">
          Press{' '}
          <kbd className="px-1 py-0.5 rounded bg-[#1E1E2A] border border-[#2A2A3A] text-[#8A8AA3]">
            1-4
          </kbd>{' '}
          to filter ·{' '}
          <kbd className="px-1 py-0.5 rounded bg-[#1E1E2A] border border-[#2A2A3A] text-[#8A8AA3]">
            r
          </kbd>{' '}
          to refresh
        </div>
      </main>

      <NewTaskToast tasks={tasks} />
    </>
  );
}
