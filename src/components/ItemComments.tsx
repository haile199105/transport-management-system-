import React, { useState } from 'react';
import { Comment, IncomeEntry, CostEntry } from '../types';
import { X, Send, MessageSquare, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface ItemCommentsProps {
  transaction: IncomeEntry | CostEntry;
  type: 'income' | 'cost';
  role: 'manager' | 'owner';
  onAddComment: (targetType: 'income' | 'cost', id: string, text: string) => Promise<void>;
  onClose: () => void;
}

export default function ItemComments({
  transaction,
  type,
  role,
  onAddComment,
  onClose
}: ItemCommentsProps) {
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  const isIncome = type === 'income';

  // Format Ethiopian Birr
  const formatBirr = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(num).replace('ETB', 'Br');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setLoading(true);
    try {
      await onAddComment(type, transaction.id, commentText.trim());
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
        id="item-comments-modal"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-900 text-white">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                isIncome ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {isIncome ? 'Income Query' : `${(transaction as any).category} Query`}
              </span>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                <Calendar className="w-2.5 h-2.5" /> {transaction.date}
              </span>
            </div>

            <h3 className="font-display font-extrabold text-sm text-white tracking-tight leading-snug">
              {isIncome ? (transaction as any).route : (transaction as any).description}
            </h3>

            {(transaction as any).description && isIncome && (
              <p className="text-xs text-slate-400 italic">"{(transaction as any).description}"</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className={`font-display font-bold text-sm leading-none ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isIncome ? '+' : '-'}{formatBirr(transaction.amount)}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audit Comment Threads Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 min-h-[220px]">
          <div className="text-[11px] text-center text-indigo-700 bg-indigo-50 border border-indigo-100/30 p-2.5 rounded-xl flex items-center justify-center gap-1.5 max-w-sm mx-auto">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Chat details are bound directly against this physical receipt</span>
          </div>

          {transaction.comments.length === 0 ? (
            <div className="text-center py-10 space-y-2 text-slate-400">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-500">No audits found</p>
              <p className="text-[10px] max-w-xs mx-auto text-slate-400">
                Write a comment to verify receipt, discuss oil synthetic metrics, or confirm terminal pricing logs.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {transaction.comments.map((comment) => {
                const isMe =
                  (role === 'manager' && (comment.author === 'Mr. Haile' || comment.author === 'Manager (Me)')) ||
                  (role === 'owner' && (comment.author === 'Mr. Amare' || comment.author === 'Owner (Uncle)'));
                return (
                  <div
                    key={comment.id}
                    className={`flex flex-col max-w-[90%] ${
                      isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <span className="text-[9px] text-slate-400 font-medium mb-0.5">
                      {comment.author} &bull; {formatTime(comment.timestamp)}
                    </span>
                    <div
                      className={`px-3 py-2 text-xs rounded-2xl shadow-xs leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                      }`}
                    >
                      {comment.text}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Submit footer */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
          <input
            type="text"
            required
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={loading}
            placeholder={`Message as ${role === 'manager' ? 'Mr. Haile' : 'Mr. Amare'}...`}
            className="flex-1 text-xs border border-slate-200 px-3.5 py-2.5 rounded-xl bg-slate-50/50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
          />
          <button
            type="submit"
            disabled={loading || !commentText.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl cursor-pointer disabled:opacity-40 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
