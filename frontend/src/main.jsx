import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/ToastProvider.jsx'
import './i18n'
import axios from 'axios'

// Set the base URL for all axios requests based on the environment
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '';

// Automatically attach the Authorization token to EVERY outgoing request
axios.interceptors.request.use((config) => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
  } catch (error) {
    console.error('Error attaching token:', error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)
