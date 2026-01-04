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
  const addressValue = report.address ? report.address : 'Non indicato';
  const coordsAvailable = Number.isFinite(report.lat) && Number.isFinite(report.lng);
  const coordsValue = coordsAvailable
    ? `${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}`
    : 'Non indicata';
  const mapLink = coordsAvailable ? toOsmLink(report.lat, report.lng) : 'Non disponibile';
  const photoValue = report.photoUrl ? report.photoUrl : 'Non presente';
  const lines = [
    'Segnalazione Municipio Bari Loseto',
    `ID: ${report.id}`,
    `Categoria: ${label}`,
    `Cosa succede: ${report.description}`,
    `Dove (indirizzo/riferimento): ${addressValue}`,
    `Coordinate GPS: ${coordsValue}`,
    `Mappa: ${mapLink}`,
    `Foto: ${photoValue}`,
    'Richiesta: verifica e intervento.',
    'Segnalante: cittadino anonimo.',
  ];

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
