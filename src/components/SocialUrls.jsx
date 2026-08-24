import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

const socialPlatformUrls = {
  Facebook: 'https://facebook.com/your-page',
  TikTok: 'https://tiktok.com/@your-account',
  YouTube: 'https://youtube.com/@your-channel',
  Instagram: 'https://instagram.com/your-account',
  X: 'https://x.com/your-account',
  Telegram: 'https://t.me/your-account',
  LinkedIn: 'https://linkedin.com/company/your-company',
}
const platformKeys = Object.fromEntries(Object.keys(socialPlatformUrls).map((platform) => [platform, platform.toLowerCase()]))

function SocialUrls() {
  const [clinicId, setClinicId] = useState(null)
  const [records, setRecords] = useState([])
  const [form, setForm] = useState({ title: '', url: '' })
  const [editingTitle, setEditingTitle] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    async function loadSocialUrls() {
      const { data, error: fetchError } = await supabase.from('clinic_information').select('id, social_urls').order('id').limit(1).single()
      if (fetchError) setError(fetchError.message)
      else {
        setClinicId(data.id)
        setRecords(Object.entries(data.social_urls ?? {}).map(([key, url]) => ({ title: Object.keys(platformKeys).find((platform) => platformKeys[platform] === key) ?? key, url })))
      }
      setLoading(false)
    }
    loadSocialUrls()
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value, ...(name === 'title' && socialPlatformUrls[value] ? { url: socialPlatformUrls[value] } : {}) }))
    setError('')
  }
  function openAddModal() { setForm({ title: '', url: '' }); setEditingTitle(null); setError(''); setIsModalOpen(true) }
  function openEditModal(record) { setForm(record); setEditingTitle(record.title); setError(''); setIsModalOpen(true) }

  async function saveSocialUrl(event) {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured || !clinicId) { setError('Add a clinic information record before saving social URLs.'); return }
    setSaving(true)
    const nextRecords = records.filter((record) => record.title !== editingTitle && record.title !== form.title)
    const socialUrls = Object.fromEntries([...nextRecords, form].map((record) => [platformKeys[record.title] ?? record.title.toLowerCase(), record.url]))
    const { error: saveError } = await supabase.from('clinic_information').update({ social_urls: socialUrls }).eq('id', clinicId)
    if (saveError) setError(saveError.message)
    else {
      setRecords([...nextRecords, form])
      setIsModalOpen(false)
      await Swal.fire({ icon: 'success', title: editingTitle ? 'Social URL updated' : 'Social URL added', timer: 1400, showConfirmButton: false })
    }
    setSaving(false)
  }

  async function deleteSocialUrl(title) {
    const result = await Swal.fire({ icon: 'warning', title: 'Delete this social URL?', text: 'This social URL will be permanently removed.', showCancelButton: true, confirmButtonText: 'Delete', cancelButtonText: 'Cancel', confirmButtonColor: '#d46d59' })
    if (!result.isConfirmed) return
    const socialUrls = Object.fromEntries(records.filter((record) => record.title !== title).map((record) => [platformKeys[record.title] ?? record.title.toLowerCase(), record.url]))
    const { error: deleteError } = await supabase.from('clinic_information').update({ social_urls: socialUrls }).eq('id', clinicId)
    if (deleteError) setError(deleteError.message)
    else { setRecords((current) => current.filter((record) => record.title !== title)); await Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false }) }
  }

  return <section className="information-page social-urls-page"><div className="information-heading"><div><p className="eyebrow">Online presence</p><h1>Social URLs</h1><p className="muted">Manage social media links shown to your visitors.</p></div><button className="primary-button" type="button" onClick={openAddModal} disabled={loading}><span>+</span> Add social URL</button></div>{!isSupabaseConfigured && <p className="setup-message">Add your Supabase keys to `.env.local` to enable cloud saving.</p>}{error && <p className="error-message" role="alert">{error}</p>}<div className="information-table-wrap"><table className="information-table"><thead><tr><th>Title</th><th>URL</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="3" className="empty-state">Loading social URLs...</td></tr> : records.length === 0 ? <tr><td colSpan="3" className="empty-state">No social URLs added yet.</td></tr> : records.map((record) => <tr key={record.title}><td><strong>{record.title}</strong></td><td><a href={record.url} target="_blank" rel="noreferrer">{record.url}</a></td><td><div className="table-actions"><button type="button" className="edit-button" onClick={() => openEditModal(record)}>Edit</button><button type="button" className="delete-button" onClick={() => deleteSocialUrl(record.title)}>Delete</button></div></td></tr>)}</tbody></table></div>{isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setIsModalOpen(false) }}><div className="information-modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="eyebrow">Online presence</p><h2>{editingTitle ? 'Edit social URL' : 'Add social URL'}</h2></div><button className="modal-close" type="button" onClick={() => !saving && setIsModalOpen(false)} aria-label="Close modal">×</button></div><form className="modal-form" onSubmit={saveSocialUrl}><label>Title<select name="title" value={form.title} onChange={updateField} required><option value="">Select a platform</option>{Object.keys(socialPlatformUrls).map((platform) => <option key={platform}>{platform}</option>)}</select></label><label>URL<input name="url" value={form.url} onChange={updateField} required type="url" placeholder="https://example.com/your-page" /></label>{error && <p className="error-message" role="alert">{error}</p>}<div className="modal-actions"><button className="cancel-button" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingTitle ? 'Update social URL' : 'Add social URL'}</button></div></form></div></div>}</section>
}

export default SocialUrls
