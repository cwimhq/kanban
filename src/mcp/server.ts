#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  appendNote,
  recallTasks,
  listAllSessions,
  getCurrentSessionName,
  setActiveSession,
} from '../storage/store.js';
import { VALID_STATUSES } from '../types.js';

const server = new Server(
  {
    name: 'cwim-kanban',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'task_create',
        description: 'Create a new task on the Kanban board',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Task title (required)' },
            description: {
              type: 'string',
              description: 'Optional task description',
            },
            status: {
              type: 'string',
              enum: VALID_STATUSES,
              description: 'Initial status (default: todo)',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional tags for categorization',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'task_update',
        description: 'Update an existing task',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID (required)' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: {
              type: 'string',
              enum: VALID_STATUSES,
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'task_move',
        description: 'Move a task to a different status column',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID (required)' },
            status: {
              type: 'string',
              enum: VALID_STATUSES,
              description: 'New status (required)',
            },
          },
          required: ['id', 'status'],
        },
      },
      {
        name: 'task_delete',
        description: 'Delete a task from the board',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID (required)' },
          },
          required: ['id'],
        },
      },
      {
        name: 'task_list',
        description: 'List all tasks in the current session, optionally filtered',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: VALID_STATUSES,
              description: 'Filter by status',
            },
            tag: {
              type: 'string',
              description: 'Filter by tag',
            },
            query: {
              type: 'string',
              description: 'Search query to filter tasks by title or description (case-insensitive)',
            },
          },
        },
      },
      {
        name: 'task_append_note',
        description: 'Append a timestamped note to a task without overwriting existing content',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID (required)' },
            note: { type: 'string', description: 'Note text to append (required)' },
          },
          required: ['id', 'note'],
        },
      },
      {
        name: 'task_recall',
        description: 'Intelligently recall relevant task context based on current work. Call this before starting complex tasks to check for existing context and avoid duplicating work.',
        inputSchema: {
          type: 'object',
          properties: {
            context: {
              type: 'string',
              description: 'Brief description of what you are about to work on (e.g., "refactoring auth middleware")',
            },
            limit: {
              type: 'number',
              description: 'Max number of relevant tasks to return (default: 5)',
              default: 5,
            },
          },
        },
      },
      {
        name: 'task_get',
        description: 'Get details of a single task',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID (required)' },
          },
          required: ['id'],
        },
      },
      {
        name: 'session_list',
        description: 'List all available sessions',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'session_switch',
        description: 'Switch to a different session',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Session name to switch to (required)',
            },
          },
          required: ['name'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'task_create': {
        const task = await createTask({
          title: String(args.title),
          description: args.description ? String(args.description) : undefined,
          status: VALID_STATUSES.includes(args.status as any)
            ? (args.status as any)
            : 'todo',
          tags: Array.isArray(args.tags) ? args.tags.map(String) : undefined,
          source: 'claude',
        });
        const sessionName = await getCurrentSessionName();
        return {
          content: [
            {
              type: 'text',
              text: `Created task "${task.title}" (${task.id}) in ${task.status} [Session: ${sessionName}]`,
            },
          ],
        };
      }

      case 'task_update': {
        const task = await updateTask(String(args.id), {
          title: args.title !== undefined ? String(args.title) : undefined,
          description:
            args.description !== undefined ? String(args.description) : undefined,
          status: VALID_STATUSES.includes(args.status as any)
            ? (args.status as any)
            : undefined,
          tags: Array.isArray(args.tags) ? args.tags.map(String) : undefined,
        });
        if (!task) {
          return {
            content: [{ type: 'text', text: `Task ${args.id} not found` }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: `Updated task "${task.title}" (${task.id})`,
            },
          ],
        };
      }

      case 'task_move': {
        const task = await moveTask(
          String(args.id),
          args.status as any
        );
        if (!task) {
          return {
            content: [{ type: 'text', text: `Task ${args.id} not found` }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: `Moved "${task.title}" to ${task.status}`,
            },
          ],
        };
      }

      case 'task_delete': {
        const ok = await deleteTask(String(args.id));
        return {
          content: [
            {
              type: 'text',
              text: ok ? `Deleted task ${args.id}` : `Task ${args.id} not found`,
            },
          ],
        };
      }

      case 'task_list': {
        const tasks = await listTasks(undefined, {
          status: VALID_STATUSES.includes(args.status as any)
            ? (args.status as any)
            : undefined,
          tag: args.tag ? String(args.tag) : undefined,
          query: args.query ? String(args.query) : undefined,
        });
        const sessionName = await getCurrentSessionName();
        if (tasks.length === 0) {
          return {
            content: [{ type: 'text', text: `No tasks found in session "${sessionName}"` }],
          };
        }
        const lines = tasks.map(
          (t) => `[${t.status}] ${t.title} (${t.id}) ${t.tags.length > 0 ? '#' + t.tags.join(' #') : ''}`
        );
        return {
          content: [{ type: 'text', text: `Session: ${sessionName}\n${lines.join('\n')}` }],
        };
      }

      case 'task_append_note': {
        const task = await appendNote(String(args.id), String(args.note));
        if (!task) {
          return {
            content: [{ type: 'text', text: `Task ${args.id} not found` }],
            isError: true,
          };
        }
        const noteCount = task.notes?.length ?? 0;
        return {
          content: [
            {
              type: 'text',
              text: `Appended note to "${task.title}" (${task.id})\nTotal notes: ${noteCount}`,
            },
          ],
        };
      }

      case 'task_recall': {
        const context = args.context ? String(args.context) : '';
        const limit = typeof args.limit === 'number' ? args.limit : 5;
        const result = await recallTasks(context, limit);
        const sessionName = await getCurrentSessionName();

        if (result.relevant.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No relevant tasks found in session "${sessionName}".\n\nSession Summary: ${result.summary.active} active, ${result.summary.done} done, ${result.summary.blocked} blocked (total: ${result.summary.total})`,
              },
            ],
          };
        }

        const lines = result.relevant.map((t) => {
          const notesPreview = t.notes && t.notes.length > 0
            ? `\n  Notes: ${t.notes.length} entries`
            : '';
          const reasons = result.reasons.get(t.id);
          const reasonText = reasons && reasons.length > 0
            ? `\n  Matched: ${reasons.map(r => `${r.field} "${r.matched}"`).join(', ')}`
            : '';
          return `• [${t.status}] ${t.title} (${t.id})${notesPreview}${reasonText}`;
        });

        return {
          content: [
            {
              type: 'text',
              text: `Relevant Context Found (${result.relevant.length} tasks):\n\n${lines.join('\n')}\n\nSession Summary: ${result.summary.active} active, ${result.summary.done} done, ${result.summary.blocked} blocked (total: ${result.summary.total})`,
            },
          ],
        };
      }

      case 'task_get': {
        const task = await getTask(String(args.id));
        if (!task) {
          return {
            content: [{ type: 'text', text: `Task ${args.id} not found` }],
            isError: true,
          };
        }
        const notesText = task.notes?.length
          ? `\nNotes (${task.notes.length}):\n${task.notes.join('\n')}`
          : '';
        return {
          content: [
            {
              type: 'text',
              text: `Task: ${task.title}\nID: ${task.id}\nStatus: ${task.status}\nDescription: ${task.description ?? '(none)'}${notesText}\nTags: ${task.tags.join(', ') || '(none)'}\nCreated: ${task.createdAt}\nUpdated: ${task.updatedAt}`,
            },
          ],
        };
      }

      case 'session_list': {
        const sessions = await listAllSessions();
        const active = await getCurrentSessionName();
        if (sessions.length === 0) {
          return {
            content: [{ type: 'text', text: 'No sessions found' }],
          };
        }
        const lines = sessions.map((s) => {
          const marker = s.name === active ? ' *' : '';
          return `- ${s.name}${marker}`;
        });
        return {
          content: [{ type: 'text', text: `Active: ${active}\n\n${lines.join('\n')}` }],
        };
      }

      case 'session_switch': {
        const targetName = String(args.name);
        const sessions = await listAllSessions();
        const exists = sessions.some((s) => s.name === targetName);
        if (!exists) {
          return {
            content: [{ type: 'text', text: `Session "${targetName}" not found. Use session_list to see available sessions.` }],
            isError: true,
          };
        }
        await setActiveSession(targetName);
        return {
          content: [{ type: 'text', text: `Switched to session "${targetName}"` }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (err: any) {
    return {
      content: [{ type: 'text', text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

export async function startMcpServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startMcpServer();
}
