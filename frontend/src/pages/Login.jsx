import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../hooks/useToast';

const ROLES = [
  { value: 'patient', label: 'Patient', icon: '🏥' },
  { value: 'doctor', label: 'Doctor', icon: '🩺' },
  { value: 'admin', label: 'Admin', icon: '🛡️' },
  { value: 'pharmacist', label: 'Pharmacist', icon: '💊' },
];

const getLoginEndpoint = (role) => {
  switch (role) {
    case 'doctor': return '/api/doctor/login';
    case 'admin': return '/api/admin/login';
    case 'pharmacist': return '/api/pharmacist/login';
    case 'patient':
    default: return '/api/auth/login';
  }
};

const getDashboardPath = (role) => {
  switch (role) {
    case 'doctor': return '/doctor-dashboard';
    case 'admin': return '/admin-dashboard';
    case 'pharmacist': return '/pharmacist-dashboard';
    case 'patient':
    default: return '/patient-dashboard';
  }
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = getLoginEndpoint(role);
      const response = await axios.post(endpoint, { email, password });

      const userData = { ...response.data, role: response.data.role || role };
      localStorage.setItem('userInfo', JSON.stringify(userData));

      pushToast('Login successful!', 'success');
      navigate(getDashboardPath(userData.role));
    } catch (error) {
      pushToast(error.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-cyan-50/40">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-md">H</div>
          <h2 className="text-3xl font-extrabold text-gray-900">Sign in to HealthCare</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login as
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border-2 text-xs font-medium transition-all duration-200 cursor-pointer
                      ${role === r.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                  >
                    <span className="text-lg">{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 hover:border-blue-400"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 hover:border-blue-400"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? 'Signing in...' : `Sign in as ${ROLES.find(r => r.value === role)?.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;