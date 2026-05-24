import { createServer, type Server } from 'http';
import { promises as fs, existsSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { 
  getAllData, 
  listAllSessions, 
  getActiveSession, 
  setActiveSession,
  getCurrentSessionName 
} from '../storage/store.js';

const MAX_BODY_SIZE = 1024 * 1024; // 1MB

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DASHBOARD_DIR = path.resolve(__dirname, '../../dashboard/dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

export function createDashboardServer(port: number = 3456): Server {
  const server = createServer(async (req, res) => {
    const url = req.url ?? '/';
    const method = req.method ?? 'GET';

    // CORS - only allow same-origin requests since dashboard is served from this server
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:' + port);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // API endpoints
    if (url.startsWith('/api/')) {
      try {
        // GET /api/tasks - Get tasks for current or specified session
        if (url === '/api/tasks' && method === 'GET') {
          const data = await getAllData();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
          return;
        }

        // GET /api/sessions - List all available sessions
        if (url === '/api/sessions' && method === 'GET') {
          const sessions = await listAllSessions();
          const active = await getCurrentSessionName();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ sessions, active }));
          return;
        }

        // GET /api/sessions/active - Get active session
        if (url === '/api/sessions/active' && method === 'GET') {
          const active = await getActiveSession();
          const current = await getCurrentSessionName();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ active, current }));
          return;
        }

        // POST /api/sessions/active - Set active session
        if (url === '/api/sessions/active' && method === 'POST') {
          let body = '';
          let bodySize = 0;
          let aborted = false;
          req.on('data', (chunk) => {
            if (aborted) return;
            bodySize += chunk.length;
            if (bodySize > MAX_BODY_SIZE) {
              aborted = true;
              res.writeHead(413, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Request body too large' }));
              return;
            }
            body += chunk;
          });
          req.on('end', async () => {
            if (aborted) return;
            try {
              const { name } = JSON.parse(body);
              if (!name || typeof name !== 'string') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Session name required' }));
                return;
              }
              await setActiveSession(name);
              const data = await getAllData(name);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(data));
            } catch (err: any) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 404 for unknown API routes
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    }

    // Static files
    const safeUrl = url === '/' ? 'index.html' : url;
    // Prevent path traversal: reject URLs with .. or null bytes
    if (safeUrl.includes('..') || safeUrl.includes('\0')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }
    let filePath = path.join(DASHBOARD_DIR, safeUrl);
    const ext = path.extname(filePath).toLowerCase();

    // If no extension, try .html (SPA routing)
    if (!ext && !url.startsWith('/api/')) {
      filePath += '.html';
    }

    // Resolve and ensure the final path stays within DASHBOARD_DIR
    const resolvedDashboard = path.resolve(DASHBOARD_DIR);
    let resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(resolvedDashboard)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    try {
      if (!existsSync(resolvedPath)) {
        // SPA fallback: serve index.html for non-API routes
        if (!url.startsWith('/api/')) {
          resolvedPath = path.join(DASHBOARD_DIR, 'index.html');
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
          return;
        }
      }

      const content = await fs.readFile(resolvedPath);
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server error');
    }
  });

  return server;
}

export async function startDashboardServer(port: number = 3456): Promise<Server> {
  // Check if dashboard is built
  if (!existsSync(DASHBOARD_DIR)) {
    throw new Error(
      `Dashboard not built. Run 'npm run build:dashboard' first.\nExpected: ${DASHBOARD_DIR}`
    );
  }

  const server = createDashboardServer(port);
  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      console.log(`CWIM Kanban dashboard running at http://localhost:${port}`);
      resolve(server);
    });
    server.on('error', reject);
  });
}
