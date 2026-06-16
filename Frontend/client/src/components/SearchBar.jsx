import { useEffect, useRef, useState } from 'react';
import { Search, X, FileText, Bot, Folder } from 'lucide-react';
import { api } from '../api';

const TYPE_ICONS = { folder: Folder, agent: Bot, file: FileText, content: FileText };

export default function SearchBar({ onSelectResult }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query);
        setResults(data.results || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(result) {
    onSelectResult(result);
    setQuery('');
    setOpen(false);
    setResults([]);
  }

  return (
    <div ref={ref} className="relative flex-1 max-w-xl">
      <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search agents, files, content..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setResults([]); }} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && (results.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-surface-border bg-surface-elevated shadow-lg">
          {loading && <p className="p-3 text-sm text-slate-500">Searching...</p>}
          {results.map((r, i) => {
            const Icon = TYPE_ICONS[r.type] || FileText;
            return (
              <button
                key={`${r.path}-${i}`}
                type="button"
                onClick={() => handleSelect(r)}
                className="flex w-full items-start gap-3 px-3 py-2 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.name} {r.agentId && r.agentId !== r.name && <span className="text-slate-400">({r.agentId})</span>}</p>
                  <p className="truncate text-xs text-slate-500">{r.path} · {r.match}</p>
                  {r.snippet && <p className="mt-0.5 truncate text-xs text-slate-400">{r.snippet}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
