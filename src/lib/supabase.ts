import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ockcocxualtukzjzyrea.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ja2NvY3h1YWx0dWt6anp5cmVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMTk3NjEsImV4cCI6MjEwMDY5NTc2MX0.bO2UiDo79bOmk8Tv-FodygdxPCP057GFFVmqlJS9OLY';

// Optimized Connection-Pooled Supabase Client with HTTP Keep-Alive & Auto-reconnect
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'aura75-keyboard-tester-pooled',
      'Connection': 'keep-alive'
    }
  }
});
