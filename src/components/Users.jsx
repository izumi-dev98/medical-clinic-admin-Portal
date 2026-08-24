import { useEffect, useState } from 'react'

const emptyForm = { id: '', full_name: '', username: '', password: '', active: true }

function Users({ currentUser }) {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadUsers() {
    const response = await fetch('/api/admin-users')
    const result = await response.json()
    if (!response.ok) setError(result.error || 'Could not load users.')
    else setUsers(result.users)
    setLoading(false)
  }
  useEffect(() => {
    fetch('/api/admin-users').then((response) => response.json()).then((result) => {
      if (!result.users) setError(result.error || 'Could not load users.')
      else setUsers(result.users)
      setLoading(false)
    }).catch(() => { setError('Could not load users.'); setLoading(false) })
  }, [])
  function updateField(event) { const { name, type, checked, value } = event.target; setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value })); setError('') }
  function editUser(user) { setForm({ id: user.id, full_name: user.full_name, username: user.username, password: '', active: user.active }); setEditing(true) }
  function resetForm() { setForm(emptyForm); setEditing(false) }
  async function saveUser(event) {
    event.preventDefault(); setSaving(true); setError('')
    const body = new FormData(); Object.entries(form).forEach(([key, value]) => { if (value !== '') body.append(key, String(value)) })
    const response = await fetch('/api/admin-users', { method: editing ? 'PATCH' : 'POST', body })
    const result = response.status === 204 ? {} : await response.json()
    if (!response.ok) setError(result.error || 'Could not save user.')
    else { resetForm(); await loadUsers() }
    setSaving(false)
  }
  async function deleteUser(id) {
    if (!window.confirm('Delete this user?')) return
    const body = new FormData(); body.append('id', String(id))
    const response = await fetch('/api/admin-users', { method: 'DELETE', body })
    const result = response.status === 204 ? {} : await response.json()
    if (!response.ok) setError(result.error || 'Could not delete user.')
    else await loadUsers()
  }

  return <section className="information-page"><div className="information-heading"><div><p className="eyebrow">Access control</p><h1>Users</h1><p className="muted">Manage administrators who can access this workspace.</p></div></div>{error && <p className="error-message" role="alert">{error}</p>}<div className="user-layout"><form className="user-form" onSubmit={saveUser}><h2>{editing ? 'Edit user' : 'Add user'}</h2><label>Full name<input name="full_name" value={form.full_name} onChange={updateField} required /></label><label>Username<input name="username" value={form.username} onChange={updateField} required minLength="3" /></label><label>Password<input name="password" type="password" value={form.password} onChange={updateField} required={!editing} minLength="8" placeholder={editing ? 'Leave blank to keep current password' : 'At least 8 characters'} /></label><label className="checkbox-label"><input name="active" type="checkbox" checked={form.active} onChange={updateField} /> Active</label><div className="modal-actions"><button className="cancel-button" type="button" onClick={resetForm}>Clear</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update user' : 'Add user'}</button></div></form><div className="information-table-wrap"><table className="information-table"><thead><tr><th>Full name</th><th>Username</th><th>Status</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="4" className="empty-state">Loading users...</td></tr> : users.map((user) => <tr key={user.id}><td><strong>{user.full_name}</strong></td><td>{user.username}</td><td><span className={`status-badge ${user.active ? 'active' : 'inactive'}`}>{user.active ? 'Active' : 'Inactive'}</span></td><td><div className="table-actions"><button className="edit-button" type="button" onClick={() => editUser(user)}>Edit</button>{String(user.id) !== String(currentUser.id) && <button className="delete-button" type="button" onClick={() => deleteUser(user.id)}>Delete</button>}</div></td></tr>)}</tbody></table></div></div></section>
}

export default Users
