import * as Hand from 'pokersolver';
import { Card } from './types';

// pokersolver uses format like 'As', 'Td', '5c'
function toSolverFormat(card: Card): string {
  const suitLetter = card.suit.charAt(0).toLowerCase();
  return `${card.rank}${suitLetter}`;
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
  return winners.map(w => ({ id: w.id, description: w.solved.descr }));
}
