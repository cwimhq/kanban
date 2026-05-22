# CWIM Kanban

> Minimal Kanban task tracking with MCP integration for Claude Code. Local-first, zero-config, and purpose-built for long-running AI-assisted workflows.

## Overview

CWIM Kanban is a complementary package to CWIM (Context Window Intelligence Manager) that adds visual task tracking to your Claude Code sessions. It consists of:

- **MCP Server** — Exposes Kanban operations as Claude Code tools (`task_create`, `task_move`, `task_list`, etc.)
- **Web Dashboard** — A clean, dark-themed Kanban board served locally at `http://localhost:3456`
- **CLI** — Full command-line interface for managing tasks outside of Claude
- **Local JSON Storage** — All data stored in `~/.kanban/tasks.json`, no cloud or database needed

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
| `task_list` | List all tasks (optionally filtered) |
| `task_get` | Show details of a specific task |

Claude will automatically detect the tools and use them to track progress on complex tasks. Tasks created via MCP are tagged with source "claude" so you can distinguish them from manually created ones.

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
# All tasks
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
# Creates ~/.kanban/ directory and empty tasks.json
kanban init
```

## Dashboard Features

- **Real-time updates** — Board refreshes every 2 seconds, showing changes as Claude moves tasks
- **4 columns** — To Do, In Progress, Done, Blocked
- **Visual indicators** — Color-coded borders, pulsing LIVE badge, flash animation on task moves
- **Session linking** — Auto-detects active Claude Code session and shows it in the header
- **Tag support** — Tasks show tags as badges for quick categorization
- **Source tracking** — Distinguishes between Claude-created and manually-created tasks
- **Keyboard shortcuts** — `r` to refresh, `1-4` to filter columns
- **New task toast** — Brief notification when a new task appears

## Data Storage

All data is stored locally in `~/.kanban/tasks.json`:

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
- **Session-aware** — Links tasks to Claude Code sessions when available
- **Portable** — Back up or version-control your `~/.kanban/` directory

## Programmatic API

Core functions are exported for custom integrations:

```typescript
import { createTask, listTasks, moveTask, getAllData } from '@cwim/kanban';

// Create a task programmatically
const task = await createTask({
  title: 'My task',
  description: 'Optional details',
  status: 'todo',
  tags: ['api'],
  source: 'manual'
});

// Get all data
const data = await getAllData();
console.log(data.tasks);
```

See `src/index.ts` for all available exports.

## Architecture

```
Claude Code → MCP Server (stdio) → tasks.json ← HTTP Server ← Dashboard UI
                ↑                                              ↑
           task_create, move, etc.                    polling /api/tasks
```

- **MCP Server** and **HTTP Server** are separate processes
- They communicate through the shared JSON file, not sockets or IPC
- The dashboard polls `/api/tasks` every 2 seconds
- All mutations go through the MCP tools or CLI commands

## Requirements

- Node.js 18+
- Claude Code (optional — dashboard works independently)

## License

MIT
