import formidable from 'formidable'
import { adminClient, bcrypt, setSession } from './_auth.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' })
  const client = adminClient()
  if (!client) return response.status(500).json({ error: 'Supabase service role is not configured.' })
  const [fields] = await formidable({ multiples: false }).parse(request)
  const username = String(Array.isArray(fields.username) ? fields.username[0] : fields.username || '').trim()
  const password = String(Array.isArray(fields.password) ? fields.password[0] : fields.password || '')
  const { data: user } = await client.from('admin_users').select('id, full_name, username, password_hash, active').eq('username', username).maybeSingle()
  if (!user || !user.active || !(await bcrypt.compare(password, user.password_hash))) return response.status(401).json({ error: 'Invalid username or password.' })
  setSession(response, user)
  return response.status(200).json({ user: { id: user.id, fullName: user.full_name, username: user.username } })
}
