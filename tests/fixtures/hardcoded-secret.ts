// Fixture: file with hardcoded Supabase service_role key
const SUPABASE_URL = "https://xxxxx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.abcdefghijklmnopqrstuvwxyz123456";

export function createClient() {
  return { url: SUPABASE_URL, key: SUPABASE_SERVICE_ROLE_KEY };
}
