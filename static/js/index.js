let socket = io();
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

//I wnat to  live but 

let canvasYOffset = (window.innerHeight * 0.04);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - canvasYOffset;

let ghostCell = document.getElementById('ghostCell');
let ghostCellBackground = document.getElementById('ghostCellBackground');

let paintersOnlineText = document.getElementById('paintersOnlineText');

let startClearVoteBtn = document.getElementById('startClearVoteBtn');
let clearVoteUI = document.getElementById('clearVoteUI');
let votesText = document.getElementById('votesText');
let voteBtns = document.getElementsByClassName('voteBtns');

let VIPClearBtn = document.getElementById('VIPClearBtn');


let cols;
let rows;
let cellW;
let cellH;
let colors;

let ghostCellX;
let ghostCellY;
let ghostCellW;
let ghostCellH;

let placed = false;
let mouseDown = false;

let isVIP = false;

let currentColorNum = 1;

let board;

let ben = new Image();
ben.src = "static/img/bennyboy.jpg";

let initialized = false;

socket.on('init', function (data) {
    cols = data.cols;
    rows = data.rows;
    colors = data.colors
    board = data.board;
    currentColorNum = data.defaultColor;
    cellW = canvas.width / cols;
    cellH = canvas.height / rows;
    ghostCellW = cellW;
    ghostCellH = cellH;
    ghostCell.style.width = ghostCellW + 'px';
    ghostCell.style.height = ghostCellH + 'px';
    ghostCell.style.backgroundColor = colors[currentColorNum];
    paintersOnlineText.innerHTML = `Painters Online: ${data.clientsCount}`;

    isVIP = data.isVIP;

    initialized = true;

    drawBoard();
    setInterval(update, 1000 / 60);
});

let colorKeys = '123456789';

let mouseCellX = 0;
let mouseCellY = 0;
let oldMouseCellX = 0;
let oldMouseCellY = 0;

let gridLinesColor = '#000';
let gridLinesThickness = 1;

let gridEnabled = true;

window.onresize = function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cellW = canvas.width / cols;
    cellH = canvas.height / rows;
    ghostCellW = cellW;
    ghostCellH = cellH;
    ghostCell.style.width = ghostCellW + 'px';
    ghostCell.style.height = ghostCellH + 'px';
    drawBoard();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            let cell = board[row][col];
            ctx.fillStyle = colors[cell];
            ctx.strokeStyle = gridLinesColor;
            ctx.fillRect(col * cellW, row * cellH, cellW, cellH);
            if(gridEnabled) ctx.strokeRect(col * cellW, row * cellH, cellW, cellH);
        }
    }
}

function placeCell(x,y, cnum) {
    let cellX = x * cellW;
    let cellY = y * cellH;
    ctx.fillStyle = colors[cnum];
    board[y][x] = cnum;
    ctx.fillRect(cellX, cellY, cellW, cellH)
    ctx.strokeStyle = gridLinesColor;
    if(gridEnabled) ctx.strokeRect(cellX, cellY, cellW, cellH);
}

function startClearVote(){
    socket.emit('startClearVote', {});
}

function placeClearVote(inFavor){
    socket.emit('clearVotePlaced', {
        inFavor: inFavor,
        voterID: socket.id
    });
}

function update() {
    if(!placed && mouseDown){
        placeCell(mouseCellX, mouseCellY, currentColorNum);
        placed = true;
        socket.emit('cellPlaced', {
            placerID: socket.id,
            color: currentColorNum,
            x: mouseCellX,
            y: mouseCellY,
            board: board
        });
    }
    console.log(mouseCellX);
}

function VIPClear(){
    if(isVIP){
        socket.emit('VIPClear', {});
    } else {
        alert('Give me gum and I will make you VIP');
    }
}

socket.on('placeCell', function (data) {
    if (data.placerID != socket.id) {
        placeCell(data.x, data.y, data.color);
    }
});

socket.on('updateClientCount', function (data) {
    paintersOnlineText.innerHTML = `Painters Online: ${data.clientsCount}`;
});

socket.on('clearVoteStarted', function(data){
    startClearVoteBtn.classList.add('hidden');
    clearVoteUI.classList.remove('hidden');
    votesText.innerHTML = `Clear Vote: ${data.votes}/${data.clientsCount}`;
});

socket.on('clearVoteUpdate', function(data){
    votesText.innerHTML = `Clear Vote: ${data.votes}/${data.clientsCount}`;
});

socket.on('clearVoteEnded', function(data){
    votesText.innerHTML = (data.result) ? "Clear Vote Successful." : "Clear Vote Failed.";
    setTimeout(function(){
        clearVoteUI.classList.add('hidden');
        startClearVoteBtn.classList.remove('hidden');
        //clearVoteText = `Clear Vote: 0/${data.clientsCount}`;
    }, 2000);
});

socket.on('updateBoard', function(data){
    board = data.board;
    drawBoard();
});

document.addEventListener('keydown', function (event) {
    if(colorKeys.includes(event.key)){
        currentColorNum = Number(event.key);
        ghostCell.style.backgroundColor = colors[currentColorNum];
        placed = false;
    } else if(event.key == 'g'){
        //gridEnabled = !gridEnabled;
        //drawBoard();
    }
});

document.addEventListener('mousemove', function (event) {

    oldMouseCellX = mouseCellX;
    oldMouseCellY = mouseCellY;

    mouseCellX = Math.floor(event.clientX / cellW);
    mouseCellY = Math.floor(event.clientY / cellH);

    if(oldMouseCellX != mouseCellX || oldMouseCellY != mouseCellY){
        placed = false;
    }

    ghostCellX = mouseCellX * cellW;
    ghostCellY = mouseCellY * cellH + canvasYOffset;

    ghostCell.style.left = ghostCellX + 'px';
    ghostCell.style.top = ghostCellY + 'px';
    ghostCellBackground.style.left = ghostCellX + 'px';
    ghostCellBackground.style.top = ghostCellY + 'px';
    
});

document.addEventListener('mousedown', function (event) {
    mouseDown = true;
});

document.addEventListener('mouseup', function (event) {
    mouseDown = false;
});
