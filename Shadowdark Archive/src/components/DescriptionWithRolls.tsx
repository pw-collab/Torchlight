import React from 'react';

interface DescriptionWithRollsProps {
  text: string;
  onRoll: (formula: string) => void;
  className?: string;
}

export default function DescriptionWithRolls({ text, onRoll, className = "" }: DescriptionWithRollsProps) {
  // Regex to find dice formulas like 1d6, d8, 3d8+2, etc.
  // Matches: 1d6, d6, 1d6+2, 1d6-1
  const diceRegex = /(\b\d*d\d+(?:[+-]\d+)?\b)/gi;
  const parts = text.split(diceRegex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.match(diceRegex)) {
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onRoll(part);
              }}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded text-[10px] font-bold transition-colors border border-primary/20 cursor-pointer"
            >
              {part}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
