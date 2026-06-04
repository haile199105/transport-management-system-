import React, { useState } from 'react';
import { GlobalComment } from '../types';
import { Send, MessageSquare, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

interface GlobalChatProps {
  comments: GlobalComment[];
  onAddGlobalComment: (text: string) => Promise<void>;
  role: 'manager' | 'owner';
}

export default function GlobalChat({ comments, onAddGlobalComment, role }: GlobalChatProps) {
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setSubmitting(true);
    try {
      await onAddGlobalComment(inputText.trim());
      setInputText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Just now';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
      {/* Feed Header */}
      <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <div className="p-1 px-1.5 bg-indigo-500 rounded text-xs font-bold font-mono">LIVE</div>
          <div>
            <h3 className="font-display font-semibold text-xs leading-none">Shared Noticeboard Chat</h3>
            <p className="text-[10px] text-slate-400 mt-1">Real-time sync between Hawassa and Addis Ababa</p>
          </div>
        </div>
        <div className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
          Role: {role === 'manager' ? 'Mr. Haile (Manager)' : 'Mr. Amare (Owner)'}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 animate-pulse" />
            <p className="text-xs font-semibold">No messages yet</p>
            <p className="text-[10px]">Type below to leave a general memo or update for each other.</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isMe =
              (role === 'manager' && (comment.author === 'Mr. Haile' || comment.author === 'Manager (Me)')) ||
              (role === 'owner' && (comment.author === 'Mr. Amare' || comment.author === 'Owner (Uncle)'));
            return (
              <div
                key={comment.id}
                className={`flex flex-col max-w-[85%] ${
                  isMe ? 'ml-auto items-end bg-transparent' : 'mr-auto items-start bg-transparent'
                }`}
              >
                <span className="text-[9px] text-slate-400 font-medium mb-0.5">
                  {comment.author} &bull; {formatTime(comment.timestamp)}
                </span>
                <div
                  className={`px-3 py-2 text-xs rounded-2xl shadow-xs leading-relaxed ${
                    isMe
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}
                >
                  {comment.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message input footer */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex items-center gap-1.5 focus-within:ring-2 focus-within:ring-slate-200">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Write general update as ${role === 'manager' ? 'Mr. Haile' : 'Mr. Amare'}...`}
          className="flex-1 text-xs border border-slate-100 px-3 py-2.5 rounded-xl bg-slate-50/50 focus:outline-none focus:bg-white placeholder:text-slate-400 text-slate-800 font-medium"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !inputText.trim()}
          className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 active:scale-95 hover:shadow transition-all disabled:opacity-40 disabled:scale-100 flex-shrink-0 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
