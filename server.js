const WebSocket = require('ws');

// Use the PORT environment variable provided by the hosting service, or 8080 for local development
const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port: PORT });

console.log(`Server started on port ${PORT}`);

// This is a very simple in-memory "database"
// A real game would have more complex state management
let players = {}; // Store player data
let food = [];    // Store food data

// Helper function to generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Main connection handler
wss.on('connection', (ws) => {
    const playerId = generateId();
    console.log(`Player ${playerId} connected.`);

    // 1. Handle incoming messages from this specific player
    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);

            // This is where you would handle different actions from the player
            switch (msg.type) {
                case 'join':
                    console.log(`Player ${playerId} joined with name: ${msg.data.name}`);
                    players[playerId] = {
                        id: playerId,
                        name: msg.data.name,
                        // ... you would add position, mass, color etc. here
                    };
                    // Send an 'init' message back to ONLY this player
                    ws.send(JSON.stringify({ type: 'init', data: { playerId: playerId } }));
                    break;

                case 'target':
                    // A player sent their mouse position
                    // You would update the player's target direction here
                    break;
                
                case 'split':
                    // A player pressed spacebar
                    // You would implement the split logic here
                    break;
                
                case 'chat':
                     // A player sent a chat message
                     // Broadcast it to everyone
                     broadcast(JSON.stringify({
                        type: 'chat',
                        data: {
                            name: players[playerId]?.name || 'Player',
                            text: msg.data.text,
                            color: '#FFFFFF' // you would assign player colors
                        }
                     }));
                     break;
            }
        } catch (e) {
            console.error("Failed to parse message or handle event:", e);
        }
    });

    // 2. Handle player disconnection
    ws.on('close', () => {
        console.log(`Player ${playerId} disconnected.`);
        delete players[playerId]; // Remove player from our state
    });
});

// Game Loop - This is essential!
// This loop runs independently of player messages and updates the game world.
setInterval(() => {
    // In a real game, you would:
    // 1. Update all player positions based on their targets.
    // 2. Check for collisions (player eating food, player eating player).
    // 3. Update player mass.
    // 4. Spawn new food if needed.

    // For now, we'll just create a sample game state and broadcast it.
    const gameState = {
        blobs: Object.values(players).map(p => ({ /* create blob objects here */ })),
        food: food
    };
    
    // Broadcast the current game state to all players
    broadcast(JSON.stringify({ type: 'gameState', data: gameState }));

    // You would also calculate and broadcast the leaderboard here
    const leaderboard = Object.values(players).map(p => ({id: p.id, name: p.name, mass: p.mass || 0}));
    broadcast(JSON.stringify({ type: 'leaderboard', data: leaderboard }));

}, 1000 / 20); // Broadcast state 20 times per second


// Function to send a message to every connected client
function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}
