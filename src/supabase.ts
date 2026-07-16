import { createClient } from "@supabase/supabase-js";

export const SUPA_URL = "https://bzedxcmuexfuprdcjtrw.supabase.co";
export const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZWR4Y211ZXhmdXByZGNqdHJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMTIwNzIsImV4cCI6MjA4ODY4ODA3Mn0.3za2-kJOf9aN-fomEaOqxxtzIt_3vB0yy3LF4DY6Qfs";

export const sb = createClient(SUPA_URL, SUPA_KEY);
