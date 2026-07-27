/* ==========================================================================
   AURA 75 - SUPABASE CLIENT CONFIGURATION & INITIALIZATION
   ========================================================================== */

const SUPABASE_URL = 'https://ockcocxualtukzjzyrea.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ja2NvY3h1YWx0dWt6anp5cmVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMTk3NjEsImV4cCI6MjEwMDY5NTc2MX0.bO2UiDo79bOmk8Tv-FodygdxPCP057GFFVmqlJS9OLY';

let supabaseClient = null;

if (window.supabase && typeof window.supabase.createClient === 'function') {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn('Supabase SDK client not loaded yet.');
}

window.supabaseClient = supabaseClient;
