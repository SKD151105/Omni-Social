import { useState } from "react";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="brand">OmniSocial</div>
        <p className="tagline">React + Vite + Tailwind scaffold ready to connect to your backend.</p>
        <div className="actions">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-gradient-to-r from-indigo-500 to-emerald-400 px-4 py-2 font-semibold text-slate-900 shadow-lg shadow-indigo-500/40 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/50"
            onClick={() => setCount((c) => c + 1)}
          >
            <span className="text-xs uppercase tracking-wide text-slate-900/80">Clicks</span>
            <span className="text-lg font-bold">{count}</span>
          </button>
        </div>
      </header>
      <section className="grid">
        <article>
          <h3>Next steps</h3>
          <ul>
            <li>Wire API base URL via env (see vite.config.js).</li>
            <li>Add routing/layout components under src.</li>
            <li>Connect auth flow to your backend endpoints.</li>
          </ul>
        </article>
        <article>
          <h3>Project structure</h3>
          <ul>
            <li>src/components for reusable UI.</li>
            <li>src/pages for routed screens.</li>
            <li>src/services for API clients.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

export default App;
