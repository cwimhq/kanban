import { useState, useEffect } from 'react';
import type { Task } from '../types.ts';

interface NewTaskToastProps {
  tasks: Task[];
}

export function NewTaskToast({ tasks }: NewTaskToastProps) {
  const [visible, setVisible] = useState(false);
  const [lastTask, setLastTask] = useState<Task | null>(null);
  const [prevCount, setPrevCount] = useState(tasks.length);

  useEffect(() => {
    if (tasks.length > prevCount) {
      const newest = tasks.reduce((latest, t) =>
        new Date(t.createdAt) > new Date(latest.createdAt) ? t : latest
      );
      setLastTask(newest);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
    setPrevCount(tasks.length);
  }, [tasks.length]);

  if (!visible || !lastTask) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast-in">
      <div
        className="px-5 py-3 rounded-lg bg-[#1E1E2A] border border-[#3D3D5C]"
        style={{
          boxShadow: '0 -2px 20px rgba(34,211,238,0.15), 0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        <span className="text-sm text-[#E8E8F0]">
          New task:{' '}
          <span className="font-medium text-[#22D3EE]">
            {lastTask.title.length > 40
              ? lastTask.title.slice(0, 40) + '...'
              : lastTask.title}
          </span>
        </span>
      </div>
    </div>
  );
}
