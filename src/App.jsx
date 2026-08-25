import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import './App.css'
import Sidebar, { Icon } from './components/Sidebar'
import SocialUrlsPage from './components/SocialUrls'
import AppointmentsPage from './components/Appointments'
import Login from './components/Login'
import Users from './components/Users'
import { getSupabaseImageUrl, isSupabaseConfigured, removeSupabaseImage, supabase, uploadCloudinaryImage } from './lib/supabaseClient'

function App() {
  const [user, setUser] = useState(undefined)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activePage, setActivePage] = useState('Hospital/Clinic Information')

  useEffect(() => {
    const previews = new Map()
    let dragState = null
    function showPreview(event) {
      const input = event.target
      if (!(input instanceof HTMLInputElement) || input.type !== 'file') return
      const parent = input.closest('label')
      if (!parent) return
      previews.get(input)?.forEach((item) => URL.revokeObjectURL(item.url))
      parent.querySelector('.image-upload-preview')?.remove()
      const files = Array.from(input.files ?? [])
      if (!files.length) return
      const preview = document.createElement('div')
      preview.className = 'image-upload-preview'
      const items = files.map((file) => {
        const url = URL.createObjectURL(file)
        const image = document.createElement('img')
        image.src = url
        image.alt = 'Selected preview'
        image.draggable = false
        preview.append(image)
        return { url }
      })
      input.before(preview)
      previews.set(input, items)
    }
    function startDrag(event) {
      const image = event.target
      if (!(image instanceof HTMLImageElement) || !image.closest('.image-upload-preview')) return
      event.preventDefault()
      image.setPointerCapture(event.pointerId)
      dragState = { image, startX: event.clientX, startY: event.clientY, x: Number(image.dataset.positionX || 50), y: Number(image.dataset.positionY || 50) }
    }
    function moveDrag(event) {
      if (!dragState) return
      const { image, startX, startY, x, y } = dragState
      const parent = image.parentElement
      const nextX = Math.max(0, Math.min(100, x - ((event.clientX - startX) / parent.clientWidth) * 100))
      const nextY = Math.max(0, Math.min(100, y - ((event.clientY - startY) / parent.clientHeight) * 100))
      image.dataset.positionX = nextX
      image.dataset.positionY = nextY
      image.style.objectPosition = `${nextX}% ${nextY}%`
    }
    function endDrag() { dragState = null }
    document.addEventListener('change', showPreview)
    document.addEventListener('pointerdown', startDrag)
    document.addEventListener('pointermove', moveDrag)
    document.addEventListener('pointerup', endDrag)
    return () => {
      document.removeEventListener('change', showPreview)
      document.removeEventListener('pointerdown', startDrag)
      document.removeEventListener('pointermove', moveDrag)
      document.removeEventListener('pointerup', endDrag)
      previews.forEach((items) => items.forEach((item) => URL.revokeObjectURL(item.url)))
    }
  }, [])

  useEffect(() => {
    fetch('/api/auth-session').then((response) => response.json()).then((result) => setUser(result.user)).catch(() => setUser(null))
  }, [])

  if (user === undefined) return <main className="login-page"><p className="muted">Loading...</p></main>
  if (!user) return <Login onLogin={setUser} />
  async function logout() { await fetch('/api/auth-session', { method: 'DELETE' }); setUser(null) }

  return (
    <div className="app-shell">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={setActivePage} onLogout={logout} user={user} />
      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" type="button" onClick={() => setIsSidebarOpen(true)} aria-label="Open navigation menu">
            <Icon name="menu" size={22} />
          </button>
          <div className="breadcrumb"><span>Workspace</span><b>/</b> {activePage}</div>
        </header>

        <div className="page-content">
          {activePage === 'Users' ? <Users currentUser={user} /> : activePage === 'Hospital/Clinic Information' ? <ClinicInformation /> : activePage === 'Mission, Vision & Core' ? <MissionVisionCore /> : activePage === 'Awards' ? <Awards /> : activePage === 'Services' ? <Services /> : activePage === 'Doctors' ? <Doctors /> : activePage === 'Management Team' ? <ManagementTeam /> : activePage === 'Medical Packages' ? <MedicalPackages /> : activePage === 'Promotions' ? <Promotions /> : activePage === 'Blog' ? <Blog /> : activePage === 'Corporate' ? <ContentManager config={contentPageConfig.corporate} /> : activePage === 'Social URLs' ? <SocialUrlsPage /> : activePage === 'Appointments' ? <AppointmentsPage /> : <ClinicInformation />}
        </div>
      </main>
    </div>
  )
}

