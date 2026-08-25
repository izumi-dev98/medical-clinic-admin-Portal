import formidable from 'formidable'
import { adminClient, requireAdmin } from './_auth.js'

const appointmentFields = ['patient_name', 'age', 'address', 'phone_number', 'doctor_name', 'appointment_date', 'reason', 'status']

async function parseFields(request) {
  const [fields] = await formidable({ multiples: false }).parse(request)
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]))
}

export default async function handler(request, response) {
  if (!requireAdmin(request, response)) return
  const client = adminClient()
  if (!client) return response.status(500).json({ error: 'Supabase service role is not configured.' })

  if (request.method === 'GET') {
    const { data, error } = await client.from('appointments').select('*').order('created_at', { ascending: false })
    if (error) return response.status(500).json({ error: error.message })
    return response.status(200).json({ appointments: data })
  }

  if (!['POST', 'PATCH'].includes(request.method)) return response.status(405).json({ error: 'Method not allowed.' })
  const values = await parseFields(request)
  const record = Object.fromEntries(appointmentFields.filter((field) => values[field] !== undefined).map((field) => [field, values[field]]))
  if (record.age !== undefined) record.age = Number(record.age)

  let query
  if (request.method === 'PATCH') {
    if (!values.id) return response.status(400).json({ error: 'Appointment id is required.' })
    query = client.from('appointments').update(record).eq('id', values.id)
  } else {
    query = client.from('appointments').insert(record)
  }
  const { data, error } = await query.select().single()
  if (error) return response.status(400).json({ error: error.message })
  return response.status(request.method === 'POST' ? 201 : 200).json({ appointment: data })
}