import { useEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './AboutUs.css'

const HISTORY_ITEMS = [
  { year: '1831', highlight: true, dataImg: '/assets/kuriakose_chavara.png', description: <>CHRIST (Deemed to be University) was born out of the <br /> educational vision of <br /> <strong>St Kuriakose Elias Chavara.</strong></> },
  { year: '1969', special: '1969', description: <>An educationalist and social reformer of the <br /> nineteenth century in South India.</> },
  { year: '1998', dataImg: '/assets/cmi.jpg', isCmi: true, description: <>He founded the first Catholic indigenous <br /> congregation, Carmelites of Mary Immaculate (CMI),</> },
  { year: '2004', dataImg: '/assets/chclg.png', isChclg: true, description: <>in 1831 which administers CHRIST (Deemed to be University).</> },
]

export default function AboutUs() {
  const sectionRef = useRef(null)
  const lineRef = useRef(null)
  const itemsRef = useRef([])
  const defaultImgRef = useRef(null)
  const treeImgRef = useRef(null)
  const deerImgRef = useRef(null)

  const [currentImgSrc, setCurrentImgSrc] = useState('/assets/kuriakose_chavara.png')
  const [showTree, setShowTree] = useState(false)
  const [showDeer, setShowDeer] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [lineHeight, setLineHeight] = useState(0)
  const [deanModalOpen, setDeanModalOpen] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    function onScroll() {
      const rect = section.getBoundingClientRect()
      const maxScroll = rect.height - window.innerHeight
      if (maxScroll <= 0) return
      const scrollProgress = Math.min(Math.max(-rect.top / maxScroll, 0), 1)

      const timelineEl = section.querySelector('.timeline')
      if (timelineEl) {
        setLineHeight(scrollProgress * timelineEl.scrollHeight)
      }

      const step = Math.min(HISTORY_ITEMS.length - 1, Math.floor(scrollProgress * HISTORY_ITEMS.length))
      setActiveStep(step)

      const activeItem = HISTORY_ITEMS[step]
      if (activeItem.special === '1969') {
        setShowTree(true)
        setShowDeer(true)
      } else {
        setShowTree(false)
        setShowDeer(false)
        if (activeItem.dataImg && activeItem.dataImg !== currentImgSrc) {
          setCurrentImgSrc(activeItem.dataImg)
        }
      }
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [currentImgSrc])

  // card in-view animation for vision/mission cards
  useEffect(() => {
    const cards = document.querySelectorAll('.about-anim-card')
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target) }
      })
    }, { threshold: 0.2 })
    cards.forEach(c => io.observe(c))
    return () => io.disconnect()
  }, [])

  return (
    <>
      <Navbar />

      {/* About Hero */}
      <section className="about-section">
        <img className="about-img top-left" src="/assets/kuriakose_chavara.png" alt="St. Kuriakose" />
        <img className="about-img top-center" src="/assets/students_studying.png" alt="Students reading" />
        <div className="vision-box-abs about-anim-card">
          <h2>VISION</h2>
          <p>Christ (Deemed to be University), a premier educational institution, is an academic fraternity of individuals dedicated to the motto of "EXCELLENCE AND SERVICE."</p>
        </div>
        <h1 className="about-title">ABOUT US</h1>
        <img className="about-img mid-right" src="/assets/dean_speaking.png" alt="Speaker at podium" />
        <div className="mission-box-abs about-anim-card">
          <h2>MISSION</h2>
          <p>CHRIST (Deemed to be University) is a nurturing ground for an individual's holistic development to make effective contribution to the society in a dynamic environment.</p>
        </div>
        <img className="about-img bottom-center" src="/assets/students_group.png" alt="Students working" />
        <img className="about-img bottom-right" src="/assets/department.png" alt="Smiling students" />
      </section>

      {/* History */}
      <section className="history-section" ref={sectionRef}>
        <h1 className="history-title">History</h1>
        <div className="history-content">
          <div className="timeline">
            <div className="timeline-line" style={{ height: lineHeight + 'px' }} ref={lineRef}></div>
            {HISTORY_ITEMS.map((item, idx) => (
              <div
                key={item.year}
                className={`timeline-item${idx <= activeStep ? ' active' : ''}`}
                ref={el => itemsRef.current[idx] = el}
              >
                <div className="year">{item.year}</div>
                <div className={`dot${item.highlight ? ' highlight' : ''}`}></div>
                <div className="description">{item.description}</div>
              </div>
            ))}
          </div>
          <div className="history-image">
            <img
              src={currentImgSrc}
              className={`default-img active${currentImgSrc.includes('cmi') ? ' cmi' : ''}${currentImgSrc.includes('chclg') ? ' chclg' : ''}`}
              alt="History step"
              ref={defaultImgRef}
            />
            <img src="/assets/tree.png" className={`special-img tree${showTree ? ' show' : ''}`} alt="Tree" ref={treeImgRef} />
            <img src="/assets/deer.png" className={`special-img deer${showDeer ? ' show' : ''}`} alt="Deer" ref={deerImgRef} />
          </div>
        </div>
      </section>

      {/* Department Section */}
      <section className="dept-section">
        <div className="dept-content">
          <div className="dept-text">
            <h1>Our Department</h1>
            <p>
              Christ University's AIML &amp; Data Science department offers a well-rounded,
              modern educational experience—from cutting-edge curriculum and resources
              to active research, industry exposure, and strong career prospects. It
              aligns well with the university's emphasis on "Excellence and Service",
              though it demands discipline with regard to academics and campus policies.
            </p>
          </div>
          <div className="dept-img">
            <img src="/assets/department.png" alt="Department Photo" />
          </div>
        </div>
      </section>

      {/* Dean Section */}
      <section className="dean-section">
        <div className="dean-container">
          <div className="dean-card">
            <img src="/assets/dean_speaking.png" alt="Dr. Raghunandan Kumar" />
            <div className="dean-name">
              <h3>DR. RAGHUNANDAN KUMAR<br />BE, ME, MBA, PhD</h3>
            </div>
          </div>
          <div className="dean-text">
            <h1>Meet Our Dean</h1>
            <p>Dr. Raghunandan Kumar embodies the ideal academic leader: a seasoned educator, accomplished researcher, and visionary administrator.</p>
            <p>His strong credentials (BE, ME, MBA, PhD), significant scholarly output, active mentorship, and leadership in engineering education make him a tremendous asset to Christ University and an inspiring role model for students and faculty alike.</p>
            <button id="readMoreBtn" className="read-more-btn" onClick={() => setDeanModalOpen(true)}>Read More</button>
          </div>
        </div>
      </section>

      {/* Dean Modal */}
      <div className={`modal${deanModalOpen ? ' open' : ''}`} id="deanModal" onClick={e => { if (e.target.classList.contains('modal')) setDeanModalOpen(false) }}>
        <div className="modal-content">
          <button className="close-btn" onClick={() => setDeanModalOpen(false)}>&times;</button>
          <h2>Message from the Dean</h2>
          <p>Welcome to the School of Engineering and Technology (SoET) at CHRIST (Deemed to be University). Established in 2009, SoET is a unique and fastest-growing school that equips students and scholars with the skills and competencies necessary to navigate the complexities of today's dynamic world. The school offers a wide range of programmes approved by the University Grants Commission (UGC) and All India Council for Technical Education (AICTE) and accredited by the National Assessment and Accreditation Council (NAAC) and National Board for Accreditation (NBA) through a blend of project-based and multidisciplinary curricula in emerging technologies including Honors and Minors in AI&amp;ML, Psychology, CIMA, Management, Geomatics, and Architecture.</p>
          <p>Spread across 78.5 acres, Kengeri Campus located off Mysore Road, is lush green with several amenities. The Mysore Horticulture Society, Lalbagh, Bangalore has awarded the Special Outstanding Prize of 'Best Ornamental Gardens' to Kengeri Campus. The vibrancy of the campus is in its diversity among the students and faculty. Centres such as the Centre of Excellence (COE) in E-Mobility, and Frontier Materials, enable our researchers and scientists to be at the forefront of cutting-edge research, actively bridging the gap between innovation and education.</p>
          <p>The university instills critical thinking in our graduates to recognize human and societal needs; design innovativeness, and sustainable engineering solutions. Embrace an international perspective; and create value through entrepreneurial efforts.</p>
          <p>Our graduates stand out as exceptional problem-solvers, adept leaders, and skilled communicators through the holistic education imparted to them by the university. They exhibit remarkable adaptability in the face of new challenges within diverse, multicultural environments. Committed to continuous learning, they keep abreast of evolving and emerging technologies and stay responsive to the ever-changing demands of the workplace.</p>
          <p>SoET is an internationally recognized center of leading-edge technology and many students find unparalleled opportunities for real-world experience before they enter the workforce. CHRIST strives to develop the citizens of tomorrow by nurturing the individual's holistic development to make an effective contribution to society in a dynamic environment, which drives us toward the pursuit of excellence.</p>
          <p>I invite you to be part of this unique transformative journey with our motto of 'Excellence and Service'.</p>
          <p><strong>DR. RAGHUNANDAN KUMAR</strong><br />BE, ME, MBA, PhD<br />Email: dean.engineering@christuniversity.in</p>
        </div>
      </div>

      <Footer />
    </>
  )
}
