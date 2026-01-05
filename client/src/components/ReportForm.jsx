import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES, CATEGORY_HINTS, ISSUE_PLACEHOLDERS } from '../constants.js';
import { buildGuidedDescription, buildWhatsappMessage, buildWhatsappUrl, categoryLabel } from '../utils.js';
import { createReport } from '../api.js';
import MapPicker from './MapPicker.jsx';

const STORAGE_KEY = 'bl-report-draft';

const initialState = {
  category: CATEGORIES[0].id,
  address: '',
  whatsapp: '',
  firstName: '',
  lastName: '',
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
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);
  const [touched, setTouched] = useState({});
  const [step, setStep] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const [toast, setToast] = useState('');

  const handleField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleGuidedField = (field) => (event) => {
    setFields((prev) => ({ ...prev, [field]: event.target.value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleCategoryChange = (value) => {
    setForm((prev) => ({ ...prev, category: value }));
    setFields(initialFields);
    setError('');
    setTouched((prev) => ({ ...prev, category: true }));
  };

  const triggerToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image load error'));
      img.src = src;
    });

  const compressImage = async (file) => {
    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImage(dataUrl);
    const maxSize = 1600;
    const scale = Math.min(1, maxSize / img.width, maxSize / img.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
    return { file: compressed, previewUrl: URL.createObjectURL(compressed) };
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await compressImage(file);
      setPhoto(result.file);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return result.previewUrl;
      });
    } catch (err) {
      setError('Errore durante la gestione della foto.');
    }
  };

  const handlePhotoRemove = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview('');
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw);
      setForm({ ...initialState, ...stored.form });
      setFields({ ...initialFields, ...stored.fields });
      setStep(stored.step || 0);
    } catch (err) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const payload = {
      form,
      fields,
      step,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [form, fields, step]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setCopied(false);

    const missing = {};
    if (!form.category) missing.category = true;
    if (fields.issue.trim().length < 5) missing.issue = true;
    if (fields.timeframe.trim().length < 3) missing.timeframe = true;
    if (fields.impact.trim().length < 3) missing.impact = true;
    if (!Number.isFinite(form.lat) || !Number.isFinite(form.lng)) missing.location = true;

    if (Object.keys(missing).length > 0) {
      setTouched((prev) => ({ ...prev, ...missing }));
      setError('Completa i campi evidenziati in rosso.');
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
    data.append('reporterFirstName', form.firstName.trim());
    data.append('reporterLastName', form.lastName.trim());
    if (Number.isFinite(form.lat)) data.append('lat', String(form.lat));
    if (Number.isFinite(form.lng)) data.append('lng', String(form.lng));
    if (photo) data.append('photo', photo);

    setSubmitting(true);
    try {
      const report = await createReport(data);
      const message = buildWhatsappMessage(report, form.category);
      const url = buildWhatsappUrl({ phone: form.whatsapp, text: message });
      setSuccess({ report, message, url });
      localStorage.removeItem(STORAGE_KEY);
      triggerToast('Segnalazione salvata.');
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
    setPhotoPreview('');
    setSuccess(null);
    setError('');
    setCopied(false);
    setTouched({});
    setStep(0);
    localStorage.removeItem(STORAGE_KEY);
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
  const invalidCategory = !form.category;
  const invalidIssue = fields.issue.trim().length < 5;
  const invalidTimeframe = fields.timeframe.trim().length < 3;
  const invalidImpact = fields.impact.trim().length < 3;
  const invalidLocation = !Number.isFinite(form.lat) || !Number.isFinite(form.lng);
  const showError = (key, invalid) => touched[key] && invalid;
  const steps = useMemo(
    () => [
      { id: 0, label: 'Categoria' },
      { id: 1, label: 'Dettagli' },
      { id: 2, label: 'Posizione' },
      { id: 3, label: 'Foto & Invio' },
    ],
    []
  );

  const handleNext = () => {
    setTouched((prev) => ({ ...prev, category: true, issue: true, timeframe: true, impact: true, location: true }));
    if (step === 0 && invalidCategory) return;
    if (step === 1 && (invalidIssue || invalidTimeframe || invalidImpact)) return;
    if (step === 2 && invalidLocation) return;
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="report-card">
      <h2>Invia una segnalazione</h2>
      <p className="muted">
        Compila i campi essenziali, salva e invia il messaggio su WhatsApp.
      </p>
      <div className="stepper">
        {steps.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`step ${step === item.id ? 'active' : ''}`}
            onClick={() => setStep(item.id)}
          >
            <span className="step-index">{item.id + 1}</span>
            <span className="step-label">{item.label}</span>
          </button>
        ))}
      </div>
      <form className="report-form" onSubmit={handleSubmit}>
        {step === 0 && (
          <div>
          <label>Categoria</label>
          <div className={`category-grid ${showError('category', invalidCategory) ? 'field-error' : ''}`}>
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
          {showError('category', invalidCategory) && (
            <span className="error-hint">Seleziona una categoria.</span>
          )}
        </div>
        )}

        {step === 1 && (
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
                className={showError('issue', invalidIssue) ? 'input-error' : ''}
                onChange={handleGuidedField('issue')}
              />
              {showError('issue', invalidIssue) && (
                <span className="error-hint">Descrivi cosa succede (min 5 caratteri).</span>
              )}
            </div>
            <div className="form-row">
              <label htmlFor="timeframe">Da quanto tempo</label>
              <input
                id="timeframe"
                type="text"
                placeholder="Es. da ieri, da 2 settimane"
                value={fields.timeframe}
                className={showError('timeframe', invalidTimeframe) ? 'input-error' : ''}
                onChange={handleGuidedField('timeframe')}
              />
              {showError('timeframe', invalidTimeframe) && (
                <span className="error-hint">Indica da quanto tempo.</span>
              )}
            </div>
            <div className="form-row">
              <label htmlFor="impact">Rischi o impatto</label>
              <input
                id="impact"
                type="text"
                placeholder="Es. pericolo per pedoni, traffico rallentato"
                value={fields.impact}
                className={showError('impact', invalidImpact) ? 'input-error' : ''}
                onChange={handleGuidedField('impact')}
              />
              {showError('impact', invalidImpact) && (
                <span className="error-hint">Indica rischi o impatto.</span>
              )}
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
        )}

        {step === 1 && (
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
        )}

        {step === 1 && (
          <div className="form-row split">
          <div>
            <label htmlFor="firstName">Nome segnalante (opzionale)</label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              placeholder="Nome"
              value={form.firstName}
              onChange={handleField('firstName')}
            />
          </div>
          <div>
            <label htmlFor="lastName">Cognome segnalante (opzionale)</label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              placeholder="Cognome"
              value={form.lastName}
              onChange={handleField('lastName')}
            />
          </div>
        </div>
        )}

        {step === 2 && (
          <div>
          <label>Posizione</label>
          <div className={showError('location', invalidLocation) ? 'field-error' : ''}>
            <MapPicker
              lat={form.lat}
              lng={form.lng}
              onChange={(coords) => setForm((prev) => ({ ...prev, ...coords }))}
            />
          </div>
          <div className="status-line">
            <span>Lat: {Number.isFinite(form.lat) ? form.lat.toFixed(6) : '--'}</span>
            <span>Lng: {Number.isFinite(form.lng) ? form.lng.toFixed(6) : '--'}</span>
          </div>
          <button type="button" className="button ghost" onClick={() => setMapOpen(true)}>
            Apri mappa a schermo intero
          </button>
          {showError('location', invalidLocation) && (
            <span className="error-hint">Seleziona un punto sulla mappa o usa la geolocalizzazione.</span>
          )}
        </div>
        )}

        {step === 3 && (
          <div>
          <label>Foto (opzionale)</label>
          <div className="file-input">
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
            />
          </div>
          <span className="helper">Consigliata per rendere la segnalazione piu efficace.</span>
          {photoPreview && (
            <div className="photo-preview">
              <img src={photoPreview} alt="Anteprima foto segnalazione" />
              <button type="button" className="button ghost" onClick={handlePhotoRemove}>
                Rimuovi foto
              </button>
            </div>
          )}
        </div>
        )}

        {step === 3 && (
          <div className="form-row">
          <label>Anteprima testo WhatsApp</label>
          <textarea readOnly value={guidedDescription} />
          <span className="helper">Il testo viene generato automaticamente in base ai campi compilati.</span>
        </div>
        )}

        {error && <div className="error">{error}</div>}

        {step === 3 && (
          <div className="submit-row">
            <button type="submit" className="button primary" disabled={submitting}>
              {submitting ? 'Invio in corso...' : 'Salva e prepara WhatsApp'}
            </button>
            <button type="button" className="button" onClick={handleReset} disabled={submitting}>
              Reset
            </button>
          </div>
        )}
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

      {mapOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Seleziona posizione</h3>
              <button type="button" className="button ghost" onClick={() => setMapOpen(false)}>
                Chiudi
              </button>
            </div>
            <MapPicker
              lat={form.lat}
              lng={form.lng}
              onChange={(coords) => setForm((prev) => ({ ...prev, ...coords }))}
            />
          </div>
        </div>
      )}

      <div className="mobile-bar">
        <button type="button" className="button ghost" onClick={handleBack} disabled={step === 0}>
          Indietro
        </button>
        {step < steps.length - 1 ? (
          <button type="button" className="button primary" onClick={handleNext}>
            Avanti
          </button>
        ) : (
          <button type="button" className="button primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Invio...' : 'Salva'}
          </button>
        )}
        <button
          type="button"
          className="button"
          onClick={() => {
            setStep(2);
            setMapOpen(true);
          }}
        >
          Mappa
        </button>
        <button
          type="button"
          className="button"
          onClick={() => {
            setStep(3);
            setTimeout(() => document.getElementById('photo-input')?.click(), 0);
          }}
        >
          Foto
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
