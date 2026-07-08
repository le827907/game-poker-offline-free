import { initGame, startHand, processAction } from './src/poker/engine';

let state = initGame('Human', 1000, 'easy');
state = startHand(state);

let humanP = state.players.findIndex(p => !p.isBot);

// fast forward to human
while(state.players[state.currentActorIndex].isBot) {
    state = processAction(state, 'fold');
}

// human raises
state = processAction(state, 'raise', 100);

// remaining bots fold
while(state.handInProgress) {
    state = processAction(state, 'fold');
}

console.log("Winners:", state.winners.length);
console.log("HandInProgress:", state.handInProgress);
