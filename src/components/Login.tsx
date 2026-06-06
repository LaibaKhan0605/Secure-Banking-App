/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Key, Eye, EyeOff, AlertTriangle, Terminal } from 'lucide-react';
import { secureRequest } from '../lib/api.js';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onNavigateToRegister: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
}

export default function Login({ onLoginSuccess, onNavigateToRegister, showToast }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{ message: string; remainingAttempts?: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please specify all login parameters', 'error');
      return;
    }

    setLoading(true);
    setErrorDetails(null);

    try {
      const data = await secureRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      showToast(data.message || 'Handshake authenticated', 'success');
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      console.error(err);
      const remaining = err.remainingAttempts;
      setErrorDetails({
        message: err.message || 'Invalid username or credentials match failure',
        remainingAttempts: remaining
      });
      showToast(err.message || 'Credentials authentication failure', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-elegant-bg flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-black">
      {/* Visual cyber background lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="w-full max-w-lg bg-elegant-card border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-950/10 z-10">
        {/* Colorful top cyber rail */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

        <div className="p-8">
          <div className="flex flex-col items-center justify-center text-center pb-8">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white font-sans">
              BANKING SECURITY PORTAL
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1 text-emerald-400/80">
              SECURE TELEMETRY ACCESS SHELL // PROTOCOL v1.2
            </p>
          </div>

          {errorDetails && (
            <div className="mb-6 bg-red-950/30 border border-red-500/30 p-4 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-200">{errorDetails.message}</p>
                {errorDetails.remainingAttempts !== undefined && errorDetails.remainingAttempts > 0 && (
                  <p className="text-xs text-red-400 font-mono mt-1">
                    [WARNING] {errorDetails.remainingAttempts} attempts remaining before account lock triggers.
                  </p>
                )}
                {errorDetails.remainingAttempts === 0 && (
                  <p className="text-xs text-red-400 font-mono mt-1">
                    [ACTION TRIGGERED] Access route locked. Please contact security admin.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-400 uppercase mb-2">
                User Access ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-mono text-sm">
                  u//
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or user"
                  className="w-full bg-elegant-bg/60 border border-slate-800 focus:border-emerald-500 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none transition-colors font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-400 uppercase mb-2">
                Encryption Passphrase
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
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 text-slate-950 font-semibold font-mono tracking-wider py-3 rounded-lg transition-colors cursor-pointer text-sm shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  INITIALIZE SESSION
                </>
              )}
            </button>
          </form>

          {/* Sandbox Credentials Guide */}
          <div className="mt-6 border border-slate-800 bg-elegant-card/45 p-3 rounded-lg text-slate-400 font-mono text-xs">
            <p className="text-emerald-500/80 mb-1.5 font-semibold">[DEFAULT SANDBOX CREDENTIALS]</p>
            <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
              <div>
                <p className="text-slate-500">ADMIN ACCOUNT:</p>
                <p>User: <span className="text-amber-400 font-bold">admin</span></p>
                <p>Pass: <span className="text-slate-300">AdminPass123!</span></p>
              </div>
              <div>
                <p className="text-slate-500">STANDARD USER:</p>
                <p>User: <span className="text-amber-400 font-bold">user</span></p>
                <p>Pass: <span className="text-slate-300">UserPass123!</span></p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center border-t border-slate-800 pt-5">
            <button
              onClick={onNavigateToRegister}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono"
            >
              [ENROLL NEW SECURE BANKING LEDGER ACCOUNT]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
