/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, Terminal } from 'lucide-react';

import Login from './components/Login.js';
import Register from './components/Register.js';
import Sidebar from './components/Sidebar.js';
import Navbar from './components/Navbar.js';
import Telemetry from './components/Telemetry.js';
import FinanceLedger from './components/FinanceLedger.js';
import SecurityAuditLogs from './components/SecurityAuditLogs.js';
import AttackSimulator from './components/AttackSimulator.js';
import OWASPChecklist from './components/OWASPChecklist.js';

import { secureRequest, fetchCsrfToken } from './lib/api.js';
import { User, Transaction, SecurityLog, SecurityAlert, SecurityStats } from './types.js';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('telemetry');
  const [showRegister, setShowRegister] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Telemetry logs, alerts, & stats systems state
  const [stats, setStats] = useState<SecurityStats>({
    totalUsers: 0,
    totalTransactions: 0,
    failedLoginAttempts: 0,
    securityAlertsCount: 0,
    apiRequestCount: 0,
    activeSessions: 1,
    dbStatus: 'Loading...',
    wafBlockedCount: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);

  const sseSourceRef = useRef<EventSource | null>(null);

  // Helper for triggering toast overlays
  const triggerToast = (message: string, type: 'success' | 'error' | 'warning') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Fetch telemetry files synchronously
  const refreshTelemetryData = async () => {
    if (!currentUser) return;

    try {
      // Gather stats
      const statsClaims = await secureRequest('/api/stats');
      setStats(statsClaims);

      // Gather transactions ledger
      const transClaims = await secureRequest('/api/transactions');
      setTransactions(transClaims);

      // Gather logs & alerts (Only accessible to Admins!)
      if (currentUser.role === 'admin') {
        const logsClaims = await secureRequest('/api/security/logs');
        setSecurityLogs(logsClaims);

        const alertsClaims = await secureRequest('/api/security/alerts');
        setSecurityAlerts(alertsClaims);
      }
    } catch (e: any) {
      console.warn('Silent refresh issue:', e);
    }
  };

  // Auth bootstrap on boot
  useEffect(() => {
    // Standard CSRF handshaking
    fetchCsrfToken();

    const storedUser = localStorage.getItem('sb_user');
    const storedToken = localStorage.getItem('sb_auth_token');

    if (storedUser && storedToken) {
      try {
        const userObj = JSON.parse(storedUser);
        setCurrentUser(userObj);
      } catch (e) {
        localStorage.removeItem('sb_user');
        localStorage.removeItem('sb_auth_token');
      }
    }
  }, []);

  // Telemetry updates and SSE Streams subscription on user logins
  useEffect(() => {
    if (!currentUser) {
      // Clean up Stream if user logged out
      if (sseSourceRef.current) {
        sseSourceRef.current.close();
        sseSourceRef.current = null;
      }
      return;
    }

    refreshTelemetryData();

    // Subscribe to real-time Server-Sent Events (SSE) stream trigger!
    console.log('Initiating Secure Banking live Event Stream feed listener...');
    const sse = new EventSource('/api/security/stream');
    sseSourceRef.current = sse;

    sse.addEventListener('message', (event) => {
      try {
        const packet = JSON.parse(event.data);
        const { type, data } = packet;

        if (type === 'STATS') {
          setStats(data);
        } else if (type === 'LOG') {
          // Prepend latest logs to display live flow
          const incomingLog = data as SecurityLog;
          setSecurityLogs(prev => {
            const exists = prev.some(l => l.id === incomingLog.id);
            if (exists) return prev;
            return [incomingLog, ...prev].slice(0, 100);
          });
          // Update API stats manually
          setStats(prev => ({
            ...prev,
            apiRequestCount: prev.apiRequestCount + 1
          }));
        } else if (type === 'ALERT') {
          const incomingAlert = data as SecurityAlert;
          // Prepend active threat and trigger live warning toast instantly!
          setSecurityAlerts(prev => {
            const exists = prev.some(a => a.id === incomingAlert.id);
            if (exists) return prev;
            return [incomingAlert, ...prev];
          });
          
          triggerToast(`[SECURITY ALERT] ${incomingAlert.title}`, 'error');
          refreshTelemetryData();
        }
      } catch (e) {
        // failed parse
      }
    });

    sse.addEventListener('error', (err) => {
      console.warn('SSE disconnected. Stream will re-attempt sync automatically.');
    });

    return () => {
      if (sse) sse.close();
    };
  }, [currentUser]);

  const handleLoginSuccess = (user: any, token: string) => {
    localStorage.setItem('sb_auth_token', token);
    localStorage.setItem('sb_user', JSON.stringify(user));
    setCurrentUser(user);
    triggerToast('Secure Tunnel Established', 'success');
  };

  const handleRegisterSuccess = (user: any, token: string) => {
    localStorage.setItem('sb_auth_token', token);
    localStorage.setItem('sb_user', JSON.stringify(user));
    setCurrentUser(user);
    triggerToast('Account Registered & Encrypted', 'success');
  };

  const handleLogout = async () => {
    try {
      await secureRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // silent
    }
    localStorage.removeItem('sb_auth_token');
    localStorage.removeItem('sb_user');
    setCurrentUser(null);
    setActiveTab('telemetry');
    setShowRegister(false);
    triggerToast('Session disconnect complete', 'success');
  };

  return (
    <div className="min-h-screen bg-elegant-bg text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black antialiased relative">
      <AnimatePresence>
        {!currentUser ? (
          showRegister ? (
            <Register
              onRegisterSuccess={handleRegisterSuccess}
              onNavigateToLogin={() => setShowRegister(false)}
              showToast={triggerToast}
            />
          ) : (
            <Login
              onLoginSuccess={handleLoginSuccess}
              onNavigateToRegister={() => setShowRegister(true)}
              showToast={triggerToast}
            />
          )
        ) : (
          <div className="flex h-screen overflow-hidden">
            {/* Dynamic Dashboard Layout with Sidebar + Navbar + Content */}
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              user={currentUser}
              onLogout={handleLogout}
              dbType={stats.dbStatus}
            />

            <div className="flex-1 flex flex-col min-w-0 bg-elegant-bg">
              <Navbar
                user={currentUser}
                onLogout={handleLogout}
                dbStatus={stats.dbStatus}
              />

              <main className="flex-1 overflow-hidden flex bg-elegant-bg/60 relative">
                {activeTab === 'telemetry' && (
                  <Telemetry
                    stats={stats}
                    logs={securityLogs}
                    alerts={securityAlerts}
                    onActionTriggered={refreshTelemetryData}
                    user={currentUser}
                    showToast={triggerToast}
                  />
                )}

                {activeTab === 'transactions' && (
                  <FinanceLedger
                    transactions={transactions}
                    onActionTriggered={refreshTelemetryData}
                    user={currentUser}
                    showToast={triggerToast}
                  />
                )}

                {activeTab === 'audit-logs' && (
                  <SecurityAuditLogs
                    logs={securityLogs}
                    user={currentUser}
                  />
                )}

                {activeTab === 'sandbox' && (
                  <AttackSimulator
                    onAttackTriggered={refreshTelemetryData}
                    showToast={triggerToast}
                  />
                )}

                {activeTab === 'checklist' && (
                  <OWASPChecklist />
                )}
              </main>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Animated Toast Banner alerts overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none select-none font-mono text-[11px] uppercase tracking-wider">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className={`p-4 rounded-xl border flex items-start gap-3 shadow-2xl backdrop-blur-md pointer-events-auto ${
                t.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/20'
                  : t.type === 'error'
                    ? 'bg-rose-955/90 text-rose-300 border-rose-500/20 animate-bounce'
                    : 'bg-amber-955/90 text-amber-300 border-amber-500/20'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {t.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : t.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                ) : (
                  <Terminal className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div>
                <p className="font-bold leading-none mb-1">
                  {t.type === 'success' ? 'SYSTEM_STABLE' : t.type === 'error' ? 'SEC_BREACH_ALERT' : 'SEC_WARNING'}
                </p>
                <p className="text-slate-300 leading-relaxed font-sans">{t.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
