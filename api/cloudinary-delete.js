import crypto from 'node:crypto'

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' })

  try {
    const { imageUrl } = request.body || {}
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    if (!cloudName || !apiKey || !apiSecret) return response.status(500).json({ error: 'Cloudinary delete environment variables are not configured.' })

    const pathname = new URL(imageUrl).pathname
    const uploadPath = pathname.split('/image/upload/')[1]
    const publicId = uploadPath.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '')
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = crypto.createHash('sha1').update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest('hex')
    const formData = new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: apiKey, signature })
    const deleteResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: 'POST', body: formData })
    const result = await deleteResponse.json()
    if (!deleteResponse.ok) return response.status(deleteResponse.status).json({ error: result.error?.message || 'Cloudinary delete failed.' })
    return response.status(200).json(result)
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Image delete failed.' })
  }
}
