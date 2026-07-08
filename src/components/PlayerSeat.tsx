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
  handStrength?: string | null;
  winProbability?: number | null;
}


const PlayerAvatar = ({ seed, className }: { seed: string, className?: string }) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors1 = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];
  const colors2 = ['#7f1d1d', '#1e3a8a', '#064e3b', '#78350f', '#4c1d95', '#831843', '#164e63', '#713f12'];
  
  const c1 = colors1[Math.abs(hash) % colors1.length];
  const c2 = colors2[Math.abs(hash >> 3) % colors2.length];
  
  const shapes = ['circle', 'square', 'triangle', 'diamond', 'hexagon', 'star'];
  const shape = shapes[Math.abs(hash >> 5) % shapes.length];

  const renderShape = () => {
    switch (shape) {
      case 'circle': return <circle cx="50" cy="50" r="28" fill={c1} opacity="0.8" />;
      case 'square': return <rect x="22" y="22" width="56" height="56" rx="12" fill={c1} opacity="0.8" />;
      case 'triangle': return <polygon points="50,15 80,70 20,70" fill={c1} opacity="0.8" />;
      case 'diamond': return <polygon points="50,15 85,50 50,85 15,50" fill={c1} opacity="0.8" />;
      case 'hexagon': return <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" fill={c1} opacity="0.8" />;
      case 'star': return <polygon points="50,10 61,38 90,38 66,55 75,85 50,68 25,85 34,55 10,38 39,38" fill={c1} opacity="0.8" />;
      default: return <circle cx="50" cy="50" r="28" fill={c1} opacity="0.8" />;
    }
  }

  return (
    <svg viewBox="0 0 100 100" className={className}>
      <rect width="100" height="100" fill={c2} opacity="0.6" />
      {renderShape()}
    </svg>
  );
};

export const PlayerSeat: React.FC<Props> = ({ player, isCurrentActor, isDealer, isSmallBlind, isBigBlind, positionClass, isTop, actionBadge, isThinking, isWinner, winAmount, isSplit, handStrength, winProbability }) => {
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
            
            {(handStrength || (winProbability !== undefined && winProbability !== null)) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20"
              >
                {handStrength && (
                  <div className="whitespace-nowrap bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-lg backdrop-blur-sm tracking-wide">
                    {handStrength}
                  </div>
                )}
                {winProbability !== undefined && winProbability !== null && (
                  <div className="whitespace-nowrap bg-blue-900/90 border border-blue-500/50 text-blue-300 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-lg backdrop-blur-sm tracking-wide">
                    Thắng: {(winProbability * 100).toFixed(1)}%
                  </div>
                )}
              </motion.div>
            )}
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
          "relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 flex flex-col items-center justify-center text-white shadow-xl transition-colors duration-300 z-30 bg-slate-800",
          isWinner ? "border-yellow-400" :
          isCurrentActor && !player.isBot ? "border-blue-500" :
          isCurrentActor && player.isBot ? "border-slate-400" : "border-slate-600",
          !player.isActive ? "opacity-30 grayscale" : player.hasFolded ? "opacity-40 grayscale" : "opacity-100"
        )}
      >
        <PlayerAvatar seed={player.name} className="absolute inset-0 w-full h-full z-0 pointer-events-none" />
        <div className="z-10 text-xs sm:text-sm font-bold truncate w-11/12 text-center text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{player.name}</div>
        <div className="z-10 text-[10px] sm:text-xs font-mono text-emerald-400 mt-0.5 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] bg-slate-900/60 px-2 py-0.5 rounded-full">${player.chips}</div>
        
        {player.isAllIn && <div className="z-10 text-[9px] font-black text-red-500 uppercase mt-1 tracking-wider bg-red-500/90 px-2 py-0.5 rounded-full">Tất tay</div>}
        {player.hasFolded && player.isActive && <div className="z-10 text-[9px] font-black text-slate-200 uppercase mt-1 tracking-wider bg-slate-800/80 px-2 py-0.5 rounded-full">Đã bỏ bài</div>}
        {!player.isActive && <div className="z-10 text-[9px] font-black text-red-200 uppercase mt-1 tracking-wider bg-red-900/80 px-2 py-0.5 rounded-full">Đã bị loại</div>}
        
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
