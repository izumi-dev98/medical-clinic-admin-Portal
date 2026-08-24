import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export function getSupabaseImageUrl(assetUrl, version) {
  if (!assetUrl || version === undefined || version === null) return assetUrl
  const separator = assetUrl.includes('?') ? '&' : '?'
  return `${assetUrl}${separator}v=${encodeURIComponent(version)}`
}
