import { BrowserRouter as Router, Link, Route, Routes, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorProfileView from './pages/DoctorProfileView';
import VideoCall from './pages/VideoCall';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Medicines from './pages/Medicines';
import PharmacistDashboard from './pages/PharmacistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PatientHealthAssistantPlaceholder from './components/PatientHealthAssistantPlaceholder';
import { useMemo } from 'react';
import { LogOut } from 'lucide-react';
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
    if (role === 'doctor') return [{ label: 'Doctor Dashboard', to: '/doctor-dashboard' }];
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
      <div className="min-h-screen font-sans bg-gradient-to-br from-slate-50 via-blue-50/40 to-cyan-50/40 pb-20">
        {/* Simple Navbar */}
        <nav className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between min-h-16 py-3 items-center gap-3">
              <Link to="/" className="flex items-center cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl mr-3 shadow-md">H</div>
                <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Health<span className="text-blue-600">Care</span>
                </span>
              </Link>
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end">
                  <div id="patient-health-assistant-nav-slot" className="flex items-center min-h-[2.25rem]" aria-live="polite" />
                  {navItems.map((item) => (
                    <Link key={item.to} to={item.to} className="text-sm font-medium text-gray-600 hover:text-blue-700 transition-colors">
                      {item.label}
                    </Link>
                  ))}
                  <Link to="/medicines" className="text-sm font-medium text-gray-600 hover:text-blue-700 transition-colors">
                    Medicines
                  </Link>
                  {userInfo?.token ? (
                    <button onClick={handleLogout} className="ui-btn-secondary inline-flex items-center gap-2 !py-2 !px-3 text-sm">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  ) : (
                    <>
                      <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 cursor-pointer transition-colors">Login</Link>
                      <Link to="/register" className="ui-btn-primary !rounded-full !py-2 !px-4 text-sm">Register</Link>
                    </>
                  )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/doctors/:id" element={<DoctorProfileView />} />
            <Route path="/video/:roomId" element={<VideoCall />} />
            <Route path="/patient-dashboard" element={<PatientDashboard />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/medicines" element={<Medicines />} />
            <Route path="/pharmacist-dashboard" element={<PharmacistDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>

        <PatientHealthAssistantPlaceholder />
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
