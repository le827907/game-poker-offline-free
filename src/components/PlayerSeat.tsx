import React from 'react';
import { Player } from '../poker/types';
import { PlayingCard, cn } from './Card';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  player: Player;
  isCurrentActor: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  positionClass: string;
  isTop?: boolean;
  actionBadge?: string | null;
  isThinking?: boolean;
  isWinner?: boolean;
  winAmount?: number;
  isSplit?: boolean;
}

export const PlayerSeat: React.FC<Props> = ({ player, isCurrentActor, isDealer, isSmallBlind, isBigBlind, positionClass, isTop, actionBadge, isThinking, isWinner, winAmount, isSplit }) => {
  return (
    <div className={cn("absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center", positionClass)}>
      
      {/* Winner Badge */}
      <AnimatePresence>
        {isWinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "absolute z-50 px-4 py-1.5 rounded-xl shadow-2xl font-black text-sm text-yellow-900 bg-yellow-400 border-2 border-yellow-200 whitespace-nowrap animate-pulse",
              isTop ? "top-full mt-4" : "bottom-full mb-4"
            )}
          >
            {isSplit ? "Chia Pot" : "Thắng Pot"} +${winAmount}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Badge */}
      <AnimatePresence>
        {actionBadge && (
          <motion.div
            initial={{ opacity: 0, y: isTop ? 10 : -10, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              "absolute z-50 px-3 py-1 rounded-lg shadow-xl font-bold text-sm text-white whitespace-nowrap border border-white/20",
              isTop ? "-bottom-32" : "-top-32",
              actionBadge.includes("Bỏ bài") ? "bg-slate-700 text-slate-300" :
              actionBadge.includes("Xem") ? "bg-emerald-600" :
              actionBadge.includes("Theo") ? "bg-blue-600" :
              actionBadge.includes("Tố") ? "bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.6)] text-base" :
              "bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)] text-base uppercase animate-pulse" // Tất tay
            )}
          >
            {actionBadge}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Turn Indicator Label */}
      <AnimatePresence>
        {isCurrentActor && !player.hasFolded && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute z-40 px-3 py-1 rounded shadow-md text-xs font-bold whitespace-nowrap",
              isTop ? "-top-8" : "-top-8",
              isThinking || player.isBot ? "bg-yellow-500 text-yellow-950 shadow-[0_0_15px_rgba(234,179,8,0.6)] animate-pulse" : "bg-emerald-500 text-emerald-950 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.6)]"
            )}
          >
            {player.isBot ? "Đang suy nghĩ..." : "Lượt của bạn"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bet Amount */}
      <AnimatePresence>
        {player.currentBet > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: isTop ? -10 : 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isTop ? 10 : -10, scale: 0.8 }}
            className={cn(
              "absolute bg-slate-800 text-white text-xs px-3 py-1 rounded-full shadow-lg border border-slate-600 font-bold tracking-wider z-20 flex items-center gap-1",
              isTop ? "-bottom-24" : "-top-24"
            )}
          >
            <div className="w-2 h-2 rounded-full bg-yellow-400 mr-1" />
            {player.currentBet}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards */}
      <AnimatePresence>
        {!player.hasFolded && player.cards && player.cards.length === 2 && (
          <motion.div 
             initial={{ 
               opacity: 0, 
               scale: 0.2, 
               x: positionClass.includes('left-[20%]') ? 150 : positionClass.includes('left-[80%]') ? -150 : 0, 
               y: isTop ? 150 : -150 
             }}
             animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
             exit={{ opacity: 0, scale: 0.8 }}
             transition={{ type: "spring", stiffness: 200, damping: 20 }}
             className={cn(
               "flex gap-1 absolute z-10",
               isTop ? "-bottom-14 sm:-bottom-16" : "-top-14 sm:-top-16"
             )}
          >
            <PlayingCard key={player.cards[0].id || `${player.cards[0].rank}-${player.cards[0].suit}`} card={player.cards[0]} hidden={player.isBot} className="-rotate-6 hover:rotate-0 transition-transform origin-bottom-right" delay={0.1} />
            <PlayingCard key={player.cards[1].id || `${player.cards[1].rank}-${player.cards[1].suit}`} card={player.cards[1]} hidden={player.isBot} className="rotate-6 hover:rotate-0 transition-transform origin-bottom-left" delay={0.2} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Folded Cards placeholder for visual effect */}
      <AnimatePresence>
        {player.hasFolded && player.cards && player.cards.length === 2 && (
          <motion.div 
             initial={{ opacity: 1 }}
             animate={{ opacity: 0.3, y: isTop ? -10 : 10, scale: 0.9, rotate: isTop ? 10 : -10 }}
             className={cn(
               "flex gap-1 absolute z-0 grayscale",
               isTop ? "-bottom-12 sm:-bottom-14" : "-top-12 sm:-top-14"
             )}
          >
             <PlayingCard key={player.cards[0].id || `${player.cards[0].rank}-${player.cards[0].suit}`} card={player.cards[0]} hidden={player.isBot} className="-rotate-12" />
             <PlayingCard key={player.cards[1].id || `${player.cards[1].rank}-${player.cards[1].suit}`} card={player.cards[1]} hidden={player.isBot} className="rotate-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar/Info */}
      <motion.div 
        animate={
          isWinner 
            ? { 
                scale: [1, 1.1, 1.05],
                boxShadow: ["0px 0px 20px rgba(250,204,21,0.5)", "0px 0px 60px rgba(250,204,21,1)", "0px 0px 40px rgba(250,204,21,0.8)"],
                borderColor: ["#facc15", "#fef08a", "#facc15"] 
              }
            : isCurrentActor && !player.isBot
            ? {
                scale: 1.05,
                boxShadow: ["0px 0px 20px rgba(52,211,153,0.5)", "0px 0px 40px rgba(52,211,153,0.8)", "0px 0px 20px rgba(52,211,153,0.5)"],
                borderColor: ["#34d399", "#6ee7b7", "#34d399"]
              }
            : isCurrentActor && player.isBot
            ? {
                scale: 1.05,
                boxShadow: ["0px 0px 20px rgba(234,179,8,0.5)", "0px 0px 40px rgba(234,179,8,0.8)", "0px 0px 20px rgba(234,179,8,0.5)"],
                borderColor: ["#eab308", "#fde047", "#eab308"]
              }
            : { scale: 1, boxShadow: "0px 0px 0px rgba(0,0,0,0)" }
        }
        transition={
          isWinner 
            ? { duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" } 
            : isCurrentActor
            ? { duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
            : { duration: 0.3 }
        }
        className={cn(
          "relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 flex flex-col items-center justify-center text-white shadow-xl transition-colors duration-300 z-30",
          isWinner ? "bg-yellow-600 border-yellow-400" :
          isCurrentActor && !player.isBot ? "bg-slate-700" :
          isCurrentActor && player.isBot ? "bg-slate-700" : "border-slate-600 bg-slate-800",
          !player.isActive ? "opacity-30 grayscale" : player.hasFolded ? "opacity-40 grayscale" : "opacity-100"
        )}
      >
        <div className="text-xs sm:text-sm font-bold truncate w-11/12 text-center text-slate-100">{player.name}</div>
        <div className="text-[10px] sm:text-xs font-mono text-emerald-400 mt-0.5">${player.chips}</div>
        
        {player.isAllIn && <div className="text-[9px] font-black text-red-500 uppercase mt-1 tracking-wider bg-red-500/20 px-2 py-0.5 rounded-full">Tất tay</div>}
        {player.hasFolded && player.isActive && <div className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-wider">Đã bỏ bài</div>}
        {!player.isActive && <div className="text-[9px] font-black text-red-400 uppercase mt-1 tracking-wider">Đã bị loại</div>}
        
        {/* Buttons (Dealer / Blinds) */}
        <div className="absolute -bottom-2 flex gap-1">
          {isDealer && (
            <div className="w-6 h-6 bg-white rounded-full border-2 border-slate-800 text-slate-900 font-bold text-[10px] flex items-center justify-center shadow-md">
              D
            </div>
          )}
          {(isSmallBlind || isBigBlind) && (
            <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-slate-800 text-white font-bold text-[10px] flex items-center justify-center shadow-md">
              {isSmallBlind ? 'SB' : 'BB'}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
