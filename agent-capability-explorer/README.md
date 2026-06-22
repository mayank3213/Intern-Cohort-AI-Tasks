# Agent Capability Explorer

Interactive showcase of repository analysis, multi-agent workflows, polyglot systems, and infrastructure artifacts — generated entirely from the local `tasks/` folder.

## Quick Start

```bash
cd agent-capability-explorer
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

Data is regenerated automatically via `predev` / `prebuild` from `../tasks/`.

## Features

- **Home** — hero, animated stats, featured agent cards
- **Explore** — search, filters (category, status, language), agent grid
- **Agent Detail** — overview, requirements, artifacts, markdown reports, evidence, commands, verification
- **Progress** — completion heatmap (B1–D6)
- **Timeline** — chronological task history
- **Command palette** — `⌘K` search, `⇧⌘K` navigation
- **Markdown viewer** — GFM tables, syntax highlighting, Mermaid diagrams
- **Dark mode first** with theme toggle

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · shadcn/ui · lucide-react · framer-motion · react-router-dom · react-markdown · mermaid

## Architecture

```
src/
├── components/ui/       # shadcn-style primitives
├── components/layout/   # AppShell, Sidebar, Header
├── components/features/ # AgentCard, MarkdownViewer, EvidencePanel, …
├── pages/               # Route pages
├── hooks/               # useAgents, useTheme, filters
├── data/
│   ├── types.ts
│   └── generated/       # Auto-generated from tasks/
├── utils/
scripts/
└── generate-data.mjs    # Scans ../tasks/ recursively
```

## Data Source

No backend required. The build script discovers:

- Task READMEs and agent specs
- Agent run outputs and evaluator keys
- Proof screenshots and artifacts
- Languages, frameworks, scores, and completion status
