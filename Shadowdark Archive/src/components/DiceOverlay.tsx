import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RollResult } from '../types';
import { Sparkles, Skull } from 'lucide-react';

interface DiceOverlayProps {
  isRolling: boolean;
  lastResult: RollResult | null;
}

export default function DiceOverlay({ isRolling, lastResult }: DiceOverlayProps) {
  const [displayValue, setDisplayValue] = useState(20);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRolling) {
      setShowResult(false);
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 20) + 1);
      }, 50);
    } else if (lastResult) {
      setShowResult(true);
      const timer = setTimeout(() => setShowResult(false), 2000);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
    return () => clearInterval(interval);
  }, [isRolling, lastResult]);

  return (
    <AnimatePresence>
      {(isRolling || showResult) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
          
          <motion.div
            initial={{ scale: 0.5, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className={`relative p-8 tarot-card shadow-2xl flex flex-col items-center justify-center min-w-[200px] ${
              showResult && lastResult?.isCritical 
                ? 'bg-primary/20 text-primary border-primary' 
                : showResult && lastResult?.isFumble
                ? 'bg-error/20 text-error border-error'
                : 'text-on-surface'
            }`}
          >
            {showResult && lastResult?.isCritical && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute -top-6 -right-6 bg-yellow-400 p-3 rounded-full shadow-lg"
              >
                <Sparkles size={32} className="text-black" />
              </motion.div>
            )}

            {showResult && lastResult?.isFumble && (
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute -top-6 -right-6 bg-black p-3 rounded-full shadow-lg"
              >
                <Skull size={32} className="text-white" />
              </motion.div>
            )}

            <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60 mb-2">
              {isRolling ? 'Rolling...' : lastResult?.label || 'Result'}
            </span>

            <div className="text-7xl font-headline font-bold italic tabular-nums">
              {isRolling ? displayValue : lastResult?.total}
            </div>

            {showResult && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mt-4 flex flex-col items-center"
              >
                <span className="text-xs font-mono opacity-80">
                  {lastResult?.die} {lastResult?.modifier && lastResult.modifier !== 0 ? (lastResult.modifier >= 0 ? `+${lastResult.modifier}` : lastResult.modifier) : ''}
                </span>
                {lastResult?.isCritical && (
                  <span className="text-sm font-headline font-bold uppercase tracking-widest mt-1">Critical Success!</span>
                )}
                {lastResult?.isFumble && (
                  <span className="text-sm font-headline font-bold uppercase tracking-widest mt-1">Critical Failure!</span>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
