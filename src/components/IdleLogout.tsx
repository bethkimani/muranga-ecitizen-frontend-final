'use client';

import { useEffect } from 'react';
import { tokens } from '@/api/client';

const IDLE_MS = 10 * 60 * 1000; // 10 minutes without activity

export function IdleLogout() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const signOut = () => {
      if (!tokens.access) return; // nobody is signed in
      tokens.clear();
      window.location.href = '/signin';
    };

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(signOut, IDLE_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);

  return null;
}