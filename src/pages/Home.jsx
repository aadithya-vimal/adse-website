import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Home.css'

export default function Home() {
  // ── About popup ──
  const [aboutOpen, setAboutOpen] = useState(false)
  const [hodOpen, setHodOpen] = useState(false)

  // ── Faculty ──
  const [facultyData, setFacultyData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [selectedSpec, setSelectedSpec] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 12
  const searchTimer = useRef(null)

  useEffect(() => {
    fetch('/faculty.json', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        setFacultyData(data)
        setFilteredData(data)
        const specs = [...new Set(data.map(f => (f.specialization || '').trim()))].filter(Boolean).sort((a, b) => a.localeCompare(b))
        setSpecializations(specs)
      })
      .catch(err => console.error('Failed to load faculty data', err))
  }, [])

  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      const q = searchQuery.toLowerCase()
      const filtered = facultyData.filter(f => {
        const matchesName = (f.name || '').toLowerCase().includes(q)
        const matchesSpec = selectedSpec === 'All' || (f.specialization || '') === selectedSpec
        return matchesName && matchesSpec
      })
      setFilteredData(filtered)
      setCurrentPage(1)
    }, 120)
  }, [searchQuery, selectedSpec, facultyData])

  const totalPages = Math.ceil(filteredData.length / perPage)
  const pageItems = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage)

  // Close popup on outside click
  useEffect(() => {
    function handleClick(e) {
      if (e.target.classList.contains('popup')) {
        setAboutOpen(false)
        setHodOpen(false)
      }
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-text">
              <h1>Empowering Learning through AIML and Data Science</h1>
              <p>
                Our AIML and Data Science departments offer cutting-edge programs designed to equip students
                with the skills needed for the future. Experience hands-on learning, innovative projects, and a
                supportive community that fosters growth and success.
              </p>
            </div>
            <div className="hero-buttons">
              <button className="btn btn-filled">Explore</button>
              <button className="btn btn-outline">Learn More</button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="mission-vision-section">
        <div className="mission-vision-container">
          <div className="mission-vision-content">
            <div className="mission-text">
              <h2>
                EMPOWERING THE FUTURE<br />
                OF AI AND DATA SCIENCE<br />
                THROUGH INNOVATION<br />
                AND COLLABORATION
              </h2>
              <p>
                Our mission is to cultivate a dynamic learning environment that fosters innovation in AI and
                Data Science. We envision a future where our students lead in technological advancements and
                data-driven solutions.
              </p>
            </div>
            <div className="mission-cards">
              <article className="mission-card">
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path fill="white" d="M256 32C132.3 32 32 132.3 32 256s100.3 224 224 224 224-100.3 224-224S379.7 32 256 32zm119.8 149.9c6.3 6.2 6.3 16.4 0 22.6l-96 96c-6.2 6.3-16.4 6.3-22.6 0l-37.3-37.4-61.3 61.3c-6.2 6.3-16.4 6.3-22.6 0s-6.3-16.4 0-22.6l72.6-72.6c6.2-6.3 16.4-6.3 22.6 0l37.4 37.3 84.7-84.7c6.2-6.3 16.4-6.3 22.6 0z" />
                    <circle cx="440" cy="440" r="8" fill="white" />
                  </svg>
                </div>
                <h3>OUR MISSION</h3>
                <p>
                  CHRIST (Deemed to be University) is a nurturing ground for an individual's holistic
                  development to make contribution to the society in a dynamic environment
                </p>
              </article>
              <article className="mission-card">
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path fill="white" d="M104 208c13.3 0 24 10.7 24 24v176c0 13.3-10.7 24-24 24s-24-10.7-24-24V232c0-13.3 10.7-24 24-24zm152-80c13.3 0 24 10.7 24 24v256c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zm176 64c13.3 0 24 10.7 24 24v192c0 13.3-10.7 24-24 24s-24-10.7-24-24V216c0-13.3 10.7-24 24-24z" />
                  </svg>
                </div>
                <h3>OUR VISION</h3>
                <p>Excellence and Service</p>
              </article>
            </div>
          </div>
          <img src="/assets/sohini.jpg" alt="Students working on computers" className="mission-image" />
        </div>
      </section>

      {/* About + HOD */}
      <section id="about">
        <div className="about-container">
          <div className="about-left">
            <h2>About Department</h2>
            <p>
              The Department offers three programmes BTech in AIML, BTech CSE Specialization in Data Science,
              BTech in CSE Specialization in AIML and MTech in Data Science. It focuses on equipping students
              with strong theoretical foundations and practical skills in areas such as Artificial Intelligence,
              Machine Learning, Deep Learning, Natural Language Processing, Computer Vision, Data Analytics,
              and Intelligent Systems. The curriculum is designed to meet industry demands and foster innovation,
              creativity, and critical thinking. With experienced faculty, modern laboratories, and industry
              collaborations, the department offers a rich learning environment for research and development.
              Students are <br />
              <a href="#" id="readMoreBtn" onClick={e => { e.preventDefault(); setAboutOpen(true) }}>Read more...</a>
            </p>
          </div>
          <div className="about-right">
            <div className="vision-box">
              <h3>Vision</h3>
              <p>
                To excel in human-centred AI and data-driven innovation through ethical research,
                societal well-being, and transformative collaborations.
              </p>
            </div>
            <div className="mission-box">
              <h3>Mission</h3>
              <ul>
                <li><strong>M1:</strong> Empowering individuals to ethically harness data and AI.</li>
                <li><strong>M2:</strong> Foster a dynamic research environment with global impact.</li>
                <li><strong>M3:</strong> Innovate knowledge and Entrepreneurship through collaborations.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* HOD */}
        <div className="hod-section">
          <div className="hod-container">
            <div className="hod-image">
              <img src="/assets/hod-image.webp" alt="HOD" />
              <h3>Dr. Michael Moses T</h3>
              <p><a href="mailto:hod.aiml@christuniversity.in">hod.aiml@christuniversity.in</a></p>
            </div>
            <div className="hod-message">
              <h2>Message from <span>the HOD</span></h2>
              <p>
                We are at the vanguard of a technological revolution in which data-driven solutions
                and intelligent systems are reshaping every industry. At CHRIST (Deemed to be University),
                the Department of AIML &amp; DS is dedicated to fostering the next wave of researchers, innovators
                and moral AI experts who can develop significant answers to pressing problems. Academic rigour
                and experiential learning are integrated in our department. Our students participate in
                project-based learning, research, industry collaboration and internships as part of a
                comprehensive curriculum that is tailored to stay up with global advancements. We place a strong emphasis on
                holistic education, whi...
              </p>
              <a href="#" id="hodReadMore" className="read-more" onClick={e => { e.preventDefault(); setHodOpen(true) }}>Read more...</a>
            </div>
          </div>
        </div>
      </section>

      {/* About popup */}
      <div id="popupBox" className={`popup${aboutOpen ? ' open' : ''}`}>
        <div className="popup-content">
          <button className="close-btn" onClick={() => setAboutOpen(false)}>&times;</button>
          <h2>About Department</h2>
          <p>
            The Department offers three programmes BTech in AIML, BTech CSE Specialization in Data
            Science, BTech in CSE Specialization in AIML and MTech in Data Science. It focuses on
            equipping students with strong theoretical foundations and practical skills in areas such as
            Artificial Intelligence, Machine Learning, Deep Learning, Natural Language Processing, Computer Vision,
            Data Analytics, and Intelligent Systems...
          </p>
          <h3>Overview</h3>
          <p>
            The Department of Artificial Intelligence (AI), Machine Learning (ML) and Data Science (DS)
            is dedicated to advancing cutting-edge technologies that are shaping the future.
          </p>
          <h3>Key Features:</h3>
          <ul>
            <li>High-performance computing labs with GPUs and cloud access.</li>
            <li>Industry-aligned curriculum with Python, TensorFlow, PyTorch, R, Spark.</li>
            <li>Active research in Explainable AI, Generative Models, Ethical AI, Data Science.</li>
            <li>Industry collaboration with CISCO, REDHAT, MongoDB, Festo, ORACLE Academy.</li>
            <li>Strong placement support and career counselling.</li>
          </ul>
        </div>
      </div>

      {/* HOD popup */}
      <div id="hodPopup" className={`popup${hodOpen ? ' open' : ''}`}>
        <div className="popup-content">
          <button className="close-btn" onClick={() => setHodOpen(false)}>&times;</button>
          <h2>Message from the HOD</h2>
          <p>
            We are at the vanguard of a technological revolution in which data-driven
            solutions and intelligent systems are reshaping every industry. At CHRIST
            (Deemed to be University), the Department of AIML &amp; DS is dedicated to
            fostering the next wave of researchers, innovators and moral AI experts
            who can develop significant answers to pressing problems. Academic rigour
            and experiential learning are integrated in our department. Our students
            participate in project-based learning, research, industry collaboration
            and internships as part of a comprehensive curriculum that is tailored to
            stay up with global advancements. We place a strong emphasis on holistic
            education, societal impact, interdisciplinary learning, and critical
            thinking. We take great pride in the lively learning environment we
            foster, our committed faculty and our active student body. As we expand,
            we aim to be a centre for innovation and teaching in AI, ML, and DS.
          </p>
        </div>
      </div>

      {/* Department Activities & Events */}
      <section className="department-section">
        <div className="department-activities">
          <h2><span>Department</span> Activities</h2>
          <a href="#" className="activity-card" style={{ color: '#000' }}>Workshps &amp; Seminars <span style={{ color: '#000' }}>→</span></a>
          <Link to="/caads" className="activity-card" style={{ color: '#000' }}>Christite Association of AIML &amp; DS <span style={{ color: '#000' }}>→</span></Link>
          <a href="#" className="activity-card" style={{ color: '#000' }}>Hackathons <span style={{ color: '#000' }}>→</span></a>
          <Link to="/industrial-visit" className="activity-card" style={{ color: '#000' }}>Industrial Visit <span style={{ color: '#000' }}>→</span></Link>
        </div>
        <div className="department-events">
          <h2><span>Department</span> Events</h2>
          <div className="event">
            <div className="event-date">Sep 15<br /><span>2025</span></div>
            <div className="event-details">
              <p><b>International Conference on Advances in Data-driven Computing and Intelligent Systems (ADCIS 2025)</b><br />Date: 15,16 September 2025</p>
            </div>
          </div>
          <div className="event">
            <div className="event-date">Sep 08<br /><span>2025</span></div>
            <div className="event-details">
              <p><b>Guest Talk:</b> Leading from Where you are: Women's Voices, Power, Potential<br />Date: 8 August 2025</p>
            </div>
          </div>
          <a href="#" className="view-all">View all events →</a>
        </div>
      </section>

      {/* Faculty */}
      <section id="faculty">
        <h1>Meet our Faculties</h1>
        <section className="filter-section">
          <div className="filters">
            <span className="filter-label">Filter by:</span>
            <select
              id="specialization-filter"
              value={selectedSpec}
              onChange={e => setSelectedSpec(e.target.value)}
            >
              <option value="All">All Specializations</option>
              {specializations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="search-box">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/5e358c269d9140e1be810ef6482a3f72/2cef4ee11033eecb4a19ef2637573b4246bf4c9b?placeholderIfAbsent=true"
              alt="Search icon"
            />
            <input
              type="text"
              id="search-input"
              placeholder="Search faculty…"
              aria-label="Search faculty"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        <div id="faculty-container" className="faculty-grid">
          {pageItems.length === 0
            ? <p>No faculty found.</p>
            : pageItems.map(f => (
              <div className="faculty-card" key={f.id}>
                <img src={`/${f.image}`} alt={f.name} />
                <h3>{f.name}</h3>
                <h4>{f.department}</h4>
                <p>Specialization: {f.specialization}</p>
                <Link to={`/faculty?id=${f.id}`}>
                  <button type="button">View</button>
                </Link>
              </div>
            ))
          }
        </div>

        {totalPages > 1 && (
          <div id="pagination" className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={n === currentPage ? 'active' : ''}
                onClick={() => setCurrentPage(n)}
              >{n}</button>
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-header">
            <span className="features-label">Empower</span>
            <h2>TRANSFORMING EDUCATION THROUGH INNOVATIVE SOLUTIONS</h2>
            <p>
              Our platform enhances the educational experience by integrating
              essential features for seamless management. From curriculum planning
              to performance evaluation, we provide the tools you need to succeed.
            </p>
          </div>
          <div className="features-cards">
            <article className="feature-card">
              <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/c2287c794fdf39706a06fbf3d717c89a937951d3?width=789" alt="Curriculum Planning Interface" />
              <h3>Streamlined Curriculum Planning for Educators</h3>
              <p>Easily design and manage your curriculum with our intuitive tools.</p>
            </article>
            <article className="feature-card">
              <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/abeb390e5bcb3ae9ea9bd19c90ff58ea9a03b748?width=789" alt="Resource Management Dashboard" />
              <h3>Efficient Resource Management Made Simple</h3>
              <p>Optimize your resources to enhance learning outcomes.</p>
            </article>
            <article className="feature-card">
              <img src="/assets/denery-banner1.jpg" alt="Group Discussion" />
              <h3>Comprehensive Performance Evaluation Tools</h3>
              <p>Track and assess student performance effortlessly.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs">
        <div className="card">
          <div className="card-header" style={{ backgroundImage: "url('/assets/college5.png')" }}>
            <img src="/assets/und-logo.webp" alt="Logo" className="profile-img" />
          </div>
          <div className="card-body">
            <h3>Undergraduate</h3>
            <p>Build a strong foundation with our undergraduate programs designed for future leaders.</p>
            <button>More Info</button>
          </div>
        </div>
        <div className="card">
          <div className="card-header" style={{ backgroundImage: "url('/assets/postgrad.jpg')" }}>
            <img src="/assets/pg-logo.jpg" alt="Logo" className="profile-img" />
          </div>
          <div className="card-body">
            <h3>Postgraduate</h3>
            <p>Advance your knowledge with specialized postgraduate degrees.</p>
            <button>More Info</button>
          </div>
        </div>
        <div className="card">
          <div className="card-header" style={{ backgroundImage: "url('/assets/phd.jpg')" }}>
            <img src="/assets/images.png" alt="Logo" className="profile-img" />
          </div>
          <div className="card-body">
            <h3>PhD</h3>
            <p>Pursue research and innovation with our doctoral programs.</p>
            <button>More Info</button>
          </div>
        </div>
        <div className="card">
          <div className="card-header" style={{ backgroundImage: "url('/assets/onlinedeg.jpg')" }}>
            <img src="/assets/ondeg-logo.jpg" alt="Logo" className="profile-img" />
          </div>
          <div className="card-body">
            <h3>Online Degree</h3>
            <p>Learn anytime, anywhere with our flexible online programs.</p>
            <button>More Info</button>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
