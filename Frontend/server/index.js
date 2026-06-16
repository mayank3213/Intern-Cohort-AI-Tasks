import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TASKS_ROOT = path.resolve(__dirname, '../../tasks');
const PORT = process.env.PORT || 3001;

const IGNORE_DIRS = new Set([
  'node_modules',
  '.venv',
  'venv',
  '.git',
  '__pycache__',
  '.pytest_cache',
  '.ruff_cache',
  'dist',
  'build',
  '.next',
]);

const IGNORE_EXTENSIONS = new Set([
  '.pyc',
  '.pyo',
  '.so',
  '.dll',
  '.exe',
]);

const app = express();
app.use(cors());
app.use(express.json());

const fileCache = new Map();
const CACHE_TTL = 30_000;

function isIgnored(name) {
  if (IGNORE_DIRS.has(name)) return true;
  const ext = path.extname(name).toLowerCase();
  return IGNORE_EXTENSIONS.has(ext);
}

function safePath(relativePath) {
  const resolved = path.resolve(TASKS_ROOT, relativePath || '');
  if (!resolved.startsWith(TASKS_ROOT)) {
    throw new Error('Invalid path');
  }
  return resolved;
}

async function readFileCached(relativePath) {
  const abs = safePath(relativePath);
  const stat = await fs.stat(abs);
  const cached = fileCache.get(relativePath);
  if (cached && cached.mtime === stat.mtimeMs) {
    return cached.content;
  }
  const content = await fs.readFile(abs, 'utf-8');
  fileCache.set(relativePath, { content, mtime: stat.mtimeMs, cachedAt: Date.now() });
  return content;
}

async function listAgentMdFiles(dir, base = '') {
  const results = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (isIgnored(entry.name)) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      results.push(...(await listAgentMdFiles(path.join(dir, entry.name), rel)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(rel);
    }
  }
  return results;
}

async function resolveAgentDefinitionFile(agentDir, mdFiles) {
  for (const f of mdFiles) {
    try {
      const content = await readFileCached(`${agentDir}/${f}`);
      if (/\*\*Agent name:\*\*/i.test(content)) return f;
    } catch {
      /* skip unreadable */
    }
  }
  if (mdFiles.includes('agent.md')) return 'agent.md';
  return null;
}

function normalizeAgentEntry(entry, folderId = '') {
  if (Array.isArray(entry)) {
    return { files: entry, displayName: folderId };
  }
  return {
    files: entry?.files || [],
    displayName: entry?.displayName || folderId,
  };
}

