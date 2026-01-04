import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ReportForm from './components/ReportForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import { CATEGORIES } from './constants.js';

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">Municipio Bari - Loseto</p>
          <h1>Portale ufficiale per le segnalazioni civiche del quartiere.</h1>
          <p className="lead">
            Un servizio rapido, affidabile e pensato per smartphone: foto, posizione
            e descrizione arrivano al consigliere con un messaggio WhatsApp pronto.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#segnala">Segnala ora</a>
            <a className="button ghost" href="#come-funziona">Come funziona</a>
          </div>
          <div className="hero-metrics">
            <div className="metric">
              <span className="metric-value">PWA</span>
              <span className="metric-label">Installabile</span>
            </div>
            <div className="metric">
              <span className="metric-value">Geo</span>
              <span className="metric-label">Posizione precisa</span>
            </div>
            <div className="metric">
              <span className="metric-value">WhatsApp</span>
              <span className="metric-label">Click to chat</span>
            </div>
          </div>
        </div>
        <div className="hero-card">
          <h3>Gestione trasparente</h3>
          <p className="muted">
            Ogni segnalazione e salvata con un testo standard e condivisa con il
            canale piu rapido: WhatsApp.
          </p>
          <ul className="muted">
            <li>Foto, coordinate e indirizzo archiviati</li>
            <li>Testo guidato e completo per l'invio</li>
            <li>Dashboard con stati e filtri operativi</li>
          </ul>
        </div>
      </section>

      <section className="section" id="categorie">
        <h2>Categorie principali</h2>
        <p className="muted">Seleziona la tipologia piu adatta alla segnalazione.</p>
        <div className="category-grid">
          {CATEGORIES.map((category) => (
            <div className="category-card" key={category.id}>
              <div className="category-chip">{category.short}</div>
              <div className="category-text">{category.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="segnala">
        <ReportForm />
      </section>

      <section className="section" id="come-funziona">
        <h2>Come funziona</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>1. Compila</h3>
            <p className="muted">Descrizione chiara, foto e posizione su mappa.</p>
          </div>
          <div className="info-card">
            <h3>2. Salva</h3>
            <p className="muted">La segnalazione finisce in dashboard per il consigliere.</p>
          </div>
          <div className="info-card">
            <h3>3. Invia</h3>
            <p className="muted">Apri WhatsApp e invia il testo standard.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const base = import.meta.env.BASE_URL || '/';
  return (
    <BrowserRouter basename={base}>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">BL</div>
            <div>
              <p className="brand-title">Bari Loseto</p>
              <p className="brand-sub">Segnalazioni civiche</p>
            </div>
          </div>
          <nav className="nav">
            <NavLink to="/" end>Segnala</NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
          </nav>
          <a className="cta" href="#segnala">Invia segnalazione</a>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>Portale civico Municipio Bari - Loseto. Non usare per emergenze, chiama 112.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
