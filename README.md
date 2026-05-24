# CWIM Kanban

> Your AI's long-term memory. Visualized.

**CWIM Kanban gives your AI agent a persistent memory layer.** It remembers what you were working on, recalls context automatically, and shows you everything on a live dashboard.

Works with **Claude Code**, **OpenCode**, and any **Git repository**.

No more "what were we doing again?" between sessions.

## How It Works

```
User: "Continue the auth refactor"
    |
Claude: task_recall("auth refactor")
    |
Memory: "Found: [in-progress] Refactor auth middleware"
    |
Claude: "Ah yes, we were extracting JWT validation..."
```

As Claude works through complex tasks, it creates cards, appends notes, and moves them across columns. You watch progress unfold in real time on the board. When you return tomorrow, Claude recalls exactly where you left off.

## Installation

```bash
# Install globally
npm install -g @cwim/kanban

# Or run directly with npx
npx @cwim/kanban

# Short command (after global install)
kanban
```

## Quick Start

```bash
# Start the dashboard
kanban
```

### Claude Code Setup

Add to your Claude Code MCP config (`~/.claude/claude.json`):

```json
{
  "mcpServers": {
    "kanban": {
      "command": "npx",
      "args": ["@cwim/kanban", "mcp"]
    }
  }
}
```

### OpenCode Setup

