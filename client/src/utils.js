import { CATEGORIES, STATUS_OPTIONS } from './constants';

export function categoryLabel(id) {
  const found = CATEGORIES.find((item) => item.id === id);
  return found ? found.label : id;
}

export function statusLabel(value) {
  const found = STATUS_OPTIONS.find((item) => item.value === value);
  return found ? found.label : value;
}

export function buildWhatsappMessage(report, categoryId) {
  const label = categoryLabel(categoryId || report.category);
  const lines = [
    'Segnalazione Municipio Bari Loseto',
    `ID: ${report.id}`,
    `Categoria: ${label}`,
    `Descrizione: ${report.description}`,
  ];

  if (report.address) {
    lines.push(`Indirizzo: ${report.address}`);
  }

  if (Number.isFinite(report.lat) && Number.isFinite(report.lng)) {
    lines.push(`Coordinate: ${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}`);
  }

  if (report.photoUrl) {
    lines.push(`Foto: ${report.photoUrl}`);
  }

  const dateValue = report.created_at || report.createdAt || new Date().toISOString();
  lines.push(`Data: ${new Date(dateValue).toLocaleString('it-IT')}`);

  return lines.join('\n');
}

export function buildWhatsappUrl({ phone, text }) {
  const cleaned = phone ? phone.replace(/[^\d]/g, '') : '';
  const encoded = encodeURIComponent(text);
  if (cleaned) {
    return `https://wa.me/${cleaned}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('it-IT');
}

export function toOsmLink(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
}
