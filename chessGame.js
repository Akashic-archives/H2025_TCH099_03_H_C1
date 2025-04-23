// Comments are mostly written in english
// 
// To do list:

//  hidden Pieces
//  Api
//  Going through game with arrow keys
//  No enpassant yet
//  No castling yet

//Limitations
//Auto Queen promotions

//This game currently functions with highlighted Squares
//I check if the move is valid through piece selections and if the ending square is highlighted
//It should be highlighted if its a valid move of that piece type

let gameHistory = [];


document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("board");
    const player1Clock = document.getElementById("player1-clock");
    const player2Clock = document.getElementById("player2-clock");

    let timePlayer1 = 300;
    let timePlayer2 = 300;
    //2 is white for now
    let currentPlayer = 2;
    let interval;

    let draggingPiece = null;
    let originSquare = null;
    let ghostPiece = null;


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
                    setTimeout(function(){
                        location.reload();
                    }, 1000);
                }
            } else {
                timePlayer2--;
                if (timePlayer2 <= 0) {
                    clearInterval(interval);
                    alert("Player 2 no time Player 1 wins!");
                    setTimeout(function(){
                        location.reload();
                    }, 1000);
                }
            }
            updateClockDisplay();
        }, 1000);
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
    }

    // Initialize Board
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
                    img.classList.add(pieceColor);
                    square.appendChild(img);
                }
            }
            
            board.appendChild(square);
        }
    }

    const boardSquares = document.getElementsByClassName("square");
    
    function setupBoardSquares(){
        for(let i=0; i<boardSquares.length;i++){
            
            let row = 8-Math.floor(i/8);
            let column= String.fromCharCode(97+(i%8));
            boardSquares[i].id=column+row;
        }
    }
    
    setupBoardSquares()
    updateClockDisplay();

    let whiteStart=true;
    let selectedPiece = null;
    let selectedSquare = null;

    function showLegalMoves(square) {
        const piece = square.firstElementChild;
        if (!piece) return;
    
        const pieceType = piece.alt;
        const pieceColor = piece.classList.contains("WhitePieces") ? "white" : "black";
        const piecePosition = square.id;
    
        if ((pieceColor === "white" && currentPlayer !== 2) || (pieceColor === "black" && currentPlayer !== 1)) {
            return;
        }
        
        clearHighlights();
        selectedPiece = piece;
        selectedSquare = square;

        let legalMoves = [];
    
        switch (pieceType) {
            case "whitePawn":
            case "blackPawn":
                legalMoves = getLegalPawnMoves(piecePosition, pieceColor);
                break;
            case "whiteKnight":
            case "blackKnight":
                legalMoves = getLegalKnightMoves(piecePosition, pieceColor);
                break;
            case "whiteBishop":
            case "blackBishop":
                legalMoves = getLegalSlidingMoves(piecePosition, [[1, 1], [1, -1], [-1, 1], [-1, -1]], pieceColor);
                break;
            case "whiteRook":
            case "blackRook":
                legalMoves = getLegalSlidingMoves(piecePosition, [[1, 0], [-1, 0], [0, 1], [0, -1]], pieceColor);
                break;
            case "whiteQueen":
            case "blackQueen":
                legalMoves = [
                    ...getLegalSlidingMoves(piecePosition, [[1, 1], [1, -1], [-1, 1], [-1, -1]], pieceColor),
                    ...getLegalSlidingMoves(piecePosition, [[1, 0], [-1, 0], [0, 1], [0, -1]], pieceColor),
                ];
                break;
            case "whiteKing":
            case "blackKing":
                legalMoves = getLegalKingMoves(piecePosition, pieceColor);
                break;
        }
        highlightSquares(legalMoves);
    }

    let movedPawns = new Set();

    function getLegalPawnMoves(position, color) {
        let moves = [];
        let direction = color === "white" ? 1 : -1; // White moves up, Black moves down
        let [file, rank] = [position[0], parseInt(position[1])];
    
        let oneStep = `${file}${rank + direction}`;
        let twoStep = `${file}${rank + 2 * direction}`;
    
        if (!document.getElementById(oneStep)?.hasChildNodes()) {
            moves.push(oneStep);
    
            if (((color === "white" && rank === 2) || (color === "black" && rank === 7)) &&
                !document.getElementById(twoStep)?.hasChildNodes()) {
                moves.push(twoStep);
            }
        }
    
        // Check for diagonal captures
        let diagonalLeft = `${String.fromCharCode(file.charCodeAt(0) - 1)}${rank + direction}`;
        let diagonalRight = `${String.fromCharCode(file.charCodeAt(0) + 1)}${rank + direction}`;
    
        [diagonalLeft, diagonalRight].forEach((diag) => {
            let square = document.getElementById(diag);
            if (square?.hasChildNodes()) {
                let piece = square.firstElementChild;
                let pieceColor = piece.classList.contains("WhitePieces") ? "white" : "black";
    
                if (pieceColor !== color) {
                    moves.push(diag);
                }
            }
        });
    
        return moves;
    }

    function getLegalKnightMoves(position, color) {
        let moves = [];
        let column = position[0].charCodeAt(0);
        let row = parseInt(position[1]);
    
        let knightMoves = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];
    
        for (let [dx, dy] of knightMoves) {
            let newColumn = String.fromCharCode(column + dx);
            let newRow = row + dy;
            let newPos = newColumn + newRow;
    
            if (isValidSquare(newColumn, newRow) && !isFriendlyPiece(newPos, color)) {
                moves.push(newPos);
            }
        }
        return moves;
    }
    
    function getLegalSlidingMoves(position, directions, color) {
        let moves = [];
        let column = position[0].charCodeAt(0);
        let row = parseInt(position[1]);
    
        for (let [dx, dy] of directions) {
            for (let step = 1; step <= 8; step++) {
                let newColumn = String.fromCharCode(column + dx * step);
                let newRow = row + dy * step;
                let newPos = newColumn + newRow;
    
                if (!isValidSquare(newColumn, newRow)) {
                    break;
                }
    
                if (isFriendlyPiece(newPos, color)) {
                    break;
                }

                moves.push(newPos);

                //No piece can jump over enemy piece except the knight
                if (isEnemyPiece(newPos, color)) {
                    break;
                } 
            }
        }
        return moves;
    }
    
    function getLegalKingMoves(position, color) {
        let moves = [];
        let [file, rank] = [position[0], parseInt(position[1])];
    
        
        let directions = [
            [1, 1], [1, 0], [1, -1],        // Right-up, Right, Right-down
            [0, 1], [0, -1],                // Up, Down
            [-1, 1], [-1, 0], [-1, -1]      // Left-up, Left, Left-down
        ];
    
        for (let [dx, dy] of directions) {
            let newColumn = String.fromCharCode(file.charCodeAt(0) + dx);
            let newRow = rank + dy;
            let newPos = newColumn + newRow;
    
            if (isValidSquare(newColumn, newRow) && !isFriendlyPiece(newPos, color)) {
                moves.push(newPos);
            }
        }
    
        return moves;
    }
    
    function isValidSquare(column, row) {
        return column >= 'a' && column <= 'h' && row >= 1 && row <= 8;
    }
    
    function isEnemyPiece(position, color) {
        let square = document.getElementById(position);
        if (!square || !square.hasChildNodes()) return false;
        return square.firstElementChild.classList.contains(color === "white" ? "BlackPieces" : "WhitePieces");
    }
    
    function isFriendlyPiece(position, color) {
        let square = document.getElementById(position);
        if (!square || !square.hasChildNodes()) return false;
        return square.firstElementChild.classList.contains(color === "white" ? "WhitePieces" : "BlackPieces");
    }
    
    function highlightSquares(moves) {
        for (let move of moves) {
            let square = document.getElementById(move);
            if (square) square.classList.add("highlight");
        }
    }
    
    function clearHighlights() {
        document.querySelectorAll(".highlight").forEach(sq => sq.classList.remove("highlight"));
    }
    
    function movePiece(targetSquare) {
        if (!selectedPiece || !selectedSquare){ 
            return;
        }

        if (targetSquare.hasChildNodes()) {

            let targetPiece = targetSquare.firstElementChild;
            let targetPieceColor = targetPiece.classList.contains("WhitePieces") ? "white" : "black";
            let currentPieceColor = selectedPiece.classList.contains("WhitePieces") ? "white" : "black";
                
                // Prevent capturing own piece
            if (targetPieceColor === currentPieceColor) {
                return; 
            }
            
            targetSquare.removeChild(targetPiece); // Remove opponent's piece

            if(targetPiece.alt=="whiteKing"){
                setTimeout(function(){
                    alert("Player 2 wins!");
                }, 1000);
                setTimeout(function(){
                    location.reload();
                }, 2000);
            }
            if(targetPiece.alt=="blackKing"){
                setTimeout(function(){
                    alert("Player 1 wins!");
                }, 1000);
                setTimeout(function(){
                    location.reload();
                }, 2000);
            }
        }
    
        let pieceType = selectedPiece.alt;
        let piecePosition = selectedSquare.id;

        //Pawn auto promotion to queen
        let isWhite = selectedPiece.classList.contains("WhitePieces");
        let isPawn = pieceType.includes("Pawn");
        let targetRank = parseInt(targetSquare.id[1]);
    
        if (isPawn && ((isWhite && targetRank === 8) || (!isWhite && targetRank === 1))) {
            // Promote to queen
            let newQueen = document.createElement("img");
            let color = isWhite ? "white" : "black";
            newQueen.src = `Assets/${isWhite ? "WhitePieces" : "BlackPieces"}/${color}Queen.png`;
            newQueen.alt = `${color}Queen`;
            newQueen.classList.add("chess-piece", isWhite ? "WhitePieces" : "BlackPieces");

            selectedPiece = newQueen;
        }


        if (pieceType.includes("Pawn") && !movedPawns.has(piecePosition)) {
            movedPawns.add(targetSquare.id); 
        }

        targetSquare.appendChild(selectedPiece);
    
        clearHighlights();
        selectedPiece = null;
        selectedSquare = null;

        //Start the clock of the game when white does first move
        if(whiteStart==true){
            startClock();
            whiteStart=false;
        }

        switchPlayer();
    }


    for (let i = 0; i < boardSquares.length; i++) {
        boardSquares[i].addEventListener("click", (event) => {

            let clickedSquare = event.currentTarget;
            if (clickedSquare.hasChildNodes()) {
                if (clickedSquare === selectedSquare) {
                    clearHighlights();
                    selectedPiece = null;
                    selectedSquare = null;
                    return;
                }
        
                const piece = clickedSquare.firstElementChild;
                const pieceColor = piece.classList.contains("WhitePieces") ? 2 : 1;
        
                if (pieceColor === currentPlayer) {
                    showLegalMoves(clickedSquare);
                } else if (clickedSquare.classList.contains("highlight")) {
                    movePiece(clickedSquare);
                }

            } else if (clickedSquare.classList.contains("highlight")) {
                movePiece(clickedSquare);
            } else {
                clearHighlights();
            }

        });

        boardSquares[i].addEventListener("mousedown", (e) => {
            let square = e.currentTarget;

        if (square.hasChildNodes()) {

            const piece = square.firstElementChild;
            const pieceColor = piece.classList.contains("WhitePieces") ? 2 : 1;
            if (pieceColor === currentPlayer) {
                draggingPiece = piece;
                originSquare = square;
                selectedPiece = piece;
                selectedSquare = square;
                showLegalMoves(square);

                //Clone the piece and make it follow the mouse
                ghostPiece = piece.cloneNode(true);
                ghostPiece.style.position = "absolute";
                ghostPiece.style.pointerEvents = "none";
                ghostPiece.style.zIndex = "1000";
                ghostPiece.style.width = piece.offsetWidth + "px";
                ghostPiece.style.height = piece.offsetHeight + "px";

                document.body.appendChild(ghostPiece);
                //remove piece getting dragged
                square.removeChild(piece);
                moveGhostPiece(e);
            }
        }
    });
   
    boardSquares[i].addEventListener("mouseup", (e) => {
        let square = e.currentTarget;
        
        if(draggingPiece){
            
        if (square.classList.contains("highlight")) {
            
            movePiece(square);

        //if dragging a piece and an originSquare exists readd the piece to board
        } else{
            originSquare.appendChild(draggingPiece);
            cleanupDrag();
            
    //old click code
            let clickedSquare = square
            
            if (clickedSquare.hasChildNodes()) {

                const piece = clickedSquare.firstElementChild;
                const pieceColor = piece.classList.contains("WhitePieces") ? 2 : 1;
        
                if (pieceColor === currentPlayer) {
                    showLegalMoves(clickedSquare);
                } else if (clickedSquare.classList.contains("highlight")) {
                    movePiece(clickedSquare);
                }

            } else if (clickedSquare.classList.contains("highlight")) {
                movePiece(clickedSquare);
            } else {
                
                clearHighlights();
            }

        }
        cleanupDrag();
    }
    });
}

//Prevents bugs, removes dragged piece, reset variables
function cleanupDrag() {
    if (ghostPiece) {
        ghostPiece.remove();
        ghostPiece = null;
    }
    draggingPiece = null;
    originSquare = null;
}

//Ghost piece follows cursor when cursor moves
document.addEventListener("mousemove", (e) => {
    if (ghostPiece) {
        moveGhostPiece(e);
    }
});
function moveGhostPiece(e) {
    ghostPiece.style.left = e.pageX - ghostPiece.offsetWidth / 2 + "px";
    ghostPiece.style.top = e.pageY - ghostPiece.offsetHeight / 2 + "px";
}


//Trying to prevent the user from selecting elements when dragging
document.addEventListener('dragstart', (e) => {
    e.preventDefault();
});



//For now I simply reload the page
    // function resetBoard() {
    //     
    //     timePlayer1 = 300;
    //     timePlayer2 = 300;
    //     updateClockDisplay();
    //     
    //     currentPlayer = 2;

    //     board.innerHTML = "";
    
    //     setupBoard();
    
    //     movedPawns.clear();
    
    //     clearInterval(interval);
    //     startClock();
    // }

});
