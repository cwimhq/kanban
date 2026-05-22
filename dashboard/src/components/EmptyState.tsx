import { CircleDashed, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { STATUS_COLORS } from '../types.ts';
import type { TaskStatus } from '../types.ts';

const ICONS: Record<TaskStatus, typeof CircleDashed> = {
  'todo': CircleDashed,
  'in-progress': Loader,
  'done': CheckCircle,
  'blocked': AlertCircle,
};

interface EmptyStateProps {
  status: TaskStatus;
}

export function EmptyState({ status }: EmptyStateProps) {
  const Icon = ICONS[status];
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-empty-fade">
      <Icon
        size={48}
        style={{ color: STATUS_COLORS[status] }}
        className="opacity-20 mb-3"
      />
      <span className="text-sm text-[#555570]">No tasks yet</span>
    </div>
  );
}
