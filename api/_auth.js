import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

const cookieName = 'clinic_admin_session'

function adminClient() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return url && key ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) : null
}

function sign(value) {
  return crypto.createHmac('sha256', process.env.AUTH_SESSION_SECRET || 'change-this-secret').update(value).digest('hex')
}

export function setSession(response, user) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, username: user.username, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url')
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader('Set-Cookie', `${cookieName}=${payload}.${sign(payload)}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=28800`)
}

export function clearSession(response) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader('Set-Cookie', `${cookieName}=; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=0`)
}

export function currentUser(request) {
  const cookies = Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((part) => part.trim().split('=')))
  const value = cookies[cookieName]
  if (!value) return null
  const [payload, signature] = value.split('.')
  if (!payload || !signature) return null
  const expected = sign(payload)
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return user.exp > Date.now() ? user : null
  } catch {
    return null
  }
}

export function requireAdmin(request, response) {
  const user = currentUser(request)
  if (!user) {
    response.status(401).json({ error: 'Authentication required.' })
    return null
  }
  request.user = user
  return user
}

export { adminClient, bcrypt }
