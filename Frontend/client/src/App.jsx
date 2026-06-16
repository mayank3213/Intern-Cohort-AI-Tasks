import { useCallback, useEffect, useState } from 'react';
import { Moon, Sun, LayoutDashboard, Network } from 'lucide-react';
import { api, enrichAgentData, getTreeWithFallback, parseAgentDefinition, saveOpenTabs } from './api';
import { useTheme } from './hooks/useTheme';
import Sidebar from './components/Sidebar';
import AgentPanel from './components/AgentPanel';
import MarkdownViewer from './components/MarkdownViewer';
import SearchBar from './components/SearchBar';
import FileTabs from './components/FileTabs';
import MermaidBlock from './components/MermaidBlock';

export default function App() {
  const { dark, toggle } = useTheme();
  const [tree, setTree] = useState({});
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [fileContents, setFileContents] = useState({});
  const [showGraph, setShowGraph] = useState(false);
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    getTreeWithFallback().then(setTree).catch(console.error);
  }, []);

  const loadAgent = useCallback(async (name) => {
    setAgentLoading(true);
    try {
      const data = await api.getAgent(name);
      let enriched = enrichAgentData(data, tree);
      const folderId = enriched.folderId || name;
      const needsDefinition =
        !enriched.agentContent ||
        !enriched.metadata?.description ||
        enriched.metadata?.title === folderId;

      if (needsDefinition) {
        const defFile = enriched.files?.find((f) => f.isAgentDefinition);
        if (defFile) {
          try {
            const file = await api.getFile(defFile.path);
            const parsed = parseAgentDefinition(file.content, folderId);
            enriched = {
              ...enriched,
              agentContent: file.content,
              displayName: parsed.displayName || enriched.displayName,
              metadata: {
                ...enriched.metadata,
                ...parsed,
                displayName: parsed.displayName || enriched.displayName,
                agentNameField: parsed.agentNameField || enriched.displayName,
                title: parsed.title || enriched.metadata.title,
                description: parsed.description || enriched.metadata.description,
              },
            };
          } catch (err) {
            console.error(err);
          }
        }
      }

      setAgentData(enriched);
      setSelectedAgent(name);
    } catch (e) {
      console.error(e);
    } finally {
      setAgentLoading(false);
    }
  }, [tree]);

  const handleSelectAgent = useCallback((name) => {
    loadAgent(name);
  }, [loadAgent]);

  const openFile = useCallback(async (path, name) => {
    if (!fileContents[path]) {
      try {
        const data = await api.getFile(path);
        setFileContents((prev) => ({ ...prev, [path]: data.content }));
      } catch (e) {
        console.error(e);
        return;
      }
    }
    setTabs((prev) => {
      if (prev.some((t) => t.path === path)) return prev;
      const next = [...prev, { path, name }];
      saveOpenTabs(next);
      return next;
    });
    setActiveTab(path);
  }, [fileContents]);

  const closeTab = useCallback((path) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.path !== path);
      saveOpenTabs(next);
      if (activeTab === path) {
        setActiveTab(next.length ? next[next.length - 1].path : null);
      }
      return next;
    });
  }, [activeTab]);

  const handleSearchResult = useCallback((result) => {
    if (result.type === 'agent' || result.type === 'folder') {
      const agentName = result.agentId || result.agent || result.name;
      if (agentName) loadAgent(agentName);
    } else if (result.path) {
      const parts = result.path.split('/');
      const agentName = parts[1];
      if (agentName) loadAgent(agentName);
      openFile(result.path, result.name);
    }
  }, [loadAgent, openFile]);

  const toggleGraph = useCallback(async () => {
    if (!showGraph && !graphData) {
      const data = await api.getGraph();
      setGraphData(data);
    }
    setShowGraph((g) => !g);
  }, [showGraph, graphData]);

  const graphMermaid = graphData
    ? `graph TD\n${graphData.nodes.filter((n) => n.type === 'category').map((n) => {
        const childEdges = graphData.edges.filter((e) => e.from === n.id);
        const nodeById = Object.fromEntries(graphData.nodes.map((node) => [node.id, node]));
        return childEdges.map((e) => {
          const child = nodeById[e.to];
          const childLabel = child?.label || e.to.split('/').pop();
          return `  ${n.id.replace(/ /g, '_')}["${n.label}"] --> ${e.to.replace(/[/ ]/g, '_')}["${childLabel}"]`;
        }).join('\n');
      }).join('\n')}`
    : '';

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-4 border-b border-surface-border bg-surface-elevated px-4 py-2">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-indigo-600" />
          <h1 className="text-lg font-bold">Agent Workbench</h1>
        </div>
        <SearchBar onSelectResult={handleSearchResult} />
        <div className="flex items-center gap-1">
          <button type="button" className="btn-icon" onClick={toggleGraph} title="System graph">
            <Network className="h-4 w-4" />
          </button>
          <button type="button" className="btn-icon" onClick={toggle} title="Toggle dark mode">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {showGraph && graphData && (
        <div className="shrink-0 border-b border-surface-border bg-surface-elevated p-4">
          <h3 className="mb-2 text-sm font-semibold">Agent System Graph</h3>
          <MermaidBlock chart={graphMermaid} dark={dark} />
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <Sidebar
          tree={tree}
          selectedAgent={selectedAgent}
          onSelectAgent={handleSelectAgent}
        />

        <div className="flex min-w-0 flex-1 flex-col border-r border-surface-border">
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
            <div className="min-h-0 overflow-hidden border-b border-surface-border lg:border-b-0 lg:border-r">
              <AgentPanel
                agent={agentData}
                loading={agentLoading}
                onOpenFile={openFile}
                activeFile={activeTab}
              />
            </div>
            <div className="flex min-h-0 flex-col">
              <FileTabs tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} onClose={closeTab} />
              <div className="min-h-0 flex-1 p-2">
                {activeTab && fileContents[activeTab] ? (
                  <MarkdownViewer
                    content={fileContents[activeTab]}
                    filename={tabs.find((t) => t.path === activeTab)?.name}
                    dark={dark}
                    onClose={() => closeTab(activeTab)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Select a file to preview markdown
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
