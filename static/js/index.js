let socket = io();
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let cols;
let rows;
let cellW;
let cellH;
let colors;

let currentColor = 1;

let board;

let initialized = false;

socket.on('init', function (data) {
    cols = data.cols;
    rows = data.rows;
    colors = data.colors
    board = data.board;
    currentColor = data.defaultColor;
    cellW = canvas.width / cols;
    cellH = canvas.height / rows;
    initialized = true;

    drawBoard();
    setInterval(update, 1000 / 16);
});

let colorKeys = '123456789';

let mouseCellX = 0;
let mouseCellY = 0;

let gridLinesColor = '#000';

window.onresize = function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cellW = canvas.width / cols;
    cellH = canvas.height / rows;
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

function placeCell(c, x, y) {
    ctx.fillStyle = c;
    board[y][x] = c;
}

function update() {

}

socket.on('placeCell', function (data) {
    if (data.placerID != socket.id) {
        placeCell(data.color, data.x, data.y);
        drawBoard();
    }
});

document.addEventListener('keydown', function (event) {
    if(colorKeys.includes(event.key)){
        currentColor = Number(event.key);
    }
});

document.addEventListener('mousemove', function (event) {

    mouseCellX = Math.floor(event.clientX / cellW);
    mouseCellY = Math.floor(event.clientY / cellH);

});

document.addEventListener('click', function (event) {
    placeCell(currentColor, mouseCellX, mouseCellY);
    drawBoard();
    socket.emit('cellPlaced', {
        placerID: socket.id,
        color: currentColor,
        x: mouseCellX,
        y: mouseCellY,
        board: board
    });
});
