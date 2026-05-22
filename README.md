# CWIM Kanban

> Minimal Kanban task tracking with MCP integration for Claude Code. Local-first, zero-config, and purpose-built for long-running AI-assisted workflows.

## Overview

CWIM Kanban is a complementary package to CWIM (Context Window Intelligence Manager) that adds visual task tracking to your Claude Code sessions. It consists of:

- **MCP Server** — Exposes Kanban operations as Claude Code tools (`task_create`, `task_move`, `task_list`, etc.)
- **Web Dashboard** — A clean, dark-themed Kanban board served locally at `http://localhost:3456`
- **CLI** — Full command-line interface for managing tasks outside of Claude
- **Local JSON Storage** — Per-session task storage in `~/.kanban/sessions/`, no cloud or database needed

As Claude works through complex multi-step tasks, it can create cards, move them across columns, and you watch progress unfold in real time on the board.

## Installation

```bash
# Install globally
npm install -g @cwim/kanban

# Or run directly with npx
npx @cwim/kanban

# Short command (after global install)
kanban
```

## Claude Code Integration (MCP)

Add CWIM Kanban to your Claude Code MCP configuration:

```bash
# Add to your Claude Code config (e.g., ~/.claude/config.json)
{
  "mcpServers": {
    "kanban": {
      "command": "npx",
      "args": ["@cwim/kanban", "mcp"]
    }
  }
}
```

Once connected, Claude can use these tools during your sessions:

| Tool | Purpose |
|------|---------|
| `task_create` | Create a new task card |
| `task_update` | Edit task title, description, tags |
| `task_move` | Move a task to another column |
| `task_delete` | Remove a task |
| `task_list` | List all tasks in current session (optionally filtered) |
| `task_get` | Show details of a specific task |
| `session_list` | List all available sessions |
| `session_switch` | Switch to a different session |

Claude will automatically detect the tools and use them to track progress on complex tasks. Tasks created via MCP are tagged with source "claude" so you can distinguish them from manually created ones.

## Session Management

CWIM Kanban supports **full session isolation** — each Claude Code project gets its own Kanban board:

- Sessions are auto-detected from `~/.claude/projects/`
- Each session has isolated task storage
- Switch between sessions via dashboard dropdown, CLI, or MCP
- "Independent Mode" available when no Claude session is active

### Switching Sessions

**Dashboard:** Click the session name in the header center to open the dropdown selector.

**CLI:**
```bash
# List all available sessions
kanban sessions

# Switch to a different session
kanban switch my-project
```

**MCP:**
```
session_list    # Show available sessions
session_switch  # Change active session
```

## CLI Commands

### `kanban` (default) — Launch Dashboard

```bash
# Start dashboard server and open browser
kanban

# Custom port
kanban --port 8080

# Don't auto-open browser
kanban --no-open
```

### `kanban mcp` — Start MCP Server

```bash
# Run in MCP mode (stdio transport for Claude Code)
kanban mcp
```

### `kanban sessions` — List Sessions

```bash
# Show all available sessions with active indicator
kanban sessions
```

### `kanban switch` — Change Session

```bash
# Switch to a specific session
kanban switch my-project
```

### `kanban add` — Create Task

```bash
# Simple task
kanban add "Fix auth middleware"

# With description and tags
kanban add "Refactor database layer" -d "Extract connection pooling" -t refactor,db

# Direct to a column
kanban add "Write tests" -s in-progress
```

### `kanban list` — List Tasks

```bash
# All tasks in current session
kanban list

# Filter by status
kanban list --status done

# Filter by tag
kanban list --tag refactor
```

### `kanban done` — Mark Complete

```bash
kanban done tf-abc123
```

### `kanban move` — Change Status

```bash
# Move to any column
kanban move tf-abc123 blocked
kanban move tf-abc123 in-progress
```

### `kanban status` — Board Overview

```bash
# Quick summary of all columns
kanban status
```

### `kanban show` — Task Details

```bash
kanban show tf-abc123
```

### `kanban remove` — Delete Task

```bash
kanban remove tf-abc123
```

### `kanban init` — Initialize Storage

```bash
# Creates ~/.kanban/ directory structure
kanban init
```

## Dashboard Features

- **Real-time updates** — Board refreshes every 2 seconds, showing changes as Claude moves tasks
- **4 columns** — To Do, In Progress, Done, Blocked
- **Visual indicators** — Color-coded borders, pulsing LIVE badge, flash animation on task moves
- **Session switching** — Dropdown in header to browse and switch between Claude projects
- **Session isolation** — Each project has its own independent task board
- **Tag support** — Tasks show tags as badges for quick categorization
- **Source tracking** — Distinguishes between Claude-created and manually-created tasks
- **Keyboard shortcuts** — `r` to refresh, `1-4` to filter columns
- **New task toast** — Brief notification when a new task appears

## Data Storage

All data is stored locally in `~/.kanban/sessions/{session-name}/tasks.json`:

```
~/.kanban/
├── sessions/
│   ├── my-project/
│   │   └── tasks.json
│   ├── another-project/
│   │   └── tasks.json
│   └── independent/
│       └── tasks.json
└── active-session.json
```

Each session's tasks.json:

```json
{
  "version": 1,
  "updatedAt": "2026-05-23T10:30:00Z",
  "session": {
    "name": "my-project",
    "path": "/home/user/.claude/projects/my-project"
  },
  "tasks": [
    {
      "id": "tf-001",
      "title": "Refactor auth middleware",
      "description": "Extract JWT validation into separate module",
      "status": "in-progress",
      "tags": ["refactor", "auth"],
      "source": "claude",
      "createdAt": "2026-05-23T10:15:00Z",
      "updatedAt": "2026-05-23T10:20:00Z"
    }
  ]
}
```

- **Local-first** — No cloud services, no accounts, no network required
- **Human-readable** — JSON format you can edit directly if needed
- **Session-aware** — Each Claude Code project gets its own isolated board
- **Portable** — Back up or version-control your `~/.kanban/` directory

## Programmatic API

Core functions are exported for custom integrations:

```typescript
import { createTask, listTasks, moveTask, getAllData, listAllSessions, setActiveSession } from '@cwim/kanban';

// Create a task in current session
const task = await createTask({
  title: 'My task',
  description: 'Optional details',
  status: 'todo',
  tags: ['api'],
  source: 'manual'
});

// List all available sessions
const sessions = await listAllSessions();

// Switch active session
await setActiveSession('my-project');

// Get all data for current session
const data = await getAllData();
console.log(data.tasks);
```

See `src/index.ts` for all available exports.

## Architecture

```
Claude Code → MCP Server (stdio) → session tasks.json ← HTTP Server ← Dashboard UI
                ↑                                              ↑
           task_create, move, etc.                    polling /api/tasks
                                                        + /api/sessions
```

- **MCP Server** and **HTTP Server** are separate processes
- They communicate through per-session JSON files, not sockets or IPC
- The dashboard polls `/api/tasks` and `/api/sessions` every 2 seconds
- All mutations go through the MCP tools or CLI commands
- Session switching is persisted in `~/.kanban/active-session.json`

## Requirements

- Node.js 18+
- Claude Code (optional — dashboard works independently)

## License

MIT
