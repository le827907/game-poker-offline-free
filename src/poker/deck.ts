import { Card, Rank, Suit } from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${rank}-${suit}`, suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export function formatCard(card: Card): string {
  const suitSymbol = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };
  return `${card.rank}${suitSymbol[card.suit]}`;
}

export function validateCardState(deck: Card[], players: { cards: Card[] }[], board: Card[], expectedDeckSize?: number) {
  const allCards: Card[] = [...deck, ...board];
  players.forEach(p => allCards.push(...p.cards));
  
  const uniqueIds = new Set<string>();
  for (const card of allCards) {
    if (!card || !card.id) {
      console.error("Invalid card found", card);
      throw new Error("Invalid card found: missing id");
    }
    if (uniqueIds.has(card.id)) {
      console.error("Duplicate card found", card);
      throw new Error(`Duplicate card found: ${card.id}`);
    }
    uniqueIds.add(card.id);
  }
  
  if (allCards.length !== 52) {
    console.error(`Total cards in play + deck is ${allCards.length}, expected 52`);
    throw new Error(`Total cards is not 52! It is ${allCards.length}`);
  }

  if (expectedDeckSize !== undefined && deck.length !== expectedDeckSize) {
    console.error(`Deck size is ${deck.length}, expected ${expectedDeckSize}`);
    throw new Error(`Deck size is ${deck.length}, expected ${expectedDeckSize}`);
  }
  return true;
}
