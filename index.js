let express = require('express');
let app = express();
let serv = require('http').Server(app);

//let ip = require('ip');

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

let clearVoteTimeSeconds = 30;
let clearVoteInProgress = false;

let clearInFavor = 0;
let clearVotes = 0;

let clearVoteTimeRemaining = clearVoteTimeSeconds;

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

app.get('/admin', function(req, res) {
    res.sendFile(__dirname + "/views/admin.html");
});
app.use('/', express.static(__dirname + '/'));


const PORT = 3000;
const HOST = '0.0.0.0';

serv.listen(PORT);
console.log('Server Running!');

function randomColor() {
    return "rgb(" + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + ")";
}

let io = require('socket.io')(serv, {});
const os = require('os');
io.sockets.on('connection', function(socket) {
    console.log("SOCKET CONNECTION");
    socket.emit('init', {
        board: board,
        cols: cols,
        rows: rows,
        colors: colors,
        defaultColor: defaultColor,
        clientsCount: io.engine.clientsCount
    });

    io.emit("updateClientCount", {
        clientsCount: io.engine.clientsCount
    });

    socket.on('startClearVote', function(){
        //if(!clearVoteInProgress){
            io.emit('clearVoteStarted', {
                clientsCount: io.engine.clientsCount
            });
            clearVoteInProgress = true;
            let clearVoteTimer = setInterval(clearVoteCountDown, 1000);
        // i dont know what this is for but it was in the original code so i will keep it here for now UNTIL I KILL THE GOVERNMENT AND TAKE OVER THE WORLD
    });

    socket.on('clearVotePlaced', function(data){
        clearVotes++;
        if(data.inFavor){
            clearInFavor++;
        }

        io.emit('clearVoteUpdate', {
            votes: clearVotes,
            clientsCount: io.engine.clientsCount
        });
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
        io.emit("updateClientCount", {
            clientsCount: io.engine.clientsCount
        });
    });
});

function clearVoteCountDown(){
    clearVoteTimeRemaining--;
    /*io.emit('clearVoteTimeRemaining', {
        time: clearVoteTimeRemaining
    });*/
    if(clearVoteTimeRemaining <= 0){
        clearVoteInProgress = false;
        clearInterval(clearVoteTimer);
        clearVoteTimeRemaining = clearVoteTimeSeconds;
        io.emit('clearVoteEnded', {});

        //clears board bro
        board = filledBoard(0, cols, rows);
        io.emit('updateBoard', {
            board: board
        });
    }
}