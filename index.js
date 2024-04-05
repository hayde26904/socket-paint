let express = require('express');
let app = express();
let serv = require('http').Server(app);

let cols = 150;
let rows = 75;

let colors = {
    0: 'white',
    1: 'black',
    2: 'red',
    3: '#19f505',
    4: '#056df5',
    5: 'yellow',
    6: 'orange',
    7: '#915200',
    8: 'purple',
    9: 'white'
}

let defaultColor = 1;

function filledBoard(fill, cols, rows){
    let arr = [];
    for(let row = 0; row < rows; row++){
        arr.push([]);
        for(let col = 0; col < cols; col++){
            arr[row][col] = fill;
        }
    }

    return arr;
}

let board = filledBoard(0, cols, rows);

app.get('/', function(req, res) {
    res.sendFile(__dirname + "/views/index.html");
});

app.use('/', express.static(__dirname + '/'));


serv.listen(2000);
console.log("Server Started");

function randomColor() {
    return "rgb(" + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + ")";
}

let io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {
    console.log("SOCKET CONNECTION");
    socket.emit('init', {
        board: board,
        cols: cols,
        rows: rows,
        colors: colors,
        defaultColor: defaultColor
    });

    socket.on('cellPlaced', function(data){
        console.log(`Cell placed at X: ${data.x}  Y: ${data.y}  of Color: ${data.color}  by Socket ID: ${data.placerID}`);
        board = data.board;
        io.emit('placeCell', {
            placerID: data.placerID,
            color: data.color,
            x: data.x,
            y: data.y
        });
    });

    socket.on('disconnect', function(){
        console.log("SOCKET DISCONNECT");
    });
});