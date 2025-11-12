import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://xqlmlviqovsaqrypgpmo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxbG1sdmlxb3ZzYXFyeXBncG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDkzNjgsImV4cCI6MjA3ODQ4NTM2OH0.qPTRqc4f4JzYI3hKrcH52l2CngpNBrmkMt9UJmUv3Fw'
);
