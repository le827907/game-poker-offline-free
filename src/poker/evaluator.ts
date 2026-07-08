import * as Hand from 'pokersolver';
import { Card } from './types';

// pokersolver uses format like 'As', 'Td', '5c'
function toSolverFormat(card: Card): string {
  const suitLetter = card.suit.charAt(0).toLowerCase();
  return `${card.rank}${suitLetter}`;
}

function fromSolverFormat(str: string): Card {
  const rank = str.charAt(0).toUpperCase() as any;
  const suitLetter = str.charAt(1).toLowerCase();
  const suitMap: any = { 'h': 'hearts', 'd': 'diamonds', 'c': 'clubs', 's': 'spades' };
  return { rank, suit: suitMap[suitLetter] };
}

export function translateHandDescr(descr: string, name: string): string {
  let translatedDescr = descr;
  translatedDescr = translatedDescr.replace('High Card', 'Mậu thầu');
  translatedDescr = translatedDescr.replace('Pair', 'Một đôi');
  translatedDescr = translatedDescr.replace('Two Pair', 'Hai đôi');
  translatedDescr = translatedDescr.replace('Three of a Kind', 'Bộ ba');
  translatedDescr = translatedDescr.replace('Straight Flush', 'Thùng phá sảnh');
  translatedDescr = translatedDescr.replace('Royal Flush', 'Sảnh chúa');
  translatedDescr = translatedDescr.replace('Straight', 'Sảnh');
  translatedDescr = translatedDescr.replace('Flush', 'Thùng');
  translatedDescr = translatedDescr.replace('Full House', 'Cù lũ');
  translatedDescr = translatedDescr.replace('Four of a Kind', 'Tứ quý');

  translatedDescr = translatedDescr.replace(/A's/g, 'A');
  translatedDescr = translatedDescr.replace(/K's/g, 'K');
  translatedDescr = translatedDescr.replace(/Q's/g, 'Q');
  translatedDescr = translatedDescr.replace(/J's/g, 'J');
  translatedDescr = translatedDescr.replace(/10's/g, '10');
  translatedDescr = translatedDescr.replace(/9's/g, '9');
  translatedDescr = translatedDescr.replace(/8's/g, '8');
  translatedDescr = translatedDescr.replace(/7's/g, '7');
  translatedDescr = translatedDescr.replace(/6's/g, '6');
  translatedDescr = translatedDescr.replace(/5's/g, '5');
  translatedDescr = translatedDescr.replace(/4's/g, '4');
  translatedDescr = translatedDescr.replace(/3's/g, '3');
  translatedDescr = translatedDescr.replace(/2's/g, '2');

  translatedDescr = translatedDescr.replace(/Aces/g, 'A');
  translatedDescr = translatedDescr.replace(/Kings/g, 'K');
  translatedDescr = translatedDescr.replace(/Queens/g, 'Q');
  translatedDescr = translatedDescr.replace(/Jacks/g, 'J');
  translatedDescr = translatedDescr.replace(/Tens/g, '10');
  translatedDescr = translatedDescr.replace(/Nines/g, '9');
  translatedDescr = translatedDescr.replace(/Eights/g, '8');
  translatedDescr = translatedDescr.replace(/Sevens/g, '7');
  translatedDescr = translatedDescr.replace(/Sixes/g, '6');
  translatedDescr = translatedDescr.replace(/Fives/g, '5');
  translatedDescr = translatedDescr.replace(/Fours/g, '4');
  translatedDescr = translatedDescr.replace(/Threes/g, '3');
  translatedDescr = translatedDescr.replace(/Twos/g, '2');

  translatedDescr = translatedDescr.replace(/High/g, 'cao nhất');
  translatedDescr = translatedDescr.replace(/and/g, 'và');
  translatedDescr = translatedDescr.replace(/Hearts/g, 'Cơ');
  translatedDescr = translatedDescr.replace(/Diamonds/g, 'Rô');
  translatedDescr = translatedDescr.replace(/Clubs/g, 'Chuồn');
  translatedDescr = translatedDescr.replace(/Spades/g, 'Bích');
  
  return translatedDescr;
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
