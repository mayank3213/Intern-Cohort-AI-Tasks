export type AgentStatus = 'PASS' | 'PARTIAL' | 'FAIL' | 'INCOMPLETE';

export type FileType =
  | 'readme'
  | 'agent-spec'
  | 'output'
  | 'evaluator'
  | 'markdown'
  | 'image'
  | 'config'
  | 'artifact'
  | 'other';

export interface AgentFile {
  path: string;
  name: string;
  relativePath: string;
  type: FileType;
  size: number;
  updatedAt: string | null;
}

export interface AgentEvidence {
  commands: string[];
  commits: string[];
  testResults: string[];
  risks: string;
  verification: string;
}

export interface Agent {
  id: string;
  taskId: string;
  name: string;
  displayName: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  categoryEmoji: string;
  difficulty: string;
  status: AgentStatus;
  score: number;
  languages: string[];
  frameworks: string[];
  files: AgentFile[];
  agentSpecPath: string | null;
  readmePath: string | null;
  primaryOutputPath: string | null;
  evaluatorPath: string | null;
  proofImages: string[];
  evidence: AgentEvidence;
  sections: Record<string, string>;
  createdAt: string | null;
  updatedAt: string | null;
  completed: boolean;
}

export interface TimelineEntry {
  id: string;
  taskId: string;
  title: string;
  category: string;
  createdAt: string | null;
  updatedAt: string | null;
  status: AgentStatus;
  outputs: string[];
  evidenceCount: number;
}

export interface CategoryStats {
  id: string;
  label: string;
  emoji: string;
  difficulty: string;
  total: number;
  completed: number;
}

export interface CatalogStats {
  totalAgents: number;
  completedTasks: number;
  markdownFiles: number;
  tests: number;
  languages: string[];
  frameworks: string[];
  categories: CategoryStats[];
}

export type FilterCategory = 'all' | 'basics' | 'intermediate' | 'advanced' | 'devops';
export type FilterStatus = 'all' | 'completed' | 'incomplete';
export type FilterLanguage = 'all' | 'Python' | 'Node' | 'Rust' | 'Terraform' | 'Docker';
