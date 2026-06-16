import { ChevronDown, ChevronRight, Folder, Bot } from 'lucide-react';
import { useState } from 'react';
import { compareAgentFolderIds, getOrderedCategories, normalizeAgentEntry } from '../api';

function TreeNode({ label, icon: Icon, children, isActive, onClick, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = Boolean(children);

  return (
    <div>
      <div
        className={`tree-item ${isActive ? 'tree-item-active' : ''}`}
        onClick={() => {
          if (hasChildren) setOpen((o) => !o);
          onClick?.();
        }}
      >
        {hasChildren ? (
          open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
        ) : (
          <span className="w-3.5" />
        )}
        {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}
        <span className="truncate">{label}</span>
      </div>
      {hasChildren && open && <div className="ml-3 border-l border-surface-border pl-1">{children}</div>}
    </div>
  );
}

export default function Sidebar({ tree, selectedAgent, onSelectAgent }) {
  const categories = getOrderedCategories(tree);

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-surface-border bg-surface-elevated lg:w-64">
      <div className="border-b border-surface-border px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Agents</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {categories.map((cat) => (
          <TreeNode key={cat} label={cat} icon={Folder} defaultOpen>
            {Object.keys(tree[cat])
              .sort(compareAgentFolderIds)
              .map((agent) => {
                const { displayName } = normalizeAgentEntry(tree[cat][agent], agent);
                return (
                <TreeNode
                  key={agent}
                  label={displayName}
                  icon={Bot}
                  isActive={selectedAgent === agent}
                  onClick={() => onSelectAgent(agent, cat)}
                />
              );
              })}
          </TreeNode>
        ))}
      </div>
    </aside>
  );
}
