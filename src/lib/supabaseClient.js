import { createClient } from '@supabase/supabase-js'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const useSupabaseProxy = import.meta.env.PROD || import.meta.env.VITE_USE_SUPABASE_PROXY === 'true'
const supabaseUrl = useSupabaseProxy && typeof window !== 'undefined'
  ? `${window.location.origin}/supabase`
  : import.meta.env.VITE_SUPABASE_URL

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

async function prepareCloudinaryFile(file) {
  const image = await createImageBitmap(file)
  const maxDimension = 1600
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  image.close()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
  if (!blob) throw new Error('Could not prepare image for upload.')
  return new File([blob], `${file.name.replace(/\.[^/.]+$/, '')}.webp`, { type: 'image/webp' })
}

export async function uploadCloudinaryImage(file, folder) {
  try {
    const uploadFile = await prepareCloudinaryFile(file)
    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('folder', folder)
    const response = await fetch('/api/cloudinary-upload', { method: 'POST', body: formData })
    const result = await response.json()
    if (!response.ok) return { error: response.status === 413 ? 'Image is too large. Please choose a smaller image.' : result.error || 'Cloudinary upload failed.' }
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
