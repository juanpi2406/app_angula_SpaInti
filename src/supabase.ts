// src/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://hvmfevjfkoeevcztjugd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bWZldmpma29lZXZjenRqdWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NDQzMjcsImV4cCI6MjA3ODIyMDMyN30.nk9TJMF-0qqbz_7MF8MAh5HxMd6KR0bB1kbeiMR_1xM'
);


