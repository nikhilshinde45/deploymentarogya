import { BrowserRouter as Router, Link, Route, Routes, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorProfileView from './pages/DoctorProfileView';
import VideoCall from './pages/VideoCall';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorManageSlots from './pages/DoctorManageSlots';
import Medicines from './pages/Medicines';
import PharmacistDashboard from './pages/PharmacistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorRecordView from './pages/DoctorRecordView';
import PatientHistoryPage from './pages/PatientHistoryPage';
import PatientHealthAssistantPlaceholder from './components/PatientHealthAssistantPlaceholder';
import { useMemo } from 'react';
import { LogOut, Mail, Phone, MapPin, ChevronRight, Globe } from 'lucide-react';
import { useToast } from './hooks/useToast';

const getUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}') || {};
  } catch {
    return {};
  }
};

const AppContent = () => {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const userInfo = getUserInfo();

  const role = userInfo?.role || '';

  const navItems = useMemo(() => {
    if (role === 'patient') return [{ label: 'Patient Dashboard', to: '/patient-dashboard' }];
    if (role === 'doctor') return [
      { label: 'Doctor Dashboard', to: '/doctor-dashboard' },
      { label: 'Manage Slots', to: '/doctor/slots' }
    ];
    if (role === 'admin') return [{ label: 'Admin Dashboard', to: '/admin-dashboard' }];
    if (role === 'pharmacist') return [{ label: 'Pharmacist Dashboard', to: '/pharmacist-dashboard' }];
    return [];
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    pushToast('Logged out successfully', 'success');
    navigate('/');
  };

  return (
      <div className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-slate-50 via-blue-50/40 to-cyan-50/40">
        {/* Simple Navbar */}
        <nav className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between min-h-16 py-3 items-center gap-3">
              <Link to="/" className="flex items-center cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-blue-600 group-hover:bg-blue-700 transition-colors flex items-center justify-center text-white font-bold text-xl mr-3 shadow-md group-hover:shadow-lg transform group-hover:scale-105 duration-200">H</div>
                <span className="text-2xl font-extrabold text-gray-900 tracking-tight group-hover:text-blue-900 transition-colors">
                    Health<span className="text-blue-600">Care</span>
                </span>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                  <div id="patient-health-assistant-nav-slot" className="flex items-center min-h-[2.25rem]" aria-live="polite" />
                  {navItems.map((item) => (
                    <Link key={item.to} to={item.to} className="text-sm font-semibold text-gray-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-full transition-all duration-200">
                      {item.label}
                    </Link>
                  ))}
                  <Link to="/medicines" className="text-sm font-semibold text-gray-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-full transition-all duration-200">
                    Medicines
                  </Link>
                  {userInfo?.token ? (
                    <button onClick={handleLogout} className="ui-btn-secondary inline-flex items-center gap-2 !py-2 !px-3 text-sm">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  ) : (
                    <>
                      <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-full transition-all duration-200 cursor-pointer">Login</Link>
                      <Link to="/register" className="ui-btn-primary !rounded-full !py-2 !px-5 text-sm hover:shadow-lg transition-shadow">Register</Link>
                    </>
                  )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1 w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/doctors/:id" element={<DoctorProfileView />} />
            <Route path="/video/:roomId" element={<VideoCall />} />
            <Route path="/patient-dashboard" element={<PatientDashboard />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/slots" element={<DoctorManageSlots />} />
            <Route path="/doctor/records/:appointmentId" element={<DoctorRecordView />} />
            <Route path="/doctor/patient-history/:patientId" element={<PatientHistoryPage />} />
            <Route path="/medicines" element={<Medicines />} />
            <Route path="/pharmacist-dashboard" element={<PharmacistDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>

        <PatientHealthAssistantPlaceholder />

        {/* Global Footer */}
        <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8 text-slate-300 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 border-b border-slate-800 pb-12">
              
              {/* Brand and About */}
              <div className="space-y-4">
                <Link to="/" className="flex items-center cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl mr-3 shadow-md">H</div>
                  <span className="text-2xl font-extrabold text-white tracking-tight">
                      Health<span className="text-blue-500">Care</span>
                  </span>
                </Link>
                <p className="text-sm text-slate-400 leading-relaxed mt-4">
                  Connecting you with top healthcare professionals globally. Our mission is to provide accessible, reliable, and secure remote medical consultations.
                </p>
                <div className="flex gap-4 pt-2">
                  <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"><Globe className="w-4 h-4" /></a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
                <ul className="space-y-3">
                  {[
                    { name: 'Search Doctors', to: '/' },
                    { name: 'Book Appointment', to: '/' },
                    { name: 'Patient Dashboard', to: '/patient-dashboard' },
                    { name: 'Medicines & Pharmacy', to: '/medicines' },
                    { name: 'Register as Doctor', to: '/register' },
                  ].map((link) => (
                    <li key={link.name}>
                      <Link to={link.to} className="text-slate-400 hover:text-blue-400 text-sm flex items-center group transition-colors">
                        <ChevronRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-blue-500" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Us */}
              <div>
                <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
                <ul className="space-y-4">
                  <li className="flex items-start group cursor-default">
                    <MapPin className="w-5 h-5 mr-3 text-blue-500 shrink-0 mt-0.5 group-hover:animate-bounce" />
                    <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">Tower A, Cyber City, DLF Phase 2, Gurugram, Haryana 122002, India</span>
                  </li>
                  <li className="flex items-center group cursor-default">
                    <Phone className="w-5 h-5 mr-3 text-blue-500 shrink-0 group-hover:animate-pulse" />
                    <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">+91 1800 123 4567<br/><span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Mon-Sat, 9 AM - 8 PM IST</span></span>
                  </li>
                  <li className="flex items-center group cursor-default">
                    <Mail className="w-5 h-5 mr-3 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <a href="mailto:support@healthcare.ai" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">support@healthcare.ai</a>
                  </li>
                </ul>
              </div>

              {/* Newsletter & Feedback */}
              <div>
                 <h3 className="text-white font-bold text-lg mb-4">Stay Healthy</h3>
                 <p className="text-sm text-slate-400 mb-4">Subscribe to our newsletter for health tips and platform updates.</p>
                 <div className="flex gap-2">
                   <input type="email" placeholder="Email address..." className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:border-blue-500 text-white placeholder-slate-500" />
                   <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Join</button>
                 </div>
              </div>

            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-slate-500 border-t border-slate-800 pt-6">
              <p className="flex items-center gap-1.5">
                &copy; {new Date().getFullYear()} <span className="font-bold text-white">HealthCare India</span> Pvt. Ltd. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-white transition-colors relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:-bottom-1 after:left-0 after:bg-blue-500 after:origin-bottom-right hover:after:scale-x-100 hover:after:origin-bottom-left after:transition-transform after:duration-300">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:-bottom-1 after:left-0 after:bg-blue-500 after:origin-bottom-right hover:after:scale-x-100 hover:after:origin-bottom-left after:transition-transform after:duration-300">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
