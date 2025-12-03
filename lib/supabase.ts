import { createClient } from "@supabase/supabase-js"
import { Database } from "./database.types"

// Variables PUBLIQUES (NEXT_PUBLIC_) pour le client côté client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// --- Client Côté Serveur (ADMIN) ---
// Utilisation : Dans les API routes (/api/*) ou les Server Components
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Créer le client admin SEULEMENT côté serveur
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null

if (typeof window === 'undefined') {
  // Nous sommes côté serveur
  if (!supabaseServiceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for server-side client.")
  }
  supabaseAdminInstance = createClient<Database>(supabaseUrl, supabaseServiceKey)
}

export const supabaseAdmin = supabaseAdminInstance

// Fonction helper pour garantir que supabaseAdmin existe
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error("supabaseAdmin is not available. This should only be called server-side.")
  }
  return supabaseAdmin
}