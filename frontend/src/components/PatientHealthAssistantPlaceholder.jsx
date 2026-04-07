import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Sparkles, X, Send, Loader2 } from 'lucide-react';

const NAV_SLOT_ID = 'patient-health-assistant-nav-slot';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const readIsPatient = () => {
  try {
    const u = JSON.parse(localStorage.getItem('userInfo') || '{}');
    return u?.role === 'patient';
  } catch {
    return false;
  }
};

/**
 * Patient-only Health Assistant: navbar entry + floating button → opens side panel.
 * Connects to backend Gemini chatbot at /api/health-assistant/chat.
 */
const PatientHealthAssistantPlaceholder = () => {
  const isPatient = readIsPatient();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I\'m your Health Assistant. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const navMount = typeof document !== 'undefined' ? document.getElementById(NAV_SLOT_ID) : null;

  // Escape key to close
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [open]);

  const openPanel = () => setOpen(true);
  const closePanel = () => setOpen(false);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/health-assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, language: 'en' }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply || 'Sorry, I could not process that.' }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Sorry, the assistant is unavailable right now. Please try again later.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /** Render markdown-style bold **text** and newlines */
  const formatText = (text) => {
    const html = String(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

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
          {/* ── Header (UNCHANGED) ── */}
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

          {/* ── Chat Messages ── */}
          <div className="flex flex-1 flex-col overflow-y-auto bg-gradient-to-b from-gray-50 to-white px-4 py-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={[
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-md'
                      : 'bg-white border border-gray-100 text-gray-700 rounded-bl-md',
                  ].join(' ')}
                >
                  {formatText(msg.text)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-3 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-400">Typing...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* ── Input Area ── */}
          <div className="border-t border-gray-100 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your health question..."
                disabled={loading}
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-md"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default PatientHealthAssistantPlaceholder;
