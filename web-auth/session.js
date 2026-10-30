import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
const config = window.AVIA_SUPABASE_CONFIG;
const supabase = createClient(config.url, config.publishableKey, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
window.aviaSupabaseSignOut = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const apiToken = localStorage.getItem('avia_auth_token');
  if (session?.access_token && apiToken) {
    try {
      await fetch(`${(window.AVIA_API_BASE_URL_RESOLVED || 'https://api.aviarockets.cl').replace(/\/$/, '')}/api/v1/identity/logout`, {
        method: 'POST', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ api_access_token: apiToken }),
      });
    } catch (_) { /* Clear the browser session even when the API is unavailable. */ }
  }
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
};
window.aviaRefreshApiSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('NO_SUPABASE_SESSION');
  const api = `${(window.AVIA_API_BASE_URL_RESOLVED || window.AVIA_API_BASE_URL || 'https://api.aviarockets.cl').replace(/\/$/, '')}/api/v1/identity/exchange`;
  const response = await fetch(api, {
    method: 'POST', cache: 'no-store',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: '{}',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error(data.detail || 'SESSION_RENEWAL_FAILED');
  localStorage.setItem('avia_auth_token', data.access_token);
  localStorage.setItem('avia_auth_user', JSON.stringify(data.user));
  return data.access_token;
};
