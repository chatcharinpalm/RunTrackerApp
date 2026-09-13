import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSession, onAuthStateChange } from '../services/authService';
import { setLinkedUser } from '../db/profileRepository';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    getSession().then((s) => {
      if (mounted) {
        setSession(s);
        setInitializing(false);
      }
    });

    const subscription = onAuthStateChange((s) => {
      setSession(s);
      setLinkedUser(s?.user.id ?? null, s?.user.email ?? null).catch((e) =>
        console.warn('[useAuth] failed to mirror session to local profile', e)
      );
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, initializing };
}
