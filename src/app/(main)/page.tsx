'use client';

import React from 'react';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingServices } from '@/components/landing/LandingServices';
import { LandingProcess } from '@/components/landing/LandingProcess';
import { LandingSupport } from '@/components/landing/LandingSupport';
import { LandingUpdates } from '@/components/landing/LandingUpdates';

export default function HomePage() {
  return (
    <div className="space-y-12 pb-12">
      <LandingHero />
      <LandingServices />
      <LandingProcess />
      <LandingUpdates />
      <LandingSupport />
    </div>
  );
}