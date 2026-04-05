import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ClipboardList, LogOut, Pill, Stethoscope, UserCog, CalendarClock, Menu, X } from 'lucide-react';
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

    const rawNavItems = [
        {
            key: 'patient',
            label: 'Patient Dashboard',
            to: '/patient-dashboard',
            icon: ClipboardList
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

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        pushToast('Logged out successfully', 'success');
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

                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="hidden sm:inline-flex items-center gap-1.5 font-medium text-gray-800">
                                <Activity className="w-4 h-4 text-blue-600" />
                                {name}
                            </span>
                            {userInfo?.token && (
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="ui-btn-secondary !py-1.5 !px-3 hidden sm:inline-flex items-center gap-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout
                                </button>
                            )}
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
                                    onClick={handleLogout}
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
        </div>
    );
};

export default DashboardLayout;

