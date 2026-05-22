export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked';

export interface Task {
  id: string;
  title: string;
  description?: string;
  notes?: string[];
  status: TaskStatus;
  tags: string[];
  source: 'claude' | 'manual';
  createdAt: string;
  updatedAt: string;
}

export interface SessionInfo {
  name: string;
  path: string;
  detectedAt: string;
}

export interface TaskFlowData {
  version: number;
  updatedAt: string;
  session?: SessionInfo;
  tasks: Task[];
}

export interface SessionsData {
  sessions: SessionInfo[];
  active: string | undefined;
}

export const STATUS_ORDER: TaskStatus[] = ['todo', 'in-progress', 'done', 'blocked'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
  'blocked': 'Blocked',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  'todo': '#F59E0B',
  'in-progress': '#3B82F6',
  'done': '#10B981',
  'blocked': '#EF4444',
};
