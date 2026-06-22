import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AgentDetailPage } from './pages/AgentDetailPage';
import { ExplorePage } from './pages/ExplorePage';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { OutputsPage } from './pages/OutputsPage';
import { ReadmesPage } from './pages/ReadmesPage';
import { DocViewerPage } from './pages/DocViewerPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="agents" element={<ExplorePage />} />
          <Route path="explore" element={<Navigate to="/agents" replace />} />
          <Route path="agent/:id" element={<AgentDetailPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="outputs" element={<OutputsPage />} />
          <Route path="readmes" element={<ReadmesPage />} />
          <Route path="doc/*" element={<DocViewerPage />} />
          <Route path="progress" element={<Navigate to="/agents" replace />} />
          <Route path="timeline" element={<Navigate to="/outputs" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
