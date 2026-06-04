import { createClient } from '@supabase/supabase-js';
import { LedgerState } from './types';

// Read values from environment variables (client-safe VITE_ prefixes)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Initialize client if credentials are provided
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Determine if Supabase is active
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};

/**
 * SQL SCHEMA FOR SUPABASE SQL EDITOR:
 * Copy and paste the following SQL statement into the "SQL Editor" in your Supabase Dashboard
 * to instantiate your table with a default starting state!
 * 
 * ```sql
 * -- Create the ledger table to store our real-time shared state
 * CREATE TABLE IF NOT EXISTS bus_ledger (
 *   id integer PRIMARY KEY DEFAULT 1,
 *   state jsonb NOT NULL,
 *   updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
 *   CONSTRAINT single_row CHECK (id = 1) -- Guarantees a single consistent real-time ledger
 * );
 * 
 * -- Insert starting default dataset if empty
 * INSERT INTO bus_ledger (id, state)
 * VALUES (
 *   1,
 *   '{
 *     "previousNetIncome": 120000,
 *     "incomes": [
 *       {
 *         "id": "inc-1",
 *         "date": "2026-06-01",
 *         "route": "Hawassa to Wolayta Sodo",
 *         "tripType": "One-Way",
 *         "amount": 18500,
 *         "passengers": 45,
 *         "description": "Full trip morning tickets",
 *         "comments": [
 *           {
 *             "id": "c-1",
 *             "author": "Mr. Amare",
 *             "text": "Very good passenger count today. Let''s maintain this.",
 *             "timestamp": "2026-06-01T14:30:00Z"
 *           }
 *         ]
 *       },
 *       {
 *         "id": "inc-2",
 *         "date": "2026-06-02",
 *         "route": "Hawassa to Butajira",
 *         "tripType": "Round-Trip",
 *         "amount": 14200,
 *         "passengers": 38,
 *         "description": "Afternoon express service",
 *         "comments": []
 *       }
 *     ],
 *     "costs": [
 *       {
 *         "id": "cost-1",
 *         "date": "2026-06-01",
 *         "category": "Fuel",
 *         "amount": 6800,
 *         "description": "60 Liters Diesel fuel refilling",
 *         "comments": []
 *       },
 *       {
 *         "id": "cost-2",
 *         "date": "2026-06-01",
 *         "category": "Driver Food",
 *         "amount": 450,
 *         "description": "Lunch and water for driver and conductor",
 *         "comments": []
 *       },
 *       {
 *         "id": "cost-3",
 *         "date": "2026-06-02",
 *         "category": "Terminal & Station Cost",
 *         "amount": 800,
 *         "description": "Hawassa terminal exit tax and association fee",
 *         "comments": []
 *       },
 *       {
 *         "id": "cost-4",
 *         "date": "2026-06-03",
 *         "category": "Mechanical & Oil",
 *         "amount": 3200,
 *         "description": "Engine Oil replacement & filter clean",
 *         "comments": [
 *           {
 *             "id": "c-2",
 *             "author": "Mr. Amare",
 *             "text": "Did you use the synthetic oil or regular? Synthetic lasts longer.",
 *             "timestamp": "2026-06-03T09:12:00Z"
 *           },
 *           {
 *             "id": "c-3",
 *             "author": "Mr. Haile",
 *             "text": "Yes, we purchased the Premium Synthetic grade oil. Next change matches 5000km.",
 *             "timestamp": "2026-06-03T11:45:00Z"
 *           }
 *         ]
 *       }
 *     ],
 *     "globalComments": [
 *       {
 *         "id": "gc-1",
 *         "author": "Mr. Amare",
 *         "text": "Welcome to our new joint dashboard! Haile, always log fuel and driver daily pay immediately so we don''t forget.",
 *         "timestamp": "2026-06-03T08:00:00Z"
 *       }
 *     ]
 *   }'
 * ) ON CONFLICT (id) DO NOTHING;
 * 
 * -- Enable Row Level Security (RLS) but allow anonymous access for simple deployment:
 * ALTER TABLE bus_ledger ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Allow public read-write" ON bus_ledger FOR ALL TO public USING (true) WITH CHECK (true);
 * ```
 */

// Save ledger to Supabase
export async function saveLedgerToSupabase(state: LedgerState): Promise<LedgerState> {
  if (!supabase) throw new Error('Supabase is not configured.');
  
  const { data, error } = await supabase
    .from('bus_ledger')
    .upsert({ id: 1, state, updated_at: new Date().toISOString() })
    .select();
    
  if (error) {
    console.error('Error writing ledger to Supabase:', error);
    throw error;
  }
  return data[0].state as LedgerState;
}

// Fetch ledger from Supabase
export async function fetchLedgerFromSupabase(): Promise<LedgerState | null> {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('bus_ledger')
    .select('state')
    .eq('id', 1)
    .single();
    
  if (error) {
    // If the table exists but is empty, let's return some logical default
    if (error.code === 'PGRST116') {
      console.warn('Bus ledger table is empty. Create default state.');
      return null;
    }
    console.error('Error reading ledger from Supabase:', error);
    throw error;
  }
  
  return data.state as LedgerState;
}
