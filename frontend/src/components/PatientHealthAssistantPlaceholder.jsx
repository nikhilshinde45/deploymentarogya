import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Sparkles, X } from 'lucide-react';

const NAV_SLOT_ID = 'patient-health-assistant-nav-slot';

const readIsPatient = () => {
  try {
    const u = JSON.parse(localStorage.getItem('userInfo') || '{}');
    return u?.role === 'patient';
  } catch {
    return false;
  }
};

/**
 * Patient-only UI placeholder: navbar entry + floating button → opens side panel.
 * No chat logic or backend.
 */
const PatientHealthAssistantPlaceholder = () => {
  const isPatient = readIsPatient();
  const [open, setOpen] = useState(false);
  const navMount = typeof document !== 'undefined' ? document.getElementById(NAV_SLOT_ID) : null;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const openPanel = () => setOpen(true);
  const closePanel = () => setOpen(false);

  const navButton =
    isPatient && navMount ? (
      <button
        type="button"
        onClick={openPanel}
        className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1.5 text-sm font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:bg-blue-100 hover:shadow-md hover:border-blue-200"
        aria-label="Open Health Assistant"
      >
        <Sparkles className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Health Assistant</span>
      </button>
    ) : null;

  if (!isPatient) return null;

  return (
    <>
      {navMount && navButton ? createPortal(navButton, navMount) : null}

      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
        <button
          type="button"
          onClick={openPanel}
          className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/30 ring-4 ring-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl hover:shadow-blue-600/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          aria-label="Open Health Assistant chat"
        >
          <MessageCircle className="h-7 w-7 transition-transform duration-300 ease-out group-hover:scale-110" />
        </button>
      </div>

      <div
        className={[
          'fixed inset-0 z-[70] transition-opacity duration-300 ease-out',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        aria-hidden={!open}
      >
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out"
          onClick={closePanel}
          aria-label="Close overlay"
        />
        <aside
          className={[
            'absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl shadow-slate-900/10 transition-transform duration-300 ease-out will-change-transform',
            open ? 'translate-x-0' : 'translate-x-full',
          ].join(' ')}
          role="dialog"
          aria-modal="true"
          aria-labelledby="health-assistant-title"
        >
          <div className="border-b border-gray-100 bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-500 px-5 py-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 id="health-assistant-title" className="text-lg font-bold tracking-tight">
                    Health Assistant
                  </h2>
                  <p className="text-sm text-blue-100/90">Your personal care companion</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-xl p-2 text-white/90 transition-colors hover:bg-white/15"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col bg-gradient-to-b from-gray-50 to-white p-5">
            <div
              className={[
                'rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 ease-out',
                open ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
              ].join(' ')}
            >
              <p className="text-sm leading-relaxed text-gray-600">
                Chatbot will be available soon
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span>Future LLM integration ready</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default PatientHealthAssistantPlaceholder;
