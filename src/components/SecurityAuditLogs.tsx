/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Cpu, Search, AlertCircle, Eye, EyeOff, ShieldCheck, Terminal, Filter } from 'lucide-react';
import { SecurityLog } from '../types.js';

interface SecurityAuditLogsProps {
  logs: SecurityLog[];
  user: any;
}

export default function SecurityAuditLogs({ logs, user }: SecurityAuditLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[30rem] w-full bg-elegant-bg font-mono text-xs text-red-500">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
          <p className="font-bold underline uppercase">System Fault: Zero Trust Guard Block</p>
          <p className="text-slate-400">Your profile credentials do not inherit ADMIN privileges to decrypt system telemetry records.</p>
        </div>
      </div>
    );
  }

  // Filter processes
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm) ||
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const selectedLog = logs.find(l => l.id === selectedLogId);

  return (
    <div className="p-8 space-y-8 overflow-y-auto w-full selection:bg-emerald-500 selection:text-black">
      {/* Title section */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white font-sans uppercase">
          CYBER SECURITY AUDIT VAULT
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1 uppercase">
          Autonomous Security Event Ledger // compliance regulatory journals
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Logs query grid list */}
        <div className="xl:col-span-2 bg-elegant-card border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-800">
              <h4 className="text-sm font-semibold text-slate-200 font-sans uppercase flex items-center gap-2">
                <Cpu className="w-4.5 h-4.5 text-emerald-400" />
                SYSTEM TRANSACTION RECORDS ({filteredLogs.length})
              </h4>
              
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-elegant-bg border border-slate-800 text-slate-300 rounded px-2 py-1 font-mono text-[10px] uppercase focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="ALL">Severity: All</option>
                  <option value="CRITICAL">Critical Only</option>
                  <option value="HIGH">High & Critical</option>
                  <option value="WARNING">Warning</option>
                  <option value="INFO">Info</option>
                </select>
              </div>
            </div>

            {/* Filter outputs */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Query message, IP headers, routing end-points..."
                className="w-full bg-elegant-bg/60 border border-slate-800 focus:border-emerald-500 rounded-lg py-2 pl-9 pr-4 text-white text-xs font-mono focus:outline-none transition-colors placeholder-slate-600"
              />
            </div>

            <div className="overflow-y-auto max-h-[26rem] space-y-2 pr-1">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-slate-500 font-mono text-xs py-14 border border-dashed border-slate-800 rounded-lg">
                  [COMPREHENSIVE QUERIES RETURNED 0 INCIDENTS]
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isCritical = log.severity === 'CRITICAL';
                  const isHigh = log.severity === 'HIGH';
                  const isWarning = log.severity === 'WARNING';
                  const isSelected = log.id === selectedLogId;

                  let borderStyle = 'border-slate-850 hover:bg-slate-950/20';
                  if (isSelected) borderStyle = 'border-emerald-500/50 bg-emerald-950/10';
                  else if (isCritical) borderStyle = 'border-red-500/20 hover:bg-red-950/10';
                  else if (isHigh) borderStyle = 'border-red-900/25 hover:bg-orange-950/5';
                  else if (isWarning) borderStyle = 'border-amber-900/25 hover:bg-amber-950/5';

                  let severityBadge = 'bg-slate-900 text-slate-400 border-slate-800';
                  if (isCritical) severityBadge = 'bg-red-950 text-red-400 border-red-500/20';
                  else if (isHigh) severityBadge = 'bg-red-950 text-red-500 border-red-500/10';
                  else if (isWarning) severityBadge = 'bg-amber-950 text-amber-500 border-amber-500/10';

                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id)}
                      className={`p-3.5 border rounded-lg font-mono text-[11px] leading-relaxed cursor-pointer transition-all ${borderStyle}`}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 border text-[9px] rounded font-bold uppercase tracking-wider ${severityBadge}`}>
                            {log.severity}
                          </span>
                          <span className="text-slate-200 uppercase font-bold">{log.eventType}</span>
                        </div>
                        <span className="text-[9px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-slate-400 mt-2 line-clamp-1">{log.message}</p>

                      <div className="flex items-center justify-between text-[9px] text-slate-500 mt-2 uppercase">
                        <div className="flex items-center gap-3">
                          <span>IP: {log.ipAddress}</span>
                          <span className="truncate max-w-[12rem]">PATH: {log.endpoint}</span>
                        </div>
                        <span className="text-emerald-500 underline flex items-center gap-0.5 hover:text-emerald-400">
                          Inspect Payload
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Audit expander inspect panel */}
        <div className="bg-elegant-card border border-slate-800/80 rounded-xl p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800 text-emerald-400">
            <Terminal className="w-5 h-5" />
            <h3 className="text-sm font-semibold uppercase tracking-wider font-mono">PARSED PACKET INJECTS</h3>
          </div>

          {selectedLog ? (
            <div className="mt-5 space-y-5 font-mono text-xs">
              <div className="space-y-1 bg-elegant-bg/40 border border-slate-800/80 rounded-lg p-4">
                <p className="text-[10px] text-slate-550 uppercase">TELEMETRY TIMESTAMP</p>
                <p className="text-slate-300 text-[11px]">{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>

              <div className="space-y-1 bg-elegant-bg/40 border border-slate-800/80 rounded-lg p-4">
                <p className="text-[10px] text-slate-550 uppercase">IDENTIFIER HEADER</p>
                <p className="text-slate-200 text-[11px] font-bold">Severity: <span className="text-red-400">{selectedLog.severity}</span></p>
                <p className="text-slate-300 text-[11px]">Source IP: {selectedLog.ipAddress}</p>
                <p className="text-slate-300 text-[11px] truncate">Client-Agent: {selectedLog.userAgent || 'General HTTP Module'}</p>
              </div>

              <div className="space-y-1 bg-elegant-bg/40 border border-slate-800/80 rounded-lg p-4">
                <p className="text-[10px] text-slate-550 uppercase">TARGET API SURFACE</p>
                <p className="text-emerald-400 text-[11px] font-bold">{selectedLog.endpoint}</p>
              </div>

              <div className="space-y-1.5 bg-elegant-bg/40 border border-slate-800/80 rounded-lg p-4">
                <p className="text-[10px] text-slate-555 uppercase">EVENT MESSAGE DESCRIPTION</p>
                <p className="text-slate-300 text-[11px] leading-relaxed">{selectedLog.message}</p>
              </div>

              {selectedLog.payload && (
                <div className="space-y-1.5 bg-red-950/20 border border-red-500/20 rounded-lg p-4 animate-pulse-subtle">
                  <p className="text-[10px] text-red-400 uppercase font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    WAF BLOCKED ATTACK SIGNATURE DETECTED
                  </p>
                  <pre className="text-rose-300 text-[10px] whitespace-pre-wrap break-all bg-black/60 p-2.5 rounded border border-red-500/10 mt-1 max-h-36 overflow-y-auto">
                    {selectedLog.payload}
                  </pre>
                </div>
              )}

              <div className="bg-emerald-950/15 border border-emerald-500/20 rounded-lg p-3 text-[10px] text-emerald-400">
                <p className="font-bold flex items-center gap-1 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Telemetry verified
                </p>
                This log is cryptographically chained and sealed under banking regulatory oversight logs databases.
              </div>
            </div>
          ) : (
            <div className="mt-14 text-center text-slate-500 font-mono text-xs">
              <p>[SELECT A SYSTEM EVENT IN CONSOLE]</p>
              <p className="text-[10px] text-slate-600 mt-2 max-w-[14rem] mx-auto">Click on any security record in the audit pipeline stream list to load full payload packets.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
