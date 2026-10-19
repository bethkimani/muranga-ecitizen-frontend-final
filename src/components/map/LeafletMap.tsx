'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixedIcon, Trash2Icon } from 'lucide-react';
import { formatCoords, type LatLng } from '@/utils/coords';

const MURANGA_TOWN: [number, number] = [-0.721, 37.1526];

const pinIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#16834A;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

type Props = {
  pin: LatLng | null;
  onPin?: (p: LatLng | null) => void;
  readOnly?: boolean;
  heightClass?: string;
};

export default function LeafletMap({ pin, onPin, readOnly = false, heightClass = 'h-72' }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const fromUser = useRef(false);
  const onPinRef = useRef(onPin);
  onPinRef.current = onPin;
  const [geoError, setGeoError] = useState('');

  // Create the map once
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, {
      center: pin ? [pin.lat, pin.lng] : MURANGA_TOWN,
      zoom: pin ? 16 : 12,
      scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m);

    if (!readOnly) {
      m.on('click', (e: L.LeafletMouseEvent) => {
        fromUser.current = true;
        onPinRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }
    map.current = m;
    setTimeout(() => m.invalidateSize(), 0);

    return () => {
      m.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in sync with the pin
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!pin) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    const pos = L.latLng(pin.lat, pin.lng);
    if (!marker.current) {
      const mk = L.marker(pos, { icon: pinIcon, draggable: !readOnly }).addTo(m);
      if (!readOnly) {
        mk.on('dragend', () => {
          const p = mk.getLatLng();
          fromUser.current = true;
          onPinRef.current?.({ lat: p.lat, lng: p.lng });
        });
      }
      marker.current = mk;
    } else {
      marker.current.setLatLng(pos);
    }
    if (!fromUser.current) m.setView(pos, Math.max(m.getZoom(), 16));
    fromUser.current = false;
  }, [pin?.lat, pin?.lng, readOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const locate = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Location is not supported on this device. Tap the map to drop a pin instead.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onPin?.({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError('Could not get your location. Tap the map to drop a pin instead.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div>
      {/* isolate keeps Leaflet's z-indexes below the sticky header and menus */}
      <div className="isolate overflow-hidden rounded-xl border border-line">
        <div ref={el} className={`${heightClass} w-full`} />
      </div>

      {!readOnly && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={locate} className="btn-secondary h-9 text-sm">
            <LocateFixedIcon className="h-4 w-4" aria-hidden="true" /> Use my location
          </button>
          {pin && (
            <button type="button" onClick={() => onPin?.(null)} className="btn-secondary h-9 text-sm">
              <Trash2Icon className="h-4 w-4" aria-hidden="true" /> Remove pin
            </button>
          )}
          <p className="text-xs text-muted">
            {pin ? `Pinned at ${formatCoords(pin)}. Drag the pin to adjust.` : 'Tap the map to drop a pin.'}
          </p>
        </div>
      )}
      {geoError && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {geoError}
        </p>
      )}
    </div>
  );
}