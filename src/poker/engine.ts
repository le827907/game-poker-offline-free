import { GameState, Player, ActionType, Street, Card, Pot } from './types';
import { createDeck, shuffleDeck, formatCard, validateCardState } from './deck';
import { evaluateWinners } from './evaluator';

export const STARTING_CHIPS = 1000;
export const SMALL_BLIND = 10;
export const BIG_BLIND = 20;

export function initGame(playerName: string, initialChips: number = STARTING_CHIPS, difficulty: 'easy' | 'normal' | 'hard' | 'expert' = 'hard'): GameState {
  const players: Player[] = [
    { id: 'p1', name: playerName, isBot: false, chips: initialChips, cards: [], currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, isActive: true, hasActed: false },
    { id: 'b1', name: 'Bot Long', isBot: true, botProfile: 'tight', chips: STARTING_CHIPS, cards: [], currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, isActive: true, hasActed: false },
    { id: 'b2', name: 'Bot Minh', isBot: true, botProfile: 'loose', chips: STARTING_CHIPS, cards: [], currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, isActive: true, hasActed: false },
    { id: 'b3', name: 'Bot Hoa', isBot: true, botProfile: 'aggressive', chips: STARTING_CHIPS, cards: [], currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, isActive: true, hasActed: false },
    { id: 'b4', name: 'Bot Tuan', isBot: true, botProfile: 'passive', chips: STARTING_CHIPS, cards: [], currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, isActive: true, hasActed: false },
    { id: 'b5', name: 'Bot Dung', isBot: true, botProfile: 'tight', chips: STARTING_CHIPS, cards: [], currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, isActive: true, hasActed: false },
  ];

  return {
    players,
    dealerIndex: 0,
    smallBlindIndex: 1,
    bigBlindIndex: 2,
    currentActorIndex: 3,
    board: [],
    deck: [],
    pot: 0,
    pots: [],
    currentHighestBet: 0,
    street: 'preflop',
    handHistory: [],
    minRaise: BIG_BLIND,
    handInProgress: false,
    winners: [],
    smallBlind: SMALL_BLIND,
    bigBlind: BIG_BLIND,
    lastActorIndex: 2,
    difficulty,
    humanStats: {
      handsPlayed: 0,
      vpip: 0,
      pfr: 0,
      foldsToCbet: 0
    }
  };
}

function getNextActivePlayer(players: Player[], startIndex: number): number {
  let index = (startIndex + 1) % players.length;
  while (index !== startIndex) {
    if (players[index].isActive && !players[index].hasFolded && !players[index].isAllIn) {
      return index;
    }
    index = (index + 1) % players.length;
  }
  return -1; // No active players found
}

function countActivePlayers(players: Player[]): number {
  return players.filter(p => p.isActive && !p.hasFolded).length;
}

function countPlayersCanAct(players: Player[]): number {
  return players.filter(p => p.isActive && !p.hasFolded && !p.isAllIn).length;
}

