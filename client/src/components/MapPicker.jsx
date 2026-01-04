import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DEFAULT_CENTER = [41.117, 16.871];

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapPicker({ lat, lng, onChange }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapEl = useRef(null);
  const [geoError, setGeoError] = useState('');

  function setMarker(coords) {
    if (!mapRef.current) return;
    if (!markerRef.current) {
      markerRef.current = L.marker([coords.lat, coords.lng]).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng([coords.lat, coords.lng]);
    }
    mapRef.current.setView([coords.lat, coords.lng], Math.max(mapRef.current.getZoom(), 15));
  }

  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map(mapEl.current, { zoomControl: true }).setView(DEFAULT_CENTER, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    map.on('click', (event) => {
      const coords = { lat: event.latlng.lat, lng: event.latlng.lng };
      setMarker(coords);
      onChange(coords);
    });

    mapRef.current = map;
  }, [onChange]);

  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setMarker({ lat, lng });
    }
  }, [lat, lng]);

  const handleGeo = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocalizzazione non disponibile.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMarker(coords);
        onChange(coords);
      },
      () => {
        setGeoError('Impossibile ottenere la posizione.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div>
      <div className="map-wrap">
        <div className="map" ref={mapEl} />
      </div>
      <div className="map-actions">
        <button type="button" className="button" onClick={handleGeo}>
          Usa la mia posizione
        </button>
        <span className="helper">Tocca la mappa per impostare il punto.</span>
      </div>
      {geoError && <div className="error">{geoError}</div>}
    </div>
  );
}
