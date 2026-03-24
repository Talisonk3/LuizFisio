import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xlykgrvluolkxuswgxun.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhseWtncnZsdW9sa3h1c3dneHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzE5MjIsImV4cCI6MjA4OTk0NzkyMn0.8PgP-N8dT81fqb6vmWO98m8vEzIJQicOOIPRGP3zYQE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);