"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/app/lib/apiClient';

type UserRow = { id: string; email: string; createdAt?: string };

export default function AdminEmailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [messageMode, setMessageMode] = useState<'text' | 'html'>('text');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${getApiUrl()}/api/admin/users`, { credentials: 'include' });
        if (!res.ok) {
          // If not configured or forbidden, we still allow manual entry
          setInfo('Autofill unavailable. You can still enter emails manually.');
          return;
        }
        const data = await res.json();
        setAllUsers(data.users || []);
      } catch (e) {
        setInfo('Autofill unavailable. You can still enter emails manually.');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const suggestions = useMemo(() => {
    if (!query) return allUsers.slice(0, 10);
    const q = query.toLowerCase();
    return allUsers.filter(u => u.email.toLowerCase().includes(q)).slice(0, 10);
  }, [allUsers, query]);

  const addRecipient = (email: string) => {
    const e = email.trim();
    if (!e) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError('Invalid email format');
      return;
    }
    setError('');
    setRecipients(prev => (prev.includes(e) ? prev : [...prev, e]));
    setQuery('');
  };

  const handleQueryKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter' || ev.key === ',') {
      ev.preventDefault();
      addRecipient(query);
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(prev => prev.filter(e => e !== email));
  };

  const insertHtmlTag = (openTag: string, closeTag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end) || 'text';
    const before = message.substring(0, start);
    const after = message.substring(end);
    
    const newMessage = `${before}${openTag}${selectedText}${closeTag}${after}`;
    setMessage(newMessage);
    
    setTimeout(() => {
      textarea.selectionStart = start + openTag.length;
      textarea.selectionEnd = start + openTag.length + selectedText.length;
      textarea.focus();
    }, 0);
  };

  const formatHelpers = [
    { label: 'Bold', onclick: () => insertHtmlTag('<strong>', '</strong>') },
    { label: 'Italic', onclick: () => insertHtmlTag('<em>', '</em>') },
    { label: 'Link', onclick: () => insertHtmlTag('<a href="url">', '</a>') },
    { label: 'Code', onclick: () => insertHtmlTag('<code>', '</code>') },
    { label: 'H1', onclick: () => insertHtmlTag('<h1>', '</h1>') },
    { label: 'H2', onclick: () => insertHtmlTag('<h2>', '</h2>') },
    { label: 'List Item', onclick: () => insertHtmlTag('<li>', '</li>') },
  ];

  const onSend = async () => {
    setError('');
    setInfo('');
    if (recipients.length === 0) {
      setError('Add at least one recipient');
      return;
    }
    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }
    if (!message.trim()) {
      setError('Message is required');
      return;
    }
    try {
      setSending(true);
      const html = messageMode === 'html' 
        ? message 
        : `<p>${message.replace(/\n/g, '<br/>')}</p>`;
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ to: recipients, subject, html })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send email');
        return;
      }
      setInfo('Email sent successfully');
      setRecipients([]);
      setSubject('');
      setMessage('');
    } catch (e: any) {
      setError(e?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Send Email</h1>
      {loading && <p className="text-gray-700">Loading suggestions…</p>}
      {!!info && <div className="mb-3 text-sm text-blue-700 bg-blue-50 p-2 rounded">{info}</div>}
      {!!error && <div className="mb-3 text-sm text-red-700 bg-red-50 p-2 rounded">{error}</div>}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-900">Recipients</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {recipients.map(r => (
            <span key={r} className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded px-2 py-1 text-sm">
              {r}
              <button className="text-gray-600 hover:text-gray-900" onClick={() => removeRecipient(r)} aria-label={`Remove ${r}`}>×</button>
            </span>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleQueryKeyDown}
          placeholder="Type an email and press Enter, or pick from suggestions"
          className="w-full border rounded px-3 py-2 text-gray-900 placeholder-gray-400"
        />
        {suggestions.length > 0 && (
          <div className="mt-2 border rounded divide-y max-h-52 overflow-auto">
            {suggestions.map(s => (
              <button key={s.id} type="button" onClick={() => addRecipient(s.email)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-900">
                {s.email}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-900">Subject</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border rounded px-3 py-2 text-gray-900" />
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-900">Message</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMessageMode('text')}
              className={`px-3 py-1 text-sm rounded ${messageMode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'}`}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => setMessageMode('html')}
              className={`px-3 py-1 text-sm rounded ${messageMode === 'html' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'}`}
            >
              HTML
            </button>
          </div>
        </div>

        {messageMode === 'html' && (
          <div className="mb-3 flex flex-wrap gap-1">
            {formatHelpers.map(helper => (
              <button
                key={helper.label}
                type="button"
                onClick={helper.onclick}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-900 rounded hover:bg-gray-300 border border-gray-300"
              >
                {helper.label}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <textarea 
            ref={textareaRef}
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            rows={10} 
            className="w-full border rounded px-3 py-2 text-gray-900 font-mono" 
            placeholder={messageMode === 'html' ? 'Enter HTML content here...' : 'Enter message text here...'}
            style={{ backgroundColor: messageMode === 'html' ? '#282c34' : '#ffffff', color: messageMode === 'html' ? '#abb2bf' : '#111827' }}
          />
        </div>

        {messageMode === 'html' && message && (
          <div className="mt-3 p-3 border rounded bg-gray-50">
            <p className="text-xs text-gray-600 mb-2">Preview:</p>
            <div className="text-sm overflow-auto max-h-40 bg-gray-900 text-gray-100 p-2 rounded font-mono whitespace-pre-wrap break-words text-xs">
              {message}
            </div>
          </div>
        )}
      </div>

      <button onClick={onSend} disabled={sending} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
        {sending ? 'Sending…' : 'Send Email'}
      </button>
    </div>
  );
}
