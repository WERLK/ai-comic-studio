import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Studio, Generator, Preview } from '@/pages';

export default function App() {
  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      <Router>
        <Routes>
          <Route path="/" element={<Studio />} />
          <Route path="/generator/:projectId" element={<Generator />} />
          <Route path="/preview/:projectId" element={<Preview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}
