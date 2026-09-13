import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured yet (see .env.example)' };
  const { error } = await supabase.auth.signUp({ email, password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured yet (see .env.example)' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  if (!isSupabaseConfigured) return { unsubscribe: () => {} };
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return data.subscription;
}
