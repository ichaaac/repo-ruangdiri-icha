// src/components/shared/dev-auth/DevAuthGate.jsx
import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'rd.devAuth.v1';

const DevAuthGate = () => {
  const enabled = import.meta.env.VITE_ENABLE_DEV_AUTH;
  const expectedUser = import.meta.env.VITE_BASIC_AUTH_USER || 'dev';
  const expectedPass = import.meta.env.VITE_BASIC_AUTH_PASS || 'dev';
  const ttlMinutes = Number(import.meta.env.VITE_DEV_AUTH_TTL_MIN || '10'); // 12h

  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { ok, ts } = JSON.parse(raw);
        const ageMin = (Date.now() - ts) / 60000;
        if (ok && ageMin < ttlMinutes) {
          setOpen(false);
          return;
        }
      }
    } catch {}
    setOpen(true);
  }, [enabled, ttlMinutes]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('logout') === '1') {
      localStorage.removeItem(STORAGE_KEY);
      setOpen(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === expectedUser && password === expectedPass) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ok: true, ts: Date.now() })
      );
      setError('');
      setOpen(false);
    } else {
      setError('Invalid credentials');
    }
  };

  if (!enabled || !open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-gray-200 p-6"
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Development Access</h2>
          <p className="text-xs text-gray-500 mt-1">
            Protected preview. Enter credentials to continue.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Enter username"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Enter password"
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 text-xs text-red-600">{error}</div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Continue
          </button>
          <div className="text-[10px] text-gray-400">RuangDiri dev gate</div>
        </div>
      </form>
    </div>
  );
};

export default DevAuthGate;

