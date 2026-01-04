import { useState } from 'react';
import { CATEGORIES } from '../constants.js';
import { buildWhatsappMessage, buildWhatsappUrl, categoryLabel } from '../utils.js';
import { createReport } from '../api.js';
import MapPicker from './MapPicker.jsx';

const initialState = {
  category: CATEGORIES[0].id,
  description: '',
  address: '',
  whatsapp: '',
  lat: null,
  lng: null,
};

export default function ReportForm() {
  const [form, setForm] = useState(initialState);
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = form.category && form.description.trim().length >= 10;

  const handleField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setCopied(false);

    if (!canSubmit) {
      setError('Inserisci categoria e una descrizione di almeno 10 caratteri.');
      return;
    }

    const data = new FormData();
    data.append('category', form.category);
    data.append('description', form.description.trim());
    data.append('address', form.address.trim());
    if (Number.isFinite(form.lat)) data.append('lat', String(form.lat));
    if (Number.isFinite(form.lng)) data.append('lng', String(form.lng));
    if (photo) data.append('photo', photo);

    setSubmitting(true);
    try {
      const report = await createReport(data);
      const message = buildWhatsappMessage(report, form.category);
      const url = buildWhatsappUrl({ phone: form.whatsapp, text: message });
      setSuccess({ report, message, url });
    } catch (err) {
      setError(err.message || 'Errore durante invio.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(initialState);
    setPhoto(null);
    setSuccess(null);
    setError('');
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!success) return;
    try {
      await navigator.clipboard.writeText(success.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Copia non riuscita.');
    }
  };

  const selectedCategory = categoryLabel(form.category);

  return (
    <div className="report-card">
      <h2>Invia una segnalazione</h2>
      <p className="muted">
        Compila i campi essenziali, salva e invia il messaggio su WhatsApp.
      </p>
      <form className="report-form" onSubmit={handleSubmit}>
        <div>
          <label>Categoria</label>
          <div className="category-grid">
            {CATEGORIES.map((category) => (
              <label
                key={category.id}
                className={`category-card ${form.category === category.id ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="category"
                  value={category.id}
                  checked={form.category === category.id}
                  onChange={handleField('category')}
                />
                <div className="category-chip">{category.short}</div>
                <div className="category-text">{category.label}</div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="description">Descrizione</label>
          <textarea
            id="description"
            name="description"
            placeholder="Descrivi il problema e indica dettagli utili."
            value={form.description}
            onChange={handleField('description')}
          />
          <span className="helper">Minimo 10 caratteri. Categoria scelta: {selectedCategory}.</span>
        </div>

        <div className="form-row split">
          <div>
            <label htmlFor="address">Indirizzo o riferimento</label>
            <input
              id="address"
              type="text"
              name="address"
              placeholder="Es. Via Roma, angolo via ..."
              value={form.address}
              onChange={handleField('address')}
            />
          </div>
          <div>
            <label htmlFor="whatsapp">Numero WhatsApp consigliere (opzionale)</label>
            <input
              id="whatsapp"
              type="tel"
              name="whatsapp"
              placeholder="+39..."
              value={form.whatsapp}
              onChange={handleField('whatsapp')}
            />
          </div>
        </div>

        <div>
          <label>Posizione</label>
          <MapPicker
            lat={form.lat}
            lng={form.lng}
            onChange={(coords) => setForm((prev) => ({ ...prev, ...coords }))}
          />
          <div className="status-line">
            <span>Lat: {Number.isFinite(form.lat) ? form.lat.toFixed(6) : '--'}</span>
            <span>Lng: {Number.isFinite(form.lng) ? form.lng.toFixed(6) : '--'}</span>
          </div>
        </div>

        <div>
          <label>Foto (opzionale)</label>
          <div className="file-input">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setPhoto(event.target.files?.[0] || null)}
            />
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="submit-row">
          <button type="submit" className="button primary" disabled={submitting}>
            {submitting ? 'Invio in corso...' : 'Salva e prepara WhatsApp'}
          </button>
          <button type="button" className="button" onClick={handleReset} disabled={submitting}>
            Reset
          </button>
        </div>
      </form>

      {success && (
        <div className="success-panel">
          <h3>Segnalazione salvata</h3>
          <p className="helper">Apri WhatsApp e invia il testo precompilato.</p>
          <textarea readOnly value={success.message} />
          <div className="submit-row">
            <a className="button primary" href={success.url} target="_blank" rel="noreferrer">
              Apri WhatsApp
            </a>
            <button type="button" className="button" onClick={handleCopy}>
              Copia testo
            </button>
            <button type="button" className="button ghost" onClick={handleReset}>
              Nuova segnalazione
            </button>
          </div>
          {copied && <span className="helper">Testo copiato.</span>}
        </div>
      )}
    </div>
  );
}
