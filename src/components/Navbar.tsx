/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Radio, ShieldCheck, Clock, User, LogOut } from 'lucide-react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  dbStatus: string;
}

export default function Navbar({ user, onLogout, dbStatus }: NavbarProps) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isMongoConnected = dbStatus === 'MongoDB';

  return (
    <header className="h-16 bg-elegant-bg border-b border-slate-800/60 px-8 flex items-center justify-between shrink-0 selection:bg-emerald-500 selection:text-black">
      {/* DB Connection status indicator */}
      <div className="flex items-center gap-3 select-none">
        <span className="flex h-2 w-2 relative">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isMongoConnected ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isMongoConnected ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
        </span>
        <p className="font-mono text-[10px] tracking-wider text-slate-400 font-semibold uppercase">
          SECURE ENCLAVE NODE // DATABASE: <span className={isMongoConnected ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>{dbStatus}</span>
        </p>
      </div>

      {/* UTC Dynamic clock and user session */}
      <div className="flex items-center gap-6">
        {/* Dynamic UTC clock */}
        <div className="hidden md:flex items-center gap-2 text-slate-500 font-mono text-[10px]">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{timeStr || 'ZULU CLOCK LOADING...'}</span>
        </div>

        {/* Status Shield */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[9px] font-mono font-bold uppercase text-emerald-400 tracking-wider">
            FIREWALLS_ACTIVE
          </span>
        </div>

        {/* User Identity widget */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-200">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:block leading-none">
            <p className="text-xs font-semibold text-slate-300 font-sans truncate max-w-[8rem]" title={user?.username}>
              u// {user?.username}
            </p>
            <p className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">{user?.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 border border-slate-850 hover:border-red-950 hover:bg-red-950/20 text-slate-550 hover:text-red-400 rounded-lg cursor-pointer transition-colors"
            title="Log Out Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
