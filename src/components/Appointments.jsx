import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

const emptyForm = { patient_name: '', age: '', address: '', phone_number: '', doctor_name: '', appointment_date: '', reason: '', status: 'Pending' }

function Appointments() {
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    async function loadAppointments() {
      const { data, error: fetchError } = await supabase.from('appointments').select('*').order('created_at', { ascending: false })
      if (fetchError) setError(fetchError.message)
      else setRecords(data ?? [])
      setLoading(false)
    }
    loadAppointments()
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  function openAddModal() {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(record) {
    setForm({ patient_name: record.patient_name ?? '', age: record.age ?? '', address: record.address ?? '', phone_number: record.phone_number ?? '', doctor_name: record.doctor_name ?? '', appointment_date: record.appointment_date ?? '', reason: record.reason ?? '', status: record.status ?? 'Pending' })
    setEditingId(record.id)
    setError('')
    setIsModalOpen(true)
  }

  async function saveAppointment(event) {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured) { setError('Supabase is not configured. Add your environment variables first.'); return }
    setSaving(true)
    const payload = { ...form, age: Number(form.age) }
    if (editingId) payload.id = editingId
    const { data, error: saveError } = await supabase.from('appointments').upsert(payload).select().single()
    if (saveError) setError(saveError.message)
    else {
      setRecords((current) => editingId ? current.map((item) => item.id === editingId ? data : item) : [data, ...current])
      setIsModalOpen(false)
      await Swal.fire({ icon: 'success', title: editingId ? 'Appointment updated' : 'Appointment added', timer: 1400, showConfirmButton: false })
    }
    setSaving(false)
  }

  async function updateAppointmentStatus(id, status) {
    setError('')
    const { data, error: updateError } = await supabase.from('appointments').update({ status }).eq('id', id).select().single()
    if (updateError) setError(updateError.message)
    else {
      setRecords((current) => current.map((item) => item.id === id ? data : item))
      await Swal.fire({ icon: 'success', title: `Appointment ${status.toLowerCase()}`, timer: 1200, showConfirmButton: false })
    }
  }

  return <section className="information-page"><div className="information-heading"><div><p className="eyebrow">Patient requests</p><h1>Appointments</h1><p className="muted">Review and manage appointment requests from your patients.</p></div><button className="primary-button" type="button" onClick={openAddModal} disabled={loading}><span>+</span> Add appointment</button></div>{!isSupabaseConfigured && <p className="setup-message">Add your Supabase keys to `.env.local` to enable cloud saving.</p>}{error && <p className="error-message" role="alert">{error}</p>}<div className="information-table-wrap"><table className="information-table"><thead><tr><th>Patient</th><th>Doctor</th><th>Appointment date</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="empty-state">Loading appointments...</td></tr> : records.length === 0 ? <tr><td colSpan="6" className="empty-state">No appointment requests yet.</td></tr> : records.map((record) => <tr key={record.id}><td><strong>{record.patient_name}</strong><span className="table-subtext">Age {record.age} · {record.address}</span></td><td>{record.doctor_name}</td><td>{record.appointment_date}</td><td>{record.phone_number}</td><td><span className={`status-badge ${record.status.toLowerCase()}`}>{record.status}</span></td><td><div className="table-actions"><button type="button" className="edit-button" onClick={() => openEditModal(record)}>Edit</button>{record.status === 'Pending' && <><button type="button" className="edit-button" onClick={() => updateAppointmentStatus(record.id, 'Completed')}>Completed</button><button type="button" className="delete-button" onClick={() => updateAppointmentStatus(record.id, 'Reject')}>Reject</button></>}</div></td></tr>)}</tbody></table></div>{isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setIsModalOpen(false) }}><div className="information-modal doctor-modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="eyebrow">Patient requests</p><h2>{editingId ? 'Edit appointment' : 'Add appointment'}</h2></div><button className="modal-close" type="button" onClick={() => !saving && setIsModalOpen(false)} aria-label="Close modal">×</button></div><form className="modal-form" onSubmit={saveAppointment}><div className="modal-form-grid"><label>Patient name<input name="patient_name" value={form.patient_name} onChange={updateField} required placeholder="Enter patient name" /></label><label>Age<input name="age" value={form.age} onChange={updateField} required type="number" min="0" max="130" placeholder="Age" /></label></div><label>Address<input name="address" value={form.address} onChange={updateField} required placeholder="Enter patient address" /></label><div className="modal-form-grid"><label>Phone number<input name="phone_number" value={form.phone_number} onChange={updateField} required type="tel" placeholder="Enter phone number" /></label><label>Doctor name<input name="doctor_name" value={form.doctor_name} onChange={updateField} required placeholder="Enter doctor name" /></label></div><div className="modal-form-grid"><label>Appointment date<input name="appointment_date" value={form.appointment_date} onChange={updateField} required type="date" /></label><label>Status<select name="status" value={form.status} onChange={updateField}><option>Pending</option><option>Reject</option><option>Completed</option></select></label></div><label>Reason<textarea name="reason" value={form.reason} onChange={updateField} required rows="4" placeholder="Describe the reason for the appointment" /></label>{error && <p className="error-message" role="alert">{error}</p>}<div className="modal-actions"><button className="cancel-button" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update appointment' : 'Add appointment'}</button></div></form></div></div>}</section>
}

export default Appointments