function ClinicInformation() {
  const emptyForm = { clinic_title: '', about_us: '', address: '', emergency_phone: '', phone: '', email: '', profile_image_url: '' }
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return

    async function loadClinicInformation() {
      const { data, error: fetchError } = await supabase.from('clinic_information').select('*').order('created_at', { ascending: false })
      if (fetchError) setError(fetchError.message)
      else setRecords(data ?? [])
      setLoading(false)
    }

    loadClinicInformation()
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  function openAddModal() {
    setForm(emptyForm)
    setEditingId(null)
    setImageFile(null)
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(record) {
    setForm({ clinic_title: record.clinic_title ?? '', about_us: record.about_us ?? '', address: record.address ?? '', emergency_phone: record.emergency_phone ?? '', phone: record.phone ?? '', email: record.email ?? '', profile_image_url: record.profile_image_url ?? '' })
    setEditingId(record.id)
    setImageFile(null)
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (!saving) setIsModalOpen(false)
  }

  async function saveClinicInformation(event) {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.')
      return
    }
    setSaving(true)
    const previousImageUrl = form.profile_image_url
    let profileImageUrl = form.profile_image_url
    if (imageFile) {
      const { data: uploadData, error: uploadError } = await uploadCloudinaryImage(imageFile, 'clinic-images')
      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }
      profileImageUrl = getSupabaseImageUrl(uploadData.publicUrl, Date.now())
    }
    const record = editingId ? { id: editingId, ...form, profile_image_url: profileImageUrl } : { ...form, profile_image_url: profileImageUrl }
    const { data, error: saveError } = await supabase.from('clinic_information').upsert(record).select().single()
    if (saveError) setError(saveError.message)
    else {
      if (imageFile && previousImageUrl && previousImageUrl !== profileImageUrl) await removeSupabaseImage('clinic-images', previousImageUrl)
      setRecords((current) => editingId ? current.map((item) => item.id === editingId ? data : item) : [data, ...current])
      setIsModalOpen(false)
      await Swal.fire({ icon: 'success', title: editingId ? 'Information updated' : 'Information added', text: 'Clinic information was saved successfully.', timer: 1600, showConfirmButton: false })
    }
    setSaving(false)
  }

  async function deleteClinicInformation(id) {
    const result = await Swal.fire({ icon: 'warning', title: 'Delete information?', text: 'This clinic record will be permanently removed.', showCancelButton: true, confirmButtonText: 'Delete', cancelButtonText: 'Cancel', confirmButtonColor: '#d46d59' })
    if (!result.isConfirmed) return
    const { error: deleteError } = await supabase.from('clinic_information').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else {
      setRecords((current) => current.filter((item) => item.id !== id))
      await Swal.fire({ icon: 'success', title: 'Deleted', text: 'Clinic information was deleted.', timer: 1400, showConfirmButton: false })
    }
  }

  return <section className="information-page">
    <div className="information-heading"><div><p className="eyebrow">Clinic profile</p><h1>Hospital/Clinic Information</h1><p className="muted">Manage your clinic contact details.</p></div><button className="primary-button" type="button" onClick={openAddModal} disabled={loading}><span>+</span> Add information</button></div>
    {!isSupabaseConfigured && <p className="setup-message" role="status">Add your Supabase keys to `.env.local` to enable cloud saving.</p>}
    {error && <p className="error-message" role="alert">{error}</p>}
    <div className="information-table-wrap"><table className="information-table"><thead><tr><th>Profile</th><th>Hospital / Clinic</th><th>Address</th><th>Emergency phone</th><th>Phone</th><th>Gmail</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="7" className="empty-state">Loading clinic information...</td></tr> : records.length === 0 ? <tr><td colSpan="7" className="empty-state">No clinic information added yet.</td></tr> : records.map((record) => <tr key={record.id}><td>{record.profile_image_url ? <img className="table-profile-image" src={record.profile_image_url} alt="" /> : <span className="table-profile-placeholder">—</span>}</td><td><strong>{record.clinic_title}</strong></td><td className="about-cell">{record.address || '—'}</td><td>{record.emergency_phone}</td><td>{record.phone}</td><td>{record.email}</td><td><div className="table-actions"><button type="button" className="edit-button" onClick={() => openEditModal(record)}>Edit</button><button type="button" className="delete-button" onClick={() => deleteClinicInformation(record.id)}>Delete</button></div></td></tr>)}</tbody></table></div>
    {isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal() }}><div className="information-modal" role="dialog" aria-modal="true" aria-labelledby="information-modal-title"><div className="modal-heading"><div><p className="eyebrow">Clinic profile</p><h2 id="information-modal-title">{editingId ? 'Edit information' : 'Add information'}</h2></div><button className="modal-close" type="button" onClick={closeModal} aria-label="Close modal">×</button></div><form className="modal-form" onSubmit={saveClinicInformation}><label>Hospital / Clinic title<input name="clinic_title" value={form.clinic_title} onChange={updateField} required placeholder="Enter hospital or clinic name" /></label><label>About us<textarea name="about_us" value={form.about_us} onChange={updateField} rows="4" placeholder="Tell patients about your clinic" /></label><label>Address<input name="address" value={form.address} onChange={updateField} required placeholder="Enter clinic address" /></label><label>Profile image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} /></label><div className="modal-form-grid"><label>Emergency phone number<input name="emergency_phone" value={form.emergency_phone} onChange={updateField} required type="tel" placeholder="+1 000 000 0000" /></label><label>Phone number<input name="phone" value={form.phone} onChange={updateField} required type="tel" placeholder="+1 000 000 0000" /></label></div><label>Gmail address<input name="email" value={form.email} onChange={updateField} required type="email" placeholder="clinic@example.com" /></label>{error && <p className="error-message" role="alert">{error}</p>}<div className="modal-actions"><button className="cancel-button" type="button" onClick={closeModal}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update information' : 'Add information'}</button></div></form></div></div>}
  </section>
}

function MissionVisionCore() {
  const emptyForm = { section_type: 'Mission', title: '', description: '', image_url: '' }
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    async function loadContent() {
      const { data, error: fetchError } = await supabase.from('mission_vision_core').select('*').order('display_order').order('created_at')
      if (fetchError) setError(fetchError.message)
      else setRecords(data ?? [])
      setLoading(false)
    }
    loadContent()
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  function openAddModal() {
    setForm(emptyForm)
    setEditingId(null)
    setImageFile(null)
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(record) {
    setForm({ section_type: record.section_type, title: record.title, description: record.description, image_url: record.image_url ?? '' })
    setEditingId(record.id)
    setImageFile(null)
    setError('')
    setIsModalOpen(true)
  }

  async function saveContent(event) {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add your environment variables first.')
      return
    }
    setSaving(true)
    const previousImageUrl = form.image_url
    let imageUrl = form.image_url
    if (imageFile) {
      const { data: uploadData, error: uploadError } = await uploadCloudinaryImage(imageFile, 'mission-images')
      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }
      imageUrl = getSupabaseImageUrl(uploadData.publicUrl, Date.now())
    }
    const payload = editingId ? { id: editingId, ...form, image_url: imageUrl } : { ...form, image_url: imageUrl }
    const { data, error: saveError } = await supabase.from('mission_vision_core').upsert(payload).select().single()
    if (saveError) setError(saveError.message)
    else {
      if (imageFile && previousImageUrl && previousImageUrl !== imageUrl) await removeSupabaseImage('mission-images', previousImageUrl)
      setRecords((current) => editingId ? current.map((item) => item.id === editingId ? data : item) : [...current, data].sort((a, b) => a.display_order - b.display_order))
      setIsModalOpen(false)
      await Swal.fire({ icon: 'success', title: editingId ? 'Content updated' : 'Content added', timer: 1400, showConfirmButton: false })
    }
    setSaving(false)
  }

  async function deleteContent(id) {
    const result = await Swal.fire({ icon: 'warning', title: 'Delete this content?', text: 'This item will be permanently removed.', showCancelButton: true, confirmButtonText: 'Delete', confirmButtonColor: '#d46d59' })
    if (!result.isConfirmed) return
    const { error: deleteError } = await supabase.from('mission_vision_core').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else {
      setRecords((current) => current.filter((item) => item.id !== id))
      await Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false })
    }
  }

  return <section className="information-page"><div className="information-heading"><div><p className="eyebrow">Clinic identity</p><h1>Mission, vision & core</h1><p className="muted">Manage the values and purpose shown to your patients.</p></div><button className="primary-button" type="button" onClick={openAddModal} disabled={loading}><span>+</span> Add content</button></div>{!isSupabaseConfigured && <p className="setup-message">Add your Supabase keys to `.env.local` to enable cloud saving.</p>}{error && <p className="error-message" role="alert">{error}</p>}<div className="information-table-wrap"><table className="information-table"><thead><tr><th>Image</th><th>Type</th><th>Title</th><th>Description</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="5" className="empty-state">Loading content...</td></tr> : records.length === 0 ? <tr><td colSpan="5" className="empty-state">No mission, vision, or core values added yet.</td></tr> : records.map((record) => <tr key={record.id}><td>{record.image_url ? <img className="table-content-image" src={record.image_url} alt="" /> : <span className="table-profile-placeholder">—</span>}</td><td><span className={`content-type ${record.section_type.toLowerCase().replaceAll(' ', '-')}`}>{record.section_type}</span></td><td><strong>{record.title}</strong></td><td className="about-cell">{record.description}</td><td><div className="table-actions"><button type="button" className="edit-button" onClick={() => openEditModal(record)}>Edit</button><button type="button" className="delete-button" onClick={() => deleteContent(record.id)}>Delete</button></div></td></tr>)}</tbody></table></div>{isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setIsModalOpen(false) }}><div className="information-modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="eyebrow">Clinic identity</p><h2>{editingId ? 'Edit content' : 'Add content'}</h2></div><button className="modal-close" type="button" onClick={() => !saving && setIsModalOpen(false)} aria-label="Close modal">×</button></div><form className="modal-form" onSubmit={saveContent}><label>Type<select name="section_type" value={form.section_type} onChange={updateField}><option>Mission</option><option>Vision</option><option>Core Value</option></select></label><label>Title<input name="title" value={form.title} onChange={updateField} required placeholder="Enter a title" /></label><label>Description<textarea name="description" value={form.description} onChange={updateField} required rows="5" placeholder="Describe this mission, vision, or core value" /></label><label>Image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} /></label>{error && <p className="error-message" role="alert">{error}</p>}<div className="modal-actions"><button className="cancel-button" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update content' : 'Add content'}</button></div></form></div></div>}</section>
}