export function startHand(state: GameState): GameState {
  const activePlayers = state.players.filter(p => p.isActive && p.chips > 0);
  if (activePlayers.length < 2) {
    return { ...state, handInProgress: false, handHistory: [...state.handHistory, 'Không đủ người chơi để bắt đầu.'] };
  }

  let deck = shuffleDeck(createDeck());
  const players = state.players.map(p => {
    let currentChips = p.chips;
    
    // Disable automatic chip refill for bots and players
    const isActive = p.isActive && currentChips > 0;
    
    if (!isActive) return { ...p, isActive: false, chips: currentChips, cards: [] as unknown as [Card, Card], hasFolded: true, isAllIn: false, hasActed: false };
    const cards: [Card, Card] = [deck.pop()!, deck.pop()!];
    return { ...p, isActive: true, chips: currentChips, cards, currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, hasActed: false };
  });

  validateCardState(deck, players, []);

  let nextDealerIdx = (state.dealerIndex + 1) % players.length;
  while (!players[nextDealerIdx].isActive || players[nextDealerIdx].hasFolded) {
    nextDealerIdx = (nextDealerIdx + 1) % players.length;
  }
  
  let sbIdx = (nextDealerIdx + 1) % players.length;
  while (!players[sbIdx].isActive || players[sbIdx].hasFolded) {
    sbIdx = (sbIdx + 1) % players.length;
  }

  let bbIdx = (sbIdx + 1) % players.length;
  while (!players[bbIdx].isActive || players[bbIdx].hasFolded) {
    bbIdx = (bbIdx + 1) % players.length;
  }

  let utgIdx = (bbIdx + 1) % players.length;
  while (!players[utgIdx].isActive || players[utgIdx].hasFolded) {
    utgIdx = (utgIdx + 1) % players.length;
  }

  // Post blinds
  const sbAmount = Math.min(players[sbIdx].chips, state.smallBlind);
  players[sbIdx].chips -= sbAmount;
  players[sbIdx].currentBet = sbAmount;
  players[sbIdx].totalInvestment = sbAmount;
  players[sbIdx].isAllIn = players[sbIdx].chips === 0;

  const bbAmount = Math.min(players[bbIdx].chips, state.bigBlind);
  players[bbIdx].chips -= bbAmount;
  players[bbIdx].currentBet = bbAmount;
  players[bbIdx].totalInvestment = bbAmount;
  players[bbIdx].isAllIn = players[bbIdx].chips === 0;

  const pot = sbAmount + bbAmount;

  return {
    ...state,
    players,
    dealerIndex: nextDealerIdx,
    smallBlindIndex: sbIdx,
    bigBlindIndex: bbIdx,
    currentActorIndex: utgIdx,
    lastActorIndex: bbIdx,
    board: [],
    deck,
    pot,
    pots: [],
    currentHighestBet: state.bigBlind,
    street: 'preflop',
    handHistory: ['Ván bài mới bắt đầu.'],
    minRaise: state.bigBlind * 2,
    handInProgress: true,
    winners: [],
    humanStats: {
      ...state.humanStats,
      handsPlayed: state.humanStats.handsPlayed + 1
    }
  };
}

function calculatePots(players: Player[]): Pot[] {
  let pots: Pot[] = [];
  let investments = players.map(p => ({ id: p.id, amount: p.totalInvestment, active: !p.hasFolded }));
  
  while (investments.some(i => i.amount > 0)) {
    const activeInvestments = investments.filter(i => i.amount > 0);
    const minAmount = Math.min(...activeInvestments.map(i => i.amount));
    
    const eligibleIds = activeInvestments.filter(i => i.active).map(i => i.id);
    let potAmount = 0;
    
    investments = investments.map(i => {
      if (i.amount > 0) {
        potAmount += minAmount;
        return { ...i, amount: i.amount - minAmount };
      }
      return i;
    });

    // Merge pots with same eligible players
    if (pots.length > 0) {
      const lastPot = pots[pots.length - 1];
      if (lastPot.eligiblePlayerIds.length === eligibleIds.length && lastPot.eligiblePlayerIds.every((id, idx) => id === eligibleIds[idx])) {
        lastPot.amount += potAmount;
        continue;
      }
    }
    
    pots.push({ amount: potAmount, eligiblePlayerIds: eligibleIds });
  }

  return pots;
}

