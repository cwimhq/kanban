import { TaskCard } from './TaskCard.tsx';
import { EmptyState } from './EmptyState.tsx';
import { STATUS_LABELS, STATUS_COLORS } from '../types.ts';
import type { Task, TaskStatus } from '../types.ts';

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  movedTaskIds: Set<string>;
}

export function Column({ status, tasks, movedTaskIds }: ColumnProps) {
  const color = STATUS_COLORS[status];

  return (
    <div
      className="flex flex-col min-w-[300px] flex-1 rounded-xl bg-[#111118] border border-[#2A2A3A] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden"
      style={{ borderTopWidth: 3, borderTopColor: color }}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-4 h-11 shrink-0 border-b border-[#2A2A3A]/50">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span
          className="text-[13px] font-medium tracking-[0.05em] uppercase"
          style={{ color }}
        >
          {STATUS_LABELS[status]}
        </span>
        <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-[#27273A] text-[11px] font-medium text-[#E8E8F0]">
          {tasks.length}
        </span>
      </div>

      {/* Column Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
        {tasks.length === 0 ? (
          <EmptyState status={status} />
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isFlashing={movedTaskIds.has(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
