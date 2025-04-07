

document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("board");
    const player1Clock = document.getElementById("player1-clock");
    const player2Clock = document.getElementById("player2-clock");

    let timePlayer1 = 300;
    let timePlayer2 = 300;
    //2 is white for now
    let currentPlayer = 2;
    let interval;

    function updateClockDisplay() {
        player1Clock.textContent = formatTime(timePlayer1);
        player2Clock.textContent = formatTime(timePlayer2);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    }

    function startClock() {
        interval = setInterval(() => {
            if (currentPlayer === 1) {
                timePlayer1--;
                if (timePlayer1 <= 0) {
                    clearInterval(interval);
                    alert("Player 1 no time Player 2 wins!");
                }
            } else {
                timePlayer2--;
                if (timePlayer2 <= 0) {
                    clearInterval(interval);
                    alert("Player 2 no time Player 1 wins!");
                }
            }
            updateClockDisplay();
        }, 1000);
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
    }



    // Initialize Board
    //chaque sous-array est une row
    const piecePlacement = [
        ["blackRook", "blackKnight", "blackBishop", "blackQueen", "blackKing", "blackBishop", "blackKnight", "blackRook"],
        ["blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn"],
        [], 
        [], 
        [], 
        [],
        ["whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn"],
        ["whiteRook", "whiteKnight", "whiteBishop", "whiteQueen", "whiteKing", "whiteBishop", "whiteKnight", "whiteRook"]
    ];

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement("div");
            square.classList.add("square", (row + col) % 2 === 0 ? "light" : "dark");
            
            if (piecePlacement[row].length > 0) {
                const piece = piecePlacement[row][col];
                if (piece) {
                    const img = document.createElement("img");
                    const pieceColor = piece.startsWith("white") ? "WhitePieces" : "BlackPieces";
                    img.src = `Assets/${pieceColor}/${piece}.png`;
                    img.alt = piece;
                    img.classList.add("chess-piece");
                    square.appendChild(img);
                }
            }
            
            square.addEventListener("click", switchPlayer);
            board.appendChild(square);
        }
    }

    updateClockDisplay();
    startClock();
});
