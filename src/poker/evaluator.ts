import * as Hand from 'pokersolver';
import { Card } from './types';

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
