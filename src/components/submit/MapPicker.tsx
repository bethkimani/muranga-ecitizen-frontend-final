'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Leaflet touches `window`, so it must only load in the browser.
export const MapPicker = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-xl bg-canvas" aria-label="Loading map" />,
});