import { useState, useRef, useEffect } from "react";
import {
  LayoutGrid,
  ChevronDown,
  Check,
  Bot,
  Terminal,
  HardDrive,
  GitBranch,
} from "lucide-react";
import { LiveIndicator } from "./LiveIndicator.tsx";
import { STATUS_COLORS } from "../types.ts";
import type { TaskFlowData, SessionsData, SessionInfo } from "../types.ts";

function SessionSourceIcon({ source }: { source: SessionInfo["source"] }) {
  switch (source) {
    case "claude":
      return (
        <span title="Claude Code">
          <Bot size={12} className="text-[#D4A574] shrink-0" />
        </span>
      );
    case "opencode":
      return (
        <span title="OpenCode">
          <Terminal size={12} className="text-[#60A5FA] shrink-0" />
        </span>
      );
    case "git":
      return (
        <span title="Git Repository">
          <GitBranch size={12} className="text-[#F05032] shrink-0" />
        </span>
      );
    case "manual":
      return (
        <span title="Manual">
          <HardDrive size={12} className="text-[var(--text-muted)] shrink-0" />
        </span>
      );
    case "independent":
      return (
        <span title="Independent">
          <HardDrive size={12} className="text-[var(--text-muted)] shrink-0" />
        </span>
      );
    default:
      return null;
  }
}

interface HeaderProps {
  data: TaskFlowData | null;
  sessions: SessionsData | null;
  onSwitchSession: (name: string) => void;
}

export function Header({ data, sessions, onSwitchSession }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const counts = {
    todo: data?.tasks.filter((t) => t.status === "todo").length ?? 0,
    "in-progress":
      data?.tasks.filter((t) => t.status === "in-progress").length ?? 0,
    done: data?.tasks.filter((t) => t.status === "done").length ?? 0,
  };

  const activeSession =
    sessions?.active ?? data?.session?.name ?? "independent";
  const sessionList = sessions?.sessions ?? [];
  const activeSessionInfo = sessionList.find((s) => s.name === activeSession);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSessionSelect = (name: string) => {
    onSwitchSession(name);
    setDropdownOpen(false);
  };

  const displayName =
    activeSession === "independent" ? "Independent Mode" : activeSession;

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--border-default)] bg-[var(--surface-1)] shrink-0">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <LayoutGrid size={18} className="text-[var(--accent)]" />
        <span className="text-base font-bold text-[var(--text-primary)] tracking-tight">
          CWIM Kanban
        </span>
        <LiveIndicator />
      </div>

      {/* Center: Session selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-all duration-150"
        >
          {activeSessionInfo && (
            <SessionSourceIcon source={activeSessionInfo.source} />
          )}
          <span className="font-medium">{displayName}</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {dropdownOpen && sessionList.length > 0 && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-64 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-[var(--shadow-lg)] z-50 py-1 overflow-hidden">
            <div className="px-3 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Sessions
            </div>
            {sessionList.map((session) => (
              <button
                key={session.name}
                onClick={() => handleSessionSelect(session.name)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] transition-colors duration-150 ${
                  session.name === activeSession
                    ? "text-[var(--accent)] bg-[var(--accent-subtle)]"
                    : "text-[var(--text-primary)] hover:bg-[var(--surface-3)]"
                }`}
              >
                <SessionSourceIcon source={session.source} />
                <span className="flex-1 text-left truncate font-medium">
                  {session.name === "independent"
                    ? "Independent Mode"
                    : session.name}
                </span>
                {session.name === activeSession && (
                  <Check size={14} className="text-[var(--accent)]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-5">
        <StatItem
          count={counts.todo}
          label="To Do"
          color={STATUS_COLORS["todo"]}
        />
        <StatItem
          count={counts["in-progress"]}
          label="In Progress"
          color={STATUS_COLORS["in-progress"]}
        />
        <StatItem
          count={counts.done}
          label="Done"
          color={STATUS_COLORS["done"]}
        />
      </div>
    </header>
  );
}

function StatItem({
  count,
  label,
  color,
}: {
  count: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
        {count}
      </span>
      <span className="text-[11px] text-[var(--text-muted)] font-medium tracking-wide">
        {label}
      </span>
    </div>
  );
}
