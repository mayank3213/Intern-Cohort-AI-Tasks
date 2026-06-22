#!/usr/bin/env node
/**
 * Scans ../tasks/ and generates static data for AgentAtlas.
 * Run: node scripts/generate-data.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TASKS_ROOT = path.resolve(ROOT, '..', 'tasks');
const OUT_DIR = path.resolve(ROOT, 'src', 'data', 'generated');

const SKIP_DIRS = new Set([
  '.venv', 'node_modules', 'vendor', 'dist', 'build', 'target',
  '.git', '.pytest_cache', '__pycache__', '.github',
]);

const CATEGORY_CONFIG = {
  Basics: { id: 'basics', label: 'Basics', emoji: '📦', difficulty: 'beginner' },
  Intermediate: { id: 'intermediate', label: 'Intermediate', emoji: '🔧', difficulty: 'intermediate' },
  Advanced: { id: 'advanced', label: 'Advanced', emoji: '🚀', difficulty: 'advanced' },
  'Infra and DevOps': { id: 'devops', label: 'DevOps', emoji: '☁️', difficulty: 'advanced' },
};

const LANG_PATTERNS = {
  Python: [/python/i, /\.py\b/, /fastapi/i, /pytest/i, /pip install/],
  Node: [/node\.?js/i, /express/i, /npm (run|test|install)/, /\.js\b/, /typescript/i],
  Rust: [/rust/i, /cargo (run|test|build)/, /\.rs\b/],
  Terraform: [/terraform/i, /\.tf\b/, /localstack/i],
  Docker: [/docker/i, /docker-compose/i, /Dockerfile/],
  Kubernetes: [/kubernetes/i, /kubectl/i, /\.yaml\b.*k8s/i, /kind cluster/],
  PHP: [/php/i, /\.php\b/, /composer\.json/],
  Go: [/\bgo\b/, /golang/i, /\.go\b/],
};

const AGENT_FILE_PATTERNS = [
  /-agent\.md$/i,
  /-mapper\.md$/i,
  /-executor\.md$/i,
  /-splitter\.md$/i,
  /-stepper\.md$/i,
  /-fixer\.md$/i,
  /-tracer\.md$/i,
  /-patcher\.md$/i,
  /-reviewer\.md$/i,
];

function walkDir(dir, base = dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full);
    if (entry.isDirectory()) {
      walkDir(full, base, files);
    } else {
      files.push({ full, rel, name: entry.name, ext: path.extname(entry.name).toLowerCase() });
    }
  }
  return files;
}

function extractTitle(content, fallback) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].replace(/^B\d+\s*[—–-]\s*/i, '').replace(/^I\d+\s*[—–-]\s*/i, '')
    .replace(/^A\d+\s*[—–-]\s*/i, '').replace(/^D\d+\s*[—–-]\s*/i, '').trim() : fallback;
}

