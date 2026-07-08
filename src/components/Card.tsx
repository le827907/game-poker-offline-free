import React from 'react';
import { Card as CardType } from '../poker/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PlayingCard: React.FC<{ card?: CardType, hidden?: boolean, className?: string, delay?: number }> = ({ card, hidden, className, delay = 0 }) => {
  if (hidden || !card) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
        animate={{ opacity: 1, scale: 1, rotateY: 180 }}
        transition={{ duration: 0.4, delay }}
        className={cn("w-10 h-14 sm:w-14 sm:h-20 rounded-md border border-slate-500 bg-slate-800 flex items-center justify-center shadow-md", className)}
      >
        <div className="w-full h-full m-1 rounded-sm border border-slate-600 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#475569_4px,#475569_8px)] opacity-50" />
      </motion.div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitSymbol = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  }[card.suit];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.5, delay, type: 'spring' }}
      className={cn(
        "w-10 h-14 sm:w-14 sm:h-20 rounded-md border border-slate-300 bg-white flex flex-col justify-between p-1 shadow-lg font-bold text-sm sm:text-lg select-none relative overflow-hidden", 
        isRed ? "text-red-600" : "text-slate-900", 
        className
      )}
    >
      <div className="leading-none">{card.rank}</div>
      <div className="text-center text-xl sm:text-3xl mt-[-4px] sm:mt-[-8px] absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">{suitSymbol}</div>
      <div className="text-right text-lg sm:text-2xl mt-auto self-end leading-none">{suitSymbol}</div>
    </motion.div>
  );
};
