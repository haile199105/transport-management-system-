import React, { useState } from 'react';
import { LedgerState, IncomeEntry, CostEntry, CostCategory } from '../types';
import { PlusCircle, MinusCircle, Trash2, Calendar, MapPin, Tag, Users, FileText, ChevronRight, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ManagerViewProps {
  ledger: LedgerState;
  onAddIncome: (entry: { date: string; route: string; tripType?: 'One-Way' | 'Round-Trip'; amount: number; passengers?: number; description: string }) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
  onAddCost: (entry: { date: string; category: CostCategory; amount: number; description: string }) => Promise<void>;
  onDeleteCost: (id: string) => Promise<void>;
  onSelectTransaction: (type: 'income' | 'cost', id: string) => void;
}

export default function ManagerView({
  ledger,
  onAddIncome,
  onDeleteIncome,
  onAddCost,
  onDeleteCost,
  onSelectTransaction
}: ManagerViewProps) {
  const [activeFormTab, setActiveFormTab] = useState<'income' | 'cost'>('income');
  
  // Income Form State
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeRouteDropdown, setIncomeRouteDropdown] = useState('Hawassa to Wolayta Sodo');
  const [incomeRouteCustom, setIncomeRouteCustom] = useState('');
  const [incomeTripType, setIncomeTripType] = useState<'One-Way' | 'Round-Trip'>('One-Way');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomePassengers, setIncomePassengers] = useState('');
  const [incomeDesc, setIncomeDesc] = useState('');
  
  // Cost Form State
  const [costDate, setCostDate] = useState(new Date().toISOString().split('T')[0]);
  const [costCategory, setCostCategory] = useState<CostCategory>('Fuel');
  const [costAmount, setCostAmount] = useState('');
  const [costDesc, setCostDesc] = useState('');

  // Submit states
  const [submittingIncome, setSubmittingIncome] = useState(false);
  const [submittingCost, setSubmittingCost] = useState(false);
  const [managerMessage, setManagerMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const routeOptions = [
    'Hawassa to Wolayta Sodo',
    'Hawassa to Butajira',
    'Hawassa to Shashemene',
    'Hawassa to Addis Ababa (AA)',
    'Hawassa to Alaba Kulito',
    'Custom Trip Route'
  ];

  const handleAddIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRoute = incomeRouteDropdown === 'Custom Trip Route' ? incomeRouteCustom.trim() : incomeRouteDropdown;
    const amountNum = parseFloat(incomeAmount);

    if (!finalRoute) {
      triggerMessage('Please select or specify a route route name.', 'error');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      triggerMessage('Please enter a valid positive ticket income amount.', 'error');
      return;
    }

    setSubmittingIncome(true);
    try {
      await onAddIncome({
        date: incomeDate,
        route: finalRoute,
        tripType: incomeTripType,
        amount: amountNum,
        passengers: incomePassengers ? parseInt(incomePassengers) : undefined,
        description: incomeDesc
      });
      // Clear form
      setIncomeAmount('');
      setIncomePassengers('');
      setIncomeDesc('');
      setIncomeRouteCustom('');
      triggerMessage('Income log added successfully!', 'success');
    } catch (err) {
      triggerMessage('Failed to save income log.', 'error');
    } finally {
      setSubmittingIncome(false);
    }
  };

  const handleAddCostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(costAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      triggerMessage('Please enter a valid service cost amount.', 'error');
      return;
    }

    setSubmittingCost(true);
    try {
      await onAddCost({
        date: costDate,
        category: costCategory,
        amount: amountNum,
        description: costDesc
      });
      // Clear form
      setCostAmount('');
      setCostDesc('');
      triggerMessage('Cost log saved successfully!', 'success');
    } catch (err) {
      triggerMessage('Failed to save cost entry.', 'error');
    } finally {
      setSubmittingCost(false);
    }
  };

  const triggerMessage = (text: string, type: 'success' | 'error') => {
    setManagerMessage({ text, type });
    setTimeout(() => {
      setManagerMessage(null);
    }, 4000);
  };

  const formatBirr = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(num).replace('ETB', 'Br');
  };

  return (
    <div id="manager-interface" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Forms Segment (5 columns on desktop) */}
      <div className="lg:col-span-5 space-y-4">
        {/* Personalized header for Mr. Haile */}
        <div className="bg-slate-900 text-white p-4.5 rounded-2xl border border-slate-800 shadow-sm">
          <span className="text-[9px] uppercase tracking-widest font-extrabold text-emerald-400 font-mono">Terminal Console</span>
          <h2 className="text-xs font-display font-black text-white mt-0.5">Mr. Haile (Manager, Hawassa)</h2>
          <p className="text-[10px] text-slate-300 mt-1">Direct terminal input for passenger volumes and daily vehicle expenses.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
            <button
              onClick={() => setActiveFormTab('income')}
              className={`flex-1 py-3 text-xs font-display font-semibold transition-all rounded-xl flex items-center justify-center gap-1.5 ${
                activeFormTab === 'income'
                  ? 'bg-white text-emerald-600 shadow-sm border border-emerald-500/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-500" />
              Log Ticket Income
            </button>
            <button
              onClick={() => setActiveFormTab('cost')}
              className={`flex-1 py-3 text-xs font-display font-semibold transition-all rounded-xl flex items-center justify-center gap-1.5 ${
                activeFormTab === 'cost'
                  ? 'bg-white text-rose-600 shadow-sm border border-rose-500/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <MinusCircle className="w-4 h-4 text-rose-500" />
              Log Bus Expense
            </button>
          </div>

          <div className="p-5">
            {/* Notification banner */}
            <AnimatePresence>
              {managerMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-xs font-medium border ${
                    managerMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                      : 'bg-rose-50 text-rose-800 border-rose-100'
                  }`}
                >
                  <AlertCircle className={`w-4 h-4 ${managerMessage.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`} />
                  <span>{managerMessage.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Income Input Form */}
            {activeFormTab === 'income' ? (
              <form onSubmit={handleAddIncomeSubmit} className="space-y-4">
                {/* Date Input */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date
                  </label>
                  <input
                    type="date"
                    required
                    value={incomeDate}
                    onChange={(e) => setIncomeDate(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                </div>

                {/* Route Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Destination Route
                  </label>
                  <select
                    value={incomeRouteDropdown}
                    onChange={(e) => setIncomeRouteDropdown(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    {routeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom route input */}
                {incomeRouteDropdown === 'Custom Trip Route' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-1"
                  >
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hawassa to Arba Minch"
                      value={incomeRouteCustom}
                      onChange={(e) => setIncomeRouteCustom(e.target.value)}
                      className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </motion.div>
                )}

                {/* Trip Type Toggle Option */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Trip Type Toggle</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setIncomeTripType('One-Way')}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        incomeTripType === 'One-Way'
                          ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/30'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      One-Way
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncomeTripType('Round-Trip')}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        incomeTripType === 'Round-Trip'
                          ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/30'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Round-Trip (Two-Way)
                    </button>
                  </div>
                </div>

                {/* Amount and Passengers count */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Ticket Income (Br)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">Br</span>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 15000"
                        value={incomeAmount}
                        onChange={(e) => setIncomeAmount(e.target.value)}
                        className="w-full text-sm pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Passengers
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 45"
                      min="1"
                      value={incomePassengers}
                      onChange={(e) => setIncomePassengers(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> Conductor Notes / Details
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Conductor Shiferaw, morning departure"
                    value={incomeDesc}
                    onChange={(e) => setIncomeDesc(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submittingIncome}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  {submittingIncome ? 'Saving...' : 'Add Ticket Income Log'}
                </button>
              </form>
            ) : (
              /* Cost Input Form */
              <form onSubmit={handleAddCostSubmit} className="space-y-4">
                {/* Date Input */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date
                  </label>
                  <input
                    type="date"
                    required
                    value={costDate}
                    onChange={(e) => setCostDate(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                  />
                </div>

                {/* Category Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" /> Cost Category
                  </label>
                  <select
                    value={costCategory}
                    onChange={(e) => setCostCategory(e.target.value as CostCategory)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                  >
                    <option value="Fuel">⛽ Fuel (Diesel)</option>
                    <option value="Mechanical & Oil">🔧 Mechanical & Oil Change</option>
                    <option value="Tyre Service">🛞 Tyre Purchase & Patching</option>
                    <option value="Driver Food">🍛 Driver Food / Expenses</option>
                    <option value="Driver Daily Salary">💰 Driver/Conductor Daily Salary</option>
                    <option value="Driver Monthly Salary">💵 Driver Monthly Base salary</option>
                    <option value="Terminal & Station Cost">🎫 Terminal Exit & Association fees</option>
                    <option value="Others">📝 Other Expenses</option>
                  </select>
                </div>

                {/* Cost Amount */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Service Cost Amount (Br)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">Br</span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 6800"
                      value={costAmount}
                      onChange={(e) => setCostAmount(e.target.value)}
                      className="w-full text-sm pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                    />
                  </div>
                </div>

                {/* Cost Description */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> Receipt Notes / Paid to
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Total fuel filling 60 liters, Hawassa Shell Station"
                    value={costDesc}
                    onChange={(e) => setCostDesc(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submittingCost}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  {submittingCost ? 'Saving...' : 'Add Service Cost Log'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Lists Segment (7 columns on desktop) */}
      <div id="manager-ledger-list" className="lg:col-span-7 space-y-4">
        {/* Ledger Title */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-3">
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-sm">📅 Logged Ledger Items</h3>
            <p className="text-xs text-slate-400">Total list of tickets sold and expenses disbursed</p>
          </div>
          <p className="text-[11px] bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-100 italic">
            Tap a transaction to chat or read uncle comments
          </p>
        </div>

        {/* Detailed Item List */}
        <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
          {ledger.incomes.length === 0 && ledger.costs.length === 0 ? (
            <div className="text-center bg-white border border-dashed border-slate-200 p-8 rounded-2xl">
              <span className="text-3xl">🚌</span>
              <h4 className="text-slate-600 font-semibold text-sm mt-2">Ledger is Empty</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">Ready for input. Log some ticket sales or fuel expenses from Hawassa terminal!</p>
            </div>
          ) : (
            <AnimatePresence>
              {[
                ...ledger.incomes.map(item => ({ ...item, type: 'income' as const })),
                ...ledger.costs.map(item => ({ ...item, type: 'cost' as const }))
              ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => {
                  const isIncome = entry.type === 'income';
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                      className={`bg-white border hover:bg-slate-50/50 transition-all rounded-xl shadow-xs overflow-hidden flex flex-col ${
                        isIncome ? 'border-emerald-100' : 'border-rose-100'
                      }`}
                    >
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => onSelectTransaction(entry.type, entry.id)}
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                              {entry.date}
                            </span>
                            
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {isIncome ? 'Income' : (entry as any).category}
                            </span>

                            {entry.comments.length > 0 && (
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-semibold">
                                <MessageSquare className="w-2.5 h-2.5" />
                                {entry.comments.length} Comment{entry.comments.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          <h4 className="font-display font-bold text-slate-800 text-sm mt-2 flex items-center gap-1.5">
                            {isIncome ? entry.route : (entry as any).description}
                          </h4>

                          {isIncome && entry.description && (
                            <p className="text-xs text-slate-400 mt-1 max-w-md italic">
                              "{entry.description}"
                            </p>
                          )}

                          {isIncome && (entry.passengers || (entry as any).tripType) && (
                            <div className="flex gap-1.5 flex-wrap mt-2">
                              {entry.passengers && (
                                <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                                  👥 {entry.passengers} passengers
                                </span>
                              )}
                              {(entry as any).tripType && (
                                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-medium">
                                  🗺️ {(entry as any).tripType === 'One-Way' ? 'One-Way' : 'Round-Trip'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Amount & Delete elements */}
                        <div className="text-right flex flex-col items-end gap-2.5">
                          <span className={`font-display font-bold text-sm ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isIncome ? '+' : '-'}{formatBirr(entry.amount)}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onSelectTransaction(entry.type, entry.id)}
                              className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                              title="Engage comments feed"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => isIncome ? onDeleteIncome(entry.id) : onDeleteCost(entry.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Delete log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Snippet of last comments if any */}
                      {entry.comments.length > 0 && (
                        <div
                          className="bg-slate-50/70 border-t border-dashed border-slate-100 px-4 py-2 flex items-center justify-between text-xs text-slate-500 cursor-pointer hover:bg-slate-100/30"
                          onClick={() => onSelectTransaction(entry.type, entry.id)}
                        >
                          <span className="truncate max-w-[85%]">
                            💬 <strong className="text-slate-600 font-semibold">{entry.comments[entry.comments.length - 1].author}:</strong> "{entry.comments[entry.comments.length - 1].text}"
                          </span>
                          <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
