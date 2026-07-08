import { initGame, startHand, processAction } from './src/poker/engine';

let state = initGame('Human', 1000, 'easy');
state = startHand(state);

// bots fold to human
while(state.players[state.currentActorIndex].isBot) {
    state = processAction(state, 'fold');
}

// Human raises
state = processAction(state, 'raise', 100);

// remaining bots fold
while(state.handInProgress) {
    let p = state.players[state.currentActorIndex];
    state = processAction(state, 'fold');
}

console.log("Winners Length:", state.winners.length);
console.log(JSON.stringify(state.winners, null, 2));

