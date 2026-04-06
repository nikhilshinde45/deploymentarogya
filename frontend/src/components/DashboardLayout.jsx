import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ClipboardList, LogOut, Pill, Stethoscope, UserCog, CalendarClock, Menu, X, Home, Settings, User } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const getUserInfo = () => {
    try {
        return JSON.parse(localStorage.getItem('userInfo') || '{}') || {};
    } catch {
        return {};
    }
};

const DashboardLayout = ({ active, children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const userInfo = getUserInfo();
    const role = userInfo?.role || '';
    const name = userInfo?.name || 'User';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const rawNavItems = [
        {
            key: 'patient',
            label: 'Home',
            to: '/',
            icon: Home
        },
        {
            key: 'patient',
            label: 'Patient Dashboard',
            to: '/patient-dashboard',
            icon: ClipboardList
        },
        {
            key: 'patient',
            label: 'Medicine',
            to: '/medicines',
            icon: Pill
        },
        {
            key: 'doctor',
            label: 'Doctor Dashboard',
            to: '/doctor-dashboard',
            icon: Stethoscope
        },
        {
            key: 'doctor',
            label: 'Add Availability',
            to: '/doctor/slots',
            icon: CalendarClock
        },
        {
            key: 'admin',
            label: 'Admin Dashboard',
            to: '/admin-dashboard',
            icon: UserCog
        },
        {
            key: 'pharmacist',
            label: 'Pharmacist Dashboard',
            to: '/pharmacist-dashboard',
            icon: Pill
        }
    ];

    const navItems = rawNavItems.filter((item) => item.key === role);

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
        setIsProfileDropdownOpen(false);
        setIsMobileMenuOpen(false);
    };

    const confirmLogout = () => {
        localStorage.removeItem('userInfo');
        pushToast('Logged out successfully', 'success');
        setShowLogoutModal(false);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold shadow-sm">
                                H
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900 leading-tight">HealthCare</p>
                                <p className="text-xs text-gray-500 leading-tight">
                                    {role ? role[0].toUpperCase() + role.slice(1) : 'Not signed in'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-600 relative">
                            {userInfo?.token ? (
                                <div className="hidden sm:block relative">
                                    <button 
                                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                        className="flex items-center gap-2.5 hover:bg-gray-100 p-1.5 pr-3 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-semibold text-gray-800">{name}</span>
                                    </button>

                                    {/* Dropdown menu */}
                                    {isProfileDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-2 border-b border-gray-50/50 mb-1">
                                                <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
                                                <p className="text-xs text-gray-500 capitalize">{role}</p>
                                            </div>
                                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors">
                                                <User className="w-4 h-4" /> Profile
                                            </button>
                                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors">
                                                <Settings className="w-4 h-4" /> Settings
                                            </button>
                                            <div className="border-t border-gray-50/50 my-1"></div>
                                            <button 
                                                onClick={handleLogoutClick}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors group"
                                            >
                                                <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                            
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
                    
                    {/* Mobile Overlay */}
                    {isMobileMenuOpen && (
                        <div 
                            className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden backdrop-blur-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={{ animation: 'fadeIn 0.2s ease-out' }}
                        />
                    )}

                    {/* Sidebar */}
                    <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl lg:static lg:w-auto lg:bg-transparent lg:shadow-none lg:translate-x-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <div className="h-full bg-white lg:border border-gray-100 lg:rounded-2xl lg:shadow-sm p-4 sm:p-5 overflow-y-auto">
                            <div className="flex items-center justify-between gap-2 mb-6 lg:mb-4 px-2 lg:px-0">
                                <div className="flex items-center gap-2">
                                    <UserCog className="w-5 h-5 text-blue-600" />
                                    <p className="font-bold text-gray-900">Navigation</p>
                                </div>
                                <button 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {/* Mobile User Info */}
                            <div className="lg:hidden flex items-center justify-between mb-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span className="font-semibold text-gray-800 text-sm truncate">{name}</span>
                                </div>
                                <button
                                    onClick={handleLogoutClick}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>

                            <nav className="space-y-1.5">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = active === item.key || location.pathname === item.to;
                                    return (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={[
                                                'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 group',
                                                isActive
                                                    ? 'bg-blue-50/80 border-blue-200 text-blue-700 shadow-sm'
                                                    : 'bg-white border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-200 hover:text-gray-900'
                                            ].join(' ')}
                                        >
                                            <Icon className={`w-4.5 h-4.5 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                                            <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    <main>{children}</main>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full relative z-10 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-5 drop-shadow-sm">
                            <LogOut className="w-8 h-8 ml-1" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Ready to Leave?</h3>
                        <p className="text-gray-500 text-center mb-8 text-sm">
                            Are you sure you want to log out of your session? You will need to sign in again to access your dashboard.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmLogout}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md transition-all hover:shadow-lg active:scale-95"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
