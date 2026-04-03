import React, { useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Medicines from './Medicines';

const getUserInfo = () => {
    try {
        return JSON.parse(localStorage.getItem('userInfo') || '{}') || {};
    } catch {
        return {};
    }
};

const PharmacistDashboard = () => {
    const userInfo = useMemo(() => getUserInfo(), []);
    const role = userInfo?.role || '';

    return (
        <DashboardLayout active="pharmacist">
            <div className="space-y-6">
                {role !== 'pharmacist' ? (
                    <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-5">
                        <p className="font-medium">Access denied: pharmacist role required.</p>
                    </div>
                ) : (
                    <div>
                        <Medicines />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PharmacistDashboard;

