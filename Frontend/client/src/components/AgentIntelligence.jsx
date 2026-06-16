import MermaidBlock from './MermaidBlock';
import { ArrowRight, Brain, GitBranch, Package, Play } from 'lucide-react';

export default function AgentIntelligence({ metadata, dark }) {
  if (!metadata) return null;

  const hasFlow = metadata.inputs?.length || metadata.outputs?.length || metadata.executionFlow?.length;

  const flowDiagram = `graph LR
  Input["Inputs"] --> Agent["${metadata.name || 'Agent'}"]
  Agent --> Output["Outputs"]`;

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <Brain className="h-5 w-5 text-indigo-500" />
        <h3 className="font-semibold">Agent Intelligence</h3>
      </div>

      {metadata.purpose && (
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">{metadata.purpose}</p>
      )}

      <div className="mb-4 flex items-center justify-center gap-3 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-950/30">
        <div className="rounded-lg bg-white px-3 py-2 text-center text-xs shadow dark:bg-slate-800">
          <Package className="mx-auto mb-1 h-4 w-4 text-green-500" />
          Input
        </div>
        <ArrowRight className="h-5 w-5 text-indigo-400" />
        <div className="rounded-lg bg-indigo-600 px-4 py-2 text-center text-xs font-medium text-white shadow">
          <Brain className="mx-auto mb-1 h-4 w-4" />
          {metadata.agentNameField || metadata.name}
        </div>
        <ArrowRight className="h-5 w-5 text-indigo-400" />
        <div className="rounded-lg bg-white px-3 py-2 text-center text-xs shadow dark:bg-slate-800">
          <Play className="mx-auto mb-1 h-4 w-4 text-blue-500" />
          Output
        </div>
      </div>

      {hasFlow && <MermaidBlock chart={flowDiagram} dark={dark} />}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {metadata.inputs?.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase text-slate-500">Inputs</h4>
            <ul className="space-y-1 text-sm">
              {metadata.inputs.slice(0, 5).map((item, i) => (
                <li key={i} className="truncate text-slate-600 dark:text-slate-400">• {item.replace(/\|.+/g, '').trim() || item}</li>
              ))}
            </ul>
          </div>
        )}
        {metadata.outputs?.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase text-slate-500">Outputs</h4>
            <ul className="space-y-1 text-sm">
              {metadata.outputs.slice(0, 5).map((item, i) => (
                <li key={i} className="truncate text-slate-600 dark:text-slate-400">• {item}</li>
              ))}
            </ul>
          </div>
        )}
        {metadata.dependencies?.length > 0 && (
          <div>
            <h4 className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500">
              <GitBranch className="h-3 w-3" /> Dependencies
            </h4>
            <ul className="space-y-1 text-sm">
              {metadata.dependencies.map((item, i) => (
                <li key={i} className="truncate text-slate-600 dark:text-slate-400">• {item}</li>
              ))}
            </ul>
          </div>
        )}
        {metadata.executionFlow?.length > 0 && (
          <div className="sm:col-span-2">
            <h4 className="mb-1 text-xs font-semibold uppercase text-slate-500">Execution Flow</h4>
            <ol className="space-y-1 text-sm">
              {metadata.executionFlow.map((step, i) => (
                <li key={i} className="text-slate-600 dark:text-slate-400">{i + 1}. {step}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