function Awards() {
  const emptyForm = { title: '', description: '', image_urls: [] }
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    async function loadAwards() {
      const { data, error: fetchError } = await supabase.from('awards').select('*').order('created_at', { ascending: false })
      if (fetchError) setError(fetchError.message)
      else setRecords(data ?? [])
      setLoading(false)
    }
    loadAwards()
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  function openAddModal() {
    setForm(emptyForm)
    setEditingId(null)
    setImageFiles([])
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(record) {
    setForm({ title: record.title ?? '', description: record.description ?? '', image_urls: record.image_urls ?? [] })
    setEditingId(record.id)
    setImageFiles([])
    setError('')
    setIsModalOpen(true)
  }

  async function saveAward(event) {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add your environment variables first.')
      return
    }
    setSaving(true)
    const previousImageUrls = form.image_urls
    let imageUrls = form.image_urls
    if (imageFiles.length) {
      const uploadedUrls = []
      for (const imageFile of imageFiles) {
        const { data: uploadData, error: uploadError } = await uploadCloudinaryImage(imageFile, 'award-images')
        if (uploadError) {
          setError(uploadError.message)
          setSaving(false)
          return
        }
        uploadedUrls.push(getSupabaseImageUrl(uploadData.publicUrl, Date.now()))
      }
      imageUrls = uploadedUrls
    }
    const payload = editingId ? { id: editingId, title: form.title, description: form.description, image_urls: imageUrls } : { title: form.title, description: form.description, image_urls: imageUrls }
    const { data, error: saveError } = await supabase.from('awards').upsert(payload).select().single()
    if (saveError) setError(saveError.message)
    else {
      if (imageFiles.length && editingId) await Promise.all(previousImageUrls.map((imageUrl) => removeSupabaseImage('award-images', imageUrl)))
      setRecords((current) => editingId ? current.map((item) => item.id === editingId ? data : item) : [data, ...current])
      setIsModalOpen(false)
      await Swal.fire({ icon: 'success', title: editingId ? 'Award updated' : 'Award added', timer: 1400, showConfirmButton: false })
    }
    setSaving(false)
  }

  async function deleteAward(id) {
    const result = await Swal.fire({ icon: 'warning', title: 'Delete this award?', text: 'This award will be permanently removed.', showCancelButton: true, confirmButtonText: 'Delete', confirmButtonColor: '#d46d59' })
    if (!result.isConfirmed) return
    const { error: deleteError } = await supabase.from('awards').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else {
      setRecords((current) => current.filter((item) => item.id !== id))
      await Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false })
    }
  }

  return <section className="information-page"><div className="information-heading"><div><p className="eyebrow">Clinic recognition</p><h1>Awards</h1><p className="muted">Manage awards and recognitions shown to your patients.</p></div><button className="primary-button" type="button" onClick={openAddModal} disabled={loading}><span>+</span> Add award</button></div>{!isSupabaseConfigured && <p className="setup-message">Add your Supabase keys to `.env.local` to enable cloud saving.</p>}{error && <p className="error-message" role="alert">{error}</p>}<div className="information-table-wrap"><table className="information-table"><thead><tr><th>Images</th><th>Title</th><th>Description</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="4" className="empty-state">Loading awards...</td></tr> : records.length === 0 ? <tr><td colSpan="4" className="empty-state">No awards added yet.</td></tr> : records.map((record) => <tr key={record.id}><td><div className="award-images">{(record.image_urls ?? []).map((imageUrl) => <img key={imageUrl} className="table-content-image" src={imageUrl} alt="" />)}</div></td><td><strong>{record.title}</strong></td><td className="about-cell">{record.description}</td><td><div className="table-actions"><button type="button" className="edit-button" onClick={() => openEditModal(record)}>Edit</button><button type="button" className="delete-button" onClick={() => deleteAward(record.id)}>Delete</button></div></td></tr>)}</tbody></table></div>{isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setIsModalOpen(false) }}><div className="information-modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="eyebrow">Clinic recognition</p><h2>{editingId ? 'Edit award' : 'Add award'}</h2></div><button className="modal-close" type="button" onClick={() => !saving && setIsModalOpen(false)} aria-label="Close modal">×</button></div><form className="modal-form" onSubmit={saveAward}><label>Title<input name="title" value={form.title} onChange={updateField} required placeholder="Enter award title" /></label><label>Description<textarea name="description" value={form.description} onChange={updateField} required rows="5" placeholder="Describe this award or recognition" /></label><label>Images<input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))} />{imageFiles.length > 0 && <span className="file-count">{imageFiles.length} image{imageFiles.length === 1 ? '' : 's'} selected</span>}</label>{error && <p className="error-message" role="alert">{error}</p>}<div className="modal-actions"><button className="cancel-button" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update award' : 'Add award'}</button></div></form></div></div>}</section>
}

