import * as Hand from 'pokersolver';
import { Card } from './types';
import { createDeck, shuffleDeck } from './deck';

// pokersolver uses format like 'As', 'Td', '5c'
function toSolverFormat(card: Card): string {
  const suitLetter = card.suit.charAt(0).toLowerCase();
  return `${card.rank}${suitLetter}`;
}

function fromSolverFormat(str: string): Card {
  let rank = str.charAt(0).toUpperCase() as any;
  if (rank === '1') rank = 'A'; // Wheel straight Ace
  
  const suitLetter = str.charAt(1).toLowerCase();
  const suitMap: any = { 'h': 'hearts', 'd': 'diamonds', 'c': 'clubs', 's': 'spades' };
  const suit = suitMap[suitLetter];
  return { id: `${rank}-${suit}`, rank, suit };
}

export function translateHandDescr(descr: string, name: string): string {
  switch (name) {
    case 'High Card': return 'Mậu thầu';
    case 'Pair': return 'Một đôi';
    case 'Two Pair': return 'Hai đôi';
    case 'Three of a Kind': return 'Bộ ba';
    case 'Straight': return 'Sảnh';
    case 'Flush': return 'Thùng';
    case 'Full House': return 'Cù lũ';
    case 'Four of a Kind': return 'Tứ quý';
    case 'Straight Flush': return 'Thùng phá sảnh';
    case 'Royal Flush': return 'Sảnh chúa';
    default: return name;
  }
}

export function evaluateHand(holeCards: Card[], boardCards: Card[]) {
  const allCards = [...holeCards, ...boardCards].map(toSolverFormat);
  const solver = Hand.Hand;
  return solver.solve(allCards);
}

export function evaluateWinners(players: { id: string, cards: Card[] }[], boardCards: Card[]) {
  const hands = players.map(p => {
    const solved = evaluateHand(p.cards, boardCards);
    return { id: p.id, solved };
  });

  const solverHands = hands.map(h => h.solved);
  const solver = Hand.Hand;
  const winnersSolver = solver.winners(solverHands);

  // find which players have the winning hands
  const winners = hands.filter(h => winnersSolver.includes(h.solved));
  
  return winners.map(w => {
    // Extract the 5 winning cards
    const winningCards: Card[] = w.solved.cards.map((c: any) => fromSolverFormat(c.value + c.suit));
    return { 
      id: w.id, 
      description: translateHandDescr(w.solved.descr, w.solved.name),
      winningCards
    };
  });
}

export function calculateWinProbability(
  holeCards: Card[],
  boardCards: Card[],
  numOpponents: number,
  iterations = 500
): number {
  if (holeCards.length !== 2) return 0;
  
  const knownCards = [...holeCards, ...boardCards];
  const knownCardIds = new Set(knownCards.map(c => c.id));
  
  // Create remaining deck
  const deck = createDeck().filter(c => !knownCardIds.has(c.id));
  
  let wins = 0;
  let ties = 0;

  for (let i = 0; i < iterations; i++) {
    // Shuffle remaining deck for this iteration
    const shuffledDeck = shuffleDeck(deck);
    let cardIndex = 0;

    // Deal to opponents
    const players = [{ id: 'hero', cards: holeCards }];
    for (let j = 0; j < numOpponents; j++) {
      players.push({
        id: `villain_${j}`,
        cards: [shuffledDeck[cardIndex++], shuffledDeck[cardIndex++]]
      });
    }

    // Deal remaining board cards
    const simBoard = [...boardCards];
    while (simBoard.length < 5) {
      simBoard.push(shuffledDeck[cardIndex++]);
    }

    // Evaluate
    const winners = evaluateWinners(players, simBoard);
    
    // Check if hero won
    if (winners.some(w => w.id === 'hero')) {
      if (winners.length === 1) {
        wins++; // Outright win
      } else {
        ties += 1 / winners.length; // Tie
      }
    }
  }

  return (wins + ties) / iterations;
}
