const fs = require('fs');
let types = fs.readFileSync('src/poker/types.ts', 'utf8');
types = types.replace(
  "botProfile?: 'tight' | 'aggressive' | 'calling_station' | 'tricky' | 'balanced';",
  "botProfile?: 'tight' | 'loose' | 'aggressive' | 'passive';"
);
fs.writeFileSync('src/poker/types.ts', types);

let engine = fs.readFileSync('src/poker/engine.ts', 'utf8');
engine = engine.replace(
  "{ id: 'b2', name: 'Bot Minh', isBot: true, botProfile: 'calling_station', chips: STARTING_CHIPS, cards: [], currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, isActive: true, hasActed: false },\n    { id: 'b3', name: 'Bot Hoa', isBot: true, botProfile: 'aggressive', chips: STARTING_CHIPS, cards: [], currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, isActive: true, hasActed: false },\n    { id: 'b4', name: 'Bot Tuan', isBot: true, botProfile: 'tricky', chips: STARTING_CHIPS, cards: [], currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, isActive: true, hasActed: false },\n    { id: 'b5', name: 'Bot Dung', isBot: true, botProfile: 'balanced', chips: STARTING_CHIPS, cards: [], currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, isActive: true, hasActed: false },",
  "{ id: 'b2', name: 'Bot Minh', isBot: true, botProfile: 'loose', chips: STARTING_CHIPS, cards: [], currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, isActive: true, hasActed: false },\n    { id: 'b3', name: 'Bot Hoa', isBot: true, botProfile: 'aggressive', chips: STARTING_CHIPS, cards: [], currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, isActive: true, hasActed: false },\n    { id: 'b4', name: 'Bot Tuan', isBot: true, botProfile: 'passive', chips: STARTING_CHIPS, cards: [], currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, isActive: true, hasActed: false },\n    { id: 'b5', name: 'Bot Dung', isBot: true, botProfile: 'tight', chips: STARTING_CHIPS, cards: [], currentBet: 0, totalInvestment: 0, hasFolded: false, isAllIn: false, isActive: true, hasActed: false },"
);
fs.writeFileSync('src/poker/engine.ts', engine);
console.log("Reverted!");
