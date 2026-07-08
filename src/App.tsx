import React, { useState, useEffect, useRef } from 'react';
import { GameState, ActionType, Action } from './poker/types';
import { initGame, startHand, processAction, STARTING_CHIPS } from './poker/engine';
import { decideBotAction } from './poker/bot';
import { PlayerSeat } from './components/PlayerSeat';
import { ActionBar } from './components/ActionBar';
import { PlayingCard, cn } from './components/Card';
import { VictoryConfetti } from './components/VictoryConfetti';
import { HandRankings } from './components/HandRankTooltip';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

import { soundManager } from './audio';

const RulesModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
  >
    <motion.div 
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Luật Chơi Poker (Texas Hold'em)</h2>
        <button onClick={() => { soundManager.playModal(); onClose(); }} className="text-slate-400 hover:text-white font-bold text-xl">✕</button>
      </div>
      <div className="space-y-4 text-slate-300">
        <section>
          <h3 className="text-lg font-bold text-blue-400 mb-2">Mục tiêu</h3>
          <p>Tạo thành tay bài 5 lá mạnh nhất từ 2 lá bài riêng của bạn và 5 lá bài chung trên bàn, hoặc khiến tất cả đối thủ phải bỏ bài.</p>
        </section>
        <section>
          <h3 className="text-lg font-bold text-blue-400 mb-2">Các Hành Động</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Bỏ bài (Fold):</strong> Dừng chơi ván hiện tại, chấp nhận mất số chip đã cược.</li>
            <li><strong>Xem bài (Check):</strong> Nhường lượt cho người tiếp theo khi chưa có ai cược thêm.</li>
            <li><strong>Theo (Call):</strong> Bỏ ra số chip bằng với mức cược cao nhất hiện tại để tiếp tục chơi.</li>
            <li><strong>Tố (Raise):</strong> Tăng mức cược lên cao hơn. Mức tăng tối thiểu bằng mức cược trước đó.</li>
            <li><strong>Tất tay (All-in):</strong> Cược toàn bộ số chip bạn đang có. Bạn sẽ chỉ thắng được số chip tương ứng từ mỗi đối thủ ở vòng đó (Side pot).</li>
          </ul>
        </section>
        <section>
          <h3 className="text-lg font-bold text-blue-400 mb-2">Thứ Tự Tay Bài (Từ mạnh đến yếu)</h3>
          <HandRankings />
        </section>
        <section>
          <h3 className="text-lg font-bold text-blue-400 mb-2">Nạp Lại (Rebuy)</h3>
          <p>Nếu bạn hết chip (phá sản), bạn có thể nạp lại $1000 miễn phí để tiếp tục chơi.</p>
        </section>
      </div>
      <div className="mt-8 text-center">
        <button onClick={() => { soundManager.playModal(); onClose(); }} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-lg font-bold transition-colors">Đã hiểu</button>
      </div>
    </motion.div>
  </motion.div>
);

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [bankroll, setBankroll] = useState(5000);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard' | 'expert'>('expert');
  
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  const toggleSound = () => {
    setSoundEnabled(soundManager.toggleSound());
  };

  // UI State
  const [actionBadges, setActionBadges] = useState<{ [playerId: string]: { id: number, text: string } }>({});
  const [chipAnimations, setChipAnimations] = useState<{ id: string, playerIndex: number, type: 'to-pot' | 'to-player' | 'burst', particles?: { id: string, dx: number, dy: number, delay: number }[] }[]>([]);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const isBotActing = useRef(false);

  const showActionBadge = (playerId: string, actionType: ActionType, amount?: number) => {
    let text = "";
    if (actionType === 'fold') { text = "Bỏ bài"; soundManager.playFold(); }
    else if (actionType === 'check') { text = "Xem"; soundManager.playCheck(); }
    else if (actionType === 'call') { text = `Theo ${amount ? '$'+amount : ''}`; soundManager.playCall(); }
    else if (actionType === 'raise') { text = `Tố $${amount}`; soundManager.playRaise(); }
    else if (actionType === 'all-in') { text = `Tất tay $${amount}`; soundManager.playAllIn(); }

    if (['call', 'raise', 'all-in'].includes(actionType)) {
      const pIndex = state?.players.findIndex(p => p.id === playerId) ?? -1;
      if (pIndex !== -1) {
        const animId = Date.now().toString() + Math.random();
        setChipAnimations(prev => [...prev, { id: animId, playerIndex: pIndex, type: 'to-pot' }]);
        setTimeout(() => {
          setChipAnimations(prev => prev.filter(a => a.id !== animId));
        }, 800);
      }
    }

    const badgeId = Date.now();
    setActionBadges(prev => ({
      ...prev,
      [playerId]: { id: badgeId, text }
    }));
    
    setTimeout(() => {
      setActionBadges(prev => {
        if (prev[playerId]?.id === badgeId) {
          const next = { ...prev };
          delete next[playerId];
          return next;
        }
        return prev;
      });
    }, 2000);
  };

  const prevBoardLength = useRef(0);
  const prevPot = useRef(0);

  useEffect(() => {
    if (!state) return;

    if (state.pot > prevPot.current && prevPot.current > 0) {
      soundManager.playPot();
    }
    prevPot.current = state.pot;

    if (state.board.length > prevBoardLength.current) {
      if (state.board.length === 3) { // Flop
        soundManager.playDealerAnnounce('flop');
        setTimeout(() => soundManager.playDeal(), 300);
        setTimeout(() => soundManager.playDeal(), 500);
        setTimeout(() => soundManager.playDeal(), 700);
      } else if (state.board.length === 4) { // Turn
        soundManager.playDealerAnnounce('turn');
        setTimeout(() => soundManager.playDeal(), 200);
      } else if (state.board.length === 5) { // River
        soundManager.playDealerAnnounce('river');
        setTimeout(() => soundManager.playDeal(), 200);
      }
    } else if (state.handInProgress && prevBoardLength.current > 0 && state.board.length === 0) {
      // New hand (preflop deal)
      soundManager.playShuffle();
      setTimeout(() => soundManager.playDeal(), 600);
      setTimeout(() => soundManager.playDeal(), 750);
    }
    prevBoardLength.current = state.board.length;
  }, [state?.board.length, state?.pot, state?.handInProgress]);

  useEffect(() => {
    if (state && !state.handInProgress && state.winners.length > 0) {
      if (state.winners.length > 1) {
        soundManager.playSplitPot();
      } else {
        soundManager.playShowdown();
      }
      
      // Add win chip animations
      state.winners.forEach((winner, i) => {
         const particles = Array.from({ length: 15 }).map((_, j) => ({
             id: Date.now().toString() + "-win-" + i + "-" + j,
             dx: (Math.random() - 0.5) * 200,
             dy: (Math.random() - 0.5) * 200,
             delay: Math.random() * 0.2
         }));
         const animId = Date.now().toString() + "-burst-" + i;
         setChipAnimations(prev => [...prev, { id: animId, playerIndex: winner.playerIndex, type: 'burst', particles }]);
         setTimeout(() => {
           setChipAnimations(prev => prev.filter(a => a.id !== animId));
         }, 1500);
      });
    }
  }, [state?.handInProgress, state?.winners]);

  useEffect(() => {
    // Load from local storage on mount
    const savedBankroll = localStorage.getItem('poker_bankroll');
    const initialChips = savedBankroll ? Number(savedBankroll) : STARTING_CHIPS;
    setBankroll(initialChips);
    
    // Init game
    setState(initGame('Bạn', initialChips, difficulty));
  }, []);

  useEffect(() => {
    if (!state || !state.handInProgress) return;

    const actor = state.players[state.currentActorIndex];
    if (actor.isBot) {
      if (isBotActing.current) return;
      isBotActing.current = true;
      setIsBotThinking(true);
      
      const timer = setTimeout(() => {
        const action = decideBotAction(state);
        setIsBotThinking(false);
        showActionBadge(actor.id, action.type, action.amount);
        setState(prev => prev ? processAction(prev, action.type, action.amount) : prev);
        isBotActing.current = false;
      }, 1500); // 1.5s delay for bot thinking
      
      return () => {
        clearTimeout(timer);
        isBotActing.current = false;
        setIsBotThinking(false);
      };
    }
  }, [state]);

  // Hand completion and persistence
  useEffect(() => {
    if (state && !state.handInProgress && state.handHistory.length > 1) {
      // Hand just finished, update bankroll
      const player = state.players.find(p => !p.isBot);
      if (player) {
        localStorage.setItem('poker_bankroll', player.chips.toString());
        setBankroll(player.chips);
      }
    }
  }, [state?.handInProgress]);

  const handleRebuy = () => {
    soundManager.playRebuy();
    localStorage.setItem('poker_bankroll', STARTING_CHIPS.toString());
    setBankroll(STARTING_CHIPS);
    setState(initGame('Bạn', STARTING_CHIPS, difficulty));
  };

  const handleStartPlay = () => {
    soundManager.init();
    soundManager.playButton();
    setShowStartScreen(false);
    if (state && !state.handInProgress && state.winners.length === 0) {
      handleNextHand();
    }
  };

  if (!state) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Đang tải...</div>;

  const handleAction = (action: ActionType, amount?: number) => {
    if (!state) return;
    const actorId = state.players[state.currentActorIndex].id;
    showActionBadge(actorId, action, amount);
    setState(prev => prev ? processAction(prev, action, amount) : prev);
  };

  const handleNextHand = () => {
    setActionBadges({});
    setState(prev => prev ? startHand(prev) : prev);
  };

  // Seat positions for 6-max around an oval table
  const seatPositions = [
    "top-[100%] sm:top-[105%] left-1/2",         // Bottom (Player)
    "top-[85%] left-[-2%] sm:left-[-5%]",        // Bottom Left
    "top-[15%] left-[-2%] sm:left-[-5%]",        // Top Left
    "top-[0%] sm:top-[-5%] left-1/2",            // Top
    "top-[15%] right-[-2%] sm:right-[-5%]",      // Top Right
    "top-[85%] right-[-2%] sm:right-[-5%]",      // Bottom Right
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100dvh] bg-slate-950 flex flex-col font-sans text-slate-200 overflow-x-hidden relative">
      <AnimatePresence>
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </AnimatePresence>
      
      <AnimatePresence>
        {showStartScreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md"
          >
            <motion.h1 
              initial={{ scale: 0.8, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-8"
            >
              Offline Poker
            </motion.h1>
            <div className="space-y-4 flex flex-col w-64">
              <button 
                onClick={handleStartPlay}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] text-xl transition-all hover:scale-105"
              >
                Chơi Ngay
              </button>
              <div className="bg-slate-800 p-2 rounded-xl flex flex-col items-center gap-2">
                <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">Độ khó</span>
                <select 
                  value={difficulty} 
                  onChange={(e) => {
                    const diff = e.target.value as 'easy' | 'normal' | 'hard' | 'expert';
                    setDifficulty(diff);
                    if (state && !state.handInProgress) {
                      setState(initGame('Bạn', bankroll, diff));
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 w-full text-center outline-none focus:border-blue-500 font-medium"
                >
                  <option value="easy">Dễ</option>
                  <option value="normal">Bình thường</option>
                  <option value="hard">Khó</option>
                  <option value="expert">Cực khó</option>
                </select>
              </div>
              <button 
                onClick={() => { soundManager.playModal(); setShowRules(true); }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-8 rounded-full transition-colors"
              >
                Luật Chơi
              </button>
              <button 
                onClick={toggleSound}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-8 rounded-full transition-colors flex justify-center gap-2"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {soundEnabled ? (
                    <motion.div
                      key="sound-on"
                      initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex items-center gap-2"
                    >
                      <Volume2 size={20} className="text-emerald-400" /> Bật âm thanh
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sound-off"
                      initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex items-center gap-2"
                    >
                      <VolumeX size={20} className="text-red-400" /> Tắt âm thanh
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-4 bg-slate-900/50 flex justify-between items-center border-b border-slate-800 z-10 flex-wrap gap-4">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-4">
          Offline Poker
          <button 
            onClick={() => { soundManager.playModal(); setShowRules(true); }}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300 transition-colors"
          >
            Luật Chơi
          </button>
          <button 
            onClick={toggleSound}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300 transition-colors flex items-center gap-1 overflow-hidden min-w-[85px] justify-center"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            <AnimatePresence mode="wait" initial={false}>
              {soundEnabled ? (
                <motion.div
                  key="icon-on"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Volume2 size={16} className="text-emerald-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="icon-off"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <VolumeX size={16} className="text-red-400" />
                </motion.div>
              )}
            </AnimatePresence>
            <span>Âm thanh</span>
          </button>
        </h1>
        <div className="flex gap-4 text-sm font-medium">
          <div className="bg-slate-800 px-3 py-1 rounded shadow-inner text-slate-300 flex items-center gap-2">
            Ngân lượng: <span className="text-emerald-400 font-bold">${bankroll}</span>
          </div>
          <div className="hidden sm:flex bg-slate-800 px-3 py-1 rounded shadow-inner text-slate-300 items-center">
            Mức cược: ${state.smallBlind}/${state.bigBlind}
          </div>
        </div>
      </header>

      {/* Main Table Area */}
      <main className="flex-1 relative p-4 sm:p-8 flex flex-col md:flex-row gap-4 sm:gap-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        {/* Table Canvas */}
        <div className="flex-1 relative flex items-center justify-center min-h-[400px] sm:min-h-[500px] py-16 px-6 sm:px-20">
          {/* Felt */}
          <div className="relative w-full max-w-5xl aspect-[1.8/1] sm:aspect-[2.5/1] table-surface rounded-[120px] sm:rounded-[200px] border-[8px] sm:border-[16px] border-slate-800 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]">
            
            {/* Center Area */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              
              {/* Main Pot */}
              <motion.div 
                key={state.pot}
                initial={{ scale: 1.2, textShadow: "0 0 10px rgba(250,204,21,1)" }}
                animate={{ scale: 1, textShadow: "0 0 0px rgba(250,204,21,0)" }}
                className="mb-4 bg-black/50 px-6 py-2 rounded-full text-white font-bold text-xl backdrop-blur-sm border border-emerald-700/50 flex items-center gap-2 shadow-lg"
              >
                <span className="text-emerald-400">Tổng:</span> ${state.pot}
              </motion.div>

              {/* Side Pots */}
              {state.pots.length > 1 && (
                <div className="flex gap-2 mb-4">
                  {state.pots.map((p, i) => (
                     <div key={i} className="bg-black/40 px-3 py-1 rounded-full text-white text-xs font-semibold backdrop-blur-sm border border-emerald-800">
                      Pot {i+1}: ${p.amount}
                     </div>
                  ))}
                </div>
              )}

              {/* Board Cards */}
              <div className="flex gap-2 h-24 items-center">
                <AnimatePresence>
                  {state.board.map((card, i) => (
                    <PlayingCard key={`${card.rank}-${card.suit}`} card={card} delay={i * 0.2 + 0.1} />
                  ))}
                </AnimatePresence>
                {/* Placeholders for un-dealt board cards */}
                {Array.from({ length: Math.max(0, 5 - state.board.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-10 h-14 sm:w-14 sm:h-20 rounded-md border border-emerald-700/30 bg-emerald-900/20 flex items-center justify-center" />
                ))}
              </div>
            </div>

            {/* Players */}
            {state.players.map((player, i) => {
              const isTop = i === 2 || i === 3 || i === 4;
              const isWinner = !state.handInProgress && state.winners.some(w => w.playerIndex === i);
              const winAmount = state.winners.find(w => w.playerIndex === i)?.amount;
              const isSplit = state.winners.length > 1;

              return (
                <PlayerSeat
                  key={player.id}
                  player={player}
                  isCurrentActor={state.currentActorIndex === i && state.handInProgress}
                  isDealer={state.dealerIndex === i}
                  isSmallBlind={state.smallBlindIndex === i}
                  isBigBlind={state.bigBlindIndex === i}
                  positionClass={seatPositions[i]}
                  isTop={isTop}
                  actionBadge={actionBadges[player.id]?.text}
                  isThinking={state.currentActorIndex === i && state.handInProgress && player.isBot && isBotThinking}
                  isWinner={isWinner}
                  winAmount={winAmount}
                  isSplit={isSplit}
                />
              );
            })}

            {/* Chip Animations Overlay */}
            <div className="absolute inset-0 pointer-events-none z-50">
              <AnimatePresence>
                {chipAnimations.map(anim => {
                   const posClass = seatPositions[anim.playerIndex];
                   if (anim.type === 'to-pot') {
                     return (
                       <div key={anim.id} className="absolute inset-0">
                         <motion.div
                           className={cn("absolute w-6 h-6 rounded-full bg-yellow-500 border-2 border-yellow-300 shadow-lg flex items-center justify-center -translate-x-1/2 -translate-y-1/2", posClass)}
                           initial={{ opacity: 1, scale: 1 }}
                           animate={{ top: '50%', left: '50%', opacity: 0, scale: 0.5 }}
                           transition={{ duration: 0.5, ease: "easeOut" }}
                           exit={{ opacity: 0 }}
                         >
                            <div className="w-3 h-3 rounded-full border border-yellow-300 border-dashed" />
                         </motion.div>
                       </div>
                     );
                   } else if (anim.type === 'burst') {
                     let targetTop = '85%';
                     let targetLeft = '100%';
                     if (posClass.includes('top-[100%]')) { targetTop = '100%'; targetLeft = '50%'; }
                     else if (posClass.includes('top-[85%] left')) { targetTop = '85%'; targetLeft = '0%'; }
                     else if (posClass.includes('top-[15%] left')) { targetTop = '15%'; targetLeft = '0%'; }
                     else if (posClass.includes('top-[0%]')) { targetTop = '0%'; targetLeft = '50%'; }
                     else if (posClass.includes('top-[15%] right')) { targetTop = '15%'; targetLeft = '100%'; }

                     return (
                       <div key={anim.id} className="absolute inset-0">
                         {anim.particles?.map(p => (
                           <motion.div
                             key={p.id}
                             className={cn("absolute w-4 h-4 rounded-full bg-yellow-400 border-2 border-yellow-200 shadow-[0_0_10px_rgba(250,204,21,0.8)] flex items-center justify-center -translate-x-1/2 -translate-y-1/2")}
                             initial={{ top: '50%', left: '50%', opacity: 0, scale: 0 }}
                             animate={{
                               top: ['50%', '50%', targetTop],
                               left: ['50%', '50%', targetLeft],
                               x: ['-50%', `calc(-50% + ${p.dx}px)`, '-50%'],
                               y: ['-50%', `calc(-50% + ${p.dy}px)`, '-50%'],
                               opacity: [0, 1, 1, 0],
                               scale: [0.5, 1, 1, 0]
                             }}
                             transition={{ duration: 1, times: [0, 0.3, 0.8, 1], delay: p.delay, ease: "easeInOut" }}
                           />
                         ))}
                       </div>
                     );
                   } else {
                     return (
                       <div key={anim.id} className="absolute inset-0">
                         <motion.div
                           className={cn("absolute w-6 h-6 rounded-full bg-yellow-400 border-2 border-yellow-200 shadow-lg flex items-center justify-center -translate-x-1/2 -translate-y-1/2")}
                           initial={{ top: '50%', left: '50%', opacity: 0, scale: 0.5 }}
                           animate={
                             posClass.includes('top-[100%]') ? { top: '100%', left: '50%', opacity: 1, scale: 1 } :
                             posClass.includes('top-[85%] left') ? { top: '85%', left: '0%', opacity: 1, scale: 1 } :
                             posClass.includes('top-[15%] left') ? { top: '15%', left: '0%', opacity: 1, scale: 1 } :
                             posClass.includes('top-[0%]') ? { top: '0%', left: '50%', opacity: 1, scale: 1 } :
                             posClass.includes('top-[15%] right') ? { top: '15%', left: '100%', opacity: 1, scale: 1 } :
                             { top: '85%', left: '100%', opacity: 1, scale: 1 }
                           }
                           transition={{ duration: 0.5, ease: "easeOut" }}
                           exit={{ opacity: 0 }}
                         >
                            <div className="w-3 h-3 rounded-full border border-yellow-200 border-dashed" />
                         </motion.div>
                       </div>
                     );
                   }
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Showdown Overlay / Winners */}
          <AnimatePresence>
            {!state.handInProgress && state.winners.length > 0 && (
              <>
                <VictoryConfetti />
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-slate-900/95 border border-slate-700 p-6 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md text-center max-w-sm pointer-events-auto"
                >
                  <h2 className="text-3xl font-black text-yellow-400 mb-4 tracking-wider uppercase">Kết quả</h2>
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {state.winners.map((w, i) => (
                      <div key={i} className="bg-slate-800 p-4 rounded-xl text-left border-2 border-yellow-500/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-bl-full" />
                        <div className="text-white font-bold text-lg">{state.players[w.playerIndex].name}</div>
                        <div className="text-emerald-400 font-bold mt-1 text-2xl">+${w.amount}</div>
                        <div className="text-yellow-400 text-sm mt-2 font-black uppercase tracking-wider bg-yellow-500/10 inline-block px-3 py-1 rounded-full border border-yellow-500/30">
                          {w.description}
                        </div>
                        {w.handCards && w.handCards.length === 2 && (
                          <div className="flex gap-2 mt-3">
                             <PlayingCard card={w.handCards[0]} delay={0.2} />
                             <PlayingCard card={w.handCards[1]} delay={0.4} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {bankroll > 0 && (
                    <button 
                      onClick={handleNextHand}
                      className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-4 rounded-lg shadow-lg text-lg transition-transform hover:scale-105 active:scale-95"
                    >
                      Ván Tiếp Theo
                    </button>
                  )}
                </motion.div>
              </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Rebuy Button overlay if bust */}
          <AnimatePresence>
            {!state.handInProgress && bankroll <= 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm"
              >
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-xl shadow-2xl text-center max-w-sm w-full mx-4">
                  <h2 className="text-4xl font-black text-red-500 mb-2 uppercase tracking-widest">Hết Chip!</h2>
                  <p className="text-slate-400 mb-8 text-lg">Bạn đã thua hết ngân lượng.</p>
                  <button 
                    onClick={handleRebuy}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(5,150,105,0.4)] text-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    Nạp lại $1000
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Hand History Panel */}
        <div className="w-full md:w-80 bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-64 md:h-full md:max-h-[600px] shadow-xl overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Lịch sử
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse custom-scrollbar">
            {[...state.handHistory].reverse().map((log, i) => {
              const isHighlight = log.includes("thắng") || log.includes("tất tay") || log.includes("Trả lại");
              return (
                <div 
                  key={i} 
                  className={`text-sm p-2 rounded-lg leading-relaxed break-words ${
                    i === 0 
                      ? 'bg-slate-800 border-l-2 border-blue-500 text-white font-medium' 
                      : isHighlight 
                        ? 'bg-slate-800/50 text-emerald-300' 
                        : 'text-slate-400'
                  }`}
                >
                  {log}
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* Action Bar */}
      <ActionBar state={state} onAction={handleAction} onNextHand={handleNextHand} />
    </div>
    </MotionConfig>
  );
}
