import { FileText, FolderOpen, Loader2 } from 'lucide-react';
import AgentIntelligence from './AgentIntelligence';
import { normalizeAgentEntry } from '../api';

export default function AgentPanel({ agent, loading, onOpenFile, activeFile }) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
        <FolderOpen className="mb-3 h-12 w-12 opacity-30" />
        <p className="text-lg font-medium">Select an agent</p>
        <p className="mt-1 text-sm">Choose from the sidebar to explore definitions and outputs</p>
      </div>
    );
  }

  const { metadata, files, path, category, displayName, folderId } = agent;
  const agentFolderId = folderId || metadata.name;
  const derivedName = normalizeAgentEntry(files.map((f) => f.name), agentFolderId).displayName;
  const agentLabel =
    [displayName, metadata.displayName, metadata.agentNameField, derivedName].find(
      (v) => v && v !== agentFolderId,
    ) || derivedName;
  const agentDef =
    files.find((f) => f.isAgentDefinition) ||
    files.find((f) => f.name === `${agentLabel}.md`);
  const outputs = files.filter((f) => f !== agentDef);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-surface-border px-4 py-3">
        <nav className="mb-1 text-xs text-slate-500">
          tasks / {category} / <span className="text-indigo-600 dark:text-indigo-400">{agentLabel}</span>
        </nav>
        <h2 className="text-xl font-bold">{metadata.title || agentLabel}</h2>
        <p className="mt-0.5 font-mono text-sm text-indigo-600 dark:text-indigo-400">{agentLabel}</p>
        {agentFolderId !== agentLabel && (
          <p className="mt-0.5 font-mono text-xs text-slate-500">{agentFolderId}</p>
        )}
        {metadata.version && (
          <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">v{metadata.version}</span>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {metadata.description && (
          <div className="panel p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Description</h3>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{metadata.description}</p>
          </div>
        )}

        <div className="panel p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Metadata</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Agent name</dt>
              <dd className="font-mono font-medium">{agentLabel}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Folder ID</dt>
              <dd className="font-mono font-medium">{agentFolderId}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Path</dt>
              <dd className="font-mono text-xs">{path}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Category</dt>
              <dd>{category}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Files</dt>
              <dd>{files.length}</dd>
            </div>
          </dl>
        </div>

        {agentDef && (
          <AgentIntelligence metadata={metadata} dark={document.documentElement.classList.contains('dark')} />
        )}

        <div className="panel p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Available Runs / Outputs
          </h3>
          <div className="space-y-1">
            {agentDef && (
              <button
                type="button"
                onClick={() => onOpenFile(agentDef.path, agentDef.name)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/40 ${
                  activeFile === agentDef.path ? 'bg-indigo-100 dark:bg-indigo-950/60' : ''
                }`}
              >
                <FileText className="h-4 w-4 text-indigo-500" />
                <span className="font-medium">{agentDef.name}</span>
                <span className="ml-auto text-xs text-slate-400">definition</span>
              </button>
            )}
            {outputs.map((file) => (
              <button
                key={file.path}
                type="button"
                onClick={() => onOpenFile(file.path, file.name)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/40 ${
                  activeFile === file.path ? 'bg-indigo-100 dark:bg-indigo-950/60' : ''
                }`}
              >
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="truncate">{file.name}</span>
                {file.modified && (
                  <span className="ml-auto shrink-0 text-xs text-slate-400">
                    {new Date(file.modified).toLocaleDateString()}
                  </span>
                )}
              </button>
            ))}
            {outputs.length === 0 && !agentDef && (
              <p className="text-sm text-slate-500">No markdown files found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
