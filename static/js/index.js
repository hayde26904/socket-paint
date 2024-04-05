let socket = io();
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let ghostCell = document.getElementById('ghostCell');
let ghostCellBackground = document.getElementById('ghostCellBackground');

let cols;
let rows;
let cellW;
let cellH;
let colors;

let ghostCellX;
let ghostCellY;
let ghostCellW;
let ghostCellH;

let currentColorNum = 1;

let board;

let initialized = false;

socket.on('init', function (data) {
    cols = data.cols;
    rows = data.rows;
    colors = data.colors
    board = data.board;
    currentColorNum = data.defaultColor;
    cellW = canvas.width / cols;
    cellH = canvas.height / rows;
    ghostCellW = cellW - gridLinesThickness;
    ghostCellH = cellH - gridLinesThickness;
    ghostCell.style.width = ghostCellW + 'px';
    ghostCell.style.height = ghostCellH + 'px';
    ghostCellBackground.style.width = ghostCellW + 'px';
    ghostCellBackground.style.height = ghostCellH + 'px';
    ghostCell.style.backgroundColor = colors[currentColorNum];
    initialized = true;

    drawBoard();
    setInterval(update, 1000 / 60);
});

let colorKeys = '123456789';

let mouseCellX = 0;
let mouseCellY = 0;

let gridLinesColor = '#000';
let gridLinesThickness = 1;

window.onresize = function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cellW = canvas.width / cols;
    cellH = canvas.height / rows;
    ghostCellW = cellW - gridLinesThickness;
    ghostCellH = cellH - gridLinesThickness;
    ghostCell.style.width = ghostCellW + 'px';
    ghostCell.style.height = ghostCellH + 'px';
    ghostCellBackground.style.width = ghostCellW + 'px';
    ghostCellBackground.style.height = ghostCellH + 'px';
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
            ctx.strokeRect(col * cellW, row * cellH, cellW, cellH);
        }
    }
}

function placeCell(x,y, cnum) {
    ctx.fillStyle = colors[cnum];
    board[y][x] = cnum;
}

function update() {
}

socket.on('placeCell', function (data) {
    if (data.placerID != socket.id) {
        placeCell(data.x, data.y, data.color);
        drawBoard();
    }
});

document.addEventListener('keydown', function (event) {
    if(colorKeys.includes(event.key)){
        currentColorNum = Number(event.key);
        ghostCell.style.backgroundColor = colors[currentColorNum];
    }
});

document.addEventListener('mousemove', function (event) {

    mouseCellX = Math.floor(event.clientX / cellW);
    mouseCellY = Math.floor(event.clientY / cellH);

    ghostCellX = Math.floor(mouseCellX * cellW) + gridLinesThickness;
    ghostCellY = Math.floor(mouseCellY * cellH) + gridLinesThickness;

    ghostCell.style.left = ghostCellX + 'px';
    ghostCell.style.top = ghostCellY + 'px';
    ghostCellBackground.style.left = ghostCellX + 'px';
    ghostCellBackground.style.top = ghostCellY + 'px';
    
});

document.addEventListener('click', function (event) {
    placeCell(mouseCellX, mouseCellY, currentColorNum);
    drawBoard();
    socket.emit('cellPlaced', {
        placerID: socket.id,
        color: currentColorNum,
        x: mouseCellX,
        y: mouseCellY,
        board: board
    });
});
