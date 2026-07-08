import { GameState, ActionType, Action, Card, Player } from './types';
import { evaluateHand } from './evaluator';

const rankToValue = (rank: string): number => {
  const map: { [key: string]: number } = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10 };
  return map[rank] || parseInt(rank);
};

export function decideBotAction(state: GameState): Action {
  const actor = state.players[state.currentActorIndex];
  const callAmount = state.currentHighestBet - actor.currentBet;
  const canCheck = callAmount === 0;
  const maxTotalBet = actor.currentBet + actor.chips;
  
  const canRaise = maxTotalBet > state.currentHighestBet && !actor.hasActed;

  const safeRaise = (amount: number): Action => {
      if (!canRaise) return canCheck ? { type: 'check' } : { type: 'call' };
      if (amount >= maxTotalBet) return { type: 'all-in' };
      return { type: 'raise', amount };
  };

  const difficulty = state.difficulty || 'normal';
  const rawProfile = actor.botProfile || 'balanced';
  
  let profile = 'balanced';
  if (rawProfile === 'tight') profile = 'tight';
  else if (rawProfile === 'aggressive') profile = 'aggressive';
  else if (rawProfile === 'loose') profile = 'calling_station';
  else if (rawProfile === 'passive') profile = 'tricky';

  // Evaluate Hand Strength
  const holeCards = actor.cards;
  const v1 = rankToValue(holeCards[0].rank);
  const v2 = rankToValue(holeCards[1].rank);
  const isSuited = holeCards[0].suit === holeCards[1].suit;
  const isPair = v1 === v2;
  const maxCard = Math.max(v1, v2);
  const minCard = Math.min(v1, v2);
  
  let preflopStrength = 0; // 0 to 10
  if (isPair) preflopStrength = minCard >= 10 ? 9 : minCard >= 7 ? 7 : 5;
  else if (maxCard >= 13 && minCard >= 10) preflopStrength = 8;
  else if (maxCard >= 12 && minCard >= 10) preflopStrength = 7;
  else if (maxCard >= 10 && minCard >= 9) preflopStrength = 5;
  else if (isSuited && maxCard >= 10) preflopStrength += 2;
  else if (maxCard - minCard <= 2 && minCard >= 6) preflopStrength = 4;
  else preflopStrength = 1;

  let postflopRank = 0;
  if (state.board.length > 0) {
    const solved = evaluateHand(holeCards, state.board);
    postflopRank = solved.rank; // 1: High Card, 2: Pair, 3: Two Pair, 4: Three of a Kind...
  }

  const activePlayers = state.players.filter(p => !p.hasFolded).length;
  const potOdds = callAmount / (state.pot + callAmount);
  const isShortStack = actor.chips < state.bigBlind * 10;
  const rand = Math.random();

  let handValue = 0; // 0 to 10
  let hasDraw = false;
  
  if (state.street !== 'preflop') {
      if (postflopRank >= 4) handValue = 9; // Trips+
      else if (postflopRank === 3) handValue = 7; // Two pair
      else if (postflopRank === 2) { 
         const boardMax = Math.max(...state.board.map(c => rankToValue(c.rank)));
         if (maxCard >= boardMax || isPair) handValue = 6; // Top pair or overpair
         else handValue = 4; // Mid/bottom pair
      } else {
         handValue = 2; // High card
      }

      // Basic draw detection (flush)
      const allSuits = [...holeCards, ...state.board].map(c => c.suit);
      const suitCounts = allSuits.reduce((acc, suit) => { acc[suit] = (acc[suit] || 0) + 1; return acc; }, {} as any);
      hasDraw = Object.values(suitCounts).some((c: any) => c === 4);
      if (hasDraw && handValue < 5) handValue = 5;
  }

  const strength = state.street === 'preflop' ? preflopStrength : handValue;

  // Apply difficulty modifiers
  let strengthMod = 0;
  if (difficulty === 'easy') {
    // Easy mode: overvalues weak hands slightly, undervalues strong hands (makes mistakes)
    strengthMod = rand < 0.3 ? 2 : (rand > 0.8 ? -2 : 0);
  } else if (difficulty === 'hard' || difficulty === 'expert') {
    // Hard mode: demands better hands to continue, punishes weakness
    if (callAmount > state.pot * 0.5) strengthMod = -1; // Tighter against large bets
  }

  const effStrength = Math.max(0, Math.min(10, strength + strengthMod));

  // Determine actions based on profile
  const executeAction = (): Action => {
      switch (profile) {
          case 'tight':
              return tightLogic();
          case 'aggressive':
              return aggressiveLogic();
          case 'calling_station':
              return callingStationLogic();
          case 'tricky':
              return trickyLogic();
          case 'balanced':
          default:
              return balancedLogic();
      }
  };

  function tightLogic(): Action {
      // Plays fewer hands, folds weak hands, raises strong
      if (effStrength >= 8) {
          if (canRaise && rand < 0.8) return safeRaise(Math.max(state.minRaise, state.pot * 0.75));
          if (callAmount > 0) return { type: 'call' };
          return canRaise && rand < 0.5 ? safeRaise(state.minRaise) : { type: 'check' };
      }
      if (effStrength >= 5) {
          if (potOdds < 0.3) return { type: 'call' };
          if (callAmount === 0) return { type: 'check' };
          return { type: 'fold' };
      }
      return canCheck ? { type: 'check' } : { type: 'fold' };
  }

  function aggressiveLogic(): Action {
      // Bets and raises more often, applies pressure, occasionally bluffs
      if (effStrength >= 6) {
          if (canRaise && rand < 0.8) return safeRaise(Math.max(state.minRaise, state.pot));
          return callAmount > 0 ? { type: 'call' } : { type: 'check' };
      }
      if (effStrength >= 4 || hasDraw) {
          if (canRaise && rand < 0.4) return safeRaise(state.minRaise); // Semi-bluff
          if (potOdds < 0.4) return { type: 'call' };
          return canCheck ? { type: 'check' } : { type: 'fold' };
      }
      // Pure bluff
      if (canRaise && rand < 0.2 && activePlayers <= 2) return safeRaise(state.pot * 0.5);
      return canCheck ? { type: 'check' } : { type: 'fold' };
  }

  function callingStationLogic(): Action {
      // Calls more often, rarely folds once invested, raises less
      if (effStrength >= 7) {
          if (canRaise && rand < 0.3) return safeRaise(state.minRaise);
          if (callAmount > 0) return { type: 'call' };
          return { type: 'check' };
      }
      if (effStrength >= 3 || hasDraw || actor.totalInvestment > state.bigBlind * 2) {
          if (callAmount > 0) return { type: 'call' };
          return { type: 'check' };
      }
      if (canCheck) return { type: 'check' };
      // Call even weak hands sometimes
      if (potOdds < 0.4 && rand < 0.5) return { type: 'call' };
      return { type: 'fold' };
  }

  function trickyLogic(): Action {
      // Slow-plays strong hands, bluffs weak hands
      if (effStrength >= 8) {
          // Slow play
          if (rand < 0.6) {
              if (callAmount > 0) return { type: 'call' };
              return { type: 'check' };
          }
          if (canRaise) return safeRaise(state.pot);
          return { type: 'call' };
      }
      if (effStrength <= 3) {
          // Bluff
          if (canRaise && rand < 0.3 && activePlayers <= 3) return safeRaise(state.pot * 0.75);
          return canCheck ? { type: 'check' } : { type: 'fold' };
      }
      // Mid hands played normally
      if (potOdds < 0.35) return { type: 'call' };
      return canCheck ? { type: 'check' } : { type: 'fold' };
  }

  function balancedLogic(): Action {
      // Normal bot logic
      if (effStrength >= 7) {
          if (canRaise && rand < 0.6) return safeRaise(Math.max(state.minRaise, state.pot * 0.5));
          if (callAmount > 0) return { type: 'call' };
          return canRaise && rand < 0.3 ? safeRaise(state.minRaise) : { type: 'check' };
      }
      if (effStrength >= 4 || hasDraw) {
          if (callAmount <= state.pot * 0.5 || potOdds < 0.3) {
              if (canRaise && rand < 0.2) return safeRaise(state.minRaise);
              return { type: 'call' };
          }
          if (hasDraw && potOdds < 0.4) return { type: 'call' };
          return canCheck ? { type: 'check' } : { type: 'fold' };
      }
      if (canCheck) {
          if (activePlayers <= 2 && rand < 0.1) return safeRaise(state.minRaise); // Occasional stab
          return { type: 'check' };
      }
      return { type: 'fold' };
  }

  const action = executeAction();

  // All-in override for short stack with decent hand
  if (isShortStack && effStrength >= 6 && rand < 0.5) {
      return { type: 'all-in' };
  }
  
  // Safety check: ensure we don't accidentally fold when we can check
  if (action.type === 'fold' && canCheck) {
      return { type: 'check' };
  }
  
  // Safety check: ensure we don't call 0 (should be check)
  if (action.type === 'call' && canCheck) {
      return { type: 'check' };
  }

  // Safety check: ensure we don't raise invalid amount
  if (action.type === 'raise') {
      if (!action.amount || action.amount < state.minRaise) {
           action.amount = state.minRaise;
      }
      if (action.amount >= maxTotalBet) {
          return { type: 'all-in' };
      }
  }

  return action;
}
