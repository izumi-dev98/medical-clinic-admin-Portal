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

export async function removeSupabaseImage(bucket, assetUrl) {
  if (!assetUrl || !supabase) return
  try {
    const pathname = new URL(assetUrl).pathname
    const marker = `/storage/v1/object/public/${bucket}/`
    const markerIndex = pathname.indexOf(marker)
    if (markerIndex === -1) return
    const path = decodeURIComponent(pathname.slice(markerIndex + marker.length))
    if (path) await supabase.storage.from(bucket).remove([path])
  } catch {
    // Ignore cleanup failures after the database update succeeds.
  }
}
