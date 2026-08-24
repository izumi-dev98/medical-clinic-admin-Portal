import { readFile } from 'node:fs/promises'
import formidable from 'formidable'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      return response.status(500).json({ error: 'Cloudinary environment variables are missing in Vercel.' })
    }
    const [fields, files] = await formidable({ multiples: false }).parse(request)
    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) {
      return response.status(400).json({ error: 'An image file is required.' })
    }
    const folderValue = Array.isArray(fields.folder) ? fields.folder[0] : fields.folder
    const folder = String(folderValue || 'clinic-images').replace(/[^a-zA-Z0-9/_-]/g, '')

    const uploadData = new FormData()
    uploadData.append('file', new Blob([await readFile(file.filepath)], { type: file.mimetype || 'application/octet-stream' }), file.originalFilename || 'image')
    uploadData.append('upload_preset', uploadPreset)
    uploadData.append('folder', folder)

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: uploadData,
    })
    const result = await uploadResponse.json()

    if (!uploadResponse.ok) return response.status(uploadResponse.status).json({ error: result.error?.message || 'Cloudinary upload failed.' })
    return response.status(200).json({ secureUrl: result.secure_url, publicId: result.public_id })
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Image upload failed.' })
  }
}
