import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './FacultyDetail.css'

export default function FacultyDetail() {
  const [searchParams] = useSearchParams()
  const id = parseInt(searchParams.get('id'))
  const [faculty, setFaculty] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // API (database) first, bundled JSON as offline fallback
    async function load() {
      try {
        let data = null
        try {
          const res = await fetch('/api/faculties', { cache: 'no-store' })
          if (res.ok) {
            const payload = await res.json()
            if (Array.isArray(payload?.faculties) && payload.faculties.length) data = payload.faculties
          }
        } catch { /* fall through */ }
        if (!data) {
          const res = await fetch('/faculty.json')
          data = await res.json()
        }
        if (Array.isArray(data)) {
          const found = data.find(f => f.id === id)
          setFaculty(found || null)
        }
      } catch (err) {
        console.error('Error loading faculty data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  return (
    <div className="fd-page">
      <Navbar />

      <section className="fd-hero-section">
        <h1>Faculty Details</h1>
      </section>

      <div className="fd-faculty-wrapper">
        {loading ? (
          <div className="fd-faculty-details">
            <p>Loading faculty details…</p>
          </div>
        ) : !faculty ? (
          <div className="fd-faculty-details">
            <p>Faculty not found.</p>
          </div>
        ) : (
          <div className="fd-faculty-details">
            <div className="fd-faculty-left">
              <img src={`/${faculty.image}`} alt={faculty.name} />
              <h2>{faculty.name}</h2>
              <p><strong>Department:</strong> {faculty.department}</p>
              <p><strong>Specialization:</strong> {faculty.specialization}</p>
            </div>
            <div className="fd-faculty-right">
              <h2>{faculty.name}</h2>
              <p><strong>Specialization:</strong> {faculty.specialization}</p>
              <p><strong>Department:</strong> {faculty.department}</p>
              <p><strong>Campus:</strong> Bangalore Kengeri Campus</p>
              <p><strong>Qualification:</strong> ME, PhD</p>
              <div className="fd-btns">
                <a href="https://www.researchgate.net" target="_blank" rel="noopener noreferrer">Research Gate</a>
                <a href="https://scholar.google.com" target="_blank" rel="noopener noreferrer">Google Scholar</a>
                <a href="https://orcid.org" target="_blank" rel="noopener noreferrer">ORCID</a>
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <Link className="fd-back-btn" to="/#faculty">← Back to Faculty List</Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
