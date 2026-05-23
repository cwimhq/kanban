import { TaskCard } from './TaskCard.tsx';
import { EmptyState } from './EmptyState.tsx';
import { STATUS_LABELS, STATUS_COLORS } from '../types.ts';
import type { Task, TaskStatus } from '../types.ts';

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  movedTaskIds: Set<string>;
  onTaskDoubleClick?: (task: Task) => void;
}

export function Column({ status, tasks, movedTaskIds, onTaskDoubleClick }: ColumnProps) {
  const color = STATUS_COLORS[status];

  return (
    <div
      className="flex flex-col min-w-[280px] flex-1 rounded-xl bg-[var(--surface-1)] border border-[var(--border-default)] overflow-hidden"
      style={{ borderTopWidth: 2, borderTopColor: color }}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-4 h-10 shrink-0 border-b border-[var(--border-subtle)]">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span
          className="text-xs font-semibold tracking-wide uppercase"
          style={{ color }}
        >
          {STATUS_LABELS[status]}
        </span>
        <span 
          className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold"
          style={{ 
            backgroundColor: `${color}15`,
            color: color 
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Column Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {tasks.length === 0 ? (
          <EmptyState status={status} />
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isFlashing={movedTaskIds.has(task.id)}
              onDoubleClick={onTaskDoubleClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
