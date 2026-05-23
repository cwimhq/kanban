import { Bot, Hand } from 'lucide-react';
import { Tag } from './Tag.tsx';
import { STATUS_COLORS } from '../types.ts';
import type { Task, TaskStatus } from '../types.ts';
import { isNewTask } from '../hooks/useTasks.ts';

interface TaskCardProps {
  task: Task;
  isFlashing: boolean;
}

const FLASH_CLASSES: Record<TaskStatus, string> = {
  'todo': 'animate-column-flash-todo',
  'in-progress': 'animate-column-flash-inprogress',
  'done': 'animate-column-flash-done',
  'blocked': 'animate-column-flash-blocked',
};

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function TaskCard({ task, isFlashing }: TaskCardProps) {
  const isNew = isNewTask(task);
  const flashClass = isFlashing ? FLASH_CLASSES[task.status] : '';

  return (
    <div
      className={`
        group relative rounded-xl p-4 cursor-pointer
        bg-[var(--surface-1)] 
        shadow-[var(--shadow-sm)]
        hover:bg-[var(--surface-3)] hover:shadow-[var(--shadow-md)]
        hover:-translate-y-0.5
        transition-all duration-200 ease-out
        border-l-[3px] border-l-transparent
        focus-ring
        ${isNew ? 'animate-card-enter' : ''}
        ${flashClass}
      `}
      style={{ borderLeftColor: STATUS_COLORS[task.status] }}
      tabIndex={0}
    >
      {/* Title */}
      <h4 className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-snug mb-1.5">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.tags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>
      )}

      {/* Footer: timestamp + source */}
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
        <span>{formatRelativeTime(task.updatedAt)}</span>
        <span className="text-[var(--text-subtle)]">·</span>
        <span className="flex items-center gap-1">
          {task.source === 'claude' ? (
            <>
              <Bot size={11} />
              <span>claude</span>
            </>
          ) : (
            <>
              <Hand size={11} />
              <span>manual</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
