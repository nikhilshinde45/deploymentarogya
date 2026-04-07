import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ClipboardList, LogOut, Pill, Stethoscope, UserCog, CalendarClock, Menu, X, Home, Settings, User } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next';

const getUserInfo = () => {
    try {
        return JSON.parse(localStorage.getItem('userInfo') || '{}') || {};
    } catch {
        return {};
    }
};

const DashboardLayout = ({ active, children }) => {
    const { t } = useTranslation();
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
            label: t('navItems.home'),
            to: '/',
            icon: Home
        },
        {
            key: 'patient',
            label: t('navItems.patientDashboard'),
            to: '/patient-dashboard',
            icon: ClipboardList
        },
        {
            key: 'patient',
            label: t('navItems.medicine'),
            to: '/medicines',
            icon: Pill
        },
        {
            key: 'doctor',
            label: t('navItems.doctorDashboard'),
            to: '/doctor-dashboard',
            icon: Stethoscope
        },
        {
            key: 'doctor',
            label: t('navItems.manageSlots'),
            to: '/doctor/slots',
            icon: CalendarClock
        },
        {
            key: 'admin',
            label: t('navItems.adminDashboard'),
            to: '/admin-dashboard',
            icon: UserCog
        },
        {
            key: 'pharmacist',
            label: t('navItems.pharmacistDashboard'),
            to: '/pharmacist-dashboard',
            icon: Pill
        }
    ];

    const navItems = rawNavItems.filter((item) => item.key === role);



    return (
        <div className="w-full">

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
                    <aside className={`fixed top-20 left-0 z-50 w-72 h-[calc(100vh-5rem)] bg-white shadow-2xl lg:sticky lg:top-[120px] lg:h-[calc(100vh-140px)] lg:w-auto lg:bg-transparent lg:shadow-none lg:translate-x-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <div className="h-full bg-white lg:border border-gray-100 lg:rounded-2xl lg:shadow-sm p-4 sm:p-5 overflow-y-auto">
                            <div className="lg:hidden flex items-center justify-end mb-4 px-2">
                                <button 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <nav className="space-y-1.5">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to + '/'));
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

                    <main>
                        {/* Mobile Menu Toggle Bar */}
                        <div className="lg:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <span className="font-bold text-gray-800">{t('navItems.navigation')}</span>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 -mr-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                        {children}
                    </main>
                </div>
            </div>

        </div>
    );
};

export default DashboardLayout;
