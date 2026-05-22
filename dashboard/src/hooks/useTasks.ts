import { useState, useEffect, useRef, useCallback } from 'react';
import type { TaskFlowData, Task, SessionsData } from '../types.ts';

const POLL_INTERVAL = 2000;

interface UseTasksResult {
  data: TaskFlowData | null;
  sessions: SessionsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  switchSession: (name: string) => Promise<void>;
  getNewlyMovedTasks: (current: Task[], previous: Task[]) => Set<string>;
}

export function useTasks(): UseTasksResult {
  const [data, setData] = useState<TaskFlowData | null>(null);
  const [sessions, setSessions] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevTasksRef = useRef<Task[]>([]);
  const movedTasksRef = useRef<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      // Fetch tasks and sessions in parallel
      const [tasksRes, sessionsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/sessions'),
      ]);
      
      if (!tasksRes.ok) throw new Error(`HTTP ${tasksRes.status}`);
      if (!sessionsRes.ok) throw new Error(`HTTP ${sessionsRes.status}`);
      
      const newData: TaskFlowData = await tasksRes.json();
      const newSessions: SessionsData = await sessionsRes.json();

      // Detect moved tasks by comparing status changes
      const prevTasks = prevTasksRef.current;
      const newMoved = new Set<string>();
      for (const newTask of newData.tasks) {
        const oldTask = prevTasks.find((t) => t.id === newTask.id);
        if (oldTask && oldTask.status !== newTask.status) {
          newMoved.add(newTask.id);
        }
      }
      movedTasksRef.current = newMoved;
      prevTasksRef.current = newData.tasks;

      setData(newData);
      setSessions(newSessions);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Keyboard shortcut for refresh
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        fetchData();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fetchData]);

  const switchSession = useCallback(async (name: string) => {
    try {
      const res = await fetch('/api/sessions/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const newData: TaskFlowData = await res.json();
      
      // Reset moved tasks tracking on session switch
      movedTasksRef.current = new Set();
      prevTasksRef.current = newData.tasks;
      
      setData(newData);
      
      // Refresh sessions to get updated active state
      const sessionsRes = await fetch('/api/sessions');
      if (sessionsRes.ok) {
        const newSessions: SessionsData = await sessionsRes.json();
        setSessions(newSessions);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const getNewlyMovedTasks = useCallback(
    (_current: Task[], _previous: Task[]) => {
      return movedTasksRef.current;
    },
    []
  );

  return { data, sessions, loading, error, refresh: fetchData, switchSession, getNewlyMovedTasks };
}

export function isNewTask(task: Task): boolean {
  const created = new Date(task.createdAt).getTime();
  const now = Date.now();
  return now - created < 2000;
}

export function isRecentlyMoved(taskId: string, movedSet: Set<string>): boolean {
  return movedSet.has(taskId);
}
