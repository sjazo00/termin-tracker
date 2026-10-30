import { createClient, SupabaseClient } from '@supabase/supabase-js';

const sanitizeUrl = (raw?: string): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/^["']|["']$/g, '');
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  // If user provided a postgresql connection string, extract the project ref
  const dbMatch = trimmed.match(/@db\.([a-z0-9_-]+)\.supabase\.co/i);
  if (dbMatch) {
    return `https://${dbMatch[1]}.supabase.co`;
  }
  const poolerMatch = trimmed.match(/postgres\.([a-z0-9_-]+):/i);
  if (poolerMatch) {
    return `https://${poolerMatch[1]}.supabase.co`;
  }
  return null;
};

// Read from env or localStorage
const getSupabaseConfig = () => {
  const env = import.meta.env as Record<string, string | undefined>;

  // Check all common URL env var names
  const rawUrl =
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    env.SUPABASE_DATABASE_URL ||
    env.SUPABASE_PROJECT_URL;

  // Check all common Anon Key env var names
  const envKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.SUPABASE_KEY ||
    env.SUPABASE_ANON ||
    env.SUPABASE_PUBLIC_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_API_KEY;

  const parsedUrl = sanitizeUrl(rawUrl);

  if (parsedUrl && envKey && !parsedUrl.includes('YOUR_SUPABASE')) {
    return {
      url: parsedUrl,
      key: envKey.trim().replace(/^["']|["']$/g, ''),
      source: 'env' as const,
    };
  }

  const stored = localStorage.getItem('termin_supabase_config');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const storedUrl = sanitizeUrl(parsed.url);
      if (storedUrl && parsed.key) {
        return {
          url: storedUrl,
          key: parsed.key.trim().replace(/^["']|["']$/g, ''),
          source: 'localStorage' as const,
        };
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