function Services() {
  const emptyForm = { title: '', description: '', image_urls: [] }
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    async function loadServices() {
      const { data, error: fetchError } = await supabase.from('services').select('*').order('created_at', { ascending: false })
      if (fetchError) setError(fetchError.message)
      else setRecords(data ?? [])
      setLoading(false)
    }
    loadServices()
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  function openAddModal() {
    setForm(emptyForm)
    setEditingId(null)
    setImageFiles([])
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(record) {
    setForm({ title: record.title ?? '', description: record.description ?? '', image_urls: record.image_urls ?? [] })
    setEditingId(record.id)
    setImageFiles([])
    setError('')
    setIsModalOpen(true)
  }

  async function saveService(event) {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add your environment variables first.')
      return
    }
    setSaving(true)
    const previousImageUrls = form.image_urls
    let imageUrls = form.image_urls
    if (imageFiles.length) {
      const uploadedUrls = []
      for (const imageFile of imageFiles) {
        const { data: uploadData, error: uploadError } = await uploadCloudinaryImage(imageFile, 'service-images')
        if (uploadError) {
          setError(uploadError.message)
          setSaving(false)
          return
        }
        uploadedUrls.push(getSupabaseImageUrl(uploadData.publicUrl, Date.now()))
      }
      imageUrls = uploadedUrls
    }
    const payload = editingId ? { id: editingId, title: form.title, description: form.description, image_urls: imageUrls } : { title: form.title, description: form.description, image_urls: imageUrls }
    const { data, error: saveError } = await supabase.from('services').upsert(payload).select().single()
    if (saveError) setError(saveError.message)
    else {
      if (imageFiles.length && editingId) await Promise.all(previousImageUrls.map((imageUrl) => removeSupabaseImage('service-images', imageUrl)))
      setRecords((current) => editingId ? current.map((item) => item.id === editingId ? data : item) : [data, ...current])
      setIsModalOpen(false)
      await Swal.fire({ icon: 'success', title: editingId ? 'Service updated' : 'Service added', timer: 1400, showConfirmButton: false })
    }
    setSaving(false)
  }

  async function deleteService(id) {
    const result = await Swal.fire({ icon: 'warning', title: 'Delete this service?', text: 'This service will be permanently removed.', showCancelButton: true, confirmButtonText: 'Delete', confirmButtonColor: '#d46d59' })
    if (!result.isConfirmed) return
    const { error: deleteError } = await supabase.from('services').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else {
      setRecords((current) => current.filter((item) => item.id !== id))
      await Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false })
    }
  }

  return <section className="information-page"><div className="information-heading"><div><p className="eyebrow">Clinic care</p><h1>Services</h1><p className="muted">Manage services and treatments shown to your patients.</p></div><button className="primary-button" type="button" onClick={openAddModal} disabled={loading}><span>+</span> Add service</button></div>{!isSupabaseConfigured && <p className="setup-message">Add your Supabase keys to `.env.local` to enable cloud saving.</p>}{error && <p className="error-message" role="alert">{error}</p>}<div className="information-table-wrap"><table className="information-table"><thead><tr><th>Images</th><th>Title</th><th>Description</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="4" className="empty-state">Loading services...</td></tr> : records.length === 0 ? <tr><td colSpan="4" className="empty-state">No services added yet.</td></tr> : records.map((record) => <tr key={record.id}><td><div className="award-images">{(record.image_urls ?? []).map((imageUrl) => <img key={imageUrl} className="table-content-image" src={imageUrl} alt="" />)}</div></td><td><strong>{record.title}</strong></td><td className="about-cell">{record.description}</td><td><div className="table-actions"><button type="button" className="edit-button" onClick={() => openEditModal(record)}>Edit</button><button type="button" className="delete-button" onClick={() => deleteService(record.id)}>Delete</button></div></td></tr>)}</tbody></table></div>{isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setIsModalOpen(false) }}><div className="information-modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="eyebrow">Clinic care</p><h2>{editingId ? 'Edit service' : 'Add service'}</h2></div><button className="modal-close" type="button" onClick={() => !saving && setIsModalOpen(false)} aria-label="Close modal">×</button></div><form className="modal-form" onSubmit={saveService}><label>Title<input name="title" value={form.title} onChange={updateField} required placeholder="Enter service title" /></label><label>Description<textarea name="description" value={form.description} onChange={updateField} required rows="5" placeholder="Describe this service" /></label><label>Images<input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))} />{imageFiles.length > 0 && <span className="file-count">{imageFiles.length} image{imageFiles.length === 1 ? '' : 's'} selected</span>}</label>{error && <p className="error-message" role="alert">{error}</p>}<div className="modal-actions"><button className="cancel-button" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update service' : 'Add service'}</button></div></form></div></div>}</section>
}

function Doctors() {
  const emptyForm = { doctor_name: '', facility: '', address: '', phone: '', gender: 'Female', qualifications: '', biography: '', image_url: '' }
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    async function loadDoctors() {
      const { data, error: fetchError } = await supabase.from('doctors').select('*').order('created_at', { ascending: false })
      if (fetchError) setError(fetchError.message)
      else setRecords(data ?? [])
      setLoading(false)
    }
    loadDoctors()
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  function openAddModal() {
    setForm(emptyForm)
    setEditingId(null)
    setImageFile(null)
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(record) {
    setForm({ doctor_name: record.doctor_name ?? '', facility: record.facility ?? '', address: record.address ?? '', phone: record.phone ?? '', gender: record.gender ?? 'Female', qualifications: record.qualifications ?? '', biography: record.biography ?? '', image_url: record.image_url ?? '' })
    setEditingId(record.id)
    setImageFile(null)
    setError('')
    setIsModalOpen(true)
  }

  async function saveDoctor(event) {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add your environment variables first.')
      return
    }
    setSaving(true)
    const previousImageUrl = form.image_url
    let imageUrl = form.image_url
    if (imageFile) {
      const { data: uploadData, error: uploadError } = await uploadCloudinaryImage(imageFile, 'doctor-images')
      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }
      imageUrl = getSupabaseImageUrl(uploadData.publicUrl, Date.now())
    }
    const payload = editingId ? { id: editingId, ...form, image_url: imageUrl } : { ...form, image_url: imageUrl }
    const { data, error: saveError } = await supabase.from('doctors').upsert(payload).select().single()
    if (saveError) setError(saveError.message)
    else {
      if (imageFile && previousImageUrl && previousImageUrl !== imageUrl) await removeSupabaseImage('doctor-images', previousImageUrl)
      setRecords((current) => editingId ? current.map((item) => item.id === editingId ? data : item) : [data, ...current])
      setIsModalOpen(false)
      await Swal.fire({ icon: 'success', title: editingId ? 'Doctor updated' : 'Doctor added', timer: 1400, showConfirmButton: false })
    }
    setSaving(false)
  }

  async function deleteDoctor(id) {
    const result = await Swal.fire({ icon: 'warning', title: 'Delete this doctor?', text: 'This doctor will be permanently removed.', showCancelButton: true, confirmButtonText: 'Delete', confirmButtonColor: '#d46d59' })
    if (!result.isConfirmed) return
    const { error: deleteError } = await supabase.from('doctors').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else {
      setRecords((current) => current.filter((item) => item.id !== id))
      await Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false })
    }
  }

  return <section className="information-page"><div className="information-heading"><div><p className="eyebrow">Medical team</p><h1>Doctors</h1><p className="muted">Manage doctor profiles shown to your patients.</p></div><button className="primary-button" type="button" onClick={openAddModal} disabled={loading}><span>+</span> Add doctor</button></div>{!isSupabaseConfigured && <p className="setup-message">Add your Supabase keys to `.env.local` to enable cloud saving.</p>}{error && <p className="error-message" role="alert">{error}</p>}<div className="information-table-wrap"><table className="information-table"><thead><tr><th>Image</th><th>Doctor name</th><th>Facility</th><th>Gender</th><th>Qualifications</th><th>Phone</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="7" className="empty-state">Loading doctors...</td></tr> : records.length === 0 ? <tr><td colSpan="7" className="empty-state">No doctors added yet.</td></tr> : records.map((record) => <tr key={record.id}><td>{record.image_url ? <img className="table-content-image" src={record.image_url} alt="" /> : <span className="table-profile-placeholder">—</span>}</td><td><strong>{record.doctor_name}</strong><span className="table-subtext">{record.address}</span></td><td>{record.facility}</td><td>{record.gender}</td><td className="about-cell">{record.qualifications}</td><td>{record.phone}</td><td><div className="table-actions"><button type="button" className="edit-button" onClick={() => openEditModal(record)}>Edit</button><button type="button" className="delete-button" onClick={() => deleteDoctor(record.id)}>Delete</button></div></td></tr>)}</tbody></table></div>{isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setIsModalOpen(false) }}><div className="information-modal doctor-modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="eyebrow">Medical team</p><h2>{editingId ? 'Edit doctor' : 'Add doctor'}</h2></div><button className="modal-close" type="button" onClick={() => !saving && setIsModalOpen(false)} aria-label="Close modal">×</button></div><form className="modal-form" onSubmit={saveDoctor}><label>Doctor name<input name="doctor_name" value={form.doctor_name} onChange={updateField} required placeholder="Enter doctor name" /></label><label>Facility<input name="facility" value={form.facility} onChange={updateField} required placeholder="e.g. Main Clinic" /></label><div className="modal-form-grid"><label>Gender<select name="gender" value={form.gender} onChange={updateField}><option>Female</option><option>Male</option><option>Other</option></select></label><label>Phone number<input name="phone" value={form.phone} onChange={updateField} required type="tel" placeholder="+1 000 000 0000" /></label></div><label>Address<input name="address" value={form.address} onChange={updateField} required placeholder="Enter address" /></label><label>Qualifications<input name="qualifications" value={form.qualifications} onChange={updateField} required placeholder="e.g. MD, Cardiology" /></label><label>Biography<textarea name="biography" value={form.biography} onChange={updateField} required rows="4" placeholder="Write a short biography" /></label><label>Profile image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />{imageFile && <span className="file-count">{imageFile.name}</span>}</label>{error && <p className="error-message" role="alert">{error}</p>}<div className="modal-actions"><button className="cancel-button" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update doctor' : 'Add doctor'}</button></div></form></div></div>}</section>
}

