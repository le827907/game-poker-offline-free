export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'all-in' | 'post-sb' | 'post-bb';

export interface Action {
  type: ActionType;
  amount?: number;
}

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  chips: number;
  cards: [Card, Card] | [];
  currentBet: number; // Bet in current round
  totalInvestment: number; // Total invested in the whole hand
  hasFolded: boolean;
  isAllIn: boolean;
  isActive: boolean;
  hasActed: boolean;
  botProfile?: 'tight' | 'loose' | 'aggressive' | 'passive';
}

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface Pot {
  amount: number;
  eligiblePlayerIds: string[];
}

export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';

export interface HumanStats {
  handsPlayed: number;
  vpip: number; // voluntarily put money in pot
  pfr: number; // preflop raise
  foldsToCbet: number;
}

export interface GameState {
  players: Player[];
  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  currentActorIndex: number;
  board: Card[];
  deck: Card[];
  pot: number;
  pots: Pot[]; // Main pot and side pots
  currentHighestBet: number; // Highest bet in current street
  street: Street;
  handHistory: string[];
  minRaise: number;
  handInProgress: boolean;
  winners: { playerIndex: number; amount: number; description: string; handCards: Card[]; winningCards?: Card[] }[];
  smallBlind: number;
  bigBlind: number;
  lastActorIndex: number; // Who closes the action
  difficulty: Difficulty;
  humanStats: HumanStats;
}
