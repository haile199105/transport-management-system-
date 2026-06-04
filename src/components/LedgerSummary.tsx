import React, { useState } from 'react';
import { LedgerState, CostCategory } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Calendar, Edit2, Check, X, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { formatGregorianToEthiopian, getTodayGregorianStr } from '../utils/ethiopianCalendar';

interface LedgerSummaryProps {
  ledger: LedgerState;
  onUpdatePreviousIncome: (amount: number) => Promise<void>;
  role: 'manager' | 'owner';
}

export default function LedgerSummary({ ledger, onUpdatePreviousIncome, role }: LedgerSummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState(ledger.previousNetIncome.toString());
  const [updating, setUpdating] = useState(false);

  // Calculate totals
  const totalIncome = ledger.incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalCost = ledger.costs.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalIncome - totalCost;
  const cumulativeBalance = ledger.previousNetIncome + netIncome;

  // Calculate cost category breakdown for Uncle visualization
  const categorySummary: Record<CostCategory, number> = {
    'Fuel': 0,
    'Mechanical & Oil': 0,
    'Tyre Service': 0,
    'Driver Food': 0,
    'Driver Daily Salary': 0,
    'Driver Monthly Salary': 0,
    'Terminal & Station Cost': 0,
    'Others': 0
  };

  ledger.costs.forEach(cost => {
    if (categorySummary[cost.category] !== undefined) {
      categorySummary[cost.category] += cost.amount;
    } else {
      categorySummary['Others'] += cost.amount;
    }
  });

  const costCategories = Object.entries(categorySummary) as [CostCategory, number][];
  const maxCost = Math.max(...costCategories.map(([_, amount]) => amount), 1);

  const handleSave = async () => {
    const parsed = parseFloat(newValue);
    if (!isNaN(parsed) && parsed >= 0) {
      setUpdating(true);
      try {
        await onUpdatePreviousIncome(parsed);
        setIsEditing(false);
      } catch (err) {
        console.error(err);
      } finally {
        setUpdating(false);
      }
    }
  };

  // Safe formatting for Birr (ETB)
  const formatBirr = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num).replace('ETB', 'Br'); // Use 'Br' for Ethiopian Birr
  };

  return (
    <div id="ledger-summary" className="space-y-6">
      {/* Bento Grid Stats */}
      <h2 className="text-lg font-display font-semibold text-slate-800 tracking-tight flex items-center gap-2">
        <span>📊 Status & Balances</span>
        <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-sans font-medium border border-emerald-100">
          Hawassa Terminal
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Current Income Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
          id="stat-income"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Trip Income</span>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-display font-semibold text-emerald-600">
              {formatBirr(totalIncome)}
            </div>
            <p className="text-xs text-slate-400 mt-1">From {ledger.incomes.length} logged trips</p>
          </div>
        </motion.div>

        {/* Current Cost Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
          id="stat-cost"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Service Costs</span>
            <div className="p-2 bg-rose-50 rounded-xl">
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-display font-semibold text-rose-600">
              {formatBirr(totalCost)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Across {ledger.costs.length} items</p>
          </div>
        </motion.div>

        {/* Current Net Profit Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
          id="stat-net"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Current Net Profit</span>
            <div className={`p-2 rounded-xl ${netIncome >= 0 ? 'bg-indigo-50' : 'bg-amber-50'}`}>
              <DollarSign className={`w-5 h-5 ${netIncome >= 0 ? 'text-indigo-600' : 'text-amber-600'}`} />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-display font-semibold ${netIncome >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
              {formatBirr(netIncome)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Income minus Costs</p>
          </div>
        </motion.div>

        {/* Previous Net Income Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden"
          id="stat-prev"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Previous Net Income</span>
            {role === 'manager' && !isEditing && (
              <button
                onClick={() => {
                  setNewValue(ledger.previousNetIncome.toString());
                  setIsEditing(true);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
                title="Edit previous net income"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div>
            {isEditing ? (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full text-sm font-medium px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Birr amount"
                    disabled={updating}
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    disabled={updating}
                    className="bg-emerald-600 text-white p-1 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-55"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={updating}
                    className="bg-slate-100 text-slate-500 p-1 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Set the previous bank balance / income</p>
              </div>
            ) : (
              <>
                <div className="text-2xl font-display font-semibold text-slate-700">
                  {formatBirr(ledger.previousNetIncome)}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                  <span>Accumulated state</span>
                  {role === 'owner' && (
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded">Mr. Haile sets this</span>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Cumulative Balance Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between text-white"
          id="stat-cumulative"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400">Total Money (Br)</span>
            <div className="p-2 bg-slate-800 rounded-xl">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-white">
              {formatBirr(cumulativeBalance)}
            </div>
            <p className="text-[11px] text-slate-300 mt-1">Previous + Current Net</p>
          </div>
        </motion.div>
      </div>

      {/* Visual Cost Category Breakdown Area (Bento Grid secondary) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <div>
              <h3 className="font-display font-semibold text-slate-800 text-sm">⛽ Expense Diagnostic</h3>
              <p className="text-xs text-slate-400">Understand where your money is spent</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">Total Cost: {formatBirr(totalCost)}</span>
          </div>

          <div className="space-y-3.5">
            {costCategories
              .sort((a, b) => b[1] - a[1]) // Sort categories by expense amount
              .map(([category, amount]) => {
                const percentage = totalCost > 0 ? (amount / totalCost) * 100 : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>{category}</span>
                      <span className="font-mono text-slate-500">
                        {formatBirr(amount)} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.6 }}
                        className={`h-full rounded-full ${
                          category === 'Fuel'
                            ? 'bg-amber-500'
                            : category === 'Mechanical & Oil'
                            ? 'bg-rose-500'
                            : category === 'Driver Monthly Salary' || category === 'Driver Daily Salary'
                            ? 'bg-indigo-500'
                            : 'bg-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Fast Insights Board */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Info className="w-4 h-4 text-indigo-500" />
              <span>Diagnostic Insights</span>
            </h3>

            <div className="space-y-3">
              {totalIncome === 0 ? (
                <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                  Waiting for ledger entries to trigger diagnostic insights.
                </div>
              ) : (
                <>
                  <div className="text-xs text-slate-600 flex items-start gap-2 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-50">
                    <span className="p-1 bg-indigo-100 rounded-lg text-indigo-700 font-bold leading-none text-[9px] mt-0.5">NET</span>
                    <div>
                      {netIncome >= 0 ? (
                        <p>The bus service is operating at a profit of <span className="font-semibold text-indigo-700">{formatBirr(netIncome)}</span> for this session.</p>
                      ) : (
                        <p>The bus is currently running at a net loss of <span className="font-semibold text-rose-600">{formatBirr(Math.abs(netIncome))}</span>. Review fuel & terminal costs.</p>
                      )}
                    </div>
                  </div>

                  {categorySummary['Fuel'] > totalIncome * 0.4 && (
                    <div className="text-xs text-slate-600 flex items-start gap-2 bg-amber-50/70 p-2.5 rounded-xl border border-amber-100/50">
                      <span className="p-1 bg-amber-100 rounded-lg text-amber-700 font-bold leading-none text-[9px] mt-0.5">WARN</span>
                      <div>
                        Fuel costs exceed <span className="font-medium text-amber-800">40% of trip income</span>. Ensure efficiency or audit routes for fuel leakage.
                      </div>
                    </div>
                  )}

                  {categorySummary['Mechanical & Oil'] > totalIncome * 0.25 && (
                    <div className="text-xs text-slate-600 flex items-start gap-2 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/30">
                      <span className="p-1 bg-rose-100 rounded-lg text-rose-700 font-bold leading-none text-[9px] mt-0.5">OIL</span>
                      <div>
                        Mechanical and tyre repair charges are higher than average. Ensure mechanics provide verified receipts.
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-600 flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="p-1 bg-slate-200 rounded-lg text-slate-600 font-bold leading-none text-[9px] mt-0.5">TIP</span>
                    <div>
                      You can switch the role toggle in the navbar to test both the <span className="font-medium">Mr. Haile View</span> (Hawassa adding entries) and <span className="font-medium font-display">Mr. Amare View</span> (Owner Addis Ababa reviewing comments).
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center border-t border-slate-50 pt-3 mt-4 font-medium">
            Last updated: {formatGregorianToEthiopian(getTodayGregorianStr(), 'long')} EC ({formatGregorianToEthiopian(getTodayGregorianStr(), 'amharic')})
          </div>
        </div>
      </div>
    </div>
  );
}
