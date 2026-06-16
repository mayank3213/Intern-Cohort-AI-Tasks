import { X } from 'lucide-react';

export default function FileTabs({ tabs, activeTab, onSelect, onClose }) {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border-b border-surface-border bg-surface-elevated px-2">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          type="button"
          onClick={() => onSelect(tab.path)}
          className={`group flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs transition-colors ${
            activeTab === tab.path
              ? 'border-b-2 border-indigo-500 bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="max-w-[120px] truncate">{tab.name}</span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onClose(tab.path); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onClose(tab.path); } }}
            className="rounded p-0.5 opacity-0 hover:bg-black/10 group-hover:opacity-100 dark:hover:bg-white/10"
          >
            <X className="h-3 w-3" />
          </span>
        </button>
      ))}
    </div>
  );
}
