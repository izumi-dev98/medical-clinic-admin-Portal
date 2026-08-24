import formidable from 'formidable'
import { adminClient, bcrypt, requireAdmin } from './_auth.js'

export default async function handler(request, response) {
  if (!requireAdmin(request, response)) return
  const client = adminClient()
  if (!client) return response.status(500).json({ error: 'Supabase service role is not configured.' })

  if (request.method === 'GET') {
    const { data, error } = await client.from('admin_users').select('id, full_name, username, active, created_at').order('created_at', { ascending: false })
    if (error) return response.status(500).json({ error: error.message })
    return response.status(200).json({ users: data })
  }

  const [fields] = await formidable({ multiples: false }).parse(request)
  const values = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]))
  if (!values.full_name || !values.username) return response.status(400).json({ error: 'Full name and username are required.' })

  if (request.method === 'POST') {
    if (!values.password || String(values.password).length < 8) return response.status(400).json({ error: 'Password must be at least 8 characters.' })
    const { data, error } = await client.from('admin_users').insert({ full_name: values.full_name, username: values.username, password_hash: await bcrypt.hash(values.password, 12), active: values.active !== 'false' }).select('id, full_name, username, active, created_at').single()
    if (error) return response.status(400).json({ error: error.message })
    return response.status(201).json({ user: data })
  }

  if (request.method === 'PATCH') {
    if (!values.id) return response.status(400).json({ error: 'User id is required.' })
    const updates = { full_name: values.full_name, username: values.username, active: values.active === 'true' }
    if (values.password) updates.password_hash = await bcrypt.hash(values.password, 12)
    const { data, error } = await client.from('admin_users').update(updates).eq('id', values.id).select('id, full_name, username, active, created_at').single()
    if (error) return response.status(400).json({ error: error.message })
    return response.status(200).json({ user: data })
  }

  if (request.method === 'DELETE') {
    if (String(values.id) === String(request.user?.id)) return response.status(400).json({ error: 'You cannot delete your own account.' })
    const { error } = await client.from('admin_users').delete().eq('id', values.id)
    if (error) return response.status(400).json({ error: error.message })
    return response.status(204).end()
  }
  return response.status(405).json({ error: 'Method not allowed.' })
}
