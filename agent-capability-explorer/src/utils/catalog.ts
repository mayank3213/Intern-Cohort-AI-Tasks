import { agents } from '../data/generated/agents';
import type { Agent, AgentFile } from '../data/types';

export type CatalogSection = 'agents' | 'services' | 'outputs' | 'readmes' | 'requirements';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  tech: string[];
  agentIds: string[];
  category: 'api' | 'worker' | 'infra' | 'observability' | 'data' | 'platform';
}

export interface OutputItem {
  id: string;
  name: string;
  path: string;
  agentId: string;
  taskId: string;
  title: string;
  category: string;
  size: number;
  updatedAt: string | null;
}

export interface ReadmeItem {
  id: string;
  path: string;
  agentId: string;
  taskId: string;
  title: string;
  category: string;
  categoryEmoji: string;
}

export interface SearchResult {
  id: string;
  type: CatalogSection | 'command' | 'markdown';
  title: string;
  subtitle: string;
  href: string;
  keywords: string[];
}

const SERVICE_DEFINITIONS: Omit<ServiceItem, 'agentIds'>[] = [
  { id: 'fastapi', name: 'FastAPI', description: 'Python async APIs for ingestion, echo services, and job orchestration.', tech: ['Python', 'uvicorn', 'pytest'], category: 'api' },
  { id: 'node-worker', name: 'Node Worker', description: 'Background job processor consuming queues and coordinating scoring pipelines.', tech: ['Node.js', 'Express', 'npm'], category: 'worker' },
  { id: 'rust-scorer', name: 'Rust Scorer', description: 'High-performance transaction scoring CLI compiled with Cargo.', tech: ['Rust', 'Cargo'], category: 'worker' },
  { id: 'express', name: 'Express Ledger', description: 'In-memory credit/debit ledger service with REST endpoints.', tech: ['Node.js', 'Express'], category: 'api' },
  { id: 'docker', name: 'Docker Stack', description: 'Containerized services with multi-stage builds and compose orchestration.', tech: ['Docker', 'Docker Compose'], category: 'infra' },
  { id: 'kubernetes', name: 'Kubernetes', description: 'kind cluster deployments with manifests, services, and ingress.', tech: ['Kubernetes', 'kubectl', 'kind'], category: 'infra' },
  { id: 'terraform', name: 'Terraform', description: 'Infrastructure-as-code for small services with LocalStack validation.', tech: ['Terraform', 'HCL'], category: 'infra' },
  { id: 'github-actions', name: 'GitHub Actions', description: 'CI pipelines for lint, test matrix, and container image builds.', tech: ['GitHub Actions', 'YAML'], category: 'platform' },
  { id: 'prometheus', name: 'Prometheus', description: 'Metrics collection and scraping for instrumented services.', tech: ['Prometheus', 'metrics'], category: 'observability' },
  { id: 'grafana', name: 'Grafana', description: 'Dashboards and visualization for service telemetry.', tech: ['Grafana', 'dashboards'], category: 'observability' },
  { id: 'postgresql', name: 'PostgreSQL', description: 'Relational persistence for job processing stacks.', tech: ['PostgreSQL', 'SQL'], category: 'data' },
  { id: 'slim-php', name: 'Slim PHP API', description: 'Legacy Slim 3 JSON API with modular router discovery.', tech: ['PHP', 'Slim 3'], category: 'api' },
];

function matchService(agent: Agent, service: Omit<ServiceItem, 'agentIds'>): boolean {
  const haystack = [
    agent.title,
    agent.description,
    agent.name,
    ...agent.frameworks,
    ...agent.languages,
    ...agent.files.map((f) => f.relativePath),
  ].join(' ').toLowerCase();

  const patterns: Record<string, RegExp[]> = {
    fastapi: [/fastapi/i, /python-api/i, /uvicorn/i],
    'node-worker': [/node worker/i, /node-worker/i, /worker/i],
    'rust-scorer': [/rust scorer/i, /rust-scorer/i, /cargo run/i],
    express: [/express/i, /ledger/i],
    docker: [/docker/i, /dockerfile/i, /docker-compose/i],
    kubernetes: [/kubernetes/i, /kubectl/i, /kind/i],
    terraform: [/terraform/i, /\.tf\b/i],
    'github-actions': [/github actions/i, /\.github\/workflows/i],
    prometheus: [/prometheus/i],
    grafana: [/grafana/i],
    postgresql: [/postgresql/i, /postgres/i],
    'slim-php': [/slim/i, /\.php\b/i],
  };

  return (patterns[service.id] ?? []).some((re) => re.test(haystack));
}

