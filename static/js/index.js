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

let clearVoteBtn = document.getElementById('startClearVoteBtn');
let clearVoteControls = document.getElementById('clearVoteControls');


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

function clearVote(inFavor){
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

socket.on('placeCell', function (data) {
    if (data.placerID != socket.id) {
        placeCell(data.x, data.y, data.color);
    }
});

socket.on('updateClientCount', function (data) {
    paintersOnlineText.innerHTML = `Painters Online: ${data.clientsCount}`;
});

socket.on('clearVoteStarted', function(data){
    clearVoteBtn.style.display = 'none';
    clearVoteControls.style.display = 'inline';
});

socket.on('clearVoteUpdate', function(data){
    clearVoteText = `Clear Vote: ${data.votes}/${data.clientsCount}`;
});

socket.on('clearVoteEnded', function(data){
    clearVoteBtn.style.display = 'inline';
    clearVoteControls.style.display = 'none';
    clearVoteText = `Clear Vote: 0/${data.clientsCount}`;
});

socket.on('updateBoard', function(data){
    board = data.board;
    drawBoard();
});

document.addEventListener('keydown', function (event) {
    if(colorKeys.includes(event.key)){
        currentColorNum = Number(event.key);
        ghostCell.style.backgroundColor = colors[currentColorNum];
    } else if(event.key == 'g'){
        //gridEnabled = !gridEnabled;
        //drawBoard();
    }
});

//I know this is bad practice but I'm lazy and this is a small project so Ise number keys to change color.'m not going to bother with a better solution
//I'm sorry for my sins but I'm not sorry enough to fix them :( - Ben
//I want to die - Ben
//I'm sorry for my sins but I'm not sorry enough to fix them :( - Ben
//i kicked ben from the server - ben

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