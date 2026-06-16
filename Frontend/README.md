# Agent Workbench UI

A full-stack **Agent Workbench** for exploring multi-agent markdown definitions, run outputs, and diagrams — dynamically loaded from the `tasks/` directory.

## Features

- **Agent Explorer** — tree sidebar with categories and agents shown by slug name (e.g. `parallel-task-splitter`, `code-artifact-mapper`)
- **Agent Detail Panel** — metadata, description, file list, intelligence extraction
- **Markdown Viewer** — syntax highlighting, GFM tables, **Mermaid diagram rendering**
- **File Actions** — copy markdown, download `.md`, fullscreen preview
- **Global Search** — agents, filenames, folder names, content snippets
- **Agent Intelligence** — auto-extracts purpose, inputs, outputs, dependencies, flow diagrams
- **System Graph** — Mermaid visualization of all agents
- **UX** — dark mode, file preview tabs, breadcrumbs

## Quick Start

```bash
cd workbench
npm run install:all
npm run dev
```

- **UI:** http://localhost:5173
- **API:** http://localhost:3001

## Architecture

```
workbench/
├── server/          # Express API — reads tasks/ filesystem
│   └── index.js
├── client/          # React + Vite + Tailwind
│   └── src/
└── package.json     # Root scripts (concurrently)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tree` | Folder structure of all agents |
| GET | `/api/file?path=` | Markdown file content |
| GET | `/api/agent?name=` | Agent metadata + file list |
| GET | `/api/search?q=` | Search agents, files, content |
| GET | `/api/graph` | System graph nodes/edges |

## Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS, react-markdown, mermaid, react-syntax-highlighter
- **Backend:** Node.js, Express, filesystem API with caching

## Usage

1. Open http://localhost:5173
2. Expand a category in the sidebar (e.g. **Infra and DevOps**)
3. Click an agent (e.g. **observability-stack-agent**)
4. View metadata and click the agent definition file or run output files
5. Mermaid diagrams render inline
6. Use copy/download/fullscreen buttons on any file

No manual configuration required — the UI reads directly from `../tasks/`.
