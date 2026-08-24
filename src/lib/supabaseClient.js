import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export async function uploadCloudinaryImage(file, folder) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    const response = await fetch('/api/cloudinary-upload', { method: 'POST', body: formData })
    const result = await response.json()
    if (!response.ok) return { error: result.error || 'Cloudinary upload failed.' }
    return { data: { publicUrl: result.secureUrl }, error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Cloudinary upload failed.' }
  }
}

export function getSupabaseImageUrl(assetUrl, version) {
  if (!assetUrl || version === undefined || version === null) return assetUrl
  const separator = assetUrl.includes('?') ? '&' : '?'
  return `${assetUrl}${separator}v=${encodeURIComponent(version)}`
}

export async function removeSupabaseImage(bucket, assetUrl) {
  if (!assetUrl || !supabase) return
  try {
    if (assetUrl.includes('res.cloudinary.com')) {
      await fetch('/api/cloudinary-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: assetUrl }),
      })
      return
    }
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
