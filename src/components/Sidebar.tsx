/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, CreditCard, Terminal, CheckSquare, LogOut, Cpu, HardDrive } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
  dbType: string;
}

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, dbType }: SidebarProps) {
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { id: 'telemetry', label: 'Monitor Telemetry', icon: Shield, adminOnly: false },
    { id: 'transactions', label: 'Finance Ledger', icon: CreditCard, adminOnly: false },
    { id: 'audit-logs', label: 'Security Logs', icon: Cpu, adminOnly: true },
    { id: 'sandbox', label: 'WAF Penetration Lab', icon: Terminal, adminOnly: false },
    { id: 'checklist', label: 'OWASP Compliance', icon: CheckSquare, adminOnly: false },
  ];

  return (
    <aside className="w-64 bg-elegant-sidebar border-r border-slate-800/60 flex flex-col justify-between shrink-0 selection:bg-emerald-500 selection:text-black">
      <div>
        {/* Logo and App name */}
        <div className="p-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] font-bold">
              <Shield className="w-4.5 h-4.5 fill-current text-slate-950" />
            </div>
            <div>
              <p className="font-sans font-bold leading-none tracking-tight text-white text-base">
                SECURE<span className="text-emerald-400">BANK</span>
              </p>
              <p className="text-[10px] font-mono text-emerald-500/80 mt-1 uppercase tracking-wider">
                CORE GATEWAY
              </p>
            </div>
          </div>
        </div>

        {/* User Identity Banner */}
        <div className="p-4 mx-4 my-5 bg-elegant-card/40 border border-slate-800/60 rounded-lg">
          <p className="text-[10px] font-mono text-slate-500 uppercase">ACCESS IDENTITY</p>
          <p className="font-mono text-slate-200 mt-1 truncate font-bold text-xs">
            u// {user?.username}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isAdmin ? 'bg-red-500' : 'bg-teal-500'}`} />
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isAdmin ? 'text-red-400' : 'text-teal-400'}`}>
              {isAdmin ? 'Privileged Admin' : 'Standard User'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-4 space-y-1.5">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-mono transition-all border outline-none text-left cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-transparent border-transparent text-slate-450 hover:text-slate-100 hover:bg-slate-800/20'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer statistics / Threat level & Database status */}
      <div className="p-4 space-y-4 border-t border-slate-800/60 bg-elegant-sidebar">
        {/* Threat Level Panel from Design HTML */}
        <div className="p-3.5 rounded-xl bg-elegant-card/40 border border-slate-800/50">
          <p className="text-[10px] text-slate-550 uppercase tracking-widest font-mono font-bold mb-1.5">Threat Level</p>
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 text-xs font-medium font-sans">Normal</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-3 bg-emerald-500/20 rounded-full"></div>
              <div className="w-1.5 h-3 bg-emerald-500/20 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <HardDrive className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <div className="flex flex-col min-w-0">
            <p className="text-[9px] font-mono text-slate-500 uppercase leading-none">DATALOGGER STATE</p>
            <p className="text-[10px] font-mono font-semibold text-emerald-400 truncate mt-1">
              {dbType}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-800/80 hover:border-red-500/40 hover:bg-red-950/20 text-slate-400 hover:text-red-400 font-mono text-xs rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          DISCONNECT
        </button>
      </div>
    </aside>
  );
}
