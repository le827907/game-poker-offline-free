import { initGame, startHand, processAction } from './src/poker/engine';

let state = initGame('Human', 1000, 'easy');
state = startHand(state);

console.log("After start hand. Active:", state.players.filter(p=>p.isActive).length);
console.log("Current actor:", state.currentActorIndex);

// Let's fold all bots
while(state.handInProgress) {
    let p = state.players[state.currentActorIndex];
    if (p.isBot) {
        state = processAction(state, 'fold');
    } else {
        // If it's human, let's say they just raise
        state = processAction(state, 'raise', 100);
    }
}

console.log("Hand in progress:", state.handInProgress);
console.log("Winners:", JSON.stringify(state.winners, null, 2));
