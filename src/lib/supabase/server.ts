import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://iwucolryqetsyjeompmq.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dWNvbHJ5cWV0c3lqZW9tcG1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzcxNzU4MSwiZXhwIjoyMDU5MjkzNTgxfQ.JH6v6K9-3ioiRdp_kO1oKT2T-KE1xNqNr4eC-F3Lys";

if (!supabaseUrl) {
  console.warn("Warning: SUPABASE_URL environment variable is missing.");
}
if (!supabaseServiceKey) {
  console.warn("Warning: SUPABASE_SERVICE_ROLE_KEY environment variable is missing.");
}

// Service role client for server-side operations
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
