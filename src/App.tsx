import React, { useEffect, useState } from 'react';
import { LedgerState, CostCategory } from './types';
import LedgerSummary from './components/LedgerSummary';
import ManagerView from './components/ManagerView';
import OwnerView from './components/OwnerView';
import GlobalChat from './components/GlobalChat';
import ItemComments from './components/ItemComments';
import { Bus, RefreshCw, UserCheck, Shield, BookOpen, AlertCircle, HelpCircle, Database, CheckCircle, Lock, LayoutDashboard, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isSupabaseConfigured, fetchLedgerFromSupabase, saveLedgerToSupabase } from './supabaseClient';
import PINOverlay from './components/PINOverlay';
import { formatGregorianToEthiopian, getTodayGregorianStr } from './utils/ethiopianCalendar';

const INITIAL_FALLBACK_STATE: LedgerState = {
  previousNetIncome: 120000,
  incomes: [
    {
      id: "inc-1",
      date: "2026-06-01",
      route: "Hawassa to Wolayta Sodo",
      tripType: "One-Way",
      amount: 18500,
      passengers: 45,
      description: "Full trip morning tickets",
      comments: [
        {
          id: "c-1",
          author: "Mr. Amare",
          text: "Very good passenger count today. Let's maintain this.",
          timestamp: "2026-06-01T14:30:00Z"
        }
      ]
    },
    {
      id: "inc-2",
      date: "2026-06-02",
      route: "Hawassa to Butajira",
      tripType: "Round-Trip",
      amount: 14200,
      passengers: 38,
      description: "Afternoon express service",
      comments: []
    }
  ],
  costs: [
    {
      id: "cost-1",
      date: "2026-06-01",
      category: "Fuel",
      amount: 6800,
      description: "60 Liters Diesel fuel refilling",
      comments: []
    },
    {
      id: "cost-2",
      date: "2026-06-01",
      category: "Driver Food",
      amount: 450,
      description: "Lunch and water for driver and conductor",
      comments: []
    },
    {
      id: "cost-3",
      date: "2026-06-02",
      category: "Terminal & Station Cost",
      amount: 800,
      description: "Hawassa terminal exit tax and association fee",
      comments: []
    },
    {
      id: "cost-4",
      date: "2026-06-03",
      category: "Mechanical & Oil",
      amount: 3200,
      description: "Engine Oil replacement & filter clean",
      comments: [
        {
          id: "c-2",
          author: "Mr. Amare",
          text: "Did you use the synthetic oil or regular? Synthetic lasts longer.",
          timestamp: "2026-06-03T09:12:00Z"
        },
        {
          id: "c-3",
          author: "Mr. Haile",
          text: "Yes, we purchased the Premium Synthetic grade oil. Next change matches 5000km.",
          timestamp: "2026-06-03T11:45:00Z"
        }
      ]
    }
  ],
  globalComments: [
    {
      id: "gc-1",
      author: "Mr. Amare",
      text: "Welcome to our new joint dashboard! Haile, always log fuel and driver daily pay immediately so we don't forget.",
      timestamp: "2026-06-03T08:00:00Z"
    }
  ]
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('bus_ledger_authenticated') === 'true';
  });
  const [ledger, setLedger] = useState<LedgerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Role can be toggled by the user in this preview workspace
  const [activeRole, setActiveRole] = useState<'manager' | 'owner'>('manager');

  // Multi-tab layout state
  const [activeTab, setActiveTab] = useState<'console' | 'history'>('console');

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
      if (isSupabaseConfigured()) {
        const data = await fetchLedgerFromSupabase();
        if (data) {
          setLedger(data);
        } else {
          // If Supabase is active but table state is blank, let's auto-seed it with initial state
          await saveLedgerToSupabase(INITIAL_FALLBACK_STATE);
          setLedger(INITIAL_FALLBACK_STATE);
        }
        return;
      }

      // Normal sandbox server mode fallback
      const res = await fetch('/api/ledger');
      if (!res.ok) throw new Error('Failed to retrieve ledger data');
      const data = await res.json();
      setLedger(data);
    } catch (err: any) {
      if (isSupabaseConfigured()) {
        setError('Connected to Supabase but failed to read table. Ensure you created your "bus_ledger" table in Supabase SQL editor!');
      } else {
        setError(err?.message || 'Error occurred while connecting to database server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const quietFetchLedger = async () => {
    try {
      if (isSupabaseConfigured()) {
        const data = await fetchLedgerFromSupabase();
        if (data) {
          setLedger(data);
        }
        return;
      }

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
  const handleAddIncome = async (entry: { date: string; route: string; tripType?: 'One-Way' | 'Round-Trip'; amount: number; passengers?: number; description: string }) => {
    if (isSupabaseConfigured() && ledger) {
      const updated: LedgerState = {
        ...ledger,
        incomes: [
          ...ledger.incomes,
          {
            id: 'inc-' + Date.now(),
            date: entry.date,
            route: entry.route,
            tripType: entry.tripType,
            amount: entry.amount,
            passengers: entry.passengers,
            description: entry.description,
            comments: []
          }
        ]
      };
      const saved = await saveLedgerToSupabase(updated);
      setLedger(saved);
      return;
    }

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
    if (isSupabaseConfigured() && ledger) {
      const updated: LedgerState = {
        ...ledger,
        incomes: ledger.incomes.filter(i => i.id !== id)
      };
      const saved = await saveLedgerToSupabase(updated);
      setLedger(saved);
      if (selectedTx?.id === id) {
        setSelectedTx(null);
      }
      return;
    }

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
    if (isSupabaseConfigured() && ledger) {
      const updated: LedgerState = {
        ...ledger,
        costs: [
          ...ledger.costs,
          {
            id: 'cost-' + Date.now(),
            ...entry,
            comments: []
          }
        ]
      };
      const saved = await saveLedgerToSupabase(updated);
      setLedger(saved);
      return;
    }

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
    if (isSupabaseConfigured() && ledger) {
      const updated: LedgerState = {
        ...ledger,
        costs: ledger.costs.filter(c => c.id !== id)
      };
      const saved = await saveLedgerToSupabase(updated);
      setLedger(saved);
      if (selectedTx?.id === id) {
        setSelectedTx(null);
      }
      return;
    }

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
    const author = activeRole === 'manager' ? 'Mr. Haile' : 'Mr. Amare';
    if (isSupabaseConfigured() && ledger) {
      const updated: LedgerState = {
        ...ledger,
        globalComments: [
          ...ledger.globalComments,
          {
            id: 'gc-' + Date.now(),
            author,
            text,
            timestamp: new Date().toISOString()
          }
        ]
      };
      const saved = await saveLedgerToSupabase(updated);
      setLedger(saved);
      return;
    }

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
    const author = activeRole === 'manager' ? 'Mr. Haile' : 'Mr. Amare';
    
    if (isSupabaseConfigured() && ledger) {
      const newComment = {
        id: 'c-' + Date.now(),
        author,
        text,
        timestamp: new Date().toISOString()
      };
      
      const updated: LedgerState = {
        ...ledger,
        incomes: targetType === 'income' 
          ? ledger.incomes.map(item => item.id === targetId ? { ...item, comments: [...item.comments, newComment] } : item)
          : ledger.incomes,
        costs: targetType === 'cost'
          ? ledger.costs.map(item => item.id === targetId ? { ...item, comments: [...item.comments, newComment] } : item)
          : ledger.costs
      };
      const saved = await saveLedgerToSupabase(updated);
      setLedger(saved);
      return;
    }

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
    if (isSupabaseConfigured() && ledger) {
      const updated: LedgerState = {
        ...ledger,
        previousNetIncome: amount
      };
      const saved = await saveLedgerToSupabase(updated);
      setLedger(saved);
      return;
    }

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
      if (isSupabaseConfigured()) {
        const saved = await saveLedgerToSupabase(INITIAL_FALLBACK_STATE);
        setLedger(saved);
        setSelectedTx(null);
        return;
      }

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


  if (!isAuthenticated) {
    return (
      <PINOverlay
        onUnlock={() => {
          setIsAuthenticated(true);
          sessionStorage.setItem('bus_ledger_authenticated', 'true');
        }}
      />
    );
  }


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
              {isSupabaseConfigured() ? (
                <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-150 font-semibold px-2.5 py-1 rounded-lg">
                  <Database className="w-3 h-3 text-indigo-500" />
                  Supabase Cloud (Connected)
                </span>
              ) : (
                <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold px-2.5 py-1 rounded-lg">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Dev Sandbox
                </span>
              )}

              <button
                onClick={triggerRefresh}
                disabled={loading || refreshing}
                className="p-2 bg-slate-50 border border-slate-150 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                title="Force refresh database logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  sessionStorage.removeItem('bus_ledger_authenticated');
                }}
                className="p-2 bg-slate-50 border border-slate-150 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-colors cursor-pointer"
                title="Lock Terminal Console"
              >
                <Lock className="w-3.5 h-3.5" />
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

            {/* Clean, Elegant Navigation Tabs Switcher */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex gap-2">
                <button
                  id="tab-console"
                  onClick={() => setActiveTab('console')}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-display font-extrabold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                    activeTab === 'console'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                  <span>Active Console</span>
                </button>
                <button
                  id="tab-history"
                  onClick={() => setActiveTab('history')}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-display font-extrabold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardList className="w-4 h-4 text-indigo-400" />
                  <span>History & Records</span>
                </button>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span>Ethiopian Year: {formatGregorianToEthiopian(getTodayGregorianStr(), 'long')}</span>
              </div>
            </div>

            {/* Split layout: Activity Forms/History VS Global Chat noticeboard */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              <div className="xl:col-span-8">
                {activeTab === 'console' ? (
                  activeRole === 'manager' ? (
                    <ManagerView
                      ledger={ledger}
                      viewMode="forms"
                      onAddIncome={handleAddIncome}
                      onDeleteIncome={handleDeleteIncome}
                      onAddCost={handleAddCost}
                      onDeleteCost={handleDeleteCost}
                      onSelectTransaction={(type, id) => setSelectedTx({ type, id })}
                    />
                  ) : (
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 animate-fade-in">
                      <div className="flex items-center gap-2.5 text-indigo-600">
                        <Shield className="w-5 h-5" />
                        <h3 className="font-display font-extrabold text-sm text-slate-800">Mr. Amare's Auditing Console</h3>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Welcome to the **Active Console** view. This interface is the daily workspace where terminal managers record passengers and daily vehicle debits in Hawassa.
                      </p>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4.5 space-y-2">
                        <h4 className="text-xs font-bold text-slate-700">Owner Audit Directives:</h4>
                        <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                          <li>Switch to the <strong className="text-indigo-600 underline">History & Records</strong> tab above to search, filter, and print the official cumulative balance sheets or pull audits.</li>
                          <li>Tapping on individual transactions inside the ledger permits leaving feedback comments instantly sync'd with Hawassa terminal.</li>
                          <li>You can use the real-time <strong className="text-slate-800 font-medium">Global Discussion Noticeboard</strong> on the right to post general comments to Mr. Haile.</li>
                        </ul>
                      </div>
                      <div className="pt-1.5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('history')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <ClipboardList className="w-4 h-4" />
                          <span>Switch to History & Records</span>
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  activeRole === 'manager' ? (
                    <ManagerView
                      ledger={ledger}
                      viewMode="list"
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
                  )
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
