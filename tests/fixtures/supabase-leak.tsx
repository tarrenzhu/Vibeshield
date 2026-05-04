// Fixture: client code using Supabase service_role
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://xxxxx.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY! // This is fine — env var
);

// BAD: hardcoded service_role key
const supabaseClient = createClient(
  "https://xxxxx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.abc123"
);