export function getServices(): ServiceItem[] {
  return SERVICE_DEFINITIONS.map((service) => ({
    ...service,
    agentIds: agents.filter((a) => matchService(a, service)).map((a) => a.id),
  })).filter((s) => s.agentIds.length > 0);
}

export function getOutputs(): OutputItem[] {
  return agents.flatMap((agent) =>
    agent.files
      .filter((f) => f.type === 'output' || f.type === 'artifact' || (f.type === 'markdown' && f.name !== 'README.md' && /output|report|inventory/i.test(f.name)))
      .map((f) => ({
        id: f.path,
        name: f.name,
        path: f.path,
        agentId: agent.id,
        taskId: agent.taskId,
        title: agent.title,
        category: agent.categoryLabel,
        size: f.size,
        updatedAt: f.updatedAt,
      })),
  );
}

export function getReadmes(): ReadmeItem[] {
  return agents
    .filter((a) => a.readmePath)
    .map((a) => ({
      id: a.readmePath!,
      path: a.readmePath!,
      agentId: a.id,
      taskId: a.taskId,
      title: a.title,
      category: a.categoryLabel,
      categoryEmoji: a.categoryEmoji,
    }));
}

export function getRequirementsAgents(): Agent[] {
  return agents.filter((a) => a.agentSpecPath || a.readmePath);
}

export function getRecentOutputs(limit = 6): OutputItem[] {
  return [...getOutputs()]
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, limit);
}

export function getAgentIcon(taskId: string): string {
  const prefix = taskId.charAt(0);
  const map: Record<string, string> = { B: '📦', I: '🔧', A: '🚀', D: '☁️' };
  return map[prefix] ?? '🤖';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  for (const agent of agents) {
    results.push({
      id: `agent-${agent.id}`,
      type: 'agents',
      title: `${agent.taskId} · ${agent.title}`,
      subtitle: agent.name,
      href: `/agent/${agent.id}`,
      keywords: [agent.taskId, agent.name, agent.title, agent.categoryLabel, ...agent.languages, ...agent.frameworks],
    });

    if (agent.agentSpecPath) {
      results.push({
        id: `req-${agent.id}`,
        type: 'requirements',
        title: `${agent.taskId} Requirements`,
        subtitle: agent.agentSpecPath.split('/').pop() ?? '',
        href: `/agent/${agent.id}?tab=requirements`,
        keywords: [agent.taskId, 'requirements', agent.name],
      });
    }

    for (const cmd of agent.evidence.commands) {
      results.push({
        id: `cmd-${agent.id}-${cmd.slice(0, 20)}`,
        type: 'command',
        title: cmd,
        subtitle: `${agent.taskId} command`,
        href: `/agent/${agent.id}?tab=commands`,
        keywords: [cmd, agent.taskId],
      });
    }
  }

  for (const service of getServices()) {
    results.push({
      id: `service-${service.id}`,
      type: 'services',
      title: service.name,
      subtitle: service.description.slice(0, 80),
      href: `/services#${service.id}`,
      keywords: [service.name, ...service.tech],
    });
  }

  for (const output of getOutputs()) {
    results.push({
      id: `output-${output.id}`,
      type: 'outputs',
      title: output.name,
      subtitle: `${output.taskId} · ${output.title}`,
      href: `/doc/${encodeURIComponent(output.path)}`,
      keywords: [output.name, output.taskId, output.title],
    });
  }

  for (const readme of getReadmes()) {
    results.push({
      id: `readme-${readme.id}`,
      type: 'readmes',
      title: `${readme.taskId} README`,
      subtitle: readme.title,
      href: `/doc/${encodeURIComponent(readme.path)}`,
      keywords: [readme.taskId, 'readme', readme.title],
    });
  }

  return results;
}

export function groupAgentsByCategory(agentList: Agent[] = agents): Record<string, Agent[]> {
  const groups: Record<string, Agent[]> = {};
  for (const agent of agentList) {
    if (!groups[agent.category]) groups[agent.category] = [];
    groups[agent.category].push(agent);
  }
  return groups;
}

export function fileTypeLabel(type: AgentFile['type']): string {
  const labels: Record<AgentFile['type'], string> = {
    readme: 'README',
    'agent-spec': 'Agent Spec',
    output: 'Output',
    evaluator: 'Evaluator',
    markdown: 'Markdown',
    image: 'Image',
    config: 'Config',
    artifact: 'Artifact',
    other: 'File',
  };
  return labels[type] ?? type;
}
