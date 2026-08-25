/* Role-adaptive dashboard.
 *  STUDENT     → own status tracking (read-only)
 *  FACULTY     → upload/manage documents for subjects they teach
 *  ADMIN (HOD) → invite/remove faculties, manage users, directory,
 *                classes & subjects, all documents
 *  SUPER_ADMIN → everything above + site content editor + admin invites */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  apiRequest,
  getStoredUser,
  isLoggedIn,
  logout,
  ROLE_LABELS,
  fmtBytes,
  fmtDate,
} from '../lib/api.js'
import Navbar from '../components/Navbar.jsx'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = getStoredUser()

  const [ready, setReady] = useState(false)
  const [flashMsg, setFlashMsg] = useState(null) // { text, ok }
  const [mySubjects, setMySubjects] = useState([])
  const [facultyUsers, setFacultyUsers] = useState([])

  useEffect(() => {
    if (!isLoggedIn() || !user) {
      navigate('/login')
      return
    }
    apiRequest('/api/auth/me')
      .then(() => setReady(true))
      .catch(() => navigate('/login'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function flash(text, ok = true) {
    setFlashMsg({ text, ok })
    clearTimeout(flash._t)
    flash._t = setTimeout(() => setFlashMsg(null), 4000)
  }

  async function onErr(promise) {
    try {
      return await promise
    } catch (err) {
      flash(err.message, false)
      throw err
    }
  }

  if (!ready || !user) return null

  const isStaff = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

  async function deleteDocument(id, refresh) {
    if (!confirm('Delete this document?')) return
    try {
      await onErr(apiRequest(`/api/documents/${id}`, { method: 'DELETE' }))
      flash('Document deleted.')
      await refresh()
    } catch { /* handled */ }
  }

  /* ---------------- STUDENT ---------------- */
  function StudentStatuses() {
    const [statuses, setStatuses] = useState(null)
    useEffect(() => {
      onErr(apiRequest('/api/statuses')).then((d) => setStatuses(d.statuses)).catch(() => {})
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
      <section className="panel">
        <h2>My statuses</h2>
        {!statuses ? (
          <p className="empty">Loading…</p>
        ) : statuses.length === 0 ? (
          <p className="empty">No status entries yet. Your department will add items here.</p>
        ) : (
          <table className="data">
            <thead><tr><th>Item</th><th>Status</th><th>Remark</th><th>Last updated</th></tr></thead>
            <tbody>
              {statuses.map((s) => (
                <tr key={s.id}>
                  <td>{s.title}</td>
                  <td><span className={`pill pill-${s.status}`}>{s.status.replace('_', ' ')}</span></td>
                  <td>{s.remark || '—'}</td>
                  <td className="muted">{fmtDate(s.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    )
  }

  /* ---------------- FACULTY ---------------- */
  function FacultyWorkspace() {
    const [docs, setDocs] = useState(null)
    const [uploadError, setUploadError] = useState('')
    const [title, setTitle] = useState('')
    const [subjectId, setSubjectId] = useState('')
    const [isPublic, setIsPublic] = useState(true)
    const [file, setFile] = useState(null)

    async function loadSubjects() {
      const { classes } = await apiRequest('/api/classes')
      const mine = classes.flatMap((c) =>
        c.subjects.filter((s) => s.teacher && s.teacher.id === user.id).map((s) => ({ ...s, className: c.name }))
      )
      setMySubjects(mine)
      if (mine.length && !mine.some((s) => String(s.id) === subjectId)) setSubjectId(String(mine[0].id))
    }

    async function refreshDocs() {
      const d = await onErr(apiRequest('/api/documents?mine=1'))
      setDocs(d.documents)
    }

    useEffect(() => {
      loadSubjects().catch(() => {})
      refreshDocs().catch(() => {})
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function handleUpload(e) {
      e.preventDefault()
      setUploadError('')
      if (!mySubjects.length) return flash('You have no assigned subjects.', false)
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('subjectId', subjectId)
      fd.append('isPublic', String(isPublic))
      fd.append('file', file)
      try {
        await onErr(apiRequest('/api/documents', { method: 'POST', formData: fd }))
        flash('Document uploaded.')
        setTitle('')
        setFile(null)
        e.target.reset()
        await refreshDocs()
      } catch (err) {
        setUploadError(err.message)
      }
    }

    return (
      <div className="grid-2">
        <section className="panel">
          <h2>Upload a document</h2>
          {uploadError && <div className="alert error">{uploadError}</div>}
          <form onSubmit={handleUpload} className="inline">
            <div className="field">
              <label>Your subject</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
                {mySubjects.length === 0 && <option value="">No subjects assigned — ask your HOD</option>}
                {mySubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.code} — {s.title} ({s.className})</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Document title</label>
              <input type="text" required placeholder="Unit-2 notes" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="field">
              <label>File (PDF, docs, images… max 25 MB)</label>
              <input type="file" required onChange={(e) => setFile(e.target.files[0])} />
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '.85rem', color: '#aaa' }}>
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              Visible to public visitors
            </label>
            <button type="submit" className="btn">Upload</button>
          </form>
        </section>

        <section className="panel">
          <h2>My documents</h2>
          {!docs ? (
            <p className="empty">Loading…</p>
          ) : docs.length === 0 ? (
            <p className="empty">You have not uploaded any documents yet.</p>
          ) : (
            <table className="data">
              <thead><tr><th>Title</th><th>Subject</th><th>Visibility</th><th>Size</th><th></th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>{d.title}<br /><span className="muted">{d.fileName}</span></td>
                    <td><code style={{ fontSize: '.78rem', color: '#9ec5ee' }}>{d.subject.code}</code> {d.subject.className || ''}</td>
                    <td><span className={`pill ${d.isPublic ? 'pill-public' : 'pill-private'}`}>{d.isPublic ? 'Public' : 'Private'}</span></td>
                    <td className="muted">{fmtBytes(d.sizeBytes)}</td>
                    <td className="actions">
                      <a className="btn btn-ghost btn-sm" href={d.downloadUrl} target="_blank" rel="noopener">View</a>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteDocument(d.id, refreshDocs)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    )
  }

  /* ---------------- STAFF ---------------- */
  function InvitationsPanel() {
    const [invites, setInvites] = useState([])
    const [form, setForm] = useState({ name: '', email: '', role: 'FACULTY' })
    const [resultUrl, setResultUrl] = useState('')
    const [error, setError] = useState('')

    async function refreshInvites() {
      const d = await onErr(apiRequest('/api/users/invites'))
      setInvites(d.invitations)
    }
    useEffect(() => { refreshInvites().catch(() => {}) /* eslint-disable-line */ }, [])

    async function handleInvite(e) {
      e.preventDefault()
      setError('')
      setResultUrl('')
      try {
        const data = await onErr(apiRequest('/api/users/invite', { method: 'POST', body: form }))
        setResultUrl(new URL(data.inviteUrl, window.location.href).href)
        flash(`Invitation created for ${data.invitation.email}.`)
        setForm({ name: '', email: '', role: 'FACULTY' })
        await refreshInvites()
      } catch { /* handled */ }
    }

    async function revoke(id) {
      if (!confirm('Revoke this invitation?')) return
      try {
        await onErr(apiRequest(`/api/users/invites/${id}`, { method: 'DELETE' }))
        flash('Invitation revoked.')
        await refreshInvites()
      } catch { /* handled */ }
    }

    return (
      <section className="panel">
        <h2>Add / remove faculties (email invitation)</h2>
        {error && <div className="alert error">{error}</div>}
        {resultUrl && (
          <div className="alert ok">
            Share this link (also emailed/logged):<br />
            <input type="text" readOnly value={resultUrl} onFocus={(e) => e.target.select()} style={{ marginTop: 6 }} />
          </div>
        )}
        <form onSubmit={handleInvite} className="inline cols-4">
          <div className="field"><label>Name</label>
            <input type="text" required placeholder="Dr. Jane Doe" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Email</label>
            <input type="email" required placeholder="jane@christ.example.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="field"><label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="FACULTY">Faculty</option>
              {user.role === 'SUPER_ADMIN' && <option value="ADMIN">Admin (HOD)</option>}
            </select></div>
          <button type="submit" className="btn">Send invite</button>
        </form>

        <h2 style={{ marginTop: 20, fontSize: '.9rem' }}>Pending invitations</h2>
        {!invites.length ? (
          <p className="empty">No pending invitations.</p>
        ) : (
          <table className="data">
            <thead><tr><th>Email</th><th>Role</th><th>Expires</th><th></th></tr></thead>
            <tbody>
              {invites.map((i) => (
                <tr key={i.id}>
                  <td>{i.email}<br /><span className="muted">{i.name}</span></td>
                  <td>{i.role}</td>
                  <td className="muted">{fmtDate(i.expiresAt)}</td>
                  <td className="actions"><button className="btn btn-danger btn-sm" onClick={() => revoke(i.id)}>Revoke</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    )
  }

  function UsersPanel() {
    const [users, setUsers] = useState(null)

    async function refreshUsers() {
      const d = await onErr(apiRequest('/api/users'))
      setUsers(d.users)
      setFacultyUsers(d.users.filter((u) => u.role === 'FACULTY' && u.isActive))
    }
    useEffect(() => { refreshUsers().catch(() => {}) /* eslint-disable-line */ }, [])

    async function toggle(u) {
      try {
        const r = await onErr(apiRequest(`/api/users/${u.id}`, { method: 'PATCH', body: { isActive: !u.isActive } }))
        flash(r.note || 'User updated.')
        await refreshUsers()
      } catch { /* handled */ }
    }

    async function remove(u) {
      if (!confirm('Remove this account? If they have dependent records it will be deactivated instead of deleted.')) return
      try {
        const r = await onErr(apiRequest(`/api/users/${u.id}`, { method: 'DELETE' }))
        flash(r.message)
        await refreshUsers()
      } catch { /* handled */ }
    }

    if (!users) return (
      <section className="panel"><h2>User accounts</h2><p className="empty">Loading…</p></section>
    )
    return (
      <section className="panel">
        <h2>User accounts</h2>
        <table className="data">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>State</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={!u.isActive ? { opacity: 0.55 } : undefined}>
                <td>{u.name}{u.id === user.id && ' (you)'}</td>
                <td className="muted">{u.email}</td>
                <td>{ROLE_LABELS[u.role] || u.role}</td>
                <td>{u.isActive ? <span className="pill pill-APPROVED">Active</span> : <span className="pill pill-REJECTED">Deactivated</span>}</td>
                <td className="actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => toggle(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                  {u.id !== user.id && <button className="btn btn-danger btn-sm" onClick={() => remove(u)}>Remove</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    )
  }

  function DirectoryPanel() {
    const [faculties, setFaculties] = useState(null)
    const [form, setForm] = useState({ name: '', specialization: '', image: '' })

    async function refreshDirectory() {
      const d = await onErr(apiRequest('/api/faculties'))
      setFaculties(d.faculties)
    }
    useEffect(() => { refreshDirectory().catch(() => {}) /* eslint-disable-line */ }, [])

    async function addEntry(e) {
      e.preventDefault()
      try {
        await onErr(apiRequest('/api/faculties', { method: 'POST', body: form }))
        flash('Directory entry added.')
        setForm({ name: '', specialization: '', image: '' })
        await refreshDirectory()
      } catch { /* handled */ }
    }

    async function editEntry(f) {
      const name = prompt('Faculty name:', f.name)
      if (name === null) return
      const specialization = prompt('Specialization:', f.specialization || '')
      try {
        await onErr(apiRequest(`/api/faculties/${f.id}`, { method: 'PUT', body: { name, specialization } }))
        flash('Entry updated.')
        await refreshDirectory()
      } catch { /* handled */ }
    }

    async function removeEntry(id) {
      if (!confirm('Remove this faculty from the public directory?')) return
      try {
        await onErr(apiRequest(`/api/faculties/${id}`, { method: 'DELETE' }))
        flash('Directory entry removed.')
        await refreshDirectory()
      } catch { /* handled */ }
    }

    if (!faculties) return (
      <section className="panel"><h2>Faculty directory (public page)</h2><p className="empty">Loading…</p></section>
    )
    return (
      <section className="panel">
        <h2>Faculty directory (public page)</h2>
        <form onSubmit={addEntry} className="inline cols-4">
          <div className="field"><label>Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Specialization</label>
            <input type="text" placeholder="Data Science" value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></div>
          <div className="field"><label>Image URL</label>
            <input type="text" placeholder="assets/faculty/x.jpg" value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
          <button type="submit" className="btn">Add entry</button>
        </form>
        <table className="data">
          <thead><tr><th>Name</th><th>Specialization</th><th>Account</th><th></th></tr></thead>
          <tbody>
            {faculties.map((f) => (
              <tr key={f.id}>
                <td>{f.image && <img className="thumb" src={f.image} alt="" />}{f.name}</td>
                <td>{f.specialization || '—'}</td>
                <td>{f.hasAccount ? <span className="pill pill-APPROVED">Linked</span> : <span className="muted">—</span>}</td>
                <td className="actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => editEntry(f)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => removeEntry(f.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    )
  }

  function AcademicsPanel() {
    const [classes, setClasses] = useState(null)

    async function refreshClasses() {
      const d = await onErr(apiRequest('/api/classes'))
      setClasses(d.classes)
    }
    useEffect(() => { refreshClasses().catch(() => {}) /* eslint-disable-line */ }, [])

    async function addClass(e) {
      e.preventDefault()
      const name = new FormData(e.target).get('name')
      try {
        await onErr(apiRequest('/api/classes', { method: 'POST', body: { name } }))
        flash('Class added.')
        e.target.reset()
        await refreshClasses()
      } catch { /* handled */ }
    }

    async function deleteClass(id) {
      if (!confirm('Delete this class AND all its subjects/documents?')) return
      try {
        await onErr(apiRequest(`/api/classes/${id}`, { method: 'DELETE' }))
        flash('Class removed.')
        await refreshClasses()
      } catch { /* handled */ }
    }

    async function addSubject(e, classId) {
      e.preventDefault()
      const fd = new FormData(e.target)
      try {
        await onErr(apiRequest('/api/classes/subjects', {
          method: 'POST',
          body: { title: fd.get('title'), code: fd.get('code'), classSectionId: Number(classId) },
        }))
        flash('Subject added.')
        await refreshClasses()
      } catch { /* handled */ }
    }

    async function assignTeacher(subjectId, teacherId) {
      try {
        await onErr(apiRequest(`/api/classes/subjects/${subjectId}`, {
          method: 'PATCH',
          body: { teacherId: teacherId ? Number(teacherId) : null },
        }))
        flash(teacherId ? 'Teacher assigned.' : 'Teacher unassigned.')
        await refreshClasses()
      } catch { /* handled */ }
    }

    async function deleteSubject(id) {
      if (!confirm('Delete this subject and its documents?')) return
      try {
        await onErr(apiRequest(`/api/classes/subjects/${id}`, { method: 'DELETE' }))
        flash('Subject removed.')
        await refreshClasses()
      } catch { /* handled */ }
    }

    if (!classes) return (
      <section className="panel"><h2>Classes &amp; subjects</h2><p className="empty">Loading…</p></section>
    )
    return (
      <section className="panel">
        <h2>Classes &amp; subjects</h2>
        <form onSubmit={addClass} className="inline cols">
          <div className="field"><label>New class name</label><input type="text" name="name" placeholder="VII Semester - Section B" /></div>
          <button type="submit" className="btn">Add class</button>
        </form>
        {!classes.length && <p className="empty">No classes yet.</p>}
        {classes.map((c) => (
          <div className="class-block" key={c.id}>
            <h3>{c.name}
              <button className="btn btn-danger btn-sm" onClick={() => deleteClass(c.id)}>Delete class</button>
            </h3>
            {c.subjects.length === 0 && <p className="empty">No subjects in this class.</p>}
            {c.subjects.map((s) => (
              <div className="subject-row" key={s.id}>
                <code>{s.code}</code><strong style={{ fontSize: '.88rem' }}>{s.title}</strong>
                <select value={s.teacher?.id ?? ''} onChange={(e) => assignTeacher(s.id, e.target.value)}>
                  <option value="">— unassigned —</option>
                  {facultyUsers.map((fu) => (
                    <option key={fu.id} value={fu.id}>{fu.name}</option>
                  ))}
                </select>
                <span className="muted">{s.documentCount} doc{s.documentCount === 1 ? '' : 's'}</span>
                <button className="btn btn-danger btn-sm" onClick={() => deleteSubject(s.id)}>✕</button>
              </div>
            ))}
            <form className="inline cols" style={{ marginTop: 12 }}
              onSubmit={(e) => addSubject(e, c.id)}>
              <div className="field"><label>Subject title</label><input type="text" name="title" required placeholder="Operating Systems" /></div>
              <div className="field"><label>Code</label><input type="text" name="code" required placeholder="OS401" /></div>
              <button type="submit" className="btn btn-sm" style={{ alignSelf: 'end', marginBottom: 2 }}>Add subject</button>
            </form>
          </div>
        ))}
      </section>
    )
  }

  function AllDocsPanel() {
    const [documents, setDocuments] = useState(null)

    async function refreshAllDocs() {
      const d = await onErr(apiRequest('/api/documents'))
      setDocuments(d.documents)
    }
    useEffect(() => { refreshAllDocs().catch(() => {}) /* eslint-disable-line */ }, [])

    if (!documents) return (
      <section className="panel"><h2>All documents</h2><p className="empty">Loading…</p></section>
    )
    return (
      <section className="panel">
        <h2>All documents</h2>
        {!documents.length ? (
          <p className="empty">No documents uploaded yet.</p>
        ) : (
          <table className="data">
            <thead><tr><th>Title</th><th>Subject</th><th>Uploaded by</th><th>Visibility</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td>{d.title}<br /><span className="muted">{d.fileName} · {fmtBytes(d.sizeBytes)}</span></td>
                  <td><code style={{ fontSize: '.78rem', color: '#9ec5ee' }}>{d.subject.code}</code> {d.subject.className || ''}</td>
                  <td>{d.uploadedBy.name}</td>
                  <td><span className={`pill ${d.isPublic ? 'pill-public' : 'pill-private'}`}>{d.isPublic ? 'Public' : 'Private'}</span></td>
                  <td className="muted">{fmtDate(d.createdAt)}</td>
                  <td className="actions">
                    <a className="btn btn-ghost btn-sm" href={d.downloadUrl} target="_blank" rel="noopener">View</a>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteDocument(d.id, refreshAllDocs)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    )
  }

  /* ------------- SUPER ADMIN ------------- */
  function ContentEditor() {
    const [content, setContent] = useState(null)
    const [drafts, setDrafts] = useState({})
    const [newKey, setNewKey] = useState('')

    async function refreshContent() {
      const d = await onErr(apiRequest('/api/content'))
      setContent(d.content)
      setDrafts(Object.fromEntries(Object.entries(d.content).map(([k, v]) => [k, JSON.stringify(v, null, 2)])))
    }
    useEffect(() => { refreshContent().catch(() => {}) /* eslint-disable-line */ }, [])

    async function saveKey(key) {
      let value
      try {
        value = JSON.parse(drafts[key])
      } catch {
        value = drafts[key]
      }
      try {
        await onErr(apiRequest(`/api/content/${encodeURIComponent(key)}`, { method: 'PUT', body: { value } }))
        flash(`Saved "${key}".`)
      } catch { /* handled */ }
    }

    async function deleteKey(key) {
      if (!confirm(`Delete content key "${key}"?`)) return
      try {
        await onErr(apiRequest(`/api/content/${encodeURIComponent(key)}`, { method: 'DELETE' }))
        flash('Key deleted.')
        await refreshContent()
      } catch { /* handled */ }
    }

    async function addKey(e) {
      e.preventDefault()
      if (!newKey.trim()) return
      try {
        await onErr(apiRequest(`/api/content/${encodeURIComponent(newKey.trim())}`, { method: 'PUT', body: { value: '' } }))
        flash(`Key "${newKey}" created.`)
        setNewKey('')
        await refreshContent()
      } catch { /* handled */ }
    }

    if (!content) return (
      <section className="panel"><h2>Site content (controls text/data shown on public pages)</h2><p className="empty">Loading…</p></section>
    )
    const keys = Object.keys(content)
    return (
      <section className="panel">
        <h2>Site content (controls text/data shown on public pages)</h2>
        <form onSubmit={addKey} className="inline cols">
          <div className="field"><label>New key</label>
            <input type="text" placeholder="home.hero.title" value={newKey} onChange={(e) => setNewKey(e.target.value)} /></div>
          <button type="submit" className="btn">Add key</button>
        </form>
        {!keys.length && <p className="empty">No content keys defined.</p>}
        {keys.map((k) => (
          <div className="content-key" key={k}>
            <header>
              <code className="keyname">{k}</code>
              <span>
                <button className="btn btn-sm" onClick={() => saveKey(k)}>Save</button>{' '}
                <button className="btn btn-danger btn-sm" onClick={() => deleteKey(k)}>Delete</button>
              </span>
            </header>
            <textarea value={drafts[k]} onChange={(e) => setDrafts({ ...drafts, [k]: e.target.value })} />
          </div>
        ))}
      </section>
    )
  }

  return (
    <div className="dash-shell">
      <Navbar />
      <main className="wrap">
        <h1 className="page-title">{ROLE_LABELS[user.role]} workspace</h1>
        <p className="page-sub">
          {{
            SUPER_ADMIN: 'Full control over site data, users and content.',
            ADMIN: 'Manage faculties via email invitations, classes, subjects and the directory.',
            FACULTY: 'Upload and manage documents for your subjects only.',
            STUDENT: 'Track your application and project statuses.',
          }[user.role]}
        </p>
        {flashMsg && <div className={`alert ${flashMsg.ok ? 'ok' : 'error'}`}>{flashMsg.text}</div>}

        {user.role === 'STUDENT' && <StudentStatuses />}
        {user.role === 'FACULTY' && <FacultyWorkspace />}
        {isStaff && <InvitationsPanel />}
        {isStaff && <UsersPanel />}
        {isStaff && (
          <div className="grid-2">
            <DirectoryPanel />
            <AcademicsPanel />
          </div>
        )}
        {isStaff && <AllDocsPanel />}
        {user.role === 'SUPER_ADMIN' && <ContentEditor />}
      </main>
    </div>
  )
}
