/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Mail, Key, Eye, EyeOff, Terminal, ArrowLeft } from 'lucide-react';
import { secureRequest } from '../lib/api.js';

interface RegisterProps {
  onRegisterSuccess: (user: any, token: string) => void;
  onNavigateToLogin: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
}

export default function Register({ onRegisterSuccess, onNavigateToLogin, showToast }: RegisterProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      showToast('Please specify all details to enroll.', 'error');
      return;
    }

    if (username.length < 3) {
      showToast('Username must be at least 3 characters long', 'error');
      return;
    }

    if (password.length < 8) {
      showToast('Security mandate: password must be at least 8 characters long', 'warning');
      return;
    }

    setLoading(true);

    try {
      const data = await secureRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      showToast(data.message || 'Enrollment transaction authorized!', 'success');
      onRegisterSuccess(data.user, data.token);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Enrollment rejected by compliance parser.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-elegant-bg flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-black">
      {/* Background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="w-full max-w-lg bg-elegant-card border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-950/10 z-10">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

        <div className="p-8">
          <div className="flex flex-col items-center justify-center text-center pb-8">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-4 scale-95 transition-transform duration-500 hover:scale-105">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white font-sans">
              LEDGER ENROLLMENT UTILITY
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1 text-teal-400/80">
              ESTABLISH IDENTITY SEED // CRYPTOGRAPHIC VAULTS
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-400 uppercase mb-2">
                Create Account Handle
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-mono text-sm">
                  u//
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. cyber_pioneer"
                  className="w-full bg-elegant-bg/60 border border-slate-800 focus:border-emerald-500 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none transition-colors font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-400 uppercase mb-2">
                Registry Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nexus.bank"
                  className="w-full bg-elegant-bg/60 border border-slate-800 focus:border-emerald-500 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none transition-colors font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-400 uppercase mb-2">
                Mandatory Passphrase (MIN 8 chars)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-elegant-bg/60 border border-slate-800 focus:border-emerald-500 rounded-lg py-2.5 pl-10 pr-10 text-white placeholder-slate-600 focus:outline-none transition-colors font-mono text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:bg-slate-800 text-slate-950 font-semibold font-mono tracking-wider py-3 rounded-lg transition-colors cursor-pointer text-sm shadow-lg shadow-teal-950/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  GENERATE VAULT KEYS
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-800 pt-5">
            <button
              onClick={onNavigateToLogin}
              className="text-xs text-slate-400 hover:text-teal-400 transition-colors font-mono flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              [RETURN TO SECURE SHELL PORTAL]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
