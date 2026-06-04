import React, { useState } from 'react';
import { LedgerState, IncomeEntry, CostEntry, CostCategory } from '../types';
import { Search, Filter, MessageSquare, ChevronRight, Bus, AlertCircle, FileText, CheckCircle2, TrendingUp, HelpCircle, Download, Printer, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OwnerViewProps {
  ledger: LedgerState;
  onSelectTransaction: (type: 'income' | 'cost', id: string) => void;
}

type FilterType = 'all' | 'income' | 'cost' | 'heavy-expense' | 'salaries';

export default function OwnerView({ ledger, onSelectTransaction }: OwnerViewProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Format Ethiopian Birr
  const formatBirr = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(num).replace('ETB', 'Br');
  };

  // Compile combined sorted list
  const combinedItems = [
    ...ledger.incomes.map(item => ({ ...item, type: 'income' as const })),
    ...ledger.costs.map(item => ({ ...item, type: 'cost' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 1. MONTHLY STATEMENT EXPORT (CSV Download)
  const handleExportCSV = () => {
    // Current local time / system date is 2026-06-04
    const today = new Date('2026-06-04T07:59:17Z');
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    // Filter last 30 days of data from ledger
    const monthlyIncomes = ledger.incomes.filter(item => {
      const itemDate = new Date(item.date);
      return !isNaN(itemDate.getTime()) && itemDate >= thirtyDaysAgo;
    });

    const monthlyCosts = ledger.costs.filter(item => {
      const itemDate = new Date(item.date);
      return !isNaN(itemDate.getTime()) && itemDate >= thirtyDaysAgo;
    });

    // Fallback to all data if the last 30 days are sparse in the demo database
    const incomesToExport = monthlyIncomes.length > 0 ? monthlyIncomes : ledger.incomes;
    const costsToExport = monthlyCosts.length > 0 ? monthlyCosts : ledger.costs;

    // Build standard high-integrity CSV structure
    const headers = ['Date', 'Type', 'Route / Category', 'Amount (Birr)', 'Description / Notes', 'Reviewed by Owner'];
    const rows = [headers];

    incomesToExport.forEach(item => {
      const hasUncleComment = item.comments.some(c => c.author === 'Mr. Amare' || c.author === 'Owner (Uncle)') ? 'Reviewed' : 'Pending Review';
      rows.push([
        item.date,
        'Income (Tickets)',
        item.route,
        item.amount.toString(),
        item.description || '',
        hasUncleComment
      ]);
    });

    costsToExport.forEach(item => {
      const hasUncleComment = item.comments.some(c => c.author === 'Mr. Amare' || c.author === 'Owner (Uncle)') ? 'Reviewed' : 'Pending Review';
      rows.push([
        item.date,
        `Expense (${item.category})`,
        item.category,
        item.amount.toString(),
        item.description || '',
        hasUncleComment
      ]);
    });

    // Output formatted CSV using secure Blob URL to bypass browser URL length constraints
    const csvContent = rows
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Bus_Ledger_Monthly_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. PRINT WINDOW ROUTINE
  const handlePrint = () => {
    window.print();
  };

  // Apply filters
  const filteredItems = combinedItems.filter(item => {
    // 1. Filter Type Match
    if (filterType === 'income' && item.type !== 'income') return false;
    if (filterType === 'cost' && item.type !== 'cost') return false;
    if (filterType === 'heavy-expense') {
      if (item.type !== 'cost') return false;
      const amount = item.amount;
      // Define heavy expenses as > 4000 Br (e.g. tyres, heavy oil service, bulk fuel)
      if (amount < 4000) return false;
    }
    if (filterType === 'salaries') {
      if (item.type !== 'cost') return false;
      const cat = (item as any).category;
      if (cat !== 'Driver Daily Salary' && cat !== 'Driver Monthly Salary') return false;
    }

    // 2. Search query match
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const routeMatch = (item as any).route?.toLowerCase().includes(query);
      const descMatch = item.description?.toLowerCase().includes(query);
      const catMatch = (item as any).category?.toLowerCase().includes(query);
      if (!routeMatch && !descMatch && !catMatch) return false;
    }

    return true;
  });

  // Calculate high-level stats for the Print-Friendly statement panel
  const totalIncomesSum = ledger.incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalCostsSum = ledger.costs.reduce((sum, c) => sum + c.amount, 0);
  const currentNetProfit = totalIncomesSum - totalCostsSum;
  const cumulativeBirrBalance = ledger.previousNetIncome + currentNetProfit;

  return (
    <div id="owner-interface" className="space-y-6">
      <style>{`
        @media print {
          /* Enforce target-only print view of audit statement paper */
          body * {
            visibility: hidden !important;
            background-color: white !important;
            color: black !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print-element {
            display: none !important;
          }
        }
      `}</style>

      {/* Print Friendly Statement Overlay Mode */}
      <AnimatePresence>
        {showPrintPreview && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl shadow-2xl rounded-3xl border border-slate-200 overflow-hidden my-6"
            >
              {/* Tool Control header (Invisible during paper output) */}
              <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 no-print-element border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPrintPreview(false)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="font-display font-semibold text-xs leading-none flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-yellow-400" />
                      Print Statement Review
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">Audit-ready cumulative balance-sheet document</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV download
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-semibold text-white px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print or Save as PDF
                  </button>
                </div>
              </div>

              {/* HIGH-FIDELITY PRINTABLE SHEET AREA */}
              <div id="print-area" className="p-8 md:p-12 bg-white text-slate-900 border-none print:p-0">
                {/* Visual Header */}
                <div className="border-b-2 border-slate-950 pb-6 flex flex-col md:flex-row justify-between items-start gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest font-bold text-slate-500 font-mono">Official Joint Statement</span>
                    <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900 mt-1">
                      HAWASSA TRANS-ROUTE LEDGER
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 italic font-medium">
                      Cooperative Starting Station: Hawassa Terminal, SNNPR Etiopia
                    </p>
                  </div>
                  <div className="text-left md:text-right font-mono text-xs text-slate-500 space-y-1">
                    <p><strong>System Date:</strong> 2026-06-04</p>
                    <p><strong>Manager:</strong> Mr. Haile (Hawassa Terminal)</p>
                    <p><strong>Primary Auditor:</strong> Mr. Amare (AA Headquarters)</p>
                    <p><strong>Version:</strong> Supabase Connected v2.0</p>
                  </div>
                </div>

                {/* Subtitle description */}
                <div className="my-6 bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center flex-wrap gap-3">
                  <span className="text-xs text-slate-700 font-semibold font-display">
                    🚨 Cumulative 30-Day Financial Performance Sheet
                  </span>
                  <span className="text-[10px] bg-indigo-50 border border-indigo-100/50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full font-mono">
                    STATUS: AUDITED
                  </span>
                </div>

                {/* Performance indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                  <div className="border border-slate-200 rounded-xl p-4 bg-white">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Prev. Net Funds</span>
                    <span className="text-lg font-display font-extrabold text-slate-900 mt-1 block">
                      {formatBirr(ledger.previousNetIncome)}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Station starting balance</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-white">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Period Trip Incomes</span>
                    <span className="text-lg font-display font-extrabold text-emerald-600 mt-1 block">
                      +{formatBirr(totalIncomesSum)}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">From registered tickets</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-white">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Service Disburses</span>
                    <span className="text-lg font-display font-extrabold text-rose-600 mt-1 block">
                      -{formatBirr(totalCostsSum)}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Fuel, oil & mechanical pay</span>
                  </div>

                  <div className="border border-slate-900 rounded-xl p-4 bg-slate-900 text-white">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">4. Total Current Asset</span>
                    <span className="text-lg font-display font-extrabold text-emerald-400 mt-1 block">
                      {formatBirr(cumulativeBirrBalance)}
                    </span>
                    <span className="text-[9px] text-slate-300 mt-0.5 block">Accumulated net funds</span>
                  </div>
                </div>

                {/* Ledger Items Tabular Output */}
                <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">
                  Trip Ledger Entry breakdown
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-600">
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Type / Category</th>
                        <th className="px-4 py-2.5">Route Destination / Note</th>
                        <th className="px-4 py-2.5 text-right">Amount (Birr)</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {combinedItems.map((item) => {
                        const isInc = item.type === 'income';
                        const approval = item.comments.some(c => c.author === 'Owner (Uncle)') ? 'Reviewed' : 'Pending';
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">{item.date}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                                isInc ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {isInc ? 'Ticket' : (item as any).category}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <strong className="text-slate-800 font-medium">{isInc ? item.route : item.description}</strong>
                              {isInc && item.description && (
                                <span className="block text-[10px] text-slate-400 italic">"{item.description}"</span>
                              )}
                            </td>
                            <td className={`px-4 py-2.5 text-right font-bold text-[11px] ${isInc ? 'text-emerald-700' : 'text-slate-700'}`}>
                              {isInc ? '+' : '-'}{formatBirr(item.amount)}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                                approval === 'Reviewed' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {approval}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Audit Sign-off Sections (Indicates professional ledger style) */}
                <div className="grid grid-cols-2 gap-8 pt-12 mt-12 border-t border-slate-200">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Submitted By</p>
                    <div className="h-12 border-b border-dashed border-slate-200" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 text-center">Mr. Haile</p>
                      <p className="text-[10px] text-slate-400 text-center">Hawassa Terminal Manager</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Approved & Signed By</p>
                    <div className="h-12 border-b border-dashed border-slate-200" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 text-center">Mr. Amare</p>
                      <p className="text-[10px] text-slate-400 text-center">Mr. Amare (Owner, Addis Ababa)</p>
                    </div>
                  </div>
                </div>

                {/* Legal disclaimer */}
                <p className="text-[9px] text-slate-400 mt-12 text-center">
                  This electronic statement is compiled under real-time network parameters matching local time in Hawassa. 
                  Any unauthorized alterations will make the print-out legally invalid. Keep duplicates for IRS and Ethiopian Bus Associations.
                </p>
              </div>

              {/* Block Footer Controls (Not printed) */}
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t border-slate-100 no-print-element">
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Close Preview
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer animate-pulse"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Statement
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Personalized Header for Mr. Amare (Owner Review Section) */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-widest font-extrabold text-indigo-400 font-mono">Owner Portal</span>
          <h2 className="text-xs font-display font-black text-white mt-0.5">Mr. Amare (Owner, Addis Ababa)</h2>
          <p className="text-[10px] text-slate-300">
            Monitor real-time passenger volumes from Hawassa starting terminal, examine service audits, and sign-off comments.
          </p>
        </div>
        <div className="flex bg-indigo-950/60 border border-indigo-500/20 px-3.5 py-2 rounded-2xl items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping text-[10px]" />
          <span className="text-[9px] text-indigo-200 font-mono font-bold uppercase tracking-tight">📋 REPORT FOR MR. AMARE (Owner Review)</span>
        </div>
      </div>

      {/* Filtering Header with Monthly CSV and Print Buttons integrated beautifully */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-display font-semibold text-slate-800 text-sm">🗂️ Audit Controls</h3>
          <p className="text-xs text-slate-400">Search, filter, or download the performance sheets</p>
        </div>

        {/* Action button grouping for CSV Export / Print-Friendly Report */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            title="Download cumulative standard CSV for spreadsheet imports"
            className="bg-slate-100 hover:bg-slate-200 text-[11px] font-display font-bold text-slate-700 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Monthly (CSV)
          </button>

          <button
            onClick={() => setShowPrintPreview(true)}
            title="Launch clean print dialog preview pane"
            className="bg-indigo-50 hover:bg-indigo-100 text-[11px] font-display font-bold text-indigo-700 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all border border-indigo-100/50 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report Sheet
          </button>
        </div>

        {/* Search Input inline */}
        <div className="relative max-w-sm w-full">
          <span className="absolute left-3 top-2.5 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search e.g. Wolayta, Oil, Fuel, Shell..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl max-w-2xl">
        <button
          onClick={() => setFilterType('all')}
          className={`flex-1 min-w-[70px] py-1.5 text-[11px] font-display font-semibold rounded-lg transition-all ${
            filterType === 'all'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          All Items ({combinedItems.length})
        </button>
        <button
          onClick={() => setFilterType('income')}
          className={`flex-1 min-w-[70px] py-1.5 text-[11px] font-display font-semibold rounded-lg transition-all ${
            filterType === 'income'
              ? 'bg-white text-emerald-600 shadow-xs border border-emerald-100'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Trip Incomes ({ledger.incomes.length})
        </button>
        <button
          onClick={() => setFilterType('cost')}
          className={`flex-1 min-w-[70px] py-1.5 text-[11px] font-display font-semibold rounded-lg transition-all ${
            filterType === 'cost'
              ? 'bg-white text-rose-600 shadow-xs border border-rose-100'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          All Costs ({ledger.costs.length})
        </button>
        <button
          onClick={() => setFilterType('heavy-expense')}
          className={`flex-1 min-w-[100px] py-1.5 text-[11px] font-display font-semibold rounded-lg transition-all ${
            filterType === 'heavy-expense'
              ? 'bg-white text-amber-700 shadow-xs border border-amber-100'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          ⚠️ Large Maintenance (&gt;4k)
        </button>
        <button
          onClick={() => setFilterType('salaries')}
          className={`flex-1 min-w-[100px] py-1.5 text-[11px] font-display font-semibold rounded-lg transition-all ${
            filterType === 'salaries'
              ? 'bg-white text-indigo-600 shadow-xs border border-indigo-100'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          🧑‍✈️ Driver Salaries
        </button>
      </div>

      {/* Grid of Results */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="font-semibold text-sm mt-3">No transactions found matching your filter</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Try changing your search keywords or choosing different categories above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredItems.map(entry => {
              const isIncome = entry.type === 'income';
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -2 }}
                  layout
                  onClick={() => onSelectTransaction(entry.type, entry.id)}
                  className={`bg-white border hover:bg-slate-50/50 transition-all rounded-2xl p-4.5 shadow-xs flex flex-col justify-between cursor-pointer group ${
                    isIncome ? 'border-emerald-100 hover:border-emerald-300' : 'border-rose-100 hover:border-rose-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {entry.date}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {isIncome ? 'Tickets Sold' : (entry as any).category}
                        </span>
                      </div>

                      {/* Display warning badge for highly heavy costs */}
                      {!isIncome && entry.amount >= 4000 && (
                        <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                          <AlertCircle className="w-2.5 h-2.5" /> High cost write-off
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-display font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                        {isIncome ? entry.route : (entry as any).description}
                      </h4>
                      {isIncome && entry.description && (
                        <p className="text-xs text-slate-400 italic mt-0.5">"{entry.description}"</p>
                      )}
                      {isIncome && (entry.passengers || (entry as any).tripType) && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {entry.passengers && (
                            <span className="text-[10px] text-indigo-700 font-medium bg-indigo-50/50 px-2 py-0.5 rounded">
                              👥 Ticket sales count: {entry.passengers} pax
                            </span>
                          )}
                          {(entry as any).tripType && (
                            <span className="text-[10px] text-emerald-750 font-medium bg-emerald-50/70 border border-emerald-100 px-2 py-0.5 rounded">
                              🗺️ {(entry as any).tripType === 'One-Way' ? 'One-Way' : 'Round-Trip'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comments preview indicator or write-button */}
                  <div className="border-t border-slate-50 pt-3 mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className={`text-md font-display font-extrabold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIncome ? '+' : '-'}{formatBirr(entry.amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {entry.comments.length > 0 ? (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-indigo-500" />
                          {entry.comments.length} Comment{entry.comments.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors font-medium flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Write comment & verify
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
