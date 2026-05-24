import { useState, useEffect, useRef, useCallback } from 'react';
import { Column } from './Column.tsx';
import { NewTaskToast } from './NewTaskToast.tsx';
import { TaskModal } from './TaskModal.tsx';
import { STATUS_ORDER } from '../types.ts';
import type { Task, TaskFlowData } from '../types.ts';

interface KanbanBoardProps {
  data: TaskFlowData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
      <div className="flex gap-4 h-full min-w-max">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="flex flex-col min-w-[280px] flex-1 rounded-xl bg-[var(--surface-1)] border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 h-10 shrink-0 border-b border-[var(--border-subtle)]">
              <div className="skeleton w-1.5 h-1.5 rounded-full" />
              <div className="skeleton w-20 h-3" />
              <div className="skeleton w-6 h-4 rounded-full ml-auto" />
            </div>
            <div className="flex-1 p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ data, loading, error, refresh }: KanbanBoardProps) {
  const [movedTasks, setMovedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const prevTasksRef = useRef<Task[]>([]);

  // Detect moved tasks
  useEffect(() => {
    if (!data) return;
    const prevTasks = prevTasksRef.current;
    const newMoved = new Set<string>();
    for (const newTask of data.tasks) {
      const oldTask = prevTasks.find((t) => t.id === newTask.id);
      if (oldTask && oldTask.status !== newTask.status) {
        newMoved.add(newTask.id);
      }
    }
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
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
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

  const handleTaskDoubleClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedTask(null);
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="text-[var(--text-primary)] text-sm font-medium mb-1">Unable to load board</div>
          <div className="text-[var(--text-muted)] text-xs mb-4">{error}</div>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-lg bg-[var(--surface-3)] text-[var(--text-secondary)] text-xs font-medium hover:bg-[var(--surface-4)] transition-colors"
          >
            Try again
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
              onTaskDoubleClick={handleTaskDoubleClick}
            />
          ))}
        </div>

        {/* Keyboard hint */}
        <div className="fixed bottom-3 right-4 text-[10px] text-[var(--text-subtle)] tracking-wide">
          Press{' '}
          <kbd className="px-1 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--border-default)] text-[var(--text-muted)]">
            1-4
          </kbd>{' '}
          to filter ·{' '}
          <kbd className="px-1 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--border-default)] text-[var(--text-muted)]">
            r
          </kbd>{' '}
          to refresh
        </div>
      </main>

      <NewTaskToast tasks={tasks} />

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={handleCloseModal} />
      )}
    </>
  );
}
