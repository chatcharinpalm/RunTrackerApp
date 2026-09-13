import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** True once the app has real Supabase credentials — sync/auth stay disabled (not crashed) until then. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Falls back to harmless placeholders so createClient never throws when the
// project hasn't been configured yet; every call site must gate on
// isSupabaseConfigured before actually using this client.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
