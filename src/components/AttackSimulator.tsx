/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Terminal as CodeIcon, 
  Flame, 
  Send, 
  Code2, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  BookOpen, 
  FileText 
} from 'lucide-react';
import { secureRequest } from '../lib/api.js';

interface AttackSimulatorProps {
  onAttackTriggered: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
}

export default function AttackSimulator({ onAttackTriggered, showToast }: AttackSimulatorProps) {
  const [loading, setLoading] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'SECURE BANKING PENETRATION SANDBOX PROTOCOL INITIALIZED...',
    'READY: Select a threat vector below to execute WAF test payloads.',
    'IP SOURCE SPOOF: Rogue Nodes [109.22.41.90]'
  ]);

  const [activeManualPayload, setActiveManualPayload] = useState("'; SELECT * FROM users WHERE role='admin' --");

  const runSimulation = async (type: 'SQL_INJECTION' | 'XSS_ATTEMPT' | 'RATE_LIMIT_FLOOD') => {
    setLoading(true);
    setTerminalOutput(prev => [...prev, `\n>> EXECUTING ATTACK VECTOR: ${type}...`]);

    try {
      // Direct post to threat simulator endpoint in routes.ts!
      const res = await secureRequest('/api/security/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attackType: type })
      });

      // If somehow successful (should be blocked in some forms)
      setTerminalOutput(prev => [
        ...prev,
        `[!] GATEWAY PROBE COMPLETED. RECEIVED STATUS RAW SUCCESS?`,
        `RESPONSE: ${JSON.stringify(res, null, 2)}`
      ]);
    } catch (err: any) {
      console.error(err);
      
      const statusText = err.status === 403 
        ? '🔴 WAF INTRUSION DETECTED (HTTP 403 FORBIDDEN)' 
        : err.status === 429 
          ? '⚠️ RATE LIMIT SATURATED (HTTP 429 TOO MANY REQUESTS)' 
          : `SYSTEM WARNING (HTTP ${err.status || 500})`;

      setTerminalOutput(prev => [
        ...prev,
        `[+] RAW TELEMETRY BLOCK RECEIVED:`,
        statusText,
        `EXPLAIN: ${err.message || 'Intrusion successfully isolated.'}`,
        `ACTION: Packet discarded. Connection closed. Threat alerts fired.`
      ]);
      
      showToast(err.message || 'WAF Isolated security incident.', 'warning');
    } finally {
      setLoading(false);
      onAttackTriggered(); // Triggers refresh of telemetry and global stats reactively!
    }
  };

  const executeManualPayload = async () => {
    if (!activeManualPayload.trim()) return;
    setLoading(true);
    setTerminalOutput(prev => [...prev, `\n>> SENDING INJECT VALUE: "${activeManualPayload}"...`]);

    try {
      // Route manually through our transfer endpoint to verify real WAF check!
      await secureRequest('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 100, type: 'transfer', recipient: activeManualPayload })
      });

      setTerminalOutput(prev => [
        ...prev,
        '[-] Success. No active structural WAF pattern triggered.',
        'HINT: Only specific harmful keywords or symbols trigger blocking structures.'
      ]);
      showToast('Payload cleared by validation guidelines.', 'success');
    } catch (err: any) {
      setTerminalOutput(prev => [
        ...prev,
        '🔴 INGEST THREAT BLOCKED BY WEB APPLICATION FIREWALL',
        `EXPLAIN: ${err.message || 'Blocked suspicious structure.'}`,
        'ACTION: Connection dropped.'
      ]);
      showToast(err.message || 'WAF Intercept matched.', 'error');
    } finally {
      setLoading(false);
      onAttackTriggered();
    }
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto w-full selection:bg-emerald-500 selection:text-black">
      {/* Overview */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white font-sans uppercase">
          WAF PENETRATION SANBOX LAB
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1 uppercase">
          Vulnerability assessment // threat simulation testing tools
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
        {/* Simulator controls */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-elegant-card border border-slate-800/80 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800 text-red-400">
              <Flame className="w-5 h-5 animate-bounce" />
              <h3 className="text-sm font-semibold uppercase tracking-wider font-mono">THREAT VECTOR GENERATORS</h3>
            </div>

            <p className="text-xs text-slate-400 font-mono leading-relaxed bg-elegant-bg/40 p-3 rounded border border-slate-800/50">
              Click any tool below to simulate active exploit packets. These requests compile standard attack vectors and send them to the server API nodes, directly testing WAF and rate-limiting enforcement rules.
            </p>

            <div className="space-y-3 font-mono text-xs">
              {/* SQL injection */}
              <button
                onClick={() => runSimulation('SQL_INJECTION')}
                disabled={loading}
                className="w-full bg-elegant-bg hover:bg-red-950/20 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-500/30 py-3 px-4 rounded-lg flex items-center justify-between transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Code2 className="w-4.5 h-4.5 shrink-0" />
                  <div>
                    <p className="font-bold">SQL Injection Exploit</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Vector payload: '; SELECT * --</p>
                  </div>
                </div>
                <span className="text-[9px] bg-red-900/10 text-red-400 px-1.5 py-0.5 border border-red-500/15 rounded">CRITICAL</span>
              </button>

              {/* XSS exploit */}
              <button
                onClick={() => runSimulation('XSS_ATTEMPT')}
                disabled={loading}
                className="w-full bg-elegant-bg hover:bg-orange-950/20 text-slate-300 hover:text-orange-400 border border-slate-800 hover:border-orange-500/30 py-3 px-4 rounded-lg flex items-center justify-between transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <div>
                    <p className="font-bold">Session Stealing XSS</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Vector payload: &lt;script&gt;alert(1)</p>
                  </div>
                </div>
                <span className="text-[9px] bg-orange-900/10 text-orange-400 px-1.5 py-0.5 border border-orange-500/15 rounded">HIGH</span>
              </button>

              {/* DDoS requests flood */}
              <button
                onClick={() => runSimulation('RATE_LIMIT_FLOOD')}
                disabled={loading}
                className="w-full bg-elegant-bg hover:bg-amber-950/20 text-slate-300 hover:text-amber-400 border border-slate-800 hover:border-amber-500/30 py-3 px-4 rounded-lg flex items-center justify-between transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <RefreshCw className="w-4.5 h-4.5 shrink-0" />
                  <div>
                    <p className="font-bold">DDoS Overload Flood</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Rapid burst flooding limit windows</p>
                  </div>
                </div>
                <span className="text-[9px] bg-amber-900/10 text-amber-400 px-1.5 py-0.5 border border-amber-500/15 rounded">WARNING</span>
              </button>
            </div>
          </div>

          {/* Manual input sandbox */}
          <div className="bg-elegant-card border border-slate-800/80 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 text-slate-300 border-b border-slate-800 font-mono text-xs font-bold uppercase">
              Custom Injection Vector
            </div>
            
            <p className="text-[11px] text-slate-500 font-mono">
              Test your own malicious patterns inside the transaction ledger transfer fields:
            </p>

            <div className="space-y-3 font-mono text-xs">
              <input
                type="text"
                value={activeManualPayload}
                onChange={(e) => setActiveManualPayload(e.target.value)}
                placeholder="e.g. <script>alert('hack')</script>"
                className="w-full bg-elegant-bg border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-red-500/40 text-[11px]"
              />
              <button
                onClick={executeManualPayload}
                disabled={loading || !activeManualPayload}
                className="w-full bg-elegant-bg hover:bg-elegant-card text-slate-200 border border-slate-800 py-2 rounded-lg font-bold hover:text-emerald-400 hover:border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                EXECUTE CUSTOM BURSTS
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Sandbox terminal interface output */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-2xl">
            {/* Terminal Top bar */}
            <div className="bg-elegant-card px-4 py-2 flex items-center justify-between border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <CodeIcon className="w-4.5 h-4.5 text-slate-400 animate-pulse" />
                <span className="font-mono text-xs font-semibold text-slate-400">interactive_exploit_panel.sh</span>
              </div>
              <div className="flex items-center gap-1.5 select-none text-slate-650 font-sans font-extrabold text-xs">
                <span>●</span> <span>●</span> <span>●</span>
              </div>
            </div>

            {/* Scrolling console */}
            <div className="p-5 h-80 overflow-y-auto bg-elegant-bg/95 font-mono text-[10px] leading-relaxed text-emerald-400 space-y-1">
              {terminalOutput.map((line, idx) => {
                if (line.startsWith('🔴') || line.includes('WAF INTRUSION')) {
                  return <pre key={idx} className="text-red-500 whitespace-pre-wrap font-bold bg-red-950/15 p-2 border border-red-500/10 rounded my-1 animate-pulse-subtle">{line}</pre>;
                }
                if (line.startsWith('[+]') || line.startsWith('EXPLAIN:')) {
                  return <pre key={idx} className="text-amber-400 whitespace-pre-wrap">{line}</pre>;
                }
                if (line.startsWith('>>')) {
                  return <pre key={idx} className="text-cyan-400 font-bold whitespace-pre-wrap mt-2">{line}</pre>;
                }
                return <pre key={idx} className="whitespace-pre-wrap text-slate-350">{line}</pre>;
              })}
            </div>
          </div>

          {/* Educational Instructions sections (SQLMap & Burp Suite configurations) */}
          <div className="bg-elegant-card border border-slate-800/80 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800 text-teal-400">
              <BookOpen className="w-5 h-5" />
              <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">INDUSTRY STANDARD AUDITING MANUALS</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-[11px] leading-relaxed select-text">
              {/* SQLMap */}
              <div className="space-y-3 bg-elegant-bg/40 border border-slate-800/80 rounded-lg p-4">
                <div className="flex items-center gap-1.5 text-amber-500 font-bold uppercase">
                  <Code2 className="w-4 h-4" />
                  SQLMap Assessment Manual
                </div>
                <p className="text-slate-400">
                  Verify parameter hardening by running sqlmap utility against transaction search routes:
                </p>
                <div className="bg-black/80 rounded p-2 text-[10px] text-slate-300 border border-slate-850 overflow-x-auto select-all">
                  sqlmap -u "https://bank.secure/api/transactions?search=1" \
                  --headers="Authorization: Bearer [JWT]" \
                  --dbms=mysql --batch --dump
                </div>
                <p className="text-[10px] text-slate-500">
                  Guidance: The parameterized mongoose logic ensures payload encapsulation, making injection attempts physically inert.
                </p>
              </div>

              {/* Burp Suite */}
              <div className="space-y-3 bg-elegant-bg/40 border border-slate-800/80 rounded-lg p-4">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase">
                  <FileText className="w-4 h-4" />
                  Burp Suite Interceptions
                </div>
                <p className="text-slate-400">
                  Analyze and decrypt TLS streams using the Burp proxy router parameters:
                </p>
                <ul className="list-disc leading-loose list-inside pl-1 text-slate-400 text-[10px]">
                  <li>Configure proxy listener to <code className="text-slate-300">127.0.0.1:8080</code></li>
                  <li>Import PortSwigger Authority certificate</li>
                  <li>In Reptar tab, fuzz header indices: <code className="text-teal-400">X-XSRF-TOKEN</code></li>
                </ul>
                <p className="text-[10px] text-slate-500">
                  Detection: The double-submit CSRF checks throw immediate 403 blocks for unauthorized state mutations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
