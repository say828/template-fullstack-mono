import { Link, Route, Routes } from "react-router-dom";

function HomePage() {
  return (
    <section className="panel">
      <p className="eyebrow">Template Web</p>
      <h1>Generic fullstack workspace</h1>
      <p className="body-copy">
        This template starts with a minimal frontend shell. Product-specific routes,
        screens, and flows should be generated through the SDD pipeline after install.
      </p>
    </section>
  );
}

function SddPage() {
  return (
    <section className="panel">
      <p className="eyebrow">SDD</p>
      <h1>Build from planning artifacts</h1>
      <p className="body-copy">
        Keep the repo generic here. Define features, screens, and contracts in `sdd/`,
        then let the orchestration pipeline materialize implementation work.
      </p>
    </section>
  );
}

function RuntimePage() {
  return (
    <section className="panel">
      <p className="eyebrow">Runtime</p>
      <h1>Backend integration ready</h1>
      <p className="body-copy">
        The default API target is <code>/api/v1/system/info</code>. Replace this shell
        with product-specific surfaces after planning is approved.
      </p>
    </section>
  );
}

export default function App() {
  return (
    <div className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Agentic Template</p>
          <h1>Fullstack mono starter</h1>
        </div>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/sdd">SDD</Link>
          <Link to="/runtime">Runtime</Link>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sdd" element={<SddPage />} />
          <Route path="/runtime" element={<RuntimePage />} />
        </Routes>
      </main>
    </div>
  );
}
