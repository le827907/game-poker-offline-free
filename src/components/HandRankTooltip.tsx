import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HAND_RANKS = [
  { name: 'Sảnh Rồng (Royal Flush)', desc: '5 lá cao nhất đồng chất.', example: ['A♠', 'K♠', 'Q♠', 'J♠', '10♠'], colors: ['text-slate-800', 'text-slate-800', 'text-slate-800', 'text-slate-800', 'text-slate-800'] },
  { name: 'Thùng Phá Sảnh (Straight Flush)', desc: '5 lá liên tiếp đồng chất.', example: ['9♥', '8♥', '7♥', '6♥', '5♥'], colors: ['text-red-600', 'text-red-600', 'text-red-600', 'text-red-600', 'text-red-600'] },
  { name: 'Tứ Quý (Four of a Kind)', desc: '4 lá bài cùng số.', example: ['8♣', '8♦', '8♥', '8♠', 'K♥'], colors: ['text-slate-800', 'text-red-600', 'text-red-600', 'text-slate-800', 'text-red-600'] },
  { name: 'Cù Lũ (Full House)', desc: 'Một bộ 3 lá và một bộ 2 lá.', example: ['Q♣', 'Q♦', 'Q♥', '7♠', '7♣'], colors: ['text-slate-800', 'text-red-600', 'text-red-600', 'text-slate-800', 'text-slate-800'] },
  { name: 'Thùng / Đồng Chất (Flush)', desc: '5 lá bài cùng chất, không cần liên tiếp.', example: ['A♦', 'J♦', '8♦', '5♦', '2♦'], colors: ['text-red-600', 'text-red-600', 'text-red-600', 'text-red-600', 'text-red-600'] },
  { name: 'Sảnh (Straight)', desc: '5 lá bài liên tiếp, không đồng chất.', example: ['10♠', '9♥', '8♦', '7♣', '6♠'], colors: ['text-slate-800', 'text-red-600', 'text-red-600', 'text-slate-800', 'text-slate-800'] },
  { name: 'Sám Cô / 3 lá (Three of a Kind)', desc: '3 lá bài cùng số.', example: ['J♠', 'J♥', 'J♦', '4♣', '2♥'], colors: ['text-slate-800', 'text-red-600', 'text-red-600', 'text-slate-800', 'text-red-600'] },
  { name: 'Hai Đôi (Two Pair)', desc: 'Hai cặp bài cùng số.', example: ['10♣', '10♦', '6♠', '6♥', 'A♣'], colors: ['text-slate-800', 'text-red-600', 'text-slate-800', 'text-red-600', 'text-slate-800'] },
  { name: 'Một Đôi (One Pair)', desc: 'Một cặp bài cùng số.', example: ['K♠', 'K♥', '9♦', '7♣', '3♠'], colors: ['text-slate-800', 'text-red-600', 'text-red-600', 'text-slate-800', 'text-slate-800'] },
  { name: 'Mậu Thầu (High Card)', desc: 'Tay bài không có liên kết nào. Dùng lá bài cao nhất để so sánh.', example: ['A♣', 'Q♠', '10♥', '7♦', '4♣'], colors: ['text-slate-800', 'text-slate-800', 'text-red-600', 'text-red-600', 'text-slate-800'] }
];

export const HandRankings = () => {
  return (
    <ol className="list-decimal pl-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm relative">
      {HAND_RANKS.map((rank, idx) => (
        <li key={idx} className="relative group cursor-help">
          <span className="border-b border-dashed border-slate-500 hover:text-white transition-colors">{rank.name}</span>
          
          <div className="absolute left-0 bottom-full mb-2 w-64 bg-slate-800 text-white rounded-lg shadow-xl border border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-3 pointer-events-none transform -translate-y-2 group-hover:translate-y-0 origin-bottom-left">
            <p className="font-bold text-blue-400 mb-1">{rank.name}</p>
            <p className="text-slate-300 text-xs mb-2">{rank.desc}</p>
            <div className="flex gap-1">
              {rank.example.map((card, cardIdx) => (
                <div key={cardIdx} className="bg-white rounded text-center w-8 h-12 flex items-center justify-center font-bold text-lg border border-slate-300 shadow-sm">
                  <span className={rank.colors[cardIdx]}>{card}</span>
                </div>
              ))}
            </div>
            {/* Tooltip Arrow */}
            <div className="absolute left-4 -bottom-2 w-4 h-4 bg-slate-800 border-b border-r border-slate-600 transform rotate-45"></div>
          </div>
        </li>
      ))}
    </ol>
  );
};