function extractDescription(content) {
  const lines = content.split('\n');
  let inGoal = false;
  for (const line of lines) {
    if (/^##\s+(Goal|Purpose|Overview)/i.test(line)) { inGoal = true; continue; }
    if (inGoal && line.startsWith('##')) break;
    if (inGoal && line.trim() && !line.startsWith('#')) return line.trim().slice(0, 280);
  }
  const para = content.split('\n\n').find(p => p.trim() && !p.startsWith('#') && !p.startsWith('```'));
  return para ? para.replace(/\*\*/g, '').trim().slice(0, 280) : '';
}

function extractAgentName(content, filename) {
  const yamlMatch = content.match(/agent_name:\s*['"]?([\w-]+)/i);
  if (yamlMatch) return yamlMatch[1];
  const headerMatch = content.match(/\*\*Agent name:\*\*\s*`?([\w-]+)`?/i);
  if (headerMatch) return headerMatch[1];
  return filename.replace(/\.md$/i, '');
}

function extractScore(content) {
  const patterns = [
    /overall[_\s]?score:\s*([\d.]+)/i,
    /\*\*Overall score:\*\*\s*([\d.]+)/i,
    /Score:\s*([\d.]+)\s*\/\s*10/i,
  ];
  for (const p of patterns) {
    const m = content.match(p);
    if (m) return Math.min(10, parseFloat(m[1]));
  }
  return null;
}

function detectLanguages(text, files) {
  const found = new Set();
  const combined = text + '\n' + files.map(f => f.name + ' ' + f.rel).join('\n');
  for (const [lang, patterns] of Object.entries(LANG_PATTERNS)) {
    if (patterns.some(p => p.test(combined))) found.add(lang);
  }
  return [...found];
}

function detectFrameworks(text) {
  const fw = [];
  const map = {
    FastAPI: /fastapi/i, Express: /express/i, Slim: /slim\s*3/i,
    Terraform: /terraform/i, Docker: /docker-compose/i,
    Kubernetes: /kubernetes|kubectl|kind/i, Prometheus: /prometheus/i,
    Grafana: /grafana/i, 'GitHub Actions': /github actions/i,
    pytest: /pytest/i, Mermaid: /```mermaid/i,
  };
  for (const [name, re] of Object.entries(map)) {
    if (re.test(text)) fw.push(name);
  }
  return fw;
}

function extractCommands(content) {
  const commands = [];
  const codeBlocks = content.matchAll(/```(?:bash|sh|shell|zsh)?\n([\s\S]*?)```/g);
  for (const [, block] of codeBlocks) {
    block.split('\n').forEach(line => {
      const t = line.trim();
      if (t && !t.startsWith('#') && (t.startsWith('npm ') || t.startsWith('pip ') ||
        t.startsWith('cargo ') || t.startsWith('docker ') || t.startsWith('kubectl ') ||
        t.startsWith('terraform ') || t.startsWith('pytest ') || t.startsWith('git ') ||
        t.startsWith('curl ') || t.startsWith('make ') || t.startsWith('cd '))) {
        commands.push(t);
      }
    });
  }
  return [...new Set(commands)].slice(0, 20);
}

function extractSections(content) {
  const sections = {};
  const parts = content.split(/^##\s+/m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const heading = part.slice(0, nl).trim();
    const body = part.slice(nl + 1).trim();
    const key = heading.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    sections[key] = body.slice(0, 5000);
  }
  return sections;
}

function getFileStats(full) {
  try {
    const stat = fs.statSync(full);
    return { mtime: stat.mtime.toISOString(), size: stat.size };
  } catch {
    return { mtime: null, size: 0 };
  }
}

function classifyFile(rel, name) {
  if (name === 'README.md') return 'readme';
  if (name === 'EVALUATOR.md') return 'evaluator';
  if (/^agent-run-output/i.test(name)) return 'output';
  if (AGENT_FILE_PATTERNS.some(p => p.test(name))) return 'agent-spec';
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name)) return 'image';
  if (/\.md$/i.test(name)) return 'markdown';
  if (/\.(yml|yaml)$/i.test(name)) return 'config';
  if (/\.(json|tf|sh)$/i.test(name)) return 'artifact';
  return 'other';
}

function determineStatus(taskFiles, outputs, proofs, evaluator) {
  if (outputs.length > 0 && proofs.length > 0) return 'PASS';
  if (outputs.length > 0) return 'PASS';
  if (proofs.length > 0) return 'PARTIAL';
  if (evaluator) return 'PARTIAL';
  const hasAgentSpec = taskFiles.some(f => f.type === 'agent-spec');
  if (hasAgentSpec) return 'PARTIAL';
  return 'INCOMPLETE';
}

function computeScore(status, parsedScore, hasOutput, hasProof) {
  if (parsedScore !== null) return parsedScore;
  if (status === 'PASS') return hasProof ? 9.0 : 8.0;
  if (status === 'PARTIAL') return 6.0;
  return 0;
}

function buildAgents() {
  const agents = [];
  const contentMap = {};
  const timeline = [];

  for (const [catFolder, catConfig] of Object.entries(CATEGORY_CONFIG)) {
    const catPath = path.join(TASKS_ROOT, catFolder);
    if (!fs.existsSync(catPath)) continue;

    const taskDirs = fs.readdirSync(catPath, { withFileTypes: true })
      .filter(d => d.isDirectory() && /^[BIDA]\d+$/.test(d.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    for (const taskDir of taskDirs) {
      const taskId = taskDir.name;
      const taskPath = path.join(catPath, taskId);
      const allFiles = walkDir(taskPath, taskPath);
      const relBase = `${catFolder}/${taskId}`;

      const readmeFile = allFiles.find(f => f.rel === 'README.md');
      const readmeContent = readmeFile ? fs.readFileSync(readmeFile.full, 'utf-8') : '';
      const title = extractTitle(readmeContent, taskId);
      const description = extractDescription(readmeContent);

      const agentSpecFiles = allFiles.filter(f => classifyFile(f.rel, f.name) === 'agent-spec');
      const outputFiles = allFiles.filter(f => classifyFile(f.rel, f.name) === 'output');
      const proofFiles = allFiles.filter(f => f.rel.startsWith('proof/') && classifyFile(f.rel, f.name) === 'image');
      const evaluatorFile = allFiles.find(f => f.name === 'EVALUATOR.md');
      const mdFiles = allFiles.filter(f => f.ext === '.md');

      let agentName = taskId;
      let agentDescription = description;
      if (agentSpecFiles.length > 0) {
        const specContent = fs.readFileSync(agentSpecFiles[0].full, 'utf-8');
        agentName = extractAgentName(specContent, agentSpecFiles[0].name);
        const specDesc = extractDescription(specContent);
        if (specDesc) agentDescription = specDesc;
      }

      const allText = mdFiles.map(f => {
        try { return fs.readFileSync(f.full, 'utf-8'); } catch { return ''; }
      }).join('\n');

      let bestScore = null;
      for (const of of outputFiles) {
        const c = fs.readFileSync(of.full, 'utf-8');
        const s = extractScore(c);
        if (s !== null) bestScore = Math.max(bestScore ?? 0, s);
      }

      const status = determineStatus(
        mdFiles.map(f => ({ type: classifyFile(f.rel, f.name) })),
        outputFiles, proofFiles, evaluatorFile
      );
      const score = computeScore(status, bestScore, outputFiles.length > 0, proofFiles.length > 0);
      const languages = detectLanguages(allText, allFiles);
      const frameworks = detectFrameworks(allText);

      const files = allFiles
        .filter(f => !SKIP_DIRS.has(path.basename(f.full)))
        .map(f => {
          const type = classifyFile(f.rel, f.name);
          const stats = getFileStats(f.full);
          const relPath = `${relBase}/${f.rel}`;
          if (f.ext === '.md' || f.ext === '.txt') {
            try {
              contentMap[relPath] = fs.readFileSync(f.full, 'utf-8');
            } catch { /* skip */ }
          }
          return {
            path: relPath,
            name: f.name,
            relativePath: f.rel,
            type,
            size: stats.size,
            updatedAt: stats.mtime,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      const primaryOutput = outputFiles[0];
      const commands = primaryOutput
        ? extractCommands(fs.readFileSync(primaryOutput.full, 'utf-8'))
        : extractCommands(readmeContent);

      const evidence = {
        commands,
        commits: [...allText.matchAll(/commit[:\s]+([a-f0-9]{7,40})/gi)].map(m => m[1]).slice(0, 10),
        testResults: allText.includes('pytest') || allText.includes('npm test') || allText.includes('cargo test')
          ? ['Tests referenced in documentation']
          : [],
        risks: extractSections(allText)['risks'] || extractSections(allText)['gaps_uncertainty'] || '',
        verification: evaluatorFile ? fs.readFileSync(evaluatorFile.full, 'utf-8').slice(0, 3000) : '',
      };

      const dates = files.filter(f => f.updatedAt).map(f => f.updatedAt);
      const createdAt = dates.length ? dates.sort()[0] : null;
      const updatedAt = dates.length ? dates.sort().reverse()[0] : null;

      const id = `${catConfig.id}-${taskId.toLowerCase()}`;

      agents.push({
        id,
        taskId,
        name: agentName,
        displayName: `${taskId} ${title}`,
        title,
        description: agentDescription || title,
        category: catConfig.id,
        categoryLabel: catConfig.label,
        categoryEmoji: catConfig.emoji,
        difficulty: catConfig.difficulty,
        status,
        score,
        languages,
        frameworks,
        files,
        agentSpecPath: agentSpecFiles[0] ? `${relBase}/${agentSpecFiles[0].rel}` : null,
        readmePath: readmeFile ? `${relBase}/README.md` : null,
        primaryOutputPath: primaryOutput ? `${relBase}/${primaryOutput.rel}` : null,
        evaluatorPath: evaluatorFile ? `${relBase}/EVALUATOR.md` : null,
        proofImages: proofFiles.map(f => `${relBase}/${f.rel}`),
        evidence,
        sections: primaryOutput ? extractSections(fs.readFileSync(primaryOutput.full, 'utf-8')) : extractSections(readmeContent),
        createdAt,
        updatedAt,
        completed: status === 'PASS',
      });

      timeline.push({
        id,
        taskId,
        title: `${taskId} — ${title}`,
        category: catConfig.label,
        createdAt,
        updatedAt,
        status,
        outputs: outputFiles.map(f => `${relBase}/${f.rel}`),
        evidenceCount: commands.length + proofFiles.length,
      });
    }
  }

  timeline.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  const stats = {
    totalAgents: agents.length,
    completedTasks: agents.filter(a => a.completed).length,
    markdownFiles: Object.keys(contentMap).length,
    tests: agents.filter(a => a.evidence.testResults.length > 0).length,
    languages: [...new Set(agents.flatMap(a => a.languages))],
    frameworks: [...new Set(agents.flatMap(a => a.frameworks))],
    categories: Object.values(CATEGORY_CONFIG).map(c => ({
      ...c,
      total: agents.filter(a => a.category === c.id).length,
      completed: agents.filter(a => a.category === c.id && a.completed).length,
    })),
  };

  return { agents, contentMap, timeline, stats };
}

function escapeForTs(str) {
  return JSON.stringify(str);
}

function copyProofImages(agents) {
  const assetsDir = path.resolve(ROOT, 'public', 'task-assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  for (const agent of agents) {
    for (const imgPath of agent.proofImages) {
      const fullSrc = path.join(TASKS_ROOT, ...imgPath.split('/'));
      const dest = path.join(assetsDir, imgPath);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      if (fs.existsSync(fullSrc)) fs.copyFileSync(fullSrc, dest);
    }
  }
}

function generate() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { agents, contentMap, timeline, stats } = buildAgents();

  const agentsTs = `/* AUTO-GENERATED — run: node scripts/generate-data.mjs */
import type { Agent, TimelineEntry, CatalogStats } from '../types';

export const agents: Agent[] = ${JSON.stringify(agents, null, 2)};

export const timeline: TimelineEntry[] = ${JSON.stringify(timeline, null, 2)};

export const catalogStats: CatalogStats = ${JSON.stringify(stats, null, 2)};
`;

  const contentEntries = Object.entries(contentMap)
    .map(([k, v]) => `  ${escapeForTs(k)}: ${escapeForTs(v)}`)
    .join(',\n');

  const contentTs = `/* AUTO-GENERATED — run: node scripts/generate-data.mjs */
export const markdownContent: Record<string, string> = {
${contentEntries}
};

export function getMarkdown(path: string): string | undefined {
  return markdownContent[path];
}
`;

  fs.writeFileSync(path.join(OUT_DIR, 'agents.ts'), agentsTs);
  fs.writeFileSync(path.join(OUT_DIR, 'content.ts'), contentTs);

  copyProofImages(agents);

  console.log(`Generated ${agents.length} agents, ${Object.keys(contentMap).length} markdown files`);
  console.log(`Stats: ${stats.completedTasks}/${stats.totalAgents} completed`);
}

generate();
