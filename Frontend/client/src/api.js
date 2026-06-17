const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchJson(url, options) {
  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  getTree: () => fetchJson('/tree'),
  getFile: (path) => fetchJson(`/file?path=${encodeURIComponent(path)}`),
  getAgent: (name) => fetchJson(`/agent?name=${encodeURIComponent(name)}`),
  search: (q) => fetchJson(`/search?q=${encodeURIComponent(q)}`),
  getGraph: () => fetchJson('/graph'),
};


const SKIP_FILE_PATTERN = /^(README\.md|agent-run-output|run-|parallel-plan|parallel-run|perf-run|stack-run|ci-run|bootstrap-run)/i;
const AGENT_SPEC_PATTERN = /-(agent|mapper|executor|stepper|fixer|reviewer|tracer|patcher|diagnoser|writer|splitter)\.md$/i;

function deriveDisplayNameFromFiles(files, folderId) {
  if (!Array.isArray(files) || files.length === 0) return folderId;

  const candidates = files.filter((f) => !SKIP_FILE_PATTERN.test(f));
  const specFile =
    candidates.find((f) => AGENT_SPEC_PATTERN.test(f)) ||
    candidates.find((f) => !f.endsWith('-demo.md')) ||
    candidates[0];

  return specFile ? specFile.replace(/\.md$/, '') : folderId;
}


const CATEGORY_ORDER = ['Basics', 'Intermediate', 'Advanced', 'Infra and DevOps'];

export function getOrderedCategories(tree = {}) {
  const names = Object.keys(tree);
  const rank = new Map(CATEGORY_ORDER.map((name, index) => [name, index]));
  return names.sort((a, b) => {
    const aRank = rank.has(a) ? rank.get(a) : CATEGORY_ORDER.length;
    const bRank = rank.has(b) ? rank.get(b) : CATEGORY_ORDER.length;
    if (aRank !== bRank) return aRank - bRank;
    return a.localeCompare(b);
  });
}

export function compareAgentFolderIds(a, b) {
  const parseId = (id) => {
    const match = /^([A-Za-z]+)(\d+)$/.exec(id);
    if (!match) return { prefix: id, number: Number.MAX_SAFE_INTEGER };
    return { prefix: match[1].toUpperCase(), number: Number(match[2]) };
  };

  const left = parseId(a);
  const right = parseId(b);
  if (left.prefix !== right.prefix) return left.prefix.localeCompare(right.prefix);
  if (left.number !== right.number) return left.number - right.number;
  return a.localeCompare(b);
}

export function normalizeAgentEntry(entry, folderId = '') {
  if (Array.isArray(entry)) {
    return {
      files: entry,
      displayName: deriveDisplayNameFromFiles(entry, folderId),
    };
  }

  const files = entry?.files || [];
  const displayName =
    entry?.displayName && entry.displayName !== folderId
      ? entry.displayName
      : deriveDisplayNameFromFiles(files, folderId);

  return { files, displayName };
}

export function getAgentLabel(tree, category, agentId) {
  const entry = tree?.[category]?.[agentId];
  if (!entry) return agentId;
  return normalizeAgentEntry(entry, agentId).displayName;
};


export function loadOpenTabs() {
  try {
    return JSON.parse(localStorage.getItem('openTabs') || '[]');
  } catch {
    return [];
  }
}

export function saveOpenTabs(tabs) {
  localStorage.setItem('openTabs', JSON.stringify(tabs));
}

let offlineTree = null;

export async function getTreeWithFallback() {
  try {
    return await api.getTree();
  } catch {
    if (!offlineTree) {
      const res = await fetch('/tree-snapshot.json');
      offlineTree = res.ok ? await res.json() : {};
    }
    return offlineTree;
  }
}

export function enrichAgentData(data, tree = {}) {
  const folderId = data.folderId || data.name;
  const fileNames = data.files?.map((f) => f.name) || [];
  const treeEntry = data.category ? tree?.[data.category]?.[folderId] : null;
  const fromTree = treeEntry ? normalizeAgentEntry(treeEntry, folderId).displayName : null;
  const fromFiles = normalizeAgentEntry(fileNames, folderId).displayName;

  const displayName =
    [data.displayName, data.metadata?.displayName, data.metadata?.agentNameField, fromTree, fromFiles].find(
      (v) => v && v !== folderId,
    ) || fromFiles;

  const defFileName = `${displayName}.md`;
  const files = (data.files || []).map((f) => ({
    ...f,
    isAgentDefinition: Boolean(f.isAgentDefinition || f.name === defFileName),
  }));

  const metadata = {
    ...data.metadata,
    displayName,
    agentNameField: data.metadata?.agentNameField || displayName,
  };

  return {
    ...data,
    folderId,
    displayName,
    metadata,
    files,
  };
}

export function parseAgentDefinition(content, folderId = '') {
  const metadata = {
    title: folderId,
    description: '',
    agentNameField: '',
    displayName: '',
    purpose: '',
    version: '',
  };

  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) metadata.title = titleMatch[1].trim();

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

  return metadata;
}
