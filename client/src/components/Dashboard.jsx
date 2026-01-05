import { useEffect, useMemo, useState } from 'react';
import { buildBasicAuth, listReports, updateReportStatus } from '../api.js';
import { CATEGORIES, STATUS_OPTIONS } from '../constants.js';
import { categoryLabel, formatDate, statusLabel, toOsmLink } from '../utils.js';

const statusFilterOptions = [{ value: '', label: 'Tutti stati' }, ...STATUS_OPTIONS];
const categoryFilterOptions = [
  { value: '', label: 'Tutte categorie' },
  ...CATEGORIES.map((category) => ({ value: category.id, label: category.label })),
];

const loadStoredAuth = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('adminAuth') || '{}');
    return {
      user: stored.user || '',
      authHeader: stored.authHeader || '',
    };
  } catch (err) {
    return { user: '', authHeader: '' };
  }
};

export default function Dashboard() {
  const [filters, setFilters] = useState({ status: '', category: '', q: '' });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const storedAuth = loadStoredAuth();
  const [authHeader, setAuthHeader] = useState(storedAuth.authHeader);
  const [login, setLogin] = useState({ user: storedAuth.user, pass: '' });

  const loadReports = async () => {
    if (!authHeader) return;
    setLoading(true);
    setError('');
    try {
      const data = await listReports(filters, authHeader);
      setReports(data);
    } catch (err) {
      if (err.message === 'Unauthorized') {
        setAuthHeader('');
        localStorage.removeItem('adminAuth');
        setError('Credenziali non valide.');
      } else {
        setError(err.message || 'Errore durante caricamento.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filters.status, filters.category, filters.q, authHeader]);

  const stats = useMemo(() => {
    const totals = { nuova: 0, in_lavorazione: 0, chiusa: 0 };
    reports.forEach((report) => {
      if (totals[report.status] !== undefined) {
        totals[report.status] += 1;
      }
    });
    return totals;
  }, [reports]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateReportStatus(id, status, authHeader);
      setReports((prev) => prev.map((report) => (report.id === id ? { ...report, status } : report)));
    } catch (err) {
      if (err.message === 'Unauthorized') {
        setAuthHeader('');
        localStorage.removeItem('adminAuth');
        setError('Credenziali non valide.');
      } else {
        setError(err.message || 'Errore aggiornamento stato.');
      }
    }
  };

  const handleLogin = (event) => {
    event.preventDefault();
    setError('');
    const header = buildBasicAuth(login.user, login.pass);
    if (!header) {
      setError('Inserisci username e password.');
      return;
    }
    setAuthHeader(header);
    localStorage.setItem('adminAuth', JSON.stringify({ user: login.user, authHeader: header }));
    setLogin((prev) => ({ ...prev, pass: '' }));
  };

  const handleLogout = () => {
    setAuthHeader('');
    setReports([]);
    localStorage.removeItem('adminAuth');
  };

  if (!authHeader) {
    return (
      <div className="section dashboard">
        <div className="report-card">
          <h2>Accesso consigliere</h2>
          <p className="muted">Inserisci le credenziali per gestire le segnalazioni.</p>
          <form className="report-form" onSubmit={handleLogin}>
            <div className="form-row split">
              <div>
                <label htmlFor="admin-user">Username</label>
                <input
                  id="admin-user"
                  type="text"
                  value={login.user}
                  onChange={(event) => setLogin((prev) => ({ ...prev, user: event.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="admin-pass">Password</label>
                <input
                  id="admin-pass"
                  type="password"
                  value={login.pass}
                  onChange={(event) => setLogin((prev) => ({ ...prev, pass: event.target.value }))}
                />
              </div>
            </div>
            {error && <div className="error">{error}</div>}
            <div className="submit-row">
              <button type="submit" className="button primary">
                Entra in dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="section dashboard">
      <div className="dashboard-header">
        <h2>Dashboard consigliere</h2>
        <div className="dashboard-actions">
          <span className="helper">Accesso: {login.user || 'admin'}</span>
          <button type="button" className="button ghost" onClick={handleLogout}>
            Esci
          </button>
        </div>
      </div>
      <p className="muted">Gestisci le segnalazioni ricevute e aggiorna lo stato.</p>

      <div className="filter-bar">
        <select
          value={filters.status}
          onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
        >
          {statusFilterOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={filters.category}
          onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
        >
          {categoryFilterOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Cerca per testo o indirizzo"
          value={filters.q}
          onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
        />
        <button type="button" className="button" onClick={loadReports}>
          Aggiorna
        </button>
      </div>

      <div className="status-line">
        <span>Nuove: {stats.nuova}</span>
        <span>In lavorazione: {stats.in_lavorazione}</span>
        <span>Chiuse: {stats.chiusa}</span>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <div className="helper">Caricamento in corso...</div>}

      <div className="report-list">
        {reports.map((report) => (
          <div key={report.id} className="report-item">
            <div className="report-head">
              <div className="status-line">
                <span className="badge">{categoryLabel(report.category)}</span>
                <span className="status-badge">{statusLabel(report.status)}</span>
              </div>
              <span className="helper">{formatDate(report.created_at)}</span>
            </div>
            <p>{report.description}</p>
            <div className="status-line">
              {report.address && <span>Indirizzo: {report.address}</span>}
              {Number.isFinite(report.lat) && Number.isFinite(report.lng) && (
                <span>
                  Coordinate: {report.lat.toFixed(6)}, {report.lng.toFixed(6)}
                </span>
              )}
              {(report.reporter_first_name || report.reporter_last_name) && (
                <span>
                  Segnalante: {[report.reporter_first_name, report.reporter_last_name].filter(Boolean).join(' ')}
                </span>
              )}
            </div>
            <div className="report-links">
              {report.photoUrl && (
                <a href={report.photoUrl} target="_blank" rel="noreferrer">
                  Apri foto
                </a>
              )}
              {Number.isFinite(report.lat) && Number.isFinite(report.lng) && (
                <a href={toOsmLink(report.lat, report.lng)} target="_blank" rel="noreferrer">
                  Apri su mappa
                </a>
              )}
            </div>
            <div className="status-actions">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={report.status === option.value ? 'active' : ''}
                  onClick={() => handleStatusUpdate(report.id, option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
