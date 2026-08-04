import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set. The application is running in local fallback mode using static fleetData.js.'
  );
}

// "Remember me" preference key, set by LoginPage before signing in. When true (default),
// the session is written to localStorage and survives browser restarts. When false, it's
// written to sessionStorage instead and clears as soon as the tab/browser closes.
export const REMEMBER_ME_KEY = 'taxijohor_remember_me';

const rememberAwareStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      const remember = window.localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
      if (remember) {
        window.localStorage.setItem(key, value);
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, value);
        window.localStorage.removeItem(key);
      }
    } catch {
      // Storage unavailable (e.g. private browsing) — session simply won't persist.
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      // no-op
    }
  },
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: rememberAwareStorage,
      },
    })
  : null;
