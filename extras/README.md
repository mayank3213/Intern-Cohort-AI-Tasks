# Extras

Supporting assets outside the core `tasks/` evaluation catalog.

| Path | Purpose |
|------|---------|
| [`frontend/agent-capability-explorer/`](frontend/agent-capability-explorer/) | **AgentAtlas** — React/Vite site generated from `tasks/` |
| [`cloned-repos/reSlim/`](cloned-repos/reSlim/) | Git submodule — PHP Slim 3 sample repo for eval tasks |

## Quick start (AgentAtlas)

```bash
cd extras/frontend/agent-capability-explorer
npm install
npm run dev
```

## reSlim submodule

```bash
git submodule update --init extras/cloned-repos/reSlim
```
