import { promises as fs, existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { Task, TaskFlowData, TaskStatus, SessionInfo } from '../types.js';

const KANBAN_DIR = path.join(os.homedir(), '.kanban');
const SESSIONS_DIR = path.join(KANBAN_DIR, 'sessions');
const ACTIVE_SESSION_FILE = path.join(KANBAN_DIR, 'active-session.json');
const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

function getDefaultData(): TaskFlowData {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    tasks: [],
  };
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function getSessionDir(sessionName: string): string {
  return path.join(SESSIONS_DIR, sessionName);
}

function getSessionDataFile(sessionName: string): string {
  return path.join(getSessionDir(sessionName), 'tasks.json');
}

// Active session management

interface ActiveSession {
  name: string;
  setAt: string;
}

export async function getActiveSession(): Promise<string | undefined> {
  try {
    if (!existsSync(ACTIVE_SESSION_FILE)) return undefined;
    const raw = await fs.readFile(ACTIVE_SESSION_FILE, 'utf-8');
    const active: ActiveSession = JSON.parse(raw);
    return active.name;
  } catch {
    return undefined;
  }
}

export async function setActiveSession(sessionName: string): Promise<void> {
  ensureDir(KANBAN_DIR);
  const active: ActiveSession = {
    name: sessionName,
    setAt: new Date().toISOString(),
  };
  await fs.writeFile(ACTIVE_SESSION_FILE, JSON.stringify(active, null, 2), 'utf-8');
}

// Session detection

export async function detectSessions(): Promise<SessionInfo[]> {
  try {
    if (!existsSync(CLAUDE_PROJECTS_DIR)) return [];
    const entries = await fs.readdir(CLAUDE_PROJECTS_DIR, { withFileTypes: true });
    const sessions = entries
      .filter((e) => e.isDirectory())
      .map((e) => ({
        name: e.name,
        path: path.join(CLAUDE_PROJECTS_DIR, e.name),
        detectedAt: new Date().toISOString(),
      }));
    
    if (sessions.length === 0) return [];
    
    // Sort by most recently modified
    const stats = await Promise.all(
      sessions.map(async (s) => {
        const stat = await fs.stat(s.path);
        return { ...s, mtime: stat.mtime };
      })
    );
    stats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    
    return stats.map((s) => ({
      name: s.name,
      path: s.path,
      detectedAt: s.detectedAt,
    }));
  } catch {
    return [];
  }
}

export async function detectLatestSession(): Promise<SessionInfo | undefined> {
  const sessions = await detectSessions();
  return sessions[0];
}

export async function listAllSessions(): Promise<SessionInfo[]> {
  const detected = await detectSessions();
  const detectedNames = new Set(detected.map((s) => s.name));
  
  // Also include any stored sessions that might not be currently detected
  // (e.g., old projects that were removed from .claude/projects)
  const storedSessions: SessionInfo[] = [];
  if (existsSync(SESSIONS_DIR)) {
    const entries = await fs.readdir(SESSIONS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !detectedNames.has(entry.name) && entry.name !== 'independent') {
        storedSessions.push({
          name: entry.name,
          path: getSessionDir(entry.name),
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }
  
  // Always include independent mode
  const allSessions = [
    ...detected,
    ...storedSessions,
    {
      name: 'independent',
      path: getSessionDir('independent'),
      detectedAt: new Date().toISOString(),
    },
  ];
  
  return allSessions;
}

// Get or initialize the current session name
export async function getCurrentSessionName(): Promise<string> {
  const active = await getActiveSession();
  if (active) return active;
  
  // Auto-detect and set
  const latest = await detectLatestSession();
  if (latest) {
    await setActiveSession(latest.name);
    return latest.name;
  }
  
  // Fallback to independent
  await setActiveSession('independent');
  return 'independent';
}

// Per-session data operations

async function readSessionData(sessionName: string): Promise<TaskFlowData> {
  const dataFile = getSessionDataFile(sessionName);
  ensureDir(getSessionDir(sessionName));
  
  try {
    const raw = await fs.readFile(dataFile, 'utf-8');
    return JSON.parse(raw) as TaskFlowData;
  } catch {
    const defaultData = getDefaultData();
    await writeSessionData(sessionName, defaultData);
    return defaultData;
  }
}

async function writeSessionData(sessionName: string, data: TaskFlowData): Promise<void> {
  const dataFile = getSessionDataFile(sessionName);
  ensureDir(getSessionDir(sessionName));
  data.updatedAt = new Date().toISOString();
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf-8');
}

// Task CRUD (session-aware)

export async function listTasks(
  sessionName?: string,
  filter?: { status?: TaskStatus; tag?: string; query?: string }
): Promise<Task[]> {
  const targetSession = sessionName ?? await getCurrentSessionName();
  const data = await readSessionData(targetSession);
  let tasks = data.tasks;
  if (filter?.status) {
    tasks = tasks.filter((t) => t.status === filter.status);
  }
  if (filter?.tag) {
    tasks = tasks.filter((t) => t.tags.includes(filter.tag!));
  }
  if (filter?.query) {
    const q = filter.query.toLowerCase();
    tasks = tasks.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q) ?? false)
    );
  }
  return tasks;
}

export async function getTask(id: string, sessionName?: string): Promise<Task | undefined> {
  const targetSession = sessionName ?? await getCurrentSessionName();
  const data = await readSessionData(targetSession);
  return data.tasks.find((t) => t.id === id);
}

export async function createTask(
  input: {
    title: string;
    description?: string;
    status?: TaskStatus;
    tags?: string[];
    source?: 'claude' | 'manual';
  },
  sessionName?: string
): Promise<Task> {
  const targetSession = sessionName ?? await getCurrentSessionName();
  const data = await readSessionData(targetSession);

  const task: Task = {
    id: generateId(),
    title: input.title,
    description: input.description,
    status: input.status ?? 'todo',
    tags: input.tags ?? [],
    source: input.source ?? 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.tasks.push(task);
  await writeSessionData(targetSession, data);
  return task;
}

export async function updateTask(
  id: string,
  input: Partial<Pick<Task, 'title' | 'description' | 'status' | 'tags'>>,
  sessionName?: string
): Promise<Task | undefined> {
  const targetSession = sessionName ?? await getCurrentSessionName();
  const data = await readSessionData(targetSession);
  const idx = data.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;

  const task = data.tasks[idx];
  if (input.title !== undefined) task.title = input.title;
  if (input.description !== undefined) task.description = input.description;
  if (input.status !== undefined) task.status = input.status;
  if (input.tags !== undefined) task.tags = input.tags;
  task.updatedAt = new Date().toISOString();

  await writeSessionData(targetSession, data);
  return task;
}

export async function moveTask(
  id: string, 
  status: TaskStatus,
  sessionName?: string
): Promise<Task | undefined> {
  return updateTask(id, { status }, sessionName);
}

export async function deleteTask(id: string, sessionName?: string): Promise<boolean> {
  const targetSession = sessionName ?? await getCurrentSessionName();
  const data = await readSessionData(targetSession);
  const initialLen = data.tasks.length;
  data.tasks = data.tasks.filter((t) => t.id !== id);
  if (data.tasks.length === initialLen) return false;
  await writeSessionData(targetSession, data);
  return true;
}

export async function appendNote(
  id: string,
  note: string,
  sessionName?: string
): Promise<Task | undefined> {
  const targetSession = sessionName ?? await getCurrentSessionName();
  const data = await readSessionData(targetSession);
  const idx = data.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;

  const task = data.tasks[idx];
  if (!task.notes) {
    task.notes = [];
  }
  const timestamp = new Date().toISOString();
  task.notes.push(`[${timestamp}] ${note}`);
  task.updatedAt = timestamp;

  await writeSessionData(targetSession, data);
  return task;
}

export async function getAllData(sessionName?: string): Promise<TaskFlowData> {
  const targetSession = sessionName ?? await getCurrentSessionName();
  const data = await readSessionData(targetSession);
  
  // Attach session info
  const sessions = await listAllSessions();
  const sessionInfo = sessions.find((s) => s.name === targetSession);
  if (sessionInfo) {
    data.session = sessionInfo;
  }
  
  return data;
}

// Smart context recall for agent memory

interface MatchReason {
  field: string;
  matched: string;
}

interface ScoredTask {
  task: Task;
  score: number;
  signals: number;
  reasons: MatchReason[];
}

interface RecallResult {
  relevant: Task[];
  reasons: Map<string, MatchReason[]>;
  summary: {
    active: number;
    done: number;
    blocked: number;
    total: number;
  };
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'her', 'way', 'many', 'oil', 'sit', 'set', 'run', 'eat', 'far', 'sea', 'eye', 'ago', 'off', 'too', 'any', 'say', 'man', 'try', 'ask', 'end', 'why', 'let', 'put', 'say', 'she', 'try', 'way', 'own', 'say', 'too', 'old', 'tell', 'very', 'when', 'much', 'would', 'there', 'their', 'what', 'said', 'each', 'which', 'will', 'about', 'could', 'other', 'after', 'first', 'never', 'these', 'think', 'where', 'being', 'every', 'great', 'might', 'shall', 'still', 'those', 'while', 'this', 'that', 'with', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .filter((w) => !STOP_WORDS.has(w));
}

function getTaskFields(task: Task): { [key: string]: string } {
  return {
    title: task.title.toLowerCase(),
    tags: task.tags.join(' ').toLowerCase(),
    description: (task.description || '').toLowerCase(),
    notes: (task.notes || []).join(' ').toLowerCase(),
  };
}

function scoreTask(task: Task, queryWords: string[]): ScoredTask {
  let score = 0;
  let signals = 0;
  const reasons: MatchReason[] = [];
  const fields = getTaskFields(task);
  
  // Title matches (highest weight: 5)
  for (const word of queryWords) {
    if (fields.title.includes(word)) {
      score += 5;
      signals++;
      reasons.push({ field: 'title', matched: word });
      break; // Only count title once per word
    }
  }
  
  // Tag matches (weight: 4)
  for (const word of queryWords) {
    if (fields.tags.includes(word)) {
      score += 4;
      signals++;
      reasons.push({ field: 'tag', matched: word });
      break;
    }
  }
  
  // Description matches (weight: 2)
  for (const word of queryWords) {
    if (fields.description.includes(word)) {
      score += 2;
      signals++;
      reasons.push({ field: 'description', matched: word });
      break;
    }
  }
  
  // Notes matches (lowest weight: 1)
  for (const word of queryWords) {
    if (fields.notes.includes(word)) {
      score += 1;
      signals++;
      reasons.push({ field: 'notes', matched: word });
      break;
    }
  }
  
  // Recency boost
  const age = Date.now() - new Date(task.updatedAt).getTime();
  const hoursOld = age / (1000 * 60 * 60);
  if (hoursOld < 1) {
    score += 2;
  } else if (hoursOld < 24) {
    score += 1;
  }
  
  // Status boost
  if (task.status === 'in-progress') {
    score += 2;
    signals++;
  } else if (task.status === 'blocked') {
    score += 1;
    signals++;
  }
  
  return { task, score, signals, reasons };
}

export async function recallTasks(
  context: string,
  limit: number = 5,
  sessionName?: string
): Promise<RecallResult> {
  const targetSession = sessionName ?? await getCurrentSessionName();
  const data = await readSessionData(targetSession);
  
  if (data.tasks.length === 0) {
    return {
      relevant: [],
      reasons: new Map(),
      summary: { active: 0, done: 0, blocked: 0, total: 0 },
      quality: 'poor',
    };
  }

  const queryWords = extractKeywords(context);
  
  // Score all tasks
  const scored = data.tasks.map((task) => scoreTask(task, queryWords));
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Determine quality based on top score
  const maxScore = scored[0]?.score || 0;
  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  let actualLimit: number;
  
  if (maxScore >= 10) {
    quality = 'excellent';
    actualLimit = Math.min(limit, 2);
  } else if (maxScore >= 7) {
    quality = 'good';
    actualLimit = Math.min(limit, 3);
  } else if (maxScore >= 5) {
    quality = 'fair';
    actualLimit = 1;
  } else {
    quality = 'poor';
    actualLimit = 0;
  }
  
  // Filter by minimum threshold and signal count
  const filtered = scored
    .filter((s) => s.score >= 5 && s.signals >= 2)
    .slice(0, actualLimit);
  
  const relevant = filtered.map((s) => s.task);
  const reasons = new Map(filtered.map((s) => [s.task.id, s.reasons]));
  
  // Calculate summary
  const summary = {
    active: data.tasks.filter((t) => t.status === 'in-progress').length,
    done: data.tasks.filter((t) => t.status === 'done').length,
    blocked: data.tasks.filter((t) => t.status === 'blocked').length,
    total: data.tasks.length,
  };

  return { relevant, reasons, summary, quality };
}

// Legacy init (creates dirs if needed)
export async function initStorage(): Promise<void> {
  ensureDir(KANBAN_DIR);
  ensureDir(SESSIONS_DIR);
}

function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return `tf-${ts}-${rand}`;
}