export function processAction(state: GameState, action: ActionType, amount?: number): GameState {
  if (!state.handInProgress) return state;

  const actor = state.players[state.currentActorIndex];
  let newPlayers = [...state.players];
  let p = { ...actor };
  let handHistory = [...state.handHistory];
  let pot = state.pot;
  let currentHighestBet = state.currentHighestBet;
  let minRaise = state.minRaise;
  let humanStats = { ...state.humanStats };

  if (!p.isBot) {
    if (state.street === 'preflop') {
      if (action === 'call' || action === 'raise' || action === 'all-in') {
         humanStats.vpip += 1;
      }
      if (action === 'raise' || action === 'all-in') {
         humanStats.pfr += 1;
      }
    } else if (state.street === 'flop' && action === 'fold' && currentHighestBet > 0) {
      humanStats.foldsToCbet += 1;
    }
  }

  const callAmount = currentHighestBet - p.currentBet;

  switch (action) {
    case 'fold':
      p.hasFolded = true;
      p.hasActed = true;
      handHistory.push(`${p.name} bỏ bài.`);
      break;
    case 'check':
      p.hasActed = true;
      handHistory.push(`${p.name} xem bài.`);
      break;
    case 'call':
      const actualCall = Math.min(p.chips, callAmount);
      p.chips -= actualCall;
      p.currentBet += actualCall;
      p.totalInvestment += actualCall;
      pot += actualCall;
      if (p.chips === 0) p.isAllIn = true;
      p.hasActed = true;
      handHistory.push(`${p.name} theo ${actualCall}.`);
      break;
    case 'raise':
    case 'all-in':
      let raiseTo = amount || (p.currentBet + p.chips);
      if (action === 'all-in') raiseTo = p.currentBet + p.chips;
      
      if (raiseTo > p.currentBet + p.chips) {
        raiseTo = p.currentBet + p.chips;
      }
      
      const raiseAmount = raiseTo - p.currentBet;
      const totalBet = raiseTo;
      
      if (totalBet > currentHighestBet) {
        const raiseAdded = totalBet - currentHighestBet;
        const isFullRaise = raiseAdded >= minRaise - currentHighestBet;
        if (isFullRaise) {
           minRaise = totalBet + raiseAdded;
           newPlayers = newPlayers.map(player => ({ ...player, hasActed: false }));
        }
        currentHighestBet = totalBet;
        // reset last actor to the player before this raiser
        let prevActor = state.currentActorIndex - 1;
        if (prevActor < 0) prevActor = newPlayers.length - 1;
        while (!newPlayers[prevActor].isActive || newPlayers[prevActor].hasFolded || newPlayers[prevActor].isAllIn) {
          if (prevActor === state.currentActorIndex) break;
          prevActor--;
          if (prevActor < 0) prevActor = newPlayers.length - 1;
        }
        state.lastActorIndex = prevActor;
      }
      p.chips -= raiseAmount;
      p.currentBet += raiseAmount;
      p.totalInvestment += raiseAmount;
      pot += raiseAmount;
      if (p.chips === 0) p.isAllIn = true;
      p.hasActed = true;
      handHistory.push(`${p.name} ${action === 'all-in' ? 'tất tay' : 'tố lên ' + raiseTo}.`);
      break;
  }

  newPlayers[state.currentActorIndex] = p;

  const activeCount = countActivePlayers(newPlayers);
  if (activeCount === 1) {
    return executeShowdown({ ...state, players: newPlayers, pot, handHistory, currentHighestBet, minRaise, humanStats });
  }

  const canActCount = countPlayersCanAct(newPlayers);
  
  if (state.currentActorIndex === state.lastActorIndex || canActCount === 0) {
    return advanceStreet({ ...state, players: newPlayers, pot, handHistory, currentHighestBet, minRaise, humanStats });
  }

  const nextActor = getNextActivePlayer(newPlayers, state.currentActorIndex);
  
  return {
    ...state,
    players: newPlayers,
    pot,
    handHistory,
    currentHighestBet,
    minRaise,
    currentActorIndex: nextActor,
    humanStats
  };
}

