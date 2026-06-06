/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CreditCard, Send, ShieldAlert, ArrowDownLeft, ArrowUpRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { secureRequest } from '../lib/api.js';
import { Transaction } from '../types.js';

interface FinanceLedgerProps {
  transactions: Transaction[];
  onActionTriggered: () => void;
  user: any;
  showToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
}

export default function FinanceLedger({ transactions, onActionTriggered, user, showToast }: FinanceLedgerProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [transType, setTransType] = useState<'deposit' | 'withdrawal' | 'transfer'>('transfer');

  const isAdmin = user?.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please specify a positive numerical transfer amount.', 'error');
      return;
    }

    if (transType === 'transfer' && !recipient) {
      showToast('Recipient audit address must be specified for transfers.', 'warning');
      return;
    }

    // High AML Suspicion warning
    if (parsedAmount >= 10000) {
      const consent = window.confirm(
        `[WARNING] COMPLIANCE NOTICE:\n\nTransactions exceeding $10,000 are subject to automatic federal and banking Anti-Money Laundering (AML) audit holds.\n\nDo you wish to submit this for compliance auditing?`
      );
      if (!consent) return;
    }

    setLoading(true);

    try {
      const data = await secureRequest('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedAmount,
          type: transType,
          recipient: transType === 'transfer' ? recipient : 'Self Ledger'
        })
      });

      if (parsedAmount >= 10000) {
        showToast(data.message || 'Transaction flagged by Risk Mitigation systems.', 'warning');
      } else {
        showToast('Ledger balance synchronized successfully.', 'success');
      }

      setAmount('');
      setRecipient('');
      onActionTriggered();
    } catch (e: any) {
      showToast(e.message || 'Transaction rejected by billing gateway.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto w-full selection:bg-emerald-500 selection:text-black">
      {/* Overview Head */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white font-sans uppercase">
          Finance Cryptographic Ledger
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1 uppercase">
          Zero-Trust Asset Transfers // End-To-End Integrity Controls
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
        {/* Ledger Submit tool */}
        <div className="xl:col-span-2 bg-elegant-card border border-slate-800/80 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800 text-teal-400">
            <CreditCard className="w-5 h-5 animate-pulse" />
            <h3 className="text-sm font-semibold uppercase tracking-wider font-mono">AUTHORIZED ASSET HANDSHAKE</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-2">OPERATION CATEGORY</label>
              <div className="grid grid-cols-3 gap-2">
                {(['transfer', 'deposit', 'withdrawal'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTransType(type)}
                    className={`py-2 px-3 border capitalize rounded-lg transition-colors cursor-pointer ${
                      transType === type
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold'
                        : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-2">Asset Volume (USD)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-elegant-bg/60 border border-slate-800 focus:border-emerald-500 rounded-lg py-2.5 pl-8 pr-4 text-white focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Recipient Account (Only on Transfer!) */}
            {transType === 'transfer' && (
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">AUDIT DESCRIPTOR / RECIPIENT</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. federal_reserve_account"
                  className="w-full bg-elegant-bg/60 border border-slate-800 focus:border-emerald-500 rounded-lg py-2.5 px-4 text-white focus:outline-none transition-colors"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 py-3 rounded-lg font-bold text-slate-950 tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  EXECUTE TRANSFER LEDGER
                </>
              )}
            </button>
          </form>

          <div className="bg-elegant-bg/40 border border-slate-800/80 rounded-lg p-3 text-[10px] leading-relaxed text-slate-500 font-mono">
            <p className="text-emerald-500/80 font-bold uppercase mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Hardened Input Guidelines
            </p>
            <p>
              Under zero-trust constraints, all amount fields are thoroughly sanitized server-side. Attempts to pass SQL commands or script tags will immediately lock transaction structures and summon the Security WAF response.
            </p>
          </div>
        </div>

        {/* Ledger Transaction History list */}
        <div className="xl:col-span-3 bg-elegant-card border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h4 className="text-sm font-semibold text-slate-200 font-sans uppercase">SECURE TRANSFER STATEMENTS</h4>
              {isAdmin && (
                <span className="px-2 py-0.5 bg-red-950 text-red-400 text-[10px] font-mono border border-red-900 rounded select-none uppercase font-bold">
                  GLOBAL PRIVILEGE VIEWER
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 font-mono mt-3 mb-5 bg-elegant-bg/40 p-2.5 border border-slate-800 rounded leading-relaxed">
              {isAdmin 
                ? '[ROLE: ADMIN] Displaying combined auditing files across all cryptographic banking profiles.'
                : `[ROLE: STANDARD] Displaying authenticated local records for your access ID u//${user?.username}.`
              }
            </p>

            <div className="overflow-y-auto max-h-[22rem] pr-1 space-y-3">
              {transactions.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs py-14">
                  [NO ASSET TRANSACTIONS IN LEDGER]
                </div>
              ) : (
                transactions.map((t) => {
                  const isDeposit = t.type === 'deposit';
                  const isFlagged = t.status === 'flagged';

                  return (
                    <div 
                      key={t.id} 
                      className={`p-3.5 border rounded-lg font-mono text-xs flex justify-between items-center gap-3 transition-colors ${
                        isFlagged 
                          ? 'border-red-500/20 bg-red-950/10' 
                          : 'border-slate-800/80 bg-elegant-bg/20 hover:bg-elegant-bg/40'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isFlagged 
                            ? 'bg-red-950 text-red-500 border border-red-500/25' 
                            : isDeposit 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/10' 
                              : 'bg-teal-950 text-teal-400 border border-teal-500/10'
                        }`}>
                          {isFlagged ? (
                            <ShieldAlert className="w-4 h-4" />
                          ) : isDeposit ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-200 capitalize">{t.type}</p>
                            {isFlagged && (
                              <span className="px-1 bg-red-600 text-slate-950 text-[9px] font-bold uppercase rounded leading-none select-none">
                                SUSPENDED
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[10px] text-slate-400 mt-1">
                            {t.type === 'transfer' 
                              ? `To: ${t.recipient || 'N/A'}` 
                              : `Source Ledger: Self Wallet`
                            }
                          </p>

                          {isAdmin && (
                            <p className="text-[9px] text-slate-500 mt-0.5">
                              OWNER ID: u// {t.username}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`font-bold font-mono text-sm ${
                          isFlagged 
                            ? 'text-red-400' 
                            : isDeposit 
                              ? 'text-emerald-400' 
                              : 'text-slate-300'
                        }`}>
                          {isDeposit ? '+' : '-'}${parseFloat(t.amount.toString()).toFixed(2)}
                        </p>
                        <p className="text-[8px] text-slate-500 mt-1">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
