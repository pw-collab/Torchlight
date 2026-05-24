import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RollResult } from '../types';
import { Sparkles, Skull } from 'lucide-react';
import DescriptionWithRolls from './DescriptionWithRolls';
import { rollFormula } from '../lib/dice';

interface RollToastsProps {
  rolls: RollResult[];
  onRoll: (result: RollResult) => void;
}

export default function RollToasts({ rolls, onRoll }: RollToastsProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const visibleRolls = rolls.filter(r => now - r.timestamp < 15000);

  return (
    <div className="fixed bottom-24 right-4 md:right-8 z-50 flex flex-col-reverse gap-4 w-[calc(100vw-2rem)] md:w-80 pointer-events-none">
      <AnimatePresence>
        {visibleRolls.map(roll => (
          <motion.div
            key={roll.id}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`paper-card p-4 pointer-events-auto shadow-xl bg-surface-container ${
              roll.isCritical 
                ? 'border-primary shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                : roll.isFumble
                ? 'border-error shadow-[0_0_15px_rgba(255,180,171,0.2)]'
                : ''
            }`}
          >
            {roll.isCritical && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent -skew-x-12 pointer-events-none"
              />
            )}
            
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase tracking-widest text-surface-container font-label">{roll.label}</span>
                {roll.isCritical && <Sparkles size={12} className="text-primary animate-bounce" />}
                {roll.isFumble && <Skull size={12} className="text-error animate-pulse" />}
              </div>
              <span className="text-[9px] font-body italic opacity-50">{new Date(roll.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            
            <div className="flex justify-between items-end relative z-10">
              <div className="flex-1">
                {roll.subLabel && (
                  <div className="text-xs text-surface-container/80 font-body mb-2">
                    <DescriptionWithRolls 
                      text={roll.subLabel} 
                      onRoll={(formula) => onRoll(rollFormula(formula, roll.label))} 
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {roll.rolls ? (
                    <div className="flex items-center gap-1">
                      {roll.rolls.map((r, i) => {
                        const isKept = r === roll.result && roll.rolls!.indexOf(r) === i;
                        return (
                          <div key={i} className={`hand-drawn-border px-2 py-0.5 ${isKept ? 'bg-surface-container-low/50' : 'bg-surface-container-low/20 opacity-50 relative'}`}>
                            <span className="text-sm font-headline text-surface-container">{r}</span>
                            {!isKept && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[80%] h-[2px] bg-surface-container rotate-12"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="hand-drawn-border px-2 py-0.5 bg-surface-container-low/50">
                      <span className="text-sm font-headline text-surface-container">{roll.result}</span>
                    </div>
                  )}
                  {roll.modifier && roll.modifier !== 0 ? (
                    <span className="text-xs font-label text-surface-container-low">
                      {roll.modifier >= 0 ? `+${roll.modifier}` : roll.modifier}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className={`text-3xl font-headline flex flex-col items-end ${
                roll.isCritical 
                  ? 'text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' 
                  : roll.isFumble
                  ? 'text-error'
                  : 'text-on-surface'
              }`}>
                <motion.span
                  initial={{ scale: 0.5, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  {roll.total}
                </motion.span>
                {roll.isCritical && <span className="text-[9px] uppercase tracking-widest font-label text-primary mt-1">Critical!</span>}
                {roll.isFumble && <span className="text-[9px] uppercase tracking-widest font-label text-error mt-1">Fumble!</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
