import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, Delete, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

interface PINOverlayProps {
  onUnlock: () => void;
}

export default function PINOverlay({ onUnlock }: PINOverlayProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState<boolean>(false);

  // Keyboard support for enhanced usability
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Numbers 0-9
      if (/^[0-9]$/.test(e.key)) {
        handlePressDigit(e.key);
      }
      // Backspace
      else if (e.key === 'Backspace') {
        handleBackspace();
      }
      // Clear/Escape
      else if (e.key === 'Escape') {
        handleClear();
      }
      // Enter key submits if there is at least something entered
      else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pin]);

  const handlePressDigit = (digit: string) => {
    setError(null);
    if (pin.length < 4) {
      const updatedPin = pin + digit;
      setPin(updatedPin);

      // Auto-submit instantly if exactly 4 digits are completed
      if (updatedPin.length === 4) {
        verifyPIN(updatedPin);
      }
    }
  };

  const handleBackspace = () => {
    setError(null);
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError(null);
    setPin('');
  };

  const verifyPIN = (input: string) => {
    if (input === '1991') {
      onUnlock();
    } else {
      setError('Incorrect security PIN. Access denied.');
      setPin('');
      setShake(true);
      // Reset shake state after animation ends
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleSubmit = () => {
    if (pin.length < 4) {
      setError('PIN must be exactly 4 digits');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    verifyPIN(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/90 [background-image:radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={
          shake
            ? { x: [-8, 8, -6, 6, -3, 3, 0], opacity: 1, scale: 1, y: 0 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={shake ? { duration: 0.4 } : { duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-[380px] bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/60 p-8 flex flex-col items-center"
      >
        {/* Secure Lock Badge */}
        <div className="w-16 h-16 bg-slate-900 text-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-950/10 mb-5 relative group">
          <motion.div
            animate={{ rotate: pin.length > 0 ? [0, -5, 5, 0] : 0 }}
            transition={{ duration: 0.5, repeat: pin.length > 0 ? 1 : 0 }}
          >
            <Lock className="w-6 h-6" />
          </motion.div>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full border-2 border-white animate-pulse" />
        </div>

        {/* Console Header */}
        <div className="text-center">
          <h2 className="text-slate-900 font-display font-extrabold text-lg tracking-tight">
            Terminal Lock
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 pb-1 leading-relaxed max-w-xs mx-auto">
            Authorized admin credentials required to load active mutual finances and real-time logs.
          </p>
        </div>

        {/* Input Dot Indicators */}
        <div className="flex items-center gap-4 my-8">
          {[0, 1, 2, 3].map(index => {
            const hasValue = pin.length > index;
            return (
              <div
                key={index}
                className="relative flex items-center justify-center w-5 h-5"
              >
                <div
                  className={`absolute inset-0 rounded-full border-2 transition-all duration-200 ${
                    hasValue
                      ? 'border-slate-900 scale-100'
                      : 'border-slate-200 scale-90'
                  }`}
                />
                {/* Delayed bounce-in core */}
                {hasValue && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2.5 h-2.5 bg-slate-900 rounded-full"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Shaking Error Notice */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-red-50 border border-red-100 text-red-600 rounded-xl py-2 px-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 mb-5 text-center"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-none" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Touch Responsive Keypad Grid */}
        <div className="grid grid-cols-3 gap-3.5 w-full">
          {/* Numbers 1-9 */}
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(val => (
            <motion.button
              key={val}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePressDigit(val)}
              className="h-14 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer font-sans select-none border border-slate-100/50 shadow-xs hover:shadow-xs transition-all"
            >
              <span className="text-lg font-bold tracking-tight font-display">{val}</span>
            </motion.button>
          ))}

          {/* Row 4: Clear | 0 | Backspace or Submit */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="h-14 bg-slate-50 hover:bg-slate-100/80 text-rose-600 hover:text-rose-700 rounded-2xl flex items-center justify-center cursor-pointer font-sans font-semibold text-xs select-none border border-slate-100/50 shadow-xs transition-all"
            title="Clear input"
          >
            CLEAR
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePressDigit('0')}
            className="h-14 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center cursor-pointer font-sans select-none border border-slate-100/50 shadow-xs transition-all"
          >
            <span className="text-lg font-bold tracking-tight font-display">0</span>
          </motion.button>

          {pin.length > 0 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackspace}
              className="h-14 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center cursor-pointer transition-all border border-indigo-100 shadow-xs"
              title="Delete last digit"
            >
              <Delete className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              className="h-14 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center cursor-pointer transition-all border border-indigo-100 shadow-xs text-xs font-bold font-display tracking-wider"
              title="Verify PIN code"
            >
              SUBMIT
            </motion.button>
          )}
        </div>

        {/* Subtle Tech Hint Footer */}
        <div className="flex items-center gap-1.5 text-[8px] text-slate-400 mt-6 tracking-widest font-mono">
          <Terminal className="w-2.5 h-2.5 text-slate-300" />
          <span>CRYPT-AUTH STANDARD SECURE</span>
        </div>
      </motion.div>
    </div>
  );
}
