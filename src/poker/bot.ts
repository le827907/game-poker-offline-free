import { GameState, ActionType, Action, Card } from './types';
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

  // Basic fallback logic for easy/passive mode
  if (difficulty === 'easy') {
    const rand = Math.random();
    if (callAmount >= actor.chips) return rand < 0.9 ? { type: 'fold' } : { type: 'all-in' };
    if (canCheck) return rand < 0.1 ? safeRaise(state.minRaise) : { type: 'check' };
    return rand < 0.6 ? { type: 'fold' } : { type: 'call' };
  }

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

  let postflopRank = 0;
  if (state.board.length > 0) {
    const solved = evaluateHand(holeCards, state.board);
    postflopRank = solved.rank; // 1: High Card, 2: Pair, 3: Two Pair, 4: Three of a Kind...
  }

  const activePlayers = state.players.filter(p => !p.hasFolded).length;
  const potOdds = callAmount / (state.pot + callAmount);
  const isShortStack = actor.chips < state.bigBlind * 10;
  const rand = Math.random();

  // Adjust aggression based on difficulty and profile
  let aggressionMod = difficulty === 'expert' ? 1.5 : difficulty === 'hard' ? 1.2 : 1.0;
  if (actor.botProfile === 'aggressive') aggressionMod *= 1.3;
  if (actor.botProfile === 'passive') aggressionMod *= 0.5;

  // Exploit human tendencies
  if (state.humanStats.handsPlayed > 10) {
    const vpipRate = state.humanStats.vpip / state.humanStats.handsPlayed;
    const pfrRate = state.humanStats.pfr / state.humanStats.handsPlayed;
    
    if (vpipRate > 0.6) {
      // Human plays too many hands (calls too much) -> value bet more, bluff less
      aggressionMod *= 1.2; // Value bet harder
    } else if (vpipRate < 0.2) {
      // Human is very tight -> bluff more
      if (difficulty === 'expert' || difficulty === 'hard') {
         aggressionMod *= 1.4;
      }
    }
  }

  // Preflop Strategy
  if (state.street === 'preflop') {
    if (preflopStrength >= 8) {
      if (canRaise) return safeRaise(Math.max(state.minRaise, state.currentHighestBet * 3));
      return { type: 'all-in' };
    }
    if (preflopStrength >= 5) {
      if (canRaise && rand < 0.3 * aggressionMod) return safeRaise(state.minRaise);
      if (potOdds < 0.4 && callAmount <= state.bigBlind * 4) return { type: 'call' };
    }
    if (preflopStrength >= 3 && callAmount <= state.bigBlind * 2 && activePlayers > 2) {
      return { type: 'call' }; // Speculate in multiway pots
    }
    if (isShortStack && preflopStrength >= 6 && rand < 0.5) return { type: 'all-in' };

    return canCheck ? { type: 'check' } : { type: 'fold' };
  }

  // Postflop Strategy
  let handValue = 0; // 0 to 10
  if (postflopRank >= 4) handValue = 9; // Trips+
  else if (postflopRank === 3) handValue = 7; // Two pair
  else if (postflopRank === 2) {
     // Check if top pair
     const boardMax = Math.max(...state.board.map(c => rankToValue(c.rank)));
     if (maxCard >= boardMax || isPair) handValue = 6;
     else handValue = 4; // Mid/bottom pair
  } else {
     handValue = 1; // High card
  }

  // Draw detection (basic heuristic for flush/straight draws)
  const allSuits = [...holeCards, ...state.board].map(c => c.suit);
  const suitCounts = allSuits.reduce((acc, suit) => { acc[suit] = (acc[suit] || 0) + 1; return acc; }, {} as any);
  const hasFlushDraw = Object.values(suitCounts).some((c: any) => c === 4);
  
  if (hasFlushDraw && handValue < 5) handValue = 5;

  // Decision Logic
  if (handValue >= 7) {
    // Very strong
    if (canRaise && rand < 0.7 * aggressionMod) return safeRaise(Math.max(state.minRaise, state.pot * 0.75));
    if (callAmount > 0) return { type: 'call' };
    return canRaise ? safeRaise(state.minRaise) : { type: 'check' };
  }
  
  if (handValue >= 5) {
    // Medium-strong or draw
    if (callAmount <= state.pot * 0.5 || potOdds < 0.3) {
      if (canRaise && rand < 0.2 * aggressionMod) return safeRaise(state.minRaise);
      return { type: 'call' };
    }
    if (callAmount > state.pot * 0.8 && rand > 0.3 * aggressionMod && !hasFlushDraw) return { type: 'fold' };
    return { type: 'call' };
  }

  if (handValue >= 4) {
    // Weak pair
    if (canCheck) {
      // Bluff less in multiway pots
      if (activePlayers <= 2 && rand < 0.2 * aggressionMod) return safeRaise(state.minRaise);
      return { type: 'check' };
    }
    if (callAmount <= state.bigBlind * 2 && potOdds < 0.2) return { type: 'call' };
    return { type: 'fold' };
  }

  // Weak hand
  if (canCheck) {
    if (activePlayers <= 2 && rand < 0.15 * aggressionMod && state.street === 'flop') return safeRaise(state.pot * 0.5); // C-bet / Bluff
    return { type: 'check' };
  }
  
  return { type: 'fold' };
}
