import { clearSession, currentUser } from './_auth.js'

export default function handler(request, response) {
  if (request.method === 'DELETE') {
    clearSession(response)
    return response.status(204).end()
  }
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed.' })
  const user = currentUser(request)
  return response.status(200).json({ user: user ? { id: user.id, username: user.username } : null })
}
