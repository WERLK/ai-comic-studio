import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Studio, Generator, Preview } from "@/pages";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Studio />} />
        <Route path="/generator/:projectId" element={<Generator />} />
        <Route path="/preview/:projectId" element={<Preview />} />
      </Routes>
    </Router>
  );
}
