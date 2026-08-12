import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
import Newsletter from './pages/Newsletter'
import Caads from './pages/Caads'
import FacultyDev from './pages/FacultyDev'
import IndustrialVisit from './pages/IndustrialVisit'
import ServiceLearning from './pages/ServiceLearning'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/newsletter" element={<Newsletter />} />
      <Route path="/caads" element={<Caads />} />
      <Route path="/faculty-dev" element={<FacultyDev />} />
      <Route path="/industrial-visit" element={<IndustrialVisit />} />
      <Route path="/service-learning" element={<ServiceLearning />} />
    </Routes>
  )
}

export default App
