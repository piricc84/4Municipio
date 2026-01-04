const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function handleResponse(response) {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.error || 'Errore richiesta API';
    throw new Error(message);
  }
  return response.json();
}

export async function createReport(formData) {
  const response = await fetch(`${API_BASE}/api/reports`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
}

export async function listReports(params = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.category) search.set('category', params.category);
  if (params.q) search.set('q', params.q);
  const response = await fetch(`${API_BASE}/api/reports?${search.toString()}`);
  return handleResponse(response);
}

export async function updateReportStatus(id, status) {
  const response = await fetch(`${API_BASE}/api/reports/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
}