function ManagementTeam() {
  const emptyForm = { name: '', position: '', department: '', description: '', image_url: '' }
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    async function loadTeam() {
      const { data, error: fetchError } = await supabase.from('management_team').select('*').order('created_at', { ascending: false })
      if (fetchError) setError(fetchError.message)
      else setRecords(data ?? [])
      setLoading(false)
    }
    loadTeam()
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  function openAddModal() {
    setForm(emptyForm)
    setEditingId(null)
    setImageFile(null)
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(record) {
    setForm({ name: record.name ?? '', position: record.position ?? '', department: record.department ?? '', description: record.description ?? '', image_url: record.image_url ?? '' })
    setEditingId(record.id)
    setImageFile(null)
    setError('')
    setIsModalOpen(true)
  }

  async function saveTeamMember(event) {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add your environment variables first.')
      return
    }
    setSaving(true)
    const previousImageUrl = form.image_url
    let imageUrl = form.image_url
    if (imageFile) {
      const { data: uploadData, error: uploadError } = await uploadCloudinaryImage(imageFile, 'team-images')
      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }
      imageUrl = getSupabaseImageUrl(uploadData.publicUrl, Date.now())
    }
    const payload = editingId ? { id: editingId, ...form, image_url: imageUrl } : { ...form, image_url: imageUrl }
    const { data, error: saveError } = await supabase.from('management_team').upsert(payload).select().single()
    if (saveError) setError(saveError.message)
    else {
      if (imageFile && previousImageUrl && previousImageUrl !== imageUrl) await removeSupabaseImage('team-images', previousImageUrl)
      setRecords((current) => editingId ? current.map((item) => item.id === editingId ? data : item) : [data, ...current])
      setIsModalOpen(false)
      await Swal.fire({ icon: 'success', title: editingId ? 'Team member updated' : 'Team member added', timer: 1400, showConfirmButton: false })
    }
    setSaving(false)
  }

  async function deleteTeamMember(id) {
    const result = await Swal.fire({ icon: 'warning', title: 'Delete this team member?', text: 'This team member will be permanently removed.', showCancelButton: true, confirmButtonText: 'Delete', confirmButtonColor: '#d46d59' })
    if (!result.isConfirmed) return
    const { error: deleteError } = await supabase.from('management_team').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else {
      setRecords((current) => current.filter((item) => item.id !== id))
      await Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false })
    }
  }

  return <section className="information-page"><div className="information-heading"><div><p className="eyebrow">Our people</p><h1>Management team</h1><p className="muted">Manage the team profiles shown to your patients.</p></div><button className="primary-button" type="button" onClick={openAddModal} disabled={loading}><span>+</span> Add team member</button></div>{!isSupabaseConfigured && <p className="setup-message">Add your Supabase keys to `.env.local` to enable cloud saving.</p>}{error && <p className="error-message" role="alert">{error}</p>}<div className="information-table-wrap"><table className="information-table"><thead><tr><th>Image</th><th>Name</th><th>Position</th><th>Department</th><th>Description</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="empty-state">Loading team members...</td></tr> : records.length === 0 ? <tr><td colSpan="6" className="empty-state">No management team members added yet.</td></tr> : records.map((record) => <tr key={record.id}><td>{record.image_url ? <img className="table-content-image" src={record.image_url} alt="" /> : <span className="table-profile-placeholder">—</span>}</td><td><strong>{record.name}</strong></td><td>{record.position}</td><td>{record.department}</td><td className="about-cell">{record.description}</td><td><div className="table-actions"><button type="button" className="edit-button" onClick={() => openEditModal(record)}>Edit</button><button type="button" className="delete-button" onClick={() => deleteTeamMember(record.id)}>Delete</button></div></td></tr>)}</tbody></table></div>{isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setIsModalOpen(false) }}><div className="information-modal doctor-modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="eyebrow">Our people</p><h2>{editingId ? 'Edit team member' : 'Add team member'}</h2></div><button className="modal-close" type="button" onClick={() => !saving && setIsModalOpen(false)} aria-label="Close modal">×</button></div><form className="modal-form" onSubmit={saveTeamMember}><label>Name<input name="name" value={form.name} onChange={updateField} required placeholder="Enter name" /></label><div className="modal-form-grid"><label>Position<input name="position" value={form.position} onChange={updateField} required placeholder="e.g. Clinic Manager" /></label><label>Department<input name="department" value={form.department} onChange={updateField} required placeholder="e.g. Administration" /></label></div><label>Description<textarea name="description" value={form.description} onChange={updateField} required rows="5" placeholder="Write a short description" /></label><label>Profile image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />{imageFile && <span className="file-count">{imageFile.name}</span>}</label>{error && <p className="error-message" role="alert">{error}</p>}<div className="modal-actions"><button className="cancel-button" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update member' : 'Add member'}</button></div></form></div></div>}</section>
}

const contentPageConfig = {
  packages: {
    table: 'medical_packages', bucket: 'package-images', eyebrow: 'Clinic care', heading: 'Medical packages', addLabel: 'Add package', singular: 'package', empty: 'No medical packages added yet.',
    emptyForm: { title: '', short_description: '', description: '', price: '', duration: '', included_services: '', image_url: '', is_active: true },
    fields: [['title', 'Title', 'Enter package title'], ['short_description', 'Short description', 'Brief package summary'], ['description', 'Detailed description', 'Describe what this package includes'], ['price', 'Price', 'e.g. 199.00'], ['duration', 'Duration', 'e.g. 2 hours'], ['included_services', 'Included services', 'e.g. Blood test, ECG, consultation']],
  },
  promotions: {
    table: 'promotions', bucket: 'promotion-images', eyebrow: 'Clinic offers', heading: 'Promotions', addLabel: 'Add promotion', singular: 'promotion', empty: 'No promotions added yet.',
    emptyForm: { title: '', description: '', discount_type: 'Percentage', discount_value: '', start_date: '', end_date: '', promo_code: '', image_url: '', is_active: true },
    fields: [['title', 'Title', 'Enter promotion title'], ['description', 'Description', 'Describe this promotion'], ['discount_value', 'Discount value', 'e.g. 20']],
  },
  corporate: {
    table: 'corporate', bucket: 'corporate-images', eyebrow: 'Clinic partnerships', heading: 'Corporate', addLabel: 'Add corporate', singular: 'corporate item', empty: 'No corporate information added yet.',
    emptyForm: { title: '', description: '', image_url: '' },
    fields: [['title', 'Title', 'Enter title'], ['description', 'Description', 'Describe this corporate information']],
  },
}

