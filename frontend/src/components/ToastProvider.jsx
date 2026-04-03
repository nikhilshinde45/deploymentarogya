import React, { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { ToastContext } from './ToastContext';

const toneStyles = {
    success: {
        icon: CheckCircle2,
        className: 'border-emerald-100 bg-emerald-50 text-emerald-800'
    },
    error: {
        icon: TriangleAlert,
        className: 'border-red-100 bg-red-50 text-red-800'
    },
    info: {
        icon: Info,
        className: 'border-blue-100 bg-blue-50 text-blue-800'
    }
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const pushToast = useCallback((message, tone = 'info', durationMs = 3200) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setToasts((prev) => [...prev, { id, message, tone }]);

        window.setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, durationMs);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const value = useMemo(() => ({ pushToast }), [pushToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}

            <div className="fixed top-20 right-4 z-[90] space-y-3 w-[min(92vw,380px)]">
                {toasts.map((toast) => {
                    const tone = toneStyles[toast.tone] || toneStyles.info;
                    const Icon = tone.icon;
                    return (
                        <div
                            key={toast.id}
                            className={`animate-in slide-in-from-right-8 fade-in duration-300 rounded-2xl border px-4 py-3 shadow-lg ${tone.className}`}
                            role="status"
                        >
                            <div className="flex items-start gap-3">
                                <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                                <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
                                <button
                                    type="button"
                                    className="ml-auto rounded-md p-1 hover:bg-black/5"
                                    onClick={() => removeToast(toast.id)}
                                    aria-label="Dismiss notification"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

