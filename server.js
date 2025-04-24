// server.js
const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3000 });

let players = [];
let games = new Map(); // key: gameId, value: [player1Socket, player2Socket]
var waitingOpponent = [];

function createGame(playerSocket) {
    const gameId = Math.random().toString(36).substring(2, 10);
    games.set(gameId, [playerSocket]);
    waitingOpponent.push(gameId);
    return gameId;
}

function joinGame(gameId, playerSocket) {
    const game = games.get(gameId);
    if (game && game.length === 1) {
        game.push(playerSocket);
        return true;
    }
    return false;
}
function getOpponent(gameId, sender){
    const game = games.get(gameId);
    if (!game) return null;

    for (const player of game) {
        if (player !== sender) return player;
    }

    return null;
}

function broadcast(gameId, data, sender) {
    const game = games.get(gameId);
    if (!game) return;

    for (const player of game) {
        if (player !== sender && player.readyState === WebSocket.OPEN) {
            player.send(JSON.stringify(data));
        }
    }
}

server.on('connection', (socket) => {
    let currentGameId = null;
    let playerColor = null;
    let userID = null;

    socket.on('message', (message) => {
        let msg;

        try {
            msg = JSON.parse(message);
        } catch (e) {
            console.error('Invalid message:', message);
            return;
        }

        switch (msg.type) {

            case 'join':
                userID = data.userID;
                if(waitingOpponent.length>0){
                    const gameIdToJoin = waitingOpponent.shift();
                    if (joinGame(gameIdToJoin, socket)) {
                        currentGameId = gameIdToJoin;
                        playerColor = 'black';
                        let opponentSocket = getOpponent(currentGameId, socket); 
                        socket.send(JSON.stringify({ type: 'joined', gameId: currentGameId, color: playerColor, opponent:opponentId }));
                        socket.send(JSON.stringify({ type: 'start', color: 'black' }));

                        // Notify white player
                        const [whiteSocket] = games.get(currentGameId);
    
                        if (whiteSocket.readyState === WebSocket.OPEN) {
                            whiteSocket.send(JSON.stringify({ type: 'start', color: 'white' }));
                        }
                        waitingOpponent.pop();
                    } else {
                        socket.send(JSON.stringify({ type: 'error', message: 'Unable to join game' }));
                    }
                }else{
                    currentGameId = createGame(socket);
                }
                console.log(`${userID} joined`);
                break;

            case 'move':
                broadcast(currentGameId, {
                    type: 'move',
                    from: msg.from,
                    to: msg.to,
                }, socket);
                break;
                
            case 'bluff':

                break;
            default:
                socket.send(JSON.stringify({ type: 'error', message: 'Unknown command' }));
        }
    });

    socket.on('close', () => {
        if (currentGameId && games.has(currentGameId)) {
            broadcast(currentGameId, { type: 'opponent_disconnected' }, socket);
            games.delete(currentGameId);
        }
    });
});

console.log("WebSocket server running on ws://localhost:8080");