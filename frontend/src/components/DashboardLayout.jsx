import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ClipboardList, LogOut, Pill, Stethoscope, UserCog, CalendarClock } from 'lucide-react';
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
                            <Activity className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-gray-800">{name}</span>
                            {userInfo?.token && (
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="ui-btn-secondary !py-1.5 !px-3 inline-flex items-center gap-1.5 text-xs"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
                    <aside className="hidden lg:block">
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <UserCog className="w-4 h-4 text-blue-600" />
                                <p className="text-sm font-semibold text-gray-900">Navigation</p>
                            </div>
                            <nav className="space-y-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = active === item.key || location.pathname === item.to;
                                    return (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            className={[
                                                'w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors',
                                                isActive
                                                    ? 'bg-blue-50 border-blue-100 text-blue-700'
                                                    : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                                            ].join(' ')}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="text-sm font-medium">{item.label}</span>
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