Add to your OpenCode config (`opencode.json` in project root or `~/.config/opencode/opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "kanban": {
      "type": "local",
      "command": ["npx", "-y", "@cwim/kanban", "mcp"],
      "enabled": true
    }
  }
}
```

## Making Your AI Agent Use It

Just installing the MCP isn't enough — your AI agent needs instructions to use it.

### For Claude Code

Add a `CLAUDE.md` file to your project root:

```markdown
## Task Tracking

Use the cwim-kanban MCP to track all work in this project.

### Workflow

1. **Before starting**: Call `task_recall` with what you're about to work on
2. **Starting a task**: Create or move to `in-progress`
3. **Making progress**: Append notes with discoveries, decisions, or blockers
4. **Finishing**: Move to `done` and append a summary note
5. **Blocked**: Move to `blocked` with a note explaining why

### Rules

- Always check for existing tasks before creating new ones
- **One task per unit of work** - If a request involves multiple distinct steps (e.g., "fix auth and update docs"), create separate tasks for each step instead of one combined task
- **Always verify the active session before creating tasks** - Call `session_list` first, confirm the active session matches the current project, and call `session_switch` if it doesn't
- Use tags consistently (e.g., "bug", "feature", "refactor", "docs")
- Append notes liberally - they build context for future sessions
- Move tasks to "blocked" immediately when stuck, with explanation
- Keep task titles concise but descriptive
```

This makes the behavior automatic — no need to ask Claude every session.

### For OpenCode

Add an `AGENTS.md` file to your project root (or add to your existing one):

```markdown
## Task Tracking

Use the cwim-kanban MCP to track all work in this project.

### Workflow

1. **Before starting**: Call `task_recall` with what you're about to work on
2. **Starting a task**: Create or move to `in-progress`
3. **Making progress**: Append notes with discoveries, decisions, or blockers
4. **Finishing**: Move to `done` and append a summary note
5. **Blocked**: Move to `blocked` with a note explaining why

### Rules

- Always check for existing tasks before creating new ones
- **One task per unit of work** - If a request involves multiple distinct steps (e.g., "fix auth and update docs"), create separate tasks for each step instead of one combined task
- **Always verify the active session before creating tasks** - Call `session_list` first, confirm the active session matches the current project, and call `session_switch` if it doesn't
- Use tags consistently (e.g., "bug", "feature", "refactor", "docs")
- Append notes liberally - they build context for future sessions
- Move tasks to "blocked" immediately when stuck, with explanation
- Keep task titles concise but descriptive
```

This makes the behavior automatic for OpenCode sessions as well.

## Memory Features

### Smart Context Recall

Before starting complex work, Claude can recall relevant past tasks:

```
task_recall({ context: "refactoring auth middleware" })
```

Returns the most relevant tasks based on keyword matching, recency, and status. No more "what were we doing again?"

### Append Notes Without Overwriting

Build context over time without losing previous work:

```
task_append_note({
  id: "tf-abc123",
  note: "Discovered edge case with JWT refresh tokens"
})
```

Each note is timestamped and preserved. The task grows smarter as you work.

### Session Isolation

Each project gets its own memory space. Work on multiple projects without context bleeding:

- **Auto-detected from Git repositories** - Automatically binds to the current git repo when you `cd` into it
- Auto-detected from `~/.claude/projects/` (Claude Code) and `~/.config/opencode/` (OpenCode)
- Switch between sessions via dashboard, CLI, or MCP
- "Independent Mode" for non-AI work

**Git Integration**: When you run kanban commands inside a git repository, it automatically detects the repo and uses it as the session. No manual session switching needed - just `cd` into your project and start tracking tasks.

### Keyword Search

Find anything instantly across your entire task history:

```
task_list({ query: "auth" })
```

## Visual Dashboard

While your AI works in the background, watch progress in real time:

- **Real-time updates** - Board refreshes every 2 seconds
- **4 columns** - To Do, In Progress, Done, Blocked
- **Session switching** - Dropdown to browse projects
- **Tag support** - Categorize tasks with badges
- **Source tracking** - Distinguish AI-created vs manual tasks vs git-detected sessions
- **Keyboard shortcuts** - `r` to refresh, `1-4` to filter columns

## MCP Tools

| Tool               | Purpose                                    |
| ------------------ | ------------------------------------------ |
| `task_recall`      | Intelligently recall relevant task context |
| `task_create`      | Create a new task card                     |
| `task_append_note` | Append timestamped note to a task          |
| `task_update`      | Edit task title, description, tags         |
| `task_move`        | Move a task to another column              |
| `task_delete`      | Remove a task                              |
| `task_list`        | List tasks (optionally filtered/search)    |
| `task_get`         | Show details of a specific task            |
| `session_list`     | List all available sessions                |
| `session_switch`   | Switch to a different session              |

## CLI Commands

### Launch Dashboard

```bash
kanban                    # Start dashboard and open browser
kanban --port 8080        # Custom port
kanban --no-open          # Don't auto-open browser
```

### Memory Operations

```bash
kanban recall "auth"      # Recall relevant tasks
kanban note tf-abc123 "Edge case found"  # Append note
```

### Task Management

```bash
kanban add "Fix auth" -d "JWT validation" -t bug,auth
kanban list --query "auth"
kanban move tf-abc123 done
kanban show tf-abc123
kanban remove tf-abc123
```

### Session Management

```bash
kanban sessions           # List all sessions
kanban switch my-project  # Change active session
```

## Data Storage

All data stored locally in `~/.kanban/sessions/`:

```
~/.kanban/
├── sessions/
│   ├── my-project/
│   │   └── tasks.json
│   └── independent/
│       └── tasks.json
└── active-session.json
```

- **Local-first** - No cloud, no accounts, no network required
- **Human-readable** - Plain JSON you can edit directly
- **Portable** - Back up or version-control your `~/.kanban/` directory

## Architecture

```
Claude Code → MCP Server (stdio) → session tasks.json ← HTTP Server ← Dashboard UI
                |                                              |
           task_recall, append_note, etc.              polling /api/tasks
```

- MCP Server and HTTP Server are separate processes
- They communicate through per-session JSON files
- Dashboard polls for updates every 2 seconds
- Session switching persisted in `~/.kanban/active-session.json`

## Requirements

- Node.js 18+
- Git (optional - for automatic repo detection)
- Claude Code or OpenCode (optional - dashboard works independently)

## License

MIT
