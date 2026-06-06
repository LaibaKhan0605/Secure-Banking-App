/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertOctagon, 
  ShieldAlert, 
  Activity, 
  Radio, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Flame, 
  Info 
} from 'lucide-react';
import { secureRequest } from '../lib/api.js';
import { SecurityStats, SecurityLog, SecurityAlert } from '../types.js';

interface TelemetryProps {
  stats: SecurityStats;
  logs: SecurityLog[];
  alerts: SecurityAlert[];
  onActionTriggered: () => void;
  user: any;
  showToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
}

export default function Telemetry({ stats, logs, alerts, onActionTriggered, user, showToast }: TelemetryProps) {
  const [loading, setLoading] = useState(false);
  const isAdmin = user?.role === 'admin';

  // State to track dynamic simulated live traffic stream
  const [trafficHistory, setTrafficHistory] = useState<number[]>([15, 24, 18, 42, 31, 35, 48, 55, 39, 45, 60, 48]);

  // Push new stats value periodically to create nice ticking effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTrafficHistory(prev => {
        const next = [...prev.slice(1)];
        // Create realistic banking query drift
        const fluctuation = Math.floor(Math.random() * 19) - 8;
        const currentVal = Math.max(10, Math.min(100, prev[prev.length - 1] + fluctuation));
        next.push(currentVal);
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const handleResolveAlert = async (id: string) => {
    try {
      setLoading(true);
      await secureRequest(`/api/security/alerts/${id}/resolve`, { method: 'POST' });
      showToast('Threat remediated. Counter-measures neutralized and credentials unlocked.', 'success');
      onActionTriggered();
    } catch (e: any) {
      showToast(e.message || 'Resolution failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('WIPE CRYPTOGRAPHIC AUDIT TRAILS? This removes all active incident files.')) return;
    try {
      setLoading(true);
      await secureRequest('/api/security/clear', { method: 'POST' });
      showToast('Unified security audit clearance transaction completed successfully.', 'success');
      onActionTriggered();
    } catch (e: any) {
      showToast(e.message || 'Wipe failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper mock chart properties
  const maxTraffic = Math.max(...trafficHistory, 1);

  return (
    <div className="p-8 space-y-8 overflow-y-auto w-full selection:bg-emerald-500 selection:text-black">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans">
            SECURITY INTELLIGENCE MONITOR
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            REALtime TELEMETRY TAPPING ACTIVE // INTERCEPT INGESTION PIPELINE
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleClearAll}
              disabled={loading}
              className="px-3 py-1.5 border border-red-900 bg-red-950/10 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-mono text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              FLUSH AUDIT SLATE
            </button>
            <button
              onClick={() => { onActionTriggered(); showToast('Telemetry buffer synced.', 'success'); }}
              className="p-1.5 border border-slate-800 hover:border-slate-700 bg-elegant-card text-slate-300 rounded-lg cursor-pointer transition-colors"
              title="Manual Telemetry Flush"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Live active security alarms (Requires manual remediation/resolution!) */}
      {alerts.filter(a => a.status !== 'RESOLVED').length > 0 && (
        <div className="bg-red-950/25 border border-red-500/40 rounded-xl overflow-hidden shadow-lg animate-pulse-subtle">
          <div className="bg-red-500/10 px-6 py-4 border-b border-red-500/20 flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-semibold tracking-wide text-red-200 uppercase font-mono">
              ACTIVE THREAT SIGNALS ENTRAPPED
            </h3>
          </div>
          <div className="p-6 divide-y divide-red-950/40">
            {alerts.filter(a => a.status !== 'RESOLVED').map((alarm) => (
              <div key={alarm.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-500 text-slate-950 text-[10px] font-mono rounded font-bold uppercase">
                      {alarm.severity}
                    </span>
                    <p className="text-sm font-semibold font-mono text-white">{alarm.title}</p>
                  </div>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed pl-1">
                    {alarm.description}
                  </p>
                  <p className="text-[10px] text-red-400 font-mono pl-1 uppercase">
                    Vector: {alarm.attackType || 'Suspicious Traffic'} | Generator: {alarm.triggeredBy}
                  </p>
                </div>

                {isAdmin ? (
                  <button
                    onClick={() => handleResolveAlert(alarm.id)}
                    disabled={loading}
                    className="shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-slate-950 font-bold font-mono text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    REMEDIATE THREAT
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-red-400 italic bg-red-950/40 border border-red-900 px-3 py-1.5 rounded-lg">
                    [PENDING ADMIN OVERRIDE]
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Headline Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* Total Users Client accounts */}
        <div className="bg-elegant-card border border-slate-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-mono tracking-wider font-semibold uppercase">Accounts Vault</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-white mt-2 font-mono">
            {stats.totalUsers}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[9px] text-emerald-500 font-mono">
            <TrendingUp className="w-3 h-3" />
            <span>ACTIVE INDEX CLIENTS</span>
          </div>
        </div>

        {/* Total Transactions ledgers count */}
        <div className="bg-elegant-card border border-slate-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-mono tracking-wider font-semibold uppercase">Audit Registers</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-white mt-2 font-mono">
            {stats.totalTransactions}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[9px] text-teal-400 font-mono">
            <Activity className="w-3 h-3" />
            <span>TRANSFER HANDSHAKES</span>
          </div>
        </div>

        {/* Failed Login Attempts */}
        <div className="bg-elegant-card border border-slate-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-mono tracking-wider font-semibold uppercase">Brute Detections</span>
            <AlertOctagon className={`w-4 h-4 ${stats.failedLoginAttempts > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <p className="text-2xl font-bold tracking-tight text-white mt-2 font-mono">
            {stats.failedLoginAttempts}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>VERIFICATION DISCREPANCIES</span>
          </div>
        </div>

        {/* Active open alerts status */}
        <div className="bg-elegant-card border border-slate-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-mono tracking-wider font-semibold uppercase">Triggered Alarm</span>
            <ShieldAlert className={`w-4 h-4 ${stats.securityAlertsCount > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} />
          </div>
          <p className="text-2xl font-bold tracking-tight text-white mt-2 font-mono">
            {stats.securityAlertsCount}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[9px] font-mono uppercase">
            <span className={`w-1.5 h-1.5 rounded-full ${stats.securityAlertsCount > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <span className={stats.securityAlertsCount > 0 ? 'text-red-400' : 'text-emerald-500'}>
              {stats.securityAlertsCount > 0 ? 'Threat Mitigation Required' : 'Shield Integrity Safe'}
            </span>
          </div>
        </div>

        {/* API request counts */}
        <div className="bg-elegant-card border border-slate-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-mono tracking-wider font-semibold uppercase">API Ingest Rate</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-white mt-2 font-mono">
            {stats.apiRequestCount}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[9px] text-emerald-500 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>TOTAL SYSTEM SENSING</span>
          </div>
        </div>

        {/* Active sessions */}
        <div className="bg-elegant-card border border-slate-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-mono tracking-wider font-semibold uppercase">Auth Heartbeat</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-white mt-2 font-mono">
            {stats.activeSessions}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[9px] text-cyan-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>ENCRYPTED FLOW SEED</span>
          </div>
        </div>
      </div>

      {/* Chart and Activity logs splitting layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Real-time traffic rate-limiting indicator graph */}
        <div className="lg:col-span-3 bg-elegant-card border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h4 className="text-sm font-semibold text-slate-200 font-sans uppercase">API Ingest Traffic Fluctuations</h4>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono rounded">
                RATE LIMIT: 100 req/15m
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 font-mono mt-3 mb-6 bg-elegant-bg/40 p-2 border border-slate-800/60 rounded">
              [TELEMETRY] Dynamic query load tracker polling. Demonstrates real-time express-rate-limit tracking logic protecting endpoints.
            </p>

            {/* Custom SVG Line and Bar Chart representation */}
            <div className="h-56 w-full flex items-end gap-2.5 pt-6 relative border-b border-slate-800">
              {/* Vertical scales */}
              <div className="absolute left-0 top-0 text-[8px] font-mono text-slate-600 space-y-10 pl-1 select-none pointer-events-none">
                <p>100 Req (MAX_SATURATION_CAP)</p>
                <p>50 Req</p>
                <p>0 Req</p>
              </div>

              {trafficHistory.map((val, idx) => {
                const heightPercent = `${(val / 100) * 100}%`;
                const isHeavyLoad = val > 65;

                return (
                  <div key={idx} className="flex-1 flex flex-col justify-end items-center group h-full">
                    {/* Glowing floating label */}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400 px-1 py-0.5 rounded -translate-y-1.5 pointer-events-none mb-1">
                      {val} req
                    </span>
                    <div 
                      style={{ height: heightPercent }}
                      className={`w-full rounded-t-sm transition-all duration-700 min-h-[4px] ${
                        isHeavyLoad 
                          ? 'bg-gradient-to-t from-red-600 to-amber-500 shadow-lg shadow-red-500/20' 
                          : 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-lg shadow-emerald-500/10'
                      }`}
                    />
                    <span className="text-[8px] font-mono text-slate-500 uppercase mt-2">
                      T-{11 - idx}m
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 bg-emerald-500 rounded-sm" />
              <span>Standard Operations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-sm" />
              <span>Heavy Probe load</span>
            </div>
          </div>
        </div>

        {/* Live Attack logs stream */}
        <div className="lg:col-span-2 bg-elegant-card border border-slate-800/80 rounded-xl p-6 flex flex-col">
          <div className="pb-4 border-b border-slate-800 flex justify-between items-center">
            <h4 className="text-sm font-semibold text-slate-200 font-sans uppercase">DEEP COCHLEA CYBER INGEST</h4>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">SEC_TAP</span>
            </span>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto max-h-[17.5rem] space-y-3 pr-1 divide-y divide-slate-800/20">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs py-10">
                [NO AUDIT TRAILS LOGGED IN PIPELINE]
              </div>
            ) : (
              logs.map((log) => {
                const isCritical = ['SQL_INJECTION', 'XSS_ATTEMPT', 'PATH_TRAVERSAL', 'COMMAND_INJECTION', 'WAF_BLOCKED', 'CSRF_BLOCKED'].includes(log.eventType);
                const isWarning = ['AUTH_FAILURE', 'RATE_LIMIT', 'TRANSFER_FLAGGED'].includes(log.eventType);

                let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
                if (isCritical) badgeColor = 'bg-red-950/40 text-red-400 border-red-500/20';
                else if (isWarning) badgeColor = 'bg-amber-950/40 text-amber-500 border-amber-500/20';
                else if (log.eventType === 'AUTH_SUCCESS') badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20';

                return (
                  <div key={log.id} className="pt-3 font-mono text-[11px] space-y-1.5 leading-relaxed">
                    <div className="flex justify-between items-center gap-2">
                      <span className={`px-1.5 py-0.5 border text-[9px] rounded font-bold uppercase tracking-wider scale-95 ${badgeColor}`}>
                        {log.eventType}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 pl-0.5">{log.message}</p>
                    <div className="flex items-center gap-3 text-[9px] text-slate-500 font-normal pl-0.5 uppercase">
                      <span>IP: {log.ipAddress}</span>
                      <span className="truncate max-w-[12rem]">Resource: {log.endpoint}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
            <Info className="w-3.5 h-3.5 text-emerald-500" />
            <span>Simulate payloads under the Penetration Lab to query graphs.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
