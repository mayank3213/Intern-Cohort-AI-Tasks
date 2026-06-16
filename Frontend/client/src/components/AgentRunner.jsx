import { useState } from 'react';
import { Play, Loader2, Terminal } from 'lucide-react';
import { api } from '../api';

export default function AgentRunner({ agentName, onRunComplete }) {
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [lastOutput, setLastOutput] = useState(null);
  const [error, setError] = useState(null);

  async function handleRun() {
    if (!agentName || !prompt.trim()) return;
    setRunning(true);
    setError(null);
    try {
      const result = await api.runAgent(agentName, prompt.trim());
      setLastOutput(result);
      onRunComplete?.(result);
      setPrompt('');
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-surface-border bg-surface-elevated xl:w-80">
      <div className="border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-indigo-500" />
          <h2 className="font-semibold">Run Agent</h2>
        </div>
        {agentName ? (
          <p className="mt-1 font-mono text-sm text-indigo-600 dark:text-indigo-400">{agentName}</p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">Select an agent first</p>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <label className="mb-1 text-xs font-semibold uppercase text-slate-500">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={!agentName || running}
          placeholder="Enter prompt for the agent..."
          rows={6}
          className="mb-3 w-full resize-none rounded-lg border border-surface-border bg-surface p-3 text-sm outline-none focus:border-indigo-500 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleRun}
          disabled={!agentName || !prompt.trim() || running}
          className="btn-primary w-full justify-center"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? 'Executing...' : 'Execute'}
        </button>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">{error}</p>
        )}

        {lastOutput && (
          <div className="mt-4 flex-1 overflow-hidden rounded-lg border border-surface-border">
            <div className="border-b border-surface-border bg-green-50 px-3 py-2 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
              Output saved: {lastOutput.filename}
            </div>
            <pre className="max-h-48 overflow-auto p-3 text-xs text-slate-600 dark:text-slate-400">
              {lastOutput.content?.slice(0, 600)}...
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
}
