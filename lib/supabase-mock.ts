// Wrapper untuk menggunakan mock data sebagai pengganti Supabase
// Import ini di semua file yang menggunakan supabase

import { mockSupabase } from './mock-data'

// Export sebagai supabase untuk compatibility
export const supabase = mockSupabase as any

// Mock admin client (tidak digunakan di mock mode)
export const supabaseAdmin = null

