'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';
import { getMe, homeFor, logout, type Role, type User } from '@/api/auth';
import { tokens } from '@/api/client';

const UserContext = createContext<User | null>(null);

export function useCurrentUser(): User {
  const user = useContext(UserContext);
  if (!user) throw new Error('useCurrentUser must be used inside <RequireRole>');
  return user;
}

export function RequireRole({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let alive = true;

    if (!tokens.access) {
      router.replace('/signin');
      return;
    }

    getMe()
      .then((me) => {
        if (!alive) return;
        if (allow.includes(me.role)) setUser(me);
        else router.replace(homeFor(me.role));
      })
      .catch(() => {
        logout();
        if (alive) router.replace('/signin');
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        <Loader2Icon className="h-5 w-5 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}