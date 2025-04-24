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

const piecePlacementWhite = [
    ["blackRook", "blackKnight", "blackBishop", "blackQueen", "blackKing", "blackBishop", "blackKnight", "blackRook"],
    ["blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn", "blackPawn"],
    [], 
    [], 
    [], 
    [],
    ["whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn", "whitePawn"],
    ["whiteRook", "whiteKnight", "whiteBishop", "whiteQueen", "whiteKing", "whiteBishop", "whiteKnight", "whiteRook"]
];
const piecePlacementBlack = [...piecePlacementWhite].map(row => [...row]).reverse();
const piecePlacement = piecePlacementWhite;
let playerColor;
let gameHistory = [];

document.addEventListener("DOMContentLoaded", () => {
    
    let socket;
    let isMyTurn = false;

    function setupWebSocket() {
        socket = new WebSocket("ws://localhost:3000");

        socket.addEventListener("open", () => {
            console.log("Connected to server");
            socket.send(JSON.stringify({ type: "join", userID:"Marco"}));
        });

        socket.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            //joined, start, created
            if (data.type === "start") {
                currentPlayer = data.color === "white" ? 2 : 1;
                playerColor=data.color;
                isMyTurn = currentPlayer === 2; // White moves first
                //test
                console.log("Game started, you are", data.color);
                createBoard(data.color);
            }

            if (data.type === "move") {
                console.log(data);
                applyOpponentMove(data);
                isMyTurn = true;
            }
        });

        socket.addEventListener("close", () => {
            console.log("Opponent Disconnected");
        });

    }
    setupWebSocket();

    function applyOpponentMove(move) {
        console.log(move);
        const fromSquare = document.getElementById(move.from);
        const toSquare = document.getElementById(move.to);
        const piece = fromSquare.firstElementChild;
    
        if (!piece) return;
    
        if (toSquare.hasChildNodes()) {
            toSquare.removeChild(toSquare.firstElementChild);
        }
    
        toSquare.appendChild(piece);
        clearHighlights();
        switchPlayer();
    }
    
    function createBoard(playerColor) {
        const board = document.getElementById("board");

    
        const piecePlacement = playerColor === "white" ? piecePlacementWhite : piecePlacementBlack;


        const rowIndices = [0,1,2,3,4,5,6,7];
        const colIndices = [0,1,2,3,4,5,6,7];

        if (playerColor === "white") {
            
        } 
        if (playerColor === "black") {
            colIndices.reverse(); // Files h to a
        }
    
        for (let row of rowIndices) {
            for (let col of colIndices) {
                const square = document.createElement("div");
                square.classList.add("square", (row + col) % 2 === 0 ? "light" : "dark");
    
                const piece = piecePlacement[row][col];
                if (piece) {
                    const img = document.createElement("img");
                    const pieceColor = piece.startsWith("white") ? "WhitePieces" : "BlackPieces";
                    img.src = `Assets/${pieceColor}/${piece}.png`;
                    img.alt = piece;
                    img.classList.add("chess-piece", pieceColor);
                    square.appendChild(img);
                }
    
                board.appendChild(square);
            }
        }
        setupBoardSquares(playerColor)
        boardCreated()
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
    

    // for (let row = 0; row < 8; row++) {
    //     for (let col = 0; col < 8; col++) {
    //         const square = document.createElement("div");
    //         square.classList.add("square", (row + col) % 2 === 0 ? "light" : "dark");
            
    //         if (piecePlacement[row].length > 0) {
    //             const piece = piecePlacement[row][col];
    //             if (piece) {
    //                 const img = document.createElement("img");
    //                 const pieceColor = piece.startsWith("white") ? "WhitePieces" : "BlackPieces";
    //                 img.src = `Assets/${pieceColor}/${piece}.png`;
    //                 img.alt = piece;
    //                 img.classList.add("chess-piece");
    //                 img.classList.add(pieceColor);
    //                 square.appendChild(img);
    //             }
    //         }
            
    //         board.appendChild(square);
    //     }
    // }

    const boardSquares = document.getElementsByClassName("square");
    
    function setupBoardSquares(color) {
        for (let i = 0; i < boardSquares.length; i++) {
            let row, col;
            if (color === 'white') {
                row = 8 - Math.floor(i / 8);
                col = String.fromCharCode(97 + (i % 8));
            } else if (color === 'black') {
                row = 1 + Math.floor(i / 8);
                col = String.fromCharCode(104 - (i % 8)); // Reverse columns
            }
    
            boardSquares[i].id = col + row;
        }
    }
    function boardCreated(){
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
    
        if (!isMyTurn) {
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


        if (socket && socket.readyState === WebSocket.OPEN) {
            const moveData = {
                from: piecePosition,
                to: targetSquare.id,
            };
            console.log(moveData);
            let to2 = targetSquare.id;
            
            socket.send(JSON.stringify({ type: "move", from: piecePosition, to: to2}));
        }
        isMyTurn = false;
        switchPlayer();
    }

    for (let i = 0; i < boardSquares.length; i++) {
        boardSquares[i].addEventListener("click", (event) => {
            if (!isMyTurn) {
                return;
            }

            let clickedSquare = event.currentTarget;
            if (clickedSquare.hasChildNodes()) {
                if (clickedSquare === selectedSquare) {
                    clearHighlights();
                    selectedPiece = null;
                    selectedSquare = null;
                    return;
                }
        
                const piece = clickedSquare.firstElementChild;
                let color=null;
                if(playerColor == "black"){
                    color= "BlackPieces";
                }else if(playerColor == "white"){
                    color= "WhitePieces"
                }
                const pieceColor = piece.classList.contains(color);

                if (pieceColor && isMyTurn) {
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
            if (!isMyTurn) {
                return;
            }
            let square = e.currentTarget;
        if (square.hasChildNodes()) {

            const piece = square.firstElementChild;
            let color=null;
                if(playerColor == "black"){
                    color= "BlackPieces";
                }else if(playerColor == "white"){
                    color= "WhitePieces"
                }
                const pieceColor = piece.classList.contains(color);

                if (pieceColor && isMyTurn) {
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
        if (!isMyTurn) {
            return;
        }
        let square = e.currentTarget;
        
        if(draggingPiece){
            
        if (square.classList.contains("highlight")) {
            if (isMyTurn) {
                movePiece(square);
            }

        //if dragging a piece and an originSquare exists readd the piece to board
        } else{
            originSquare.appendChild(draggingPiece);
            cleanupDrag();
            
    //old click code
            let clickedSquare = square
            
            if (clickedSquare.hasChildNodes()) {

                const piece = clickedSquare.firstElementChild;
                let color=null;
                if(playerColor == "black"){
                    color= "BlackPieces";
                }else if(playerColor == "white"){
                    color= "WhitePieces"
                }
                const pieceColor = piece.classList.contains(color);

                if (pieceColor && isMyTurn) {
                    showLegalMoves(clickedSquare);
                } else if (clickedSquare.classList.contains("highlight")) {
                    if (isMyTurn) {
                        movePiece(clickedSquare);
                    }
                }

            } else if (clickedSquare.classList.contains("highlight")) {
                if (isMyTurn) {
                    movePiece(clickedSquare);
                }
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
    }
});





//CODE FOR LOGIN AND SIGNUP - Pablo


document.addEventListener("DOMContentLoaded", DOMEventHandler());

function DOMEventHandler() {
    if(window.location.href.includes("profile.html")) {
        const sessionUser = JSON.parse(sessionStorage.getItem("user"));
        populateProfile(sessionUser);
    }
}

function fetchNewUser(){
    const pattern = /^(?=.*\d)(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/;
    let okPassword = pattern.test(document.getElementById("motDePasseBar").value);

    if(document.getElementById("motDePasseBar").value != document.getElementById("confirmationBar").value){
        document.getElementById("error").innerHTML = "Les mots de passes ne sont pas les même!";
    }
    else if(document.getElementById("prenomBar").value == '' || document.getElementById("nomBar").value == '' || 
    document.getElementById("usernameBar").value == '' || document.getElementById("courrielBar") == '' || document.getElementById("motDePasseBar").value == '' ){
        document.getElementById("error").innerHTML = "Il manque de l'information!";
    }
    else if(!okPassword){
        document.getElementById("error").innerHTML = "Le mot de passe doit contenir un chiffre, une majuscule et un caractère spéciale!";
    }
    else{
        let newUser = {
        Name : document.getElementById("prenomBar").value,
        LastName: document.getElementById("nomBar").value,
        UserName: document.getElementById("usernameBar").value,
        Email: document.getElementById("courrielBar").value,
        Password: document.getElementById("motDePasseBar").value
    };

        fetch('http://localhost:80/api/web/user', 
        {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newUser)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la création du compte');
            }
            return response.json();
        })
        .then(data => {
            if(data["error"] == "Exists"){
                document.getElementById("error").innerHTML = "Ce courriel à déjà un compte!";
            }
            else {
                sessionStorage.setItem("user", JSON.stringify(data[0]));
                window.location.href = "http://127.0.0.1:5500/HTML/profile.html";
            }
        })
        .catch(error => {
            if(data == "Exists"){
                document.getElementById("error").innerHTML = "Ce courriel à déjà un compte!";
            }
            console.error('Erreur:', error);
        });
        
    }
    
}

function fetchConnection(){
    if(document.getElementById("courrielBar") == '' || document.getElementById("motDePasseBar").value == '' ){
        document.getElementById("error").innerHTML = "Il manque de l'information!";
    }
    else{

        let email = document.getElementById('courrielBar').value;
        let password = document.getElementById('motDePasseBar').value;

        fetch('http://localhost:80/api/user/' + email, {methode: "GET"})
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération du compte');
            }
            return response.json();
        })
        .then(data => {
            if(data.length == 0){
                document.getElementById("error").innerHTML = "Courriel pas trouvé!";
            }
            else if(data[0].Password == password){
                sessionStorage.setItem("user", JSON.stringify(data[0]));
                window.location.href = "http://127.0.0.1:5500/HTML/profile.html";
            }   
            else {
                document.getElementById("error").innerHTML = "Mot de passe incorrecte!";
            }         
            
        })
        .catch(error => {
            console.error('Erreur:', error);
        });   
    }
}
function populateHistorique(sessionUser){
    let id = sessionUser['UserID'];
    


    fetch('http://localhost:80/api/user/games/' + id, {methode: "GET"})
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération du compte');
        }
        return response.json();
    })
    .then(data => {
        let games = data;
        for (let i = 0; i < games.length; i++) {

            fetch('http://localhost:80/api/user/id/' + games[i]["Player_black"], {methode: "GET"})
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération du compte');
                }
                return response.json();
            })
            .then(data => {
                let player1Username = data;
                fetch('http://localhost:80/api/user/id/' + games[i]["Player_white"], {methode: "GET"})
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erreur lors de la récupération du compte');
                    }
                    return response.json();
                })
                .then(data => {
                    let player2Username = data;
                    let newGameData = document.createElement('p');
                    newGameData.innerHTML = player1Username[0]["UserName"] + " VS. " + player2Username[0]["UserName"] ;
                    newGameData.className = "battle";

                    let container = document.getElementById('historique'); 
                    container.appendChild(newGameData);
                })
                .catch(error => {
                    console.error('Erreur:', error);
                }); 
            })
            .catch(error => {
                console.error('Erreur:', error);
            }); 
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
    });  


    
}

