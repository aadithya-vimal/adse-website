import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './ServiceLearning.css'

const NEWSLETTERS = [
  {
    title: "Kusuri Mane",
    subtitle: "Bengaluru",
    description: "Kusuri Mane is a marketplace for handmade, homemade, fresh-made, local-made, and also rural-made products.",
    image: "/assets/service1.jpg"
  },
  {
    title: "Janapada Loka",
    subtitle: "Ramanagara",
    description: "This has become quite popular among tourists as it offers an excellent opportunity to observe the myriad folk art of Karnataka and as well as internalize the Heritage and Culture of the state.",
    image: "/assets/service2.jpg"
  },
  {
    title: "Jungle Lodges and Resorts",
    subtitle: "Bengaluru",
    description: "It boasts of numerous sights of natural beauty along with an impressive amount of flora and fauna. Charming grasslands, dense forests, and glistening rivers are a common sight in the state.",
    image: "/assets/service3.jpg"
  },
  {
    title: "Ride for Cause",
    subtitle: "Bengaluru",
    description: "It is a non-profit organization in India dedicated to helping underprivileged children reach their full potential—physically, mentally, and emotionally.",
    image: "/assets/service4.jpg"
  },
  {
    title: "Uthishta",
    subtitle: "Bengaluru",
    description: "Uthishta is a committed non-profit organization that works towards uplifting and empowering underserved communities through transformative initiatives.",
    image: "/assets/service5.png"
  },
  {
    title: "Saahas Zero Waste",
    subtitle: "Bengaluru",
    description: "Saahas Waste Management Pvt Ltd, a socio-environmental enterprise also known as Saahas Zero Waste, provides end-to-end waste management services.",
    image: "/assets/service6.jpg"
  },
  {
    title: "Grama Shilpi",
    subtitle: "Hubballi",
    description: "Skill upgradation to existing artisans and training to new generation artisans. Diversifying artisan products to meet eco-friendly demand.",
    image: "/assets/service7.jpg"
  }
]

export default function ServiceLearning() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 16

  const filteredList = NEWSLETTERS.filter(nl =>
    nl.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredList.length / itemsPerPage)
  const start = (currentPage - 1) * itemsPerPage
  const paginatedList = filteredList.slice(start, start + itemsPerPage)

  return (
    <div className="sl-page">
      <Navbar />

      {/* Hero Section */}
      <section className="sl-hero-section">
        <div className="sl-hero-inner">
          <div className="sl-hero-content">
            <div className="sl-hero-text">
              <h1>DEPARTMENT OF AI ML &amp; DS</h1>
            </div>
          </div>
          <div className="sl-hero-spline-wrapper">
            <div className="sl-hero-spline">
              <iframe
                src="https://my.spline.design/nexbotrobotcharacterconcept-AvOzoPLnXD7ff93O50ATgDlu/"
                frameBorder="0"
                className="sl-spline-iframe"
                title="Nexbot Robot Character Concept"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="sl-filter-section">
        <div className="sl-search-box">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/5e358c269d9140e1be810ef6482a3f72/2cef4ee11033eecb4a19ef2637573b4246bf4c9b"
            alt="Search icon"
          />
          <input
            type="text"
            placeholder="Search projects…"
            aria-label="Search projects"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
      </section>

      {/* About Section */}
      <section className="sl-section">
        <h2>About Service Learning</h2>

        <div className="sl-row">
          <div className="sl-text">
            <p>
              Students apply classroom knowledge to solve practical problems in the community, such as developing
              apps, building websites, or automating processes for nonprofits.
            </p>
          </div>
          <div className="sl-image">
            <img src="/assets/servicebanner.jpg" alt="Service Learning 1" />
          </div>
        </div>

        <div className="sl-row reverse">
          <div className="sl-text">
            <p>
              Working on service projects encourages teamwork, communication, and creative problem-solving in real-world,
              multidisciplinary contexts.
            </p>
          </div>
          <div className="sl-image">
            <img src="/assets/servicebanner1.jpg" alt="Service Learning 2" />
          </div>
        </div>

        <div className="sl-row">
          <div className="sl-text">
            <p>
              Students gain awareness of societal challenges while developing ethical, civic-minded perspectives and
              professional skills valued in their careers.
            </p>
          </div>
          <div className="sl-image">
            <img src="/assets/servicebanner2.jpg" alt="Service Learning 3" />
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <main className="sl-container">
        <h1 className="sl-page-title">Our Service Learning Partners</h1>

        <section className="sl-newsletter-wrapper">
          <div className="sl-newsletter-grid">
            {paginatedList.map((nl, idx) => (
              <article className="sl-newsletter-card" key={idx}>
                <div className="sl-card-image">
                  <img src={nl.image} alt={nl.title} />
                </div>
                <div className="sl-card-body">
                  <h3 className="sl-card-title">{nl.title}</h3>
                  {nl.subtitle && <h4 className="sl-card-subtitle">{nl.subtitle}</h4>}
                  <p className="sl-card-desc">{nl.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {totalPages > 1 && (
          <div className="sl-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={currentPage === page ? 'active' : ''}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