function MedicalPackages() { return <ContentManager config={contentPageConfig.packages} /> }
function Promotions() { return <ContentManager config={contentPageConfig.promotions} /> }

function ContentManager({ config }) {
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(config.emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    async function loadRecords() {
      const { data, error: fetchError } = await supabase.from(config.table).select('*').order('created_at', { ascending: false })
      if (fetchError) setError(fetchError.message)
      else setRecords(data ?? [])
      setLoading(false)
    }
    loadRecords()
  }, [config.table])

  function updateField(event) {
    const { name, type, checked, value } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }
  function openAddModal() { setForm(config.emptyForm); setEditingId(null); setImageFile(null); setError(''); setIsModalOpen(true) }
  function openEditModal(record) { setForm({ ...config.emptyForm, ...record }); setEditingId(record.id); setImageFile(null); setError(''); setIsModalOpen(true) }

  async function saveRecord(event) {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured) { setError('Supabase is not configured. Add your environment variables first.'); return }
    setSaving(true)
    const previousImageUrl = form.image_url
    let imageUrl = form.image_url
    if (imageFile) {
      const { data: uploadData, error: uploadError } = await uploadCloudinaryImage(imageFile, config.bucket)
      if (uploadError) { setError(uploadError.message); setSaving(false); return }
      imageUrl = getSupabaseImageUrl(uploadData.publicUrl, Date.now())
    }
    const payload = { ...form, image_url: imageUrl }
    if (editingId) payload.id = editingId
    if (config.table === 'medical_packages') payload.price = Number(form.price)
    if (config.table === 'promotions') payload.discount_value = Number(form.discount_value)
    const { data, error: saveError } = await supabase.from(config.table).upsert(payload).select().single()
    if (saveError) setError(saveError.message)
    else { if (imageFile && previousImageUrl && previousImageUrl !== imageUrl) await removeSupabaseImage(config.bucket, previousImageUrl); setRecords((current) => editingId ? current.map((item) => item.id === editingId ? data : item) : [data, ...current]); setIsModalOpen(false); await Swal.fire({ icon: 'success', title: `${config.singular[0].toUpperCase()}${config.singular.slice(1)} ${editingId ? 'updated' : 'added'}`, timer: 1400, showConfirmButton: false }) }
    setSaving(false)
  }

  async function deleteRecord(id) {
    const result = await Swal.fire({ icon: 'warning', title: `Delete this ${config.singular}?`, text: `This ${config.singular} will be permanently removed.`, showCancelButton: true, confirmButtonText: 'Delete', confirmButtonColor: '#d46d59' })
    if (!result.isConfirmed) return
    const { error: deleteError } = await supabase.from(config.table).delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else { setRecords((current) => current.filter((item) => item.id !== id)); await Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false }) }
  }

  const isPackage = config.table === 'medical_packages'
  const isCorporate = config.table === 'corporate'
  const detailHeaders = isCorporate ? <th>Description</th> : isPackage ? <><th>Price</th><th>Duration</th></> : <><th>Discount</th><th>Promo period</th></>
  const statusHeader = !isCorporate && <th>Status</th>
  return <section className="information-page"><div className="information-heading"><div><p className="eyebrow">{config.eyebrow}</p><h1>{config.heading}</h1><p className="muted">Manage {config.singular}s shown to your patients.</p></div><button className="primary-button" type="button" onClick={openAddModal} disabled={loading}><span>+</span> {config.addLabel}</button></div>{!isSupabaseConfigured && <p className="setup-message">Add your Supabase keys to `.env.local` to enable cloud saving.</p>}{error && <p className="error-message" role="alert">{error}</p>}<div className="information-table-wrap"><table className="information-table"><thead><tr><th>Image</th><th>Title</th>{detailHeaders}{statusHeader}<th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan={isCorporate ? 4 : 6} className="empty-state">Loading {config.singular}s...</td></tr> : records.length === 0 ? <tr><td colSpan={isCorporate ? 4 : 6} className="empty-state">{config.empty}</td></tr> : records.map((record) => <tr key={record.id}><td>{record.image_url ? <img className="table-content-image" src={record.image_url} alt="" /> : <span className="table-profile-placeholder">—</span>}</td><td><strong>{record.title}</strong>{!isCorporate && <span className="table-subtext">{isPackage ? record.short_description : record.description}</span>}</td>{isCorporate ? <td className="about-cell">{record.description}</td> : isPackage ? <><td>${Number(record.price).toFixed(2)}</td><td>{record.duration}</td></> : <><td>{record.discount_type === 'Percentage' ? `${record.discount_value}%` : `$${record.discount_value}`}</td><td>{record.start_date} - {record.end_date}</td><td><span className={`status-badge ${record.is_active ? 'active' : 'inactive'}`}>{record.is_active ? 'Active' : 'Inactive'}</span></td></>}<td><div className="table-actions"><button type="button" className="edit-button" onClick={() => openEditModal(record)}>Edit</button><button type="button" className="delete-button" onClick={() => deleteRecord(record.id)}>Delete</button></div></td></tr>)}</tbody></table></div>{isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setIsModalOpen(false) }}><div className="information-modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="eyebrow">{config.eyebrow}</p><h2>{editingId ? `Edit ${config.singular}` : config.addLabel}</h2></div><button className="modal-close" type="button" onClick={() => !saving && setIsModalOpen(false)} aria-label="Close modal">×</button></div><form className="modal-form" onSubmit={saveRecord}>{config.fields.map(([name, label, placeholder]) => name === 'description' ? <label key={name}>{label}<textarea name={name} value={form[name]} onChange={updateField} required rows="4" placeholder={placeholder} /></label> : <label key={name}>{label}<input name={name} value={form[name]} onChange={updateField} required type={name.includes('date') ? 'date' : name === 'price' || name === 'discount_value' ? 'number' : 'text'} step={name === 'price' || name === 'discount_value' ? '0.01' : undefined} placeholder={placeholder} /></label>)}{!isPackage && !isCorporate && <><div className="modal-form-grid"><label>Discount type<select name="discount_type" value={form.discount_type} onChange={updateField}><option>Percentage</option><option>Fixed amount</option></select></label><label>Promo code<input name="promo_code" value={form.promo_code} onChange={updateField} placeholder="e.g. HEALTH20" /></label></div><div className="modal-form-grid"><label>Start date<input name="start_date" value={form.start_date} onChange={updateField} required type="date" /></label><label>End date<input name="end_date" value={form.end_date} onChange={updateField} required type="date" /></label></div></>}{isPackage && <label>Included services<textarea name="included_services" value={form.included_services} onChange={updateField} required rows="3" placeholder="e.g. Blood test, ECG, consultation" /></label>}<label>Image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />{imageFile && <span className="file-count">{imageFile.name}</span>}</label>{!isCorporate && <label className="checkbox-label"><input name="is_active" type="checkbox" checked={form.is_active} onChange={updateField} /> Active</label>}{error && <p className="error-message" role="alert">{error}</p>}<div className="modal-actions"><button className="cancel-button" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? `Update ${config.singular}` : config.addLabel}</button></div></form></div></div>}</section>
}

