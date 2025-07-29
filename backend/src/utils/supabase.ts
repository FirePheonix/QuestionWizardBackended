import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in the .env file');
}

// Create a single, reusable Supabase client instance
// The anon key is safe to use in a browser if Row Level Security is enabled on your tables.
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
