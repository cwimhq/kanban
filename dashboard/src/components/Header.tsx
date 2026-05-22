import { useState, useRef, useEffect } from 'react';
import { LayoutGrid, ChevronDown, Check } from 'lucide-react';
import { LiveIndicator } from './LiveIndicator.tsx';
import { STATUS_COLORS } from '../types.ts';
import type { TaskFlowData, SessionsData } from '../types.ts';

interface HeaderProps {
  data: TaskFlowData | null;
  sessions: SessionsData | null;
  onSwitchSession: (name: string) => void;
}

export function Header({ data, sessions, onSwitchSession }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const counts = {
    todo: data?.tasks.filter((t) => t.status === 'todo').length ?? 0,
    'in-progress': data?.tasks.filter((t) => t.status === 'in-progress').length ?? 0,
    done: data?.tasks.filter((t) => t.status === 'done').length ?? 0,
  };

  const activeSession = sessions?.active ?? data?.session?.name ?? 'independent';
  const sessionList = sessions?.sessions ?? [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSessionSelect = (name: string) => {
    onSwitchSession(name);
    setDropdownOpen(false);
  };

  const displayName = activeSession === 'independent' ? 'Independent Mode' : activeSession;

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[#2A2A3A] bg-[#111118] shrink-0">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <LayoutGrid size={20} className="text-[#22D3EE]" />
        <span className="text-lg font-semibold text-[#E8E8F0] tracking-tight">
          CWIM Kanban
        </span>
        <LiveIndicator />
      </div>

      {/* Center: Session selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] text-[#8A8AA3] hover:text-[#E8E8F0] hover:bg-[#2A2A3A] transition-colors"
        >
          <span>{displayName}</span>
          <ChevronDown 
            size={14} 
            className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {dropdownOpen && sessionList.length > 0 && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-64 bg-[#1A1A24] border border-[#2A2A3A] rounded-lg shadow-xl z-50 py-1">
            <div className="px-3 py-1.5 text-xs text-[#8A8AA3] uppercase tracking-wider">
              Sessions
            </div>
            {sessionList.map((session) => (
              <button
                key={session.name}
                onClick={() => handleSessionSelect(session.name)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] transition-colors ${
                  session.name === activeSession
                    ? 'text-[#22D3EE] bg-[#22D3EE]/10'
                    : 'text-[#E8E8F0] hover:bg-[#2A2A3A]'
                }`}
              >
                <span className="flex-1 text-left truncate">
                  {session.name === 'independent' ? 'Independent Mode' : session.name}
                </span>
                {session.name === activeSession && (
                  <Check size={14} className="text-[#22D3EE]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-6">
        <StatItem count={counts.todo} label="To Do" color={STATUS_COLORS['todo']} />
        <StatItem count={counts['in-progress']} label="In Progress" color={STATUS_COLORS['in-progress']} />
        <StatItem count={counts.done} label="Done" color={STATUS_COLORS['done']} />
      </div>
    </header>
  );
}

function StatItem({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xl font-bold text-[#E8E8F0] tracking-tight">
        {count}
      </span>
      <span className="text-xs text-[#8A8AA3] tracking-wide">{label}</span>
    </div>
  );
}
