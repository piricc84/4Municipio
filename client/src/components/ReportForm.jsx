import { useState } from 'react';
import { CATEGORIES, CATEGORY_HINTS, ISSUE_PLACEHOLDERS } from '../constants.js';
import { buildGuidedDescription, buildWhatsappMessage, buildWhatsappUrl, categoryLabel } from '../utils.js';
import { createReport } from '../api.js';
import MapPicker from './MapPicker.jsx';

const initialState = {
  category: CATEGORIES[0].id,
  address: '',
  whatsapp: '',
  lat: null,
  lng: null,
};

const initialFields = {
  issue: '',
  timeframe: '',
  impact: '',
  details: '',
};

export default function ReportForm() {
  const [form, setForm] = useState(initialState);
  const [fields, setFields] = useState(initialFields);
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  const canSubmit =
    form.category &&
    fields.issue.trim().length >= 5 &&
    fields.timeframe.trim().length >= 3 &&
    fields.impact.trim().length >= 3 &&
    Number.isFinite(form.lat) &&
    Number.isFinite(form.lng);

  const handleField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleGuidedField = (field) => (event) => {
    setFields((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCategoryChange = (value) => {
    setForm((prev) => ({ ...prev, category: value }));
    setFields(initialFields);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setCopied(false);

    if (!form.category) {
      setError('Seleziona una categoria.');
      return;
    }

    if (fields.issue.trim().length < 5 || fields.timeframe.trim().length < 3 || fields.impact.trim().length < 3) {
      setError('Completa i campi obbligatori del testo guidato.');
      return;
    }

    if (!Number.isFinite(form.lat) || !Number.isFinite(form.lng)) {
      setError('Seleziona il punto sulla mappa oppure usa la geolocalizzazione.');
      return;
    }

    const description = buildGuidedDescription(form.category, {
      issue: fields.issue.trim(),
      timeframe: fields.timeframe.trim(),
      impact: fields.impact.trim(),
      details: fields.details.trim(),
    });

    const data = new FormData();
    data.append('category', form.category);
    data.append('description', description);
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
    setFields(initialFields);
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
  const categoryHint = CATEGORY_HINTS[form.category];
  const issuePlaceholder = ISSUE_PLACEHOLDERS[form.category] || ISSUE_PLACEHOLDERS.altro;
  const guidedDescription = buildGuidedDescription(form.category, {
    issue: fields.issue || '...',
    timeframe: fields.timeframe || '...',
    impact: fields.impact || '...',
    details: fields.details || '',
  });

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
                  onChange={() => handleCategoryChange(category.id)}
                />
                <div className="category-chip">{category.short}</div>
                <div className="category-text">{category.label}</div>
              </label>
            ))}
          </div>
          {categoryHint && <span className="helper">{categoryHint}</span>}
        </div>

        <div className="form-row">
          <label>Testo guidato (compilazione assistita)</label>
          <div className="guided-grid">
            <div className="form-row">
              <label htmlFor="issue">Cosa succede</label>
              <input
                id="issue"
                type="text"
                placeholder={issuePlaceholder}
                value={fields.issue}
                onChange={handleGuidedField('issue')}
              />
            </div>
            <div className="form-row">
              <label htmlFor="timeframe">Da quanto tempo</label>
              <input
                id="timeframe"
                type="text"
                placeholder="Es. da ieri, da 2 settimane"
                value={fields.timeframe}
                onChange={handleGuidedField('timeframe')}
              />
            </div>
            <div className="form-row">
              <label htmlFor="impact">Rischi o impatto</label>
              <input
                id="impact"
                type="text"
                placeholder="Es. pericolo per pedoni, traffico rallentato"
                value={fields.impact}
                onChange={handleGuidedField('impact')}
              />
            </div>
            <div className="form-row">
              <label htmlFor="details">Dettagli aggiuntivi (opzionale)</label>
              <textarea
                id="details"
                placeholder="Info utili aggiuntive"
                value={fields.details}
                onChange={handleGuidedField('details')}
              />
            </div>
          </div>
          <span className="helper">Categoria scelta: {selectedCategory}. Campi con testo guidato obbligatori.</span>
        </div>

        <div className="form-row split">
          <div>
            <label htmlFor="address">Indirizzo o riferimento</label>
            <input
              id="address"
              type="text"
              name="address"
              placeholder="Es. Via Roma, angolo via ..., vicino a ..."
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
          <span className="helper">Consigliata per rendere la segnalazione piu efficace.</span>
        </div>

        <div className="form-row">
          <label>Anteprima testo WhatsApp</label>
          <textarea readOnly value={guidedDescription} />
          <span className="helper">Il testo viene generato automaticamente in base ai campi compilati.</span>
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
          <p className="helper">Apri WhatsApp e invia il testo standard guidato.</p>
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