function advanceStreet(state: GameState): GameState {
  let { street, board, players } = state;
  let deck = [...state.deck];
  let handHistory = [...state.handHistory];

  // reset current bets
  players = players.map(p => ({ ...p, currentBet: 0, hasActed: false }));

  if (countPlayersCanAct(players) <= 1 && street !== 'river') {
      // Fast forward
      let newBoard = [...board];
      while (newBoard.length < 5) {
        newBoard.push(deck.pop()!);
      }
      board = newBoard;
      street = 'river';
      validateCardState(deck, players, board);
      return executeShowdown({ ...state, players, board, deck, street });
  }

  if (street === 'preflop') {
    street = 'flop';
    board = [deck.pop()!, deck.pop()!, deck.pop()!];
    handHistory.push(`Flop: ${board.map(formatCard).join(' ')}`);
  } else if (street === 'flop') {
    street = 'turn';
    board = [...board, deck.pop()!];
    handHistory.push(`Turn: ${board.map(formatCard).join(' ')}`);
  } else if (street === 'turn') {
    street = 'river';
    board = [...board, deck.pop()!];
    handHistory.push(`River: ${board.map(formatCard).join(' ')}`);
  } else {
    return executeShowdown({ ...state, players });
  }

  let firstActor = getNextActivePlayer(players, state.dealerIndex);
  let lastActor = state.dealerIndex;
  while (!players[lastActor].isActive || players[lastActor].hasFolded || players[lastActor].isAllIn) {
    lastActor--;
    if (lastActor < 0) lastActor = players.length - 1;
  }

  validateCardState(deck, players, board);

  return {
    ...state,
    players,
    board,
    deck,
    street,
    handHistory,
    currentHighestBet: 0,
    minRaise: state.bigBlind,
    currentActorIndex: firstActor,
    lastActorIndex: lastActor
  };
}

function executeShowdown(state: GameState): GameState {
  const pots = calculatePots(state.players);
  let players = [...state.players];
  let handHistory = [...state.handHistory];
  let winnersLog: any[] = [];
  
  const activePlayers = players.filter(p => p.isActive && !p.hasFolded);

  pots.forEach((pot, index) => {
    if (pot.amount === 0) return;
    const eligiblePlayers = players.filter(p => pot.eligiblePlayerIds.includes(p.id));
    if (eligiblePlayers.length === 1) {
      players = players.map(p => p.id === eligiblePlayers[0].id ? { ...p, chips: p.chips + pot.amount } : p);
      if (activePlayers.length === 1 && index === pots.length - 1) {
          handHistory.push(`${eligiblePlayers[0].name} thắng ${pot.amount} chip (đối thủ bỏ bài).`);
          winnersLog.push({ playerIndex: state.players.findIndex(p => p.id === eligiblePlayers[0].id), amount: pot.amount, description: 'Đối thủ bỏ bài', handCards: [] });
      } else {
          handHistory.push(`Trả lại ${pot.amount} chip chưa được theo cho ${eligiblePlayers[0].name}.`);
      }
    } else {
      const pData = eligiblePlayers.map(p => ({ id: p.id, cards: p.cards }));
      const winners = evaluateWinners(pData, state.board);
      const splitAmount = Math.floor(pot.amount / winners.length);
      
      const orderedWinners = [...winners].sort((a, b) => {
        const idxA = players.findIndex(p => p.id === a.id);
        const idxB = players.findIndex(p => p.id === b.id);
        const distA = (idxA - state.dealerIndex + players.length) % players.length;
        const distB = (idxB - state.dealerIndex + players.length) % players.length;
        const adjustedDistA = distA === 0 ? players.length : distA;
        const adjustedDistB = distB === 0 ? players.length : distB;
        return adjustedDistA - adjustedDistB;
      });

      const remainder = pot.amount % winners.length;

      orderedWinners.forEach((w, i) => {
        const playerIdx = players.findIndex(p => p.id === w.id);
        let amountWon = splitAmount;
        let gotOddChip = false;
        
        if (i < remainder) {
          amountWon += 1;
          gotOddChip = true;
        }

        players[playerIdx].chips += amountWon;
        const player = players[playerIdx];
        const oddChipText = gotOddChip ? " (nhận chip lẻ)" : "";
        handHistory.push(`${player.name} thắng ${amountWon} chip với ${w.description}${oddChipText}.`);
        winnersLog.push({ playerIndex: playerIdx, amount: amountWon, description: w.description, handCards: player.cards, winningCards: w.winningCards });
      });
    }
  });

  return {
    ...state,
    players,
    handHistory,
    street: 'showdown',
    handInProgress: false,
    winners: winnersLog,
    pots
  };
}