function Blog() {
  const emptyForm = { title: '', short_description: '', content: '', author: '', category: '', image_url: '', published_date: '', status: 'Draft', is_featured: false }
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  void Corporate


function Corporate() {
  const emptyForm = { title: '', description: '', image_url: '' }
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')


  void LegacySocialUrls

function LegacySocialUrls() {
  const emptyForm = { title: '', url: '' }
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    async function loadSocialUrls() {
      const { data, error: fetchError } = await supabase.from('social_urls').select('*').order('created_at', { ascending: false })
      if (fetchError) setError(fetchError.message)
      else setRecords(data ?? [])
      setLoading(false)
    }
    loadSocialUrls()
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
    setForm({ title: record.title ?? '', url: record.url ?? '' })
    setEditingId(record.id)
    setError('')
    setIsModalOpen(true)
  }

  async function saveSocialUrl(event) {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add your environment variables first.')
      return
    }
    setSaving(true)
    const payload = editingId ? { id: editingId, ...form } : form
    const { data, error: saveError } = await supabase.from('social_urls').upsert(payload).select().single()
    if (saveError) setError(saveError.message)
    else {
      setRecords((current) => editingId ? current.map((item) => item.id === editingId ? data : item) : [data, ...current])
      setIsModalOpen(false)
      await Swal.fire({ icon: 'success', title: editingId ? 'Social URL updated' : 'Social URL added', timer: 1400, showConfirmButton: false })
    }
    setSaving(false)
  }

  async function deleteSocialUrl(id) {
    const result = await Swal.fire({ icon: 'warning', title: 'Delete this social URL?', text: 'This social URL will be permanently removed.', showCancelButton: true, confirmButtonText: 'Delete', cancelButtonText: 'Cancel', confirmButtonColor: '#d46d59' })
    if (!result.isConfirmed) return
    const { error: deleteError } = await supabase.from('social_urls').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else {
      setRecords((current) => current.filter((item) => item.id !== id))
      await Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false })
    }
  }

  return <section className="information-page"><div className="information-heading"><div><p className="eyebrow">Online presence</p><h1>Social URLs</h1><p className="muted">Manage social media links shown to your visitors.</p></div><button className="primary-button" type="button" onClick={openAddModal} disabled={loading}><span>+</span> Add social URL</button></div>{!isSupabaseConfigured && <p className="setup-message">Add your Supabase keys to `.env.local` to enable cloud saving.</p>}{error && <p className="error-message" role="alert">{error}</p>}<div className="information-table-wrap"><table className="information-table"><thead><tr><th>Title</th><th>URL</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="3" className="empty-state">Loading social URLs...</td></tr> : records.length === 0 ? <tr><td colSpan="3" className="empty-state">No social URLs added yet.</td></tr> : records.map((record) => <tr key={record.id}><td><strong>{record.title}</strong></td><td><a href={record.url} target="_blank" rel="noreferrer">{record.url}</a></td><td><div className="table-actions"><button type="button" className="edit-button" onClick={() => openEditModal(record)}>Edit</button><button type="button" className="delete-button" onClick={() => deleteSocialUrl(record.id)}>Delete</button></div></td></tr>)}</tbody></table></div>{isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setIsModalOpen(false) }}><div className="information-modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="eyebrow">Online presence</p><h2>{editingId ? 'Edit social URL' : 'Add social URL'}</h2></div><button className="modal-close" type="button" onClick={() => !saving && setIsModalOpen(false)} aria-label="Close modal">×</button></div><form className="modal-form" onSubmit={saveSocialUrl}><label>Title<input name="title" value={form.title} onChange={updateField} required placeholder="e.g. Facebook" /></label><label>URL<input name="url" value={form.url} onChange={updateField} required type="url" placeholder="https://example.com/your-page" /></label>{error && <p className="error-message" role="alert">{error}</p>}<div className="modal-actions"><button className="cancel-button" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update social URL' : 'Add social URL'}</button></div></form></div></div>}</section>
}
  useEffect(() => {
    if (!isSupabaseConfigured) return
    async function loadCorporate() {
      const { data, error: fetchError } = await supabase.from('corporate').select('*').order('created_at', { ascending: false })
      if (fetchError) setError(fetchError.message)
      else setRecords(data ?? [])
      setLoading(false)
    }
    loadCorporate()
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }
  function openAddModal() { setForm(emptyForm); setEditingId(null); setImageFile(null); setError(''); setIsModalOpen(true) }
  function openEditModal(record) { setForm({ title: record.title ?? '', description: record.description ?? '', image_url: record.image_url ?? '' }); setEditingId(record.id); setImageFile(null); setError(''); setIsModalOpen(true) }

  async function saveCorporate(event) {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured) { setError('Supabase is not configured. Add your environment variables first.'); return }
    setSaving(true)
    const previousImageUrl = form.image_url
    let imageUrl = form.image_url
    if (imageFile) {
      const { data: uploadData, error: uploadError } = await uploadCloudinaryImage(imageFile, 'corporate-images')
      if (uploadError) { setError(uploadError.message); setSaving(false); return }
      imageUrl = getSupabaseImageUrl(uploadData.publicUrl, Date.now())
    }
    const payload = editingId ? { id: editingId, title: form.title, description: form.description, image_url: imageUrl } : { title: form.title, description: form.description, image_url: imageUrl }
    const { data, error: saveError } = await supabase.from('corporate').upsert(payload).select().single()
    if (saveError) setError(saveError.message)
    else { if (imageFile && previousImageUrl && previousImageUrl !== imageUrl) await removeSupabaseImage('corporate-images', previousImageUrl); setRecords((current) => editingId ? current.map((item) => item.id === editingId ? data : item) : [data, ...current]); setIsModalOpen(false); await Swal.fire({ icon: 'success', title: editingId ? 'Corporate information updated' : 'Corporate information added', timer: 1400, showConfirmButton: false }) }
    setSaving(false)
  }

  async function deleteCorporate(id) {
    const result = await Swal.fire({ icon: 'warning', title: 'Delete this corporate item?', text: 'This item will be permanently removed.', showCancelButton: true, confirmButtonText: 'Delete', confirmButtonColor: '#d46d59' })
    if (!result.isConfirmed) return
    const { error: deleteError } = await supabase.from('corporate').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else { setRecords((current) => current.filter((item) => item.id !== id)); await Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false }) }
  }

  return <section className="information-page"><div className="information-heading"><div><p className="eyebrow">Clinic partnerships</p><h1>Corporate</h1><p className="muted">Manage corporate information and partnerships shown to your visitors.</p></div><button className="primary-button" type="button" onClick={openAddModal} disabled={loading}><span>+</span> Add corporate</button></div>{!isSupabaseConfigured && <p className="setup-message">Add your Supabase keys to `.env.local` to enable cloud saving.</p>}{error && <p className="error-message" role="alert">{error}</p>}<div className="information-table-wrap"><table className="information-table"><thead><tr><th>Image</th><th>Title</th><th>Description</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="4" className="empty-state">Loading corporate information...</td></tr> : records.length === 0 ? <tr><td colSpan="4" className="empty-state">No corporate information added yet.</td></tr> : records.map((record) => <tr key={record.id}><td>{record.image_url ? <img className="table-content-image" src={record.image_url} alt="" /> : <span className="table-profile-placeholder">—</span>}</td><td><strong>{record.title}</strong></td><td className="about-cell">{record.description}</td><td><div className="table-actions"><button type="button" className="edit-button" onClick={() => openEditModal(record)}>Edit</button><button type="button" className="delete-button" onClick={() => deleteCorporate(record.id)}>Delete</button></div></td></tr>)}</tbody></table></div>{isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setIsModalOpen(false) }}><div className="information-modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="eyebrow">Clinic partnerships</p><h2>{editingId ? 'Edit corporate information' : 'Add corporate information'}</h2></div><button className="modal-close" type="button" onClick={() => !saving && setIsModalOpen(false)} aria-label="Close modal">×</button></div><form className="modal-form" onSubmit={saveCorporate}><label>Title<input name="title" value={form.title} onChange={updateField} required placeholder="Enter title" /></label><label>Description<textarea name="description" value={form.description} onChange={updateField} required rows="6" placeholder="Describe this corporate information" /></label><label>Image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />{imageFile && <span className="file-count">{imageFile.name}</span>}</label>{error && <p className="error-message" role="alert">{error}</p>}<div className="modal-actions"><button className="cancel-button" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update information' : 'Add information'}</button></div></form></div></div>}</section>
}
  useEffect(() => {
    if (!isSupabaseConfigured) return
    async function loadPosts() {
      const { data, error: fetchError } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
      if (fetchError) setError(fetchError.message)
      else setRecords(data ?? [])
      setLoading(false)
    }
    loadPosts()
  }, [])

  function updateField(event) {
    const { name, type, checked, value } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }
  function openAddModal() { setForm(emptyForm); setEditingId(null); setImageFile(null); setError(''); setIsModalOpen(true) }
  function openEditModal(record) { setForm({ ...emptyForm, ...record }); setEditingId(record.id); setImageFile(null); setError(''); setIsModalOpen(true) }

  async function savePost(event) {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured) { setError('Supabase is not configured. Add your environment variables first.'); return }
    setSaving(true)
    const previousImageUrl = form.image_url
    let imageUrl = form.image_url
    if (imageFile) {
      const { data: uploadData, error: uploadError } = await uploadCloudinaryImage(imageFile, 'blog-images')
      if (uploadError) { setError(uploadError.message); setSaving(false); return }
      imageUrl = getSupabaseImageUrl(uploadData.publicUrl, Date.now())
    }
    const payload = { ...form, image_url: imageUrl }
    if (editingId) payload.id = editingId
    const { data, error: saveError } = await supabase.from('blog_posts').upsert(payload).select().single()
    if (saveError) setError(saveError.message)
    else { if (imageFile && previousImageUrl && previousImageUrl !== imageUrl) await removeSupabaseImage('blog-images', previousImageUrl); setRecords((current) => editingId ? current.map((item) => item.id === editingId ? data : item) : [data, ...current]); setIsModalOpen(false); await Swal.fire({ icon: 'success', title: editingId ? 'Post updated' : 'Post added', timer: 1400, showConfirmButton: false }) }
    setSaving(false)
  }

  async function deletePost(id) {
    const result = await Swal.fire({ icon: 'warning', title: 'Delete this post?', text: 'This blog post will be permanently removed.', showCancelButton: true, confirmButtonText: 'Delete', confirmButtonColor: '#d46d59' })
    if (!result.isConfirmed) return
    const { error: deleteError } = await supabase.from('blog_posts').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else { setRecords((current) => current.filter((item) => item.id !== id)); await Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false }) }
  }

  return <section className="information-page"><div className="information-heading"><div><p className="eyebrow">Clinic journal</p><h1>Blog</h1><p className="muted">Manage health articles and updates for your patients.</p></div><button className="primary-button" type="button" onClick={openAddModal} disabled={loading}><span>+</span> Add post</button></div>{!isSupabaseConfigured && <p className="setup-message">Add your Supabase keys to `.env.local` to enable cloud saving.</p>}{error && <p className="error-message" role="alert">{error}</p>}<div className="information-table-wrap"><table className="information-table"><thead><tr><th>Image</th><th>Title</th><th>Author</th><th>Category</th><th>Published</th><th>Status</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="7" className="empty-state">Loading blog posts...</td></tr> : records.length === 0 ? <tr><td colSpan="7" className="empty-state">No blog posts added yet.</td></tr> : records.map((record) => <tr key={record.id}><td>{record.image_url ? <img className="table-content-image" src={record.image_url} alt="" /> : <span className="table-profile-placeholder">—</span>}</td><td><strong>{record.title}</strong>{record.is_featured && <span className="featured-label">Featured</span>}<span className="table-subtext">{record.short_description}</span></td><td>{record.author}</td><td>{record.category}</td><td>{record.published_date || '—'}</td><td><span className={`status-badge ${record.status.toLowerCase()}`}>{record.status}</span></td><td><div className="table-actions"><button type="button" className="edit-button" onClick={() => openEditModal(record)}>Edit</button><button type="button" className="delete-button" onClick={() => deletePost(record.id)}>Delete</button></div></td></tr>)}</tbody></table></div>{isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setIsModalOpen(false) }}><div className="information-modal doctor-modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="eyebrow">Clinic journal</p><h2>{editingId ? 'Edit blog post' : 'Add blog post'}</h2></div><button className="modal-close" type="button" onClick={() => !saving && setIsModalOpen(false)} aria-label="Close modal">×</button></div><form className="modal-form" onSubmit={savePost}><label>Blog title<input name="title" value={form.title} onChange={updateField} required placeholder="Enter blog title" /></label><label>Short description<input name="short_description" value={form.short_description} onChange={updateField} required placeholder="Brief article summary" /></label><label>Full content<textarea name="content" value={form.content} onChange={updateField} required rows="6" placeholder="Write the complete article" /></label><div className="modal-form-grid"><label>Author name<input name="author" value={form.author} onChange={updateField} required placeholder="e.g. Dr. James Dean" /></label><label>Category<input name="category" value={form.category} onChange={updateField} required placeholder="e.g. Health Tips" /></label></div><div className="modal-form-grid"><label>Published date<input name="published_date" value={form.published_date} onChange={updateField} type="date" /></label><label>Status<select name="status" value={form.status} onChange={updateField}><option>Draft</option><option>Published</option></select></label></div><label>Featured image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />{imageFile && <span className="file-count">{imageFile.name}</span>}</label><label className="checkbox-label"><input name="is_featured" type="checkbox" checked={form.is_featured} onChange={updateField} /> Featured post</label>{error && <p className="error-message" role="alert">{error}</p>}<div className="modal-actions"><button className="cancel-button" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update post' : 'Add post'}</button></div></form></div></div>}</section>
}

export default App
