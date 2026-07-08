import React, { useState, useEffect } from 'react';
import { GameState, ActionType } from '../poker/types';
import { cn } from './Card';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  state: GameState;
  onAction: (action: ActionType, amount?: number) => void;
  onNextHand: () => void;
}

export const ActionBar: React.FC<Props> = ({ state, onAction, onNextHand }) => {
  const actor = state.players[state.currentActorIndex];
  const isPlayerTurn = !actor.isBot && state.handInProgress;
  
  const callAmount = state.currentHighestBet - actor.currentBet;
  const canCheck = callAmount === 0;
  
  const maxTotalBet = actor.currentBet + actor.chips;
  const minRaiseAmount = Math.min(state.minRaise, maxTotalBet);
  
  const [raiseInput, setRaiseInput] = useState(minRaiseAmount);

  useEffect(() => {
    setRaiseInput(minRaiseAmount);
  }, [minRaiseAmount, isPlayerTurn]);

  if (!state.handInProgress) {
    if (actor.chips <= 0) return null;
    return (
      <div className="w-full bg-slate-900 border-t border-slate-800 p-4 flex justify-center items-center gap-4 z-40">
        <button 
          onClick={onNextHand}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-10 rounded-xl shadow-[0_0_15px_rgba(5,150,105,0.4)] text-lg transition-transform hover:scale-105 active:scale-95"
        >
          Ván Tiếp Theo
        </button>
      </div>
    );
  }

  if (!isPlayerTurn) {
    return (
      <div className="w-full bg-slate-900 border-t border-slate-800 p-4 flex justify-center items-center h-28 sm:h-24 z-40">
        <div className="text-slate-400 font-medium animate-pulse flex items-center gap-3 bg-slate-800 px-6 py-3 rounded-full">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
          Đang chờ đối thủ... ({actor.name})
        </div>
      </div>
    );
  }

  const handleRaise = () => {
    if (raiseInput >= maxTotalBet) {
      onAction('all-in');
    } else {
      onAction('raise', raiseInput);
    }
  };

  const canRaise = maxTotalBet > state.currentHighestBet && !actor.hasActed;

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full bg-slate-900 border-t-2 border-emerald-500 p-4 z-40 shadow-[0_-10px_40px_rgba(16,185,129,0.2)] flex flex-col items-center"
    >
      <div className="absolute -top-4 bg-emerald-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider animate-bounce">
        Đến lượt bạn
      </div>
      <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row gap-4 sm:gap-8 justify-between items-center">
        
        {/* Raise Slider / Input */}
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <div className="w-full flex items-center gap-3">
            <span className="text-xs text-slate-500 font-bold min-w-[30px]">${minRaiseAmount}</span>
            <input 
              type="range" 
              min={minRaiseAmount} 
              max={maxTotalBet} 
              step={state.bigBlind}
              value={raiseInput}
              onChange={(e) => setRaiseInput(Number(e.target.value))}
              className="flex-1 accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              disabled={!canRaise}
            />
            <span className="text-xs text-slate-500 font-bold min-w-[30px]">${maxTotalBet}</span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
            <div className="text-emerald-400 font-bold text-xl sm:text-2xl w-20 text-right font-mono">
              ${raiseInput}
            </div>
            <button 
              onClick={handleRaise}
              disabled={!canRaise}
              className="bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform active:scale-95 whitespace-nowrap min-w-[120px]"
            >
              {raiseInput >= maxTotalBet ? 'Tất tay' : 'Tố'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full sm:w-auto justify-center">
          <button 
            onClick={() => onAction('fold')}
            className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-6 sm:px-8 rounded-lg shadow-lg transition-transform active:scale-95"
          >
            Bỏ bài
          </button>
          {canCheck ? (
            <button 
              onClick={() => onAction('check')}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 sm:px-8 rounded-lg shadow-lg transition-transform active:scale-95"
            >
              Xem bài
            </button>
          ) : (
            <button 
              onClick={() => {
                if (callAmount >= actor.chips) {
                  onAction('all-in');
                } else {
                  onAction('call');
                }
              }}
              className="flex-1 sm:flex-none bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 px-6 sm:px-8 rounded-lg shadow-lg transition-transform active:scale-95 flex flex-col items-center justify-center leading-none"
            >
              <span>{callAmount >= actor.chips ? 'Tất tay' : 'Theo'}</span>
              {callAmount < actor.chips && <span className="text-xs font-mono mt-1">${callAmount}</span>}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
