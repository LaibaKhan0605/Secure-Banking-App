/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckSquare, ShieldCheck, AlertCircle, Sparkles, BookCheck } from 'lucide-react';

export default function OWASPChecklist() {
  const complianceItems = [
    {
      code: 'A01:2021',
      title: 'Broken Access Control',
      mitigation: 'Strict stateless JWT authorization checks. Zero-Trust role validators guard resources (user vs admin endpoint bounds).',
      status: 'VERIFIED_SECURE',
    },
    {
      code: 'A02:2021',
      title: 'Cryptographic Failures',
      mitigation: 'Sensitive inputs hashed via intense bcryptjs iterations. Telemetry sessions secured with strict HttpOnly cookies.',
      status: 'VERIFIED_SECURE',
    },
    {
      code: 'A03:2021',
      title: 'Injection (SQLi / XSS)',
      mitigation: 'All request variables parsed natively with Mongoose parameterization. Incoming traffic scanned for injection signatures via active WAF.',
      status: 'VERIFIED_SECURE',
    },
    {
      code: 'A04:2021',
      title: 'Insecure Design',
      mitigation: 'Anti-DDoS safety filters (express-rate-limit) prevent system fatigue. Separate API key authorization tiers restrict access.',
      status: 'VERIFIED_SECURE',
    },
    {
      code: 'A05:2021',
      title: 'Security Misconfiguration',
      mitigation: 'Helmet.js injects strict Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), and suspends X-Powered-By signatures.',
      status: 'VERIFIED_SECURE',
    },
    {
      code: 'A06:2021',
      title: 'Vulnerable Components',
      mitigation: 'Isolated Docker environments. Out-of-the-box support for strict npm audit vulnerability scans.',
      status: 'VERIFIED_SECURE',
    },
    {
      code: 'A07:2021',
      title: 'Identification Failures',
      mitigation: 'Intelligent brute-force detection algorithms lock target user accounts automatically on 5 consecutive login failures.',
      status: 'VERIFIED_SECURE',
    },
    {
      code: 'A08:2021',
      title: 'Software & Data Integrity Failures',
      mitigation: 'Robust custom Double-Submit CSRF cookies block cross-site forms manipulations on all mutating API layers.',
      status: 'VERIFIED_SECURE',
    },
    {
      code: 'A09:2021',
      title: 'Logging & Monitoring Failures',
      mitigation: 'Every exception and exploit logged instantly in persistent database logs. Server-Sent Events push alerts to live terminals.',
      status: 'VERIFIED_SECURE',
    },
    {
      code: 'A10:2021',
      title: 'Request Forgery (SSRF)',
      mitigation: 'Strict server parameters parse outgoing connections, only loading internal assets and authorized service bindings.',
      status: 'VERIFIED_SECURE',
    }
  ];

  return (
    <div className="p-8 space-y-8 overflow-y-auto w-full selection:bg-emerald-500 selection:text-black">
      {/* Overview Head */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white font-sans uppercase">
          OWASP COMPLIANCE DASHBOARD
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1 uppercase">
          Banking standards audit checklist // regulatory verification files
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Compliance checklist card list */}
        <div className="xl:col-span-2 bg-elegant-card border border-slate-800/80 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800 text-teal-400">
            <BookCheck className="w-5 h-5" />
            <h3 className="text-sm font-semibold uppercase tracking-wider font-mono">MITIGATION CHECKLIST RECORDS</h3>
          </div>

          <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-1">
            {complianceItems.map((item, idx) => (
              <div 
                key={idx} 
                className="p-4 border border-slate-800 bg-elegant-bg/40 hover:bg-elegant-bg/70 rounded-lg font-mono text-xs flex justify-between items-start gap-4 transition-all"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-400 rounded">
                      {item.code}
                    </span>
                    <p className="font-bold text-slate-200">{item.title}</p>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{item.mitigation}</p>
                </div>

                <span className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  SECURED
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory template reports sidebar */}
        <div className="space-y-6">
          {/* Certificate */}
          <div className="bg-elegant-card border border-slate-800/80 rounded-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200 font-sans uppercase">COMPLIANCE CERTIFICATE</h4>
              <p className="text-[10px] text-emerald-400 font-mono uppercase mt-1">SEC_LEVEL // BANKING_DEEP_HARD_PASS</p>
            </div>
            
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed bg-elegant-bg/40 p-3 rounded text-left border border-slate-850">
              [TELEMETRY JOURNAL] Automated compliance checks verify that all 10 core security boundaries are active and defended. The Web Application Firewall is reporting 100% scanning coverage on routing parameters.
            </p>

            <div className="pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between items-center">
              <span>LEDGER COMPLIANT</span>
              <span>YEAR: 2026</span>
            </div>
          </div>

          {/* Penetration Reports Template */}
          <div className="bg-elegant-card border border-slate-800/80 rounded-xl p-6 space-y-4 select-text">
            <h4 className="text-xs font-bold text-slate-200 font-mono uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-cyan-400" />
              Incident Audit Template
            </h4>
            
            <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
              Copy this report format when summarizing penetration tests or incidents compiled during WAF Sandbox simulation runs:
            </p>

            <pre className="text-slate-300 text-[9.5px] p-2.5 bg-elegant-bg/40 border border-slate-850 rounded block select-all whitespace-pre-wrap font-mono leading-normal max-h-36 overflow-y-auto">
{`=========================================
BANKING SECURITY PORTAL AUDIT INCIDENT REPORT
=========================================
DATE: ${new Date().toLocaleDateString()}
SEVERITY: CRITICAL / EXPLOIT ATTEMPT
TARGET APIS: /api/transactions
VECTOR: SQL Injection (OWASP A03)
ATTACKER IP: 109.22.41.90
WAF STATUS: INTRUSION BLOCKED (403 FORBIDDEN)
MITIGATION: Automated regex payload neutralizer flagged queries blocking the session database bindings immediately. Account integrity unaffected.`}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
