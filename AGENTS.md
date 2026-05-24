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
