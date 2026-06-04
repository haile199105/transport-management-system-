import React, { useEffect, useState } from 'react';
import { LedgerState, CostCategory } from './types';
import LedgerSummary from './components/LedgerSummary';
import ManagerView from './components/ManagerView';
import OwnerView from './components/OwnerView';
import GlobalChat from './components/GlobalChat';
import ItemComments from './components/ItemComments';
import { Bus, RefreshCw, UserCheck, Shield, BookOpen, AlertCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [ledger, setLedger] = useState<LedgerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Role can be toggled by the user in this preview workspace
  const [activeRole, setActiveRole] = useState<'manager' | 'owner'>('manager');

  // Currently focused transaction for deep comment audits
  const [selectedTx, setSelectedTx] = useState<{ type: 'income' | 'cost'; id: string } | null>(null);

  // Initial load
  useEffect(() => {
    fetchLedger();

    // Setup quiet live updates polling every 8 seconds to enable real-time updates 
    // between manager (Hawassa) and uncle (Addis Ababa) without copy-pasting!
    const pollInterval = setInterval(() => {
      quietFetchLedger();
    }, 8000);

    return () => clearInterval(pollInterval);
  }, []);

  const fetchLedger = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ledger');
      if (!res.ok) throw new Error('Failed to retrieve ledger data');
      const data = await res.json();
      setLedger(data);
    } catch (err: any) {
      setError(err?.message || 'Error occurred while connecting to database server.');
    } finally {
      setLoading(false);
    }
  };

  const quietFetchLedger = async () => {
    try {
      const res = await fetch('/api/ledger');
      if (res.ok) {
        const data = await res.json();
        setLedger(data);
      }
    } catch (err) {
      console.warn('Silent sync failed (offline-mode or network lag).');
    }
  };

  const triggerRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchLedger();
    } finally {
      setRefreshing(false);
    }
  };

  // API Call: Add Income
  const handleAddIncome = async (entry: { date: string; route: string; amount: number; passengers?: number; description: string }) => {
    const res = await fetch('/api/ledger/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    if (!res.ok) throw new Error('Failed to add income log');
    const updated = await res.json();
    setLedger(updated);
  };

  // API Call: Delete Income
  const handleDeleteIncome = async (id: string) => {
    const res = await fetch(`/api/ledger/income/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete income log');
    const updated = await res.json();
    setLedger(updated);
    if (selectedTx?.id === id) {
      setSelectedTx(null);
    }
  };

  // API Call: Add Cost
  const handleAddCost = async (entry: { date: string; category: CostCategory; amount: number; description: string }) => {
    const res = await fetch('/api/ledger/cost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    if (!res.ok) throw new Error('Failed to add cost log');
    const updated = await res.json();
    setLedger(updated);
  };

  // API Call: Delete Cost
  const handleDeleteCost = async (id: string) => {
    const res = await fetch(`/api/ledger/cost/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete cost log');
    const updated = await res.json();
    setLedger(updated);
    if (selectedTx?.id === id) {
      setSelectedTx(null);
    }
  };

  // API Call: Add General / Global Comment memo
  const handleAddGlobalComment = async (text: string) => {
    const res = await fetch('/api/ledger/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: 'global',
        text,
        author: activeRole === 'manager' ? 'Mr. Haile' : 'Mr. Amare'
      })
    });
    if (!res.ok) throw new Error('Comment could not be submitted');
    const updated = await res.json();
    setLedger(updated);
  };

  // API Call: Add comment thread directly to a specific transaction
  const handleAddTxComment = async (targetType: 'income' | 'cost', targetId: string, text: string) => {
    const res = await fetch('/api/ledger/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType,
        targetId,
        text,
        author: activeRole === 'manager' ? 'Mr. Haile' : 'Mr. Amare'
      })
    });
    if (!res.ok) throw new Error('Receipt comment failed to save');
    const updated = await res.json();
    setLedger(updated);
  };

  // API Call: Save accumulated Previous Balance Net Income setting
  const handleUpdatePreviousIncome = async (amount: number) => {
    const res = await fetch('/api/ledger/previous-income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    if (!res.ok) throw new Error('Failed to update previous net balance calculation');
    const updated = await res.json();
    setLedger(updated);
  };

  // Reset database state (helps test from scratch with sample parameters)
  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset ledger logs to sample demo entries?')) {
      const res = await fetch('/api/ledger/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLedger(data);
        setSelectedTx(null);
      }
    }
  };

  // Retrieve selected transaction object securely
  const getSelectedTxObject = () => {
    if (!ledger || !selectedTx) return null;
    if (selectedTx.type === 'income') {
      return ledger.incomes.find(i => i.id === selectedTx.id) || null;
    } else {
      return ledger.costs.find(c => c.id === selectedTx.id) || null;
    }
  };

  const selectedTxObj = getSelectedTxObject();

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 flex flex-col">
      {/* Upper Navigation Bar */}
      <header className="bg-white border-b border-slate-100 shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo and subtitle */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 rounded-xl text-yellow-400">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-display font-extrabold text-sm md:text-md text-slate-900 tracking-tight leading-none">
                  Bus Ledger
                </h1>
                <p className="text-[10px] text-slate-400 mt-0.5">Hawassa starting service console</p>
              </div>
            </div>

            {/* Premium Role Toggler (Active Sync Mode Select) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveRole('manager')}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-display font-bold transition-all flex items-center gap-1.5 ${
                  activeRole === 'manager'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-950'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Mr. Haile (Manager, Hawassa)</span>
              </button>
              <button
                onClick={() => setActiveRole('owner')}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-display font-bold transition-all flex items-center gap-1.5 ${
                  activeRole === 'owner'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-950'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Mr. Amare (Owner, Addis Ababa)</span>
              </button>
            </div>

            {/* Sync Refresh controls */}
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                Live Sync
              </span>

              <button
                onClick={triggerRefresh}
                disabled={loading || refreshing}
                className="p-2 bg-slate-50 border border-slate-150 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                title="Force refresh database logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex-1 w-full space-y-6">
        
        {/* Connection status warning */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-rose-800">Server Connection Disturbance</h4>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              <button
                onClick={fetchLedger}
                className="mt-2 text-[11px] font-bold text-rose-800 underline hover:text-rose-950 cursor-pointer"
              >
                Retry handshake
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-800 border-t-transparent" />
            <p className="text-xs text-slate-500 font-medium">Reconciling ledger data records...</p>
          </div>
        ) : ledger ? (
          <div className="space-y-6">
            
            {/* Context Notice regarding how to use */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-sm flex items-center gap-1">
                  🌐 Real-Time Bus ledger Portal (Starts: Hawassa &mdash; AA &bull; Wolayta &bull; Butajira)
                </h3>
                <p className="text-xs text-slate-300 max-w-4xl">
                  This system enables dual-access synchronization. Mr. Haile in Hawassa can enter all ticket receipts & station fees. 
                  Mr. Amare in Addis Ababa visits this exact web address to monitor stats and add comments instantly. 
                  Zero messages are lost, zero paper copy needed.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleResetData}
                  className="bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition-all font-semibold"
                >
                  Load Sample Defaults
                </button>
              </div>
            </div>

            {/* Summary Analytical Bento Section */}
            <LedgerSummary
              ledger={ledger}
              onUpdatePreviousIncome={handleUpdatePreviousIncome}
              role={activeRole}
            />

            {/* Split layout: Activity Forms & Lists VS Global Chat noticedboard */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              <div className="xl:col-span-8">
                {activeRole === 'manager' ? (
                  <ManagerView
                    ledger={ledger}
                    onAddIncome={handleAddIncome}
                    onDeleteIncome={handleDeleteIncome}
                    onAddCost={handleAddCost}
                    onDeleteCost={handleDeleteCost}
                    onSelectTransaction={(type, id) => setSelectedTx({ type, id })}
                  />
                ) : (
                  <OwnerView
                    ledger={ledger}
                    onSelectTransaction={(type, id) => setSelectedTx({ type, id })}
                  />
                )}
              </div>

              {/* Real-time chat side Panel */}
              <div className="xl:col-span-4">
                <GlobalChat
                  comments={ledger.globalComments}
                  onAddGlobalComment={handleAddGlobalComment}
                  role={activeRole}
                />
                
                {/* Info Card describing how to move to Supabase later */}
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 mt-6">
                  <h4 className="text-amber-800 font-display font-semibold text-xs flex items-center gap-1 leading-none">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    Custom Supabase Prompt
                  </h4>
                  <p className="text-[11px] text-amber-700 mt-1.5 leading-relaxed">
                    Check the very bottom of the response details for your ready-to-run 
                     Vercel + Supabase setup prompt to claim production-grade standalone deployment!
                  </p>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="py-24 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-semibold text-slate-700 mt-3 text-sm">Failed to assemble state</h3>
          </div>
        )}

      </main>

      {/* Transaction specific Modal Thread panel */}
      <AnimatePresence>
        {selectedTxObj && selectedTx && (
          <ItemComments
            transaction={selectedTxObj}
            type={selectedTx.type}
            role={activeRole}
            onAddComment={handleAddTxComment}
            onClose={() => setSelectedTx(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
