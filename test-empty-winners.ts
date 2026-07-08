import { initGame, startHand, processAction } from './src/poker/engine';

let state = initGame('Human', 1000, 'easy');
state = startHand(state);

let humanIdx = state.players.findIndex(p => !p.isBot);

// Human folds
state = processAction(state, 'fold');

// Let remaining bots fold until 1 is left
while(state.handInProgress) {
    let p = state.players[state.currentActorIndex];
    state = processAction(state, 'fold');
}

console.log("Winners Length:", state.winners.length);
console.log(JSON.stringify(state.winners, null, 2));

