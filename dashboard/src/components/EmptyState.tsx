import { CircleDashed, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { STATUS_COLORS } from '../types.ts';
import type { TaskStatus } from '../types.ts';

const ICONS: Record<TaskStatus, typeof CircleDashed> = {
  'todo': CircleDashed,
  'in-progress': Loader,
  'done': CheckCircle,
  'blocked': AlertCircle,
};

const MESSAGES: Record<TaskStatus, string> = {
  'todo': 'No tasks waiting',
  'in-progress': 'Nothing in progress',
  'done': 'No completed tasks',
  'blocked': 'No blocked tasks',
};

interface EmptyStateProps {
  status: TaskStatus;
}

export function EmptyState({ status }: EmptyStateProps) {
  const Icon = ICONS[status];
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-empty-fade">
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${STATUS_COLORS[status]}10` }}
      >
        <Icon
          size={20}
          style={{ color: STATUS_COLORS[status] }}
          className="opacity-50"
        />
      </div>
      <span className="text-xs text-[var(--text-muted)] font-medium">{MESSAGES[status]}</span>
    </div>
  );
}
