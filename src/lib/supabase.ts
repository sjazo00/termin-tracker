import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from env or localStorage
const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('YOUR_SUPABASE')) {
    return { url: envUrl, key: envKey, source: 'env' as const };
  }

  const stored = localStorage.getItem('termin_supabase_config');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.key) {
        return { url: parsed.url, key: parsed.key, source: 'localStorage' as const };
      }
    } catch {
      // ignore
    }
  }

  return null;
};

export const currentConfig = getSupabaseConfig();

export const supabase: SupabaseClient | null = currentConfig
  ? createClient(currentConfig.url, currentConfig.key)
  : null;

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('termin_supabase_config', JSON.stringify({ url, key }));
  window.location.reload();
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('termin_supabase_config');
  window.location.reload();
};
