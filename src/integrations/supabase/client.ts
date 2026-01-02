import { createClient } from '@supabase/supabase-js';

// Priority: 
// 1. Environment Variables (Vercel deployments)
// 2. Local Storage (Setup Wizard)
// 3. Fallback (Prevents crash before setup)

const getSupabaseConfig = () => {
  // 1. Environment Variables (Highest Priority)
  // Recommended for persistence: Create a .env file in the project root with:
  // VITE_SUPABASE_URL=your_url
  // VITE_SUPABASE_ANON_KEY=your_key
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey, isConfigured: true };
  }

  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_key');

  if (localUrl && localKey) {
    return { url: localUrl, key: localKey, isConfigured: true };
  }

  return {
    url: 'https://placeholder.supabase.co',
    key: 'placeholder',
    isConfigured: false
  };
};

const { url, key, isConfigured } = getSupabaseConfig();

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const isSupabaseConfigured = () => isConfigured;