async function resolveAgentDisplayName(agentDir, mdFiles, folderId) {
  const defFile = await resolveAgentDefinitionFile(agentDir, mdFiles);
  if (!defFile) return folderId;

  try {
    const content = await readFileCached(`${agentDir}/${defFile}`);
    const match = content.match(/\*\*Agent name:\*\*\s*`?([^`\n]+)`?/i);
    if (match) return match[1].trim();
    return defFile.replace(/\.md$/, '');
  } catch {
    return folderId;
  }
}

async function buildTree() {
  const tree = {};
  let categories;
  try {
    categories = await fs.readdir(TASKS_ROOT, { withFileTypes: true });
  } catch {
    return tree;
  }

  for (const cat of categories) {
    if (!cat.isDirectory() || isIgnored(cat.name)) continue;
    const catPath = path.join(TASKS_ROOT, cat.name);
    const agents = await fs.readdir(catPath, { withFileTypes: true });
    tree[cat.name] = {};

    for (const agent of agents) {
      if (!agent.isDirectory() || isIgnored(agent.name)) continue;
      const agentPath = path.join(catPath, agent.name);
      const files = await fs.readdir(agentPath, { withFileTypes: true });
      const mdFiles = files
        .filter((f) => f.isFile() && f.name.endsWith('.md'))
        .map((f) => f.name)
        .sort();
      if (mdFiles.length > 0) {
        const agentDir = `${cat.name}/${agent.name}`;
        const displayName = await resolveAgentDisplayName(agentDir, mdFiles, agent.name);
        tree[cat.name][agent.name] = { files: mdFiles, displayName };
      }
    }
  }
  return tree;
}

function extractMetadata(content, agentName) {
  const metadata = {
    name: agentName,
    title: '',
    purpose: '',
    description: '',
    inputs: [],
    outputs: [],
    dependencies: [],
    executionFlow: [],
    agentNameField: '',
    version: '',
  };

  const lines = content.split('\n');
  const titleMatch = content.match(/^#\s+(.+)$/m);
  metadata.title = titleMatch ? titleMatch[1].trim() : agentName;

  const purposeMatch = content.match(/\*\*Purpose:\*\*\s*(.+)/i);
  if (purposeMatch) metadata.purpose = purposeMatch[1].trim();

  const agentNameMatch = content.match(/\*\*Agent name:\*\*\s*`?([^`\n]+)`?/i);
  if (agentNameMatch) {
    metadata.agentNameField = agentNameMatch[1].trim();
    metadata.displayName = metadata.agentNameField;
  }

  const versionMatch = content.match(/\*\*Version:\*\*\s*([^\n]+)/i);
  if (versionMatch) metadata.version = versionMatch[1].trim();

  const goalIdx = content.indexOf('## Goal');
  if (goalIdx !== -1) {
    const nextSection = content.indexOf('\n## ', goalIdx + 1);
    const goalBlock = nextSection === -1 ? content.slice(goalIdx) : content.slice(goalIdx, nextSection);
    metadata.description = goalBlock.replace(/^## Goal\s*/i, '').trim().slice(0, 500);
  } else if (metadata.purpose) {
    metadata.description = metadata.purpose;
  }

  const inputSection = content.match(/##\s*(?:Required\s+)?Inputs?[^\n]*\n([\s\S]*?)(?=\n## |\n---|\Z)/i);
  if (inputSection) {
    metadata.inputs = inputSection[1]
      .split('\n')
      .filter((l) => /^[-*]/.test(l.trim()) || /^\|/.test(l.trim()))
      .slice(0, 8)
      .map((l) => l.replace(/^[-*]\s*/, '').trim());
  }

  const outputSection = content.match(/##\s*(?:Required\s+)?Outputs?[^\n]*\n([\s\S]*?)(?=\n## |\n---|\Z)/i);
  if (outputSection) {
    metadata.outputs = outputSection[1]
      .split('\n')
      .filter((l) => /^[-*]/.test(l.trim()))
      .slice(0, 8)
      .map((l) => l.replace(/^[-*]\s*/, '').trim());
  }

  const depSection = content.match(/##\s*Dependencies[^\n]*\n([\s\S]*?)(?=\n## |\n---|\Z)/i);
  if (depSection) {
    metadata.dependencies = depSection[1]
      .split('\n')
      .filter((l) => /^[-*]/.test(l.trim()))
      .slice(0, 6)
      .map((l) => l.replace(/^[-*]\s*/, '').trim());
  }

  const flowPatterns = [
    /##\s*(?:Execution\s+)?(?:Flow|Steps|Workflow)[^\n]*\n([\s\S]*?)(?=\n## |\n---|\Z)/i,
    /##\s*Run\s+(?:order|sequence)[^\n]*\n([\s\S]*?)(?=\n## |\n---|\Z)/i,
  ];
  for (const pat of flowPatterns) {
    const m = content.match(pat);
    if (m) {
      metadata.executionFlow = m[1]
        .split('\n')
        .filter((l) => /^\d+\./.test(l.trim()) || /^[-*]/.test(l.trim()))
        .slice(0, 10)
        .map((l) => l.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim());
      break;
    }
  }

  return metadata;
}

function findAgentPath(tree, agentName) {
  for (const [category, agents] of Object.entries(tree)) {
    if (agents[agentName]) {
      const { files, displayName } = normalizeAgentEntry(agents[agentName], agentName);
      return { category, agentName, files, displayName };
    }
  }
  return null;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, tasksRoot: TASKS_ROOT });
});

app.get('/api/tree', async (_req, res) => {
  try {
    const tree = await buildTree();
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/file', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    if (!filePath) return res.status(400).json({ error: 'path required' });
    const content = await readFileCached(filePath);
    const stat = await fs.stat(safePath(filePath));
    res.json({
      path: filePath,
      content,
      size: stat.size,
      modified: stat.mtime.toISOString(),
      name: path.basename(filePath),
    });
  } catch (err) {
    res.status(err.message === 'Invalid path' ? 403 : 404).json({ error: err.message });
  }
});

app.get('/api/agent', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'name required' });

    const tree = await buildTree();
    const found = findAgentPath(tree, name);
    if (!found) return res.status(404).json({ error: `Agent ${name} not found` });

    const agentDir = `${found.category}/${found.agentName}`;
    const agentDefFile = await resolveAgentDefinitionFile(agentDir, found.files);
    const agentMdPath = agentDefFile ? `${agentDir}/${agentDefFile}` : null;
    let agentContent = '';
    let metadata = { name, title: name, description: '' };

    if (agentMdPath) {
      try {
        agentContent = await readFileCached(agentMdPath);
        metadata = extractMetadata(agentContent, name);
      } catch {
        /* agent definition may not exist */
      }
    }

    const outputs = found.files.filter((f) => f !== agentDefFile);
    const files = await Promise.all(
      found.files.map(async (f) => {
        const fp = `${agentDir}/${f}`;
        try {
          const stat = await fs.stat(safePath(fp));
          return {
            name: f,
            path: fp,
            size: stat.size,
            modified: stat.mtime.toISOString(),
            isAgentDefinition: f === agentDefFile,
          };
        } catch {
          return { name: f, path: fp, isAgentDefinition: f === agentDefFile };
        }
      }),
    );

    res.json({
      name,
      displayName: metadata.displayName || found.displayName || name,
      folderId: found.agentName,
      category: found.category,
      path: agentDir,
      metadata,
      files,
      outputs,
      agentContent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ results: [] });

    const query = q.toLowerCase();
    const tree = await buildTree();
    const results = [];

    for (const [category, agents] of Object.entries(tree)) {
      if (category.toLowerCase().includes(query)) {
        results.push({ type: 'folder', name: category, path: category, match: 'category' });
      }
      for (const [agentName, entry] of Object.entries(agents)) {
        const { files, displayName } = normalizeAgentEntry(entry, agentName);
        const matchesFolder = agentName.toLowerCase().includes(query);
        const matchesDisplay = displayName.toLowerCase().includes(query);
        if (matchesFolder || matchesDisplay) {
          results.push({
            type: 'agent',
            name: displayName,
            agent: agentName,
            path: `${category}/${agentName}`,
            category,
            match: matchesDisplay ? 'agent name' : 'folder id',
          });
        }
        for (const file of files) {
          if (file.toLowerCase().includes(query)) {
            results.push({
              type: 'file',
              name: file,
              path: `${category}/${agentName}/${file}`,
              agent: displayName,
              agentId: agentName,
              category,
              match: 'filename',
            });
          }
        }
      }
    }

    const allMd = await listAgentMdFiles(TASKS_ROOT);
    for (const rel of allMd.slice(0, 50)) {
      if (results.some((r) => r.path === rel)) continue;
      try {
        const content = await readFileCached(rel);
        if (content.toLowerCase().includes(query)) {
          const parts = rel.split('/');
          results.push({
            type: 'content',
            name: parts[parts.length - 1],
            path: rel,
            agent: parts[1],
            category: parts[0],
            match: 'content',
            snippet: content.slice(
              Math.max(0, content.toLowerCase().indexOf(query) - 40),
              content.toLowerCase().indexOf(query) + 80,
            ),
          });
        }
      } catch {
        /* skip unreadable */
      }
      if (results.length >= 30) break;
    }

    res.json({ results: results.slice(0, 30), query: q });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/graph', async (_req, res) => {
  try {
    const tree = await buildTree();
    const nodes = [];
    const edges = [];

    for (const [category, agents] of Object.entries(tree)) {
      nodes.push({ id: category, label: category, type: 'category' });
      for (const [agentName, entry] of Object.entries(agents)) {
        const { displayName } = normalizeAgentEntry(entry, agentName);
        const id = `${category}/${agentName}`;
        nodes.push({ id, label: displayName, folderId: agentName, type: 'agent', category });
        edges.push({ from: category, to: id });
      }
    }

    res.json({ nodes, edges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const clientDist = path.resolve(__dirname, '../client/dist');
try {
  await fs.access(clientDist);
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} catch {
  /* dev mode — vite serves client */
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of fileCache) {
    if (now - val.cachedAt > CACHE_TTL * 10) fileCache.delete(key);
  }
}, 60_000);

app.listen(PORT, () => {
  console.log(`Agent Workbench API running on http://localhost:${PORT}`);
  console.log(`Tasks root: ${TASKS_ROOT}`);
});
