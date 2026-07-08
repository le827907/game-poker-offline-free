import React, { useState, useEffect, useRef } from 'react';
import { GameState, ActionType } from '../poker/types';
import { cn } from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '../audio';

interface Props {
  state: GameState;
  onAction: (action: ActionType, amount?: number) => void;
  onNextHand: () => void;
}

export const ActionBar: React.FC<Props> = ({ state, onAction, onNextHand }) => {
  const actor = state.players[state.currentActorIndex];
  const isPlayerTurn = state.handInProgress && !actor.isBot;
  
  // Ref to track if we already played the sound for this turn
  const prevTurnRef = useRef(false);
  
  useEffect(() => {
    if (isPlayerTurn && !prevTurnRef.current) {
      soundManager.playYourTurn();
    }
    prevTurnRef.current = isPlayerTurn;
  }, [isPlayerTurn]);

  
  const callAmount = state.currentHighestBet - actor.currentBet;
  const canCheck = callAmount === 0;
  
  const maxTotalBet = actor.currentBet + actor.chips;
  const minRaiseAmount = Math.min(state.minRaise, maxTotalBet);
  
  const [raiseInput, setRaiseInput] = useState(minRaiseAmount);

  useEffect(() => {
    setRaiseInput(minRaiseAmount);
  }, [minRaiseAmount, isPlayerTurn]);

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
      className={cn(
        "w-full bg-slate-900 border-t-2 p-4 z-40 shadow-[0_-10px_40px_rgba(16,185,129,0.2)] flex flex-col items-center",
        isPlayerTurn ? "border-emerald-500" : "border-slate-800"
      )}
    >
      <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row gap-4 sm:gap-8 justify-between items-center">
        
        {/* Raise Slider / Input */}
        <div className={cn("flex-1 flex flex-col items-center gap-3 w-full sm:w-auto bg-slate-800/50 p-3 rounded-xl border border-slate-700/50", !isPlayerTurn && "opacity-50 pointer-events-none")}>
          
          <div className="w-full flex items-center justify-between gap-2">
             <button onClick={() => setRaiseInput(minRaiseAmount)} disabled={!canRaise} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300">Min</button>
             <button onClick={() => setRaiseInput(Math.min(maxTotalBet, Math.max(minRaiseAmount, Math.floor(state.pot / 2))))} disabled={!canRaise} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300">1/2 Pot</button>
             <button onClick={() => setRaiseInput(Math.min(maxTotalBet, Math.max(minRaiseAmount, state.pot)))} disabled={!canRaise} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300">Pot</button>
             <button onClick={() => setRaiseInput(maxTotalBet)} disabled={!canRaise} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300">Max</button>
          </div>

          <div className="w-full flex flex-col sm:flex-row items-center gap-3">
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
                disabled={!canRaise || !isPlayerTurn}
              />
              <span className="text-xs text-slate-500 font-bold min-w-[30px]">${maxTotalBet}</span>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input 
                  type="number"
                  min={minRaiseAmount}
                  max={maxTotalBet}
                  step={state.bigBlind}
                  value={raiseInput}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      setRaiseInput(val);
                    }
                  }}
                  onBlur={() => {
                    if (raiseInput < minRaiseAmount) setRaiseInput(minRaiseAmount);
                    if (raiseInput > maxTotalBet) setRaiseInput(maxTotalBet);
                  }}
                  disabled={!canRaise || !isPlayerTurn}
                  className="bg-slate-900 border border-slate-700 rounded pl-6 pr-2 py-2 text-emerald-400 font-bold text-lg w-24 text-right font-mono outline-none focus:border-blue-500"
                />
              </div>
              <button 
                onClick={handleRaise}
                disabled={!canRaise || !isPlayerTurn}
                className="bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform active:scale-95 whitespace-nowrap min-w-[120px]"
              >
                {raiseInput >= maxTotalBet ? 'Tất tay' : 'Tố'}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full sm:w-auto justify-center">
          <button 
            onClick={() => onAction('fold')}
            disabled={!isPlayerTurn}
            className="flex-1 sm:flex-none bg-slate-700 disabled:opacity-50 hover:bg-slate-600 text-white font-bold py-4 px-6 sm:px-8 rounded-lg shadow-lg transition-transform active:scale-95"
          >
            Bỏ bài
          </button>
          {canCheck ? (
            <button 
              onClick={() => onAction('check')}
              disabled={!isPlayerTurn}
              className="flex-1 sm:flex-none bg-emerald-600 disabled:opacity-50 hover:bg-emerald-500 text-white font-bold py-4 px-6 sm:px-8 rounded-lg shadow-lg transition-transform active:scale-95"
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
              disabled={!isPlayerTurn}
              className="flex-1 sm:flex-none bg-yellow-600 disabled:opacity-50 hover:bg-yellow-500 text-white font-bold py-4 px-6 sm:px-8 rounded-lg shadow-lg transition-transform active:scale-95 flex flex-col items-center justify-center leading-none"
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