function populateProfile(sessionUser){
    let usernameTag = document.getElementById("username");
    usernameTag.innerHTML = sessionUser['UserName'];  

    let nameTag = document.getElementById("name");
    nameTag.innerHTML = sessionUser['Name'] + " " + sessionUser['LastName'];

    populateHistorique(sessionUser);
}

if(window.location.href.includes("signup.html")){
    let buttonInscrire = document.getElementById("bInscrire");
    buttonInscrire.addEventListener("click",  function(){
    if(document.readyState === "complete"){
        fetchNewUser();
    }
});
}

if(window.location.href.includes("login.html")){
    let buttonConnection = document.getElementById("bSeConnecter");
    buttonConnection.addEventListener("click",  function(){
    if(document.readyState === "complete"){
        fetchConnection();
    }
});
}

if(window.location.href.includes("profile.html")){
    let buttonJouer = document.getElementById("bJouer");
    buttonJouer.addEventListener("click",  function(){
    if(document.readyState === "complete"){
        window.location.href = "http://127.0.0.1:5500/HTML/gameboard.html";
    }});

    let buttonDeconnection = document.getElementById("bDeconnecter");
    buttonDeconnection.addEventListener("click",  function(){
    if(document.readyState === "complete"){
        sessionStorage.clear();
        window.location.href = "http://127.0.0.1:5500/HTML/login.html";
    }});
}
