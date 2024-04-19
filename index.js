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

let clearVoteTimeSeconds = 10;
let clearVoteInProgress = false;

let clearInFavor = 0;
let clearVotes = 0;

let voters = [];
let IPs = [];
let whitelist = [
    '172.16.1.104',
    '172.16.1.189'
];

let clearVoteTimer;

let clearVoteTimeRemaining = clearVoteTimeSeconds;

function filledBoard(fill, cols, rows) {
    let arr = [];
    for (let row = 0; row < rows; row++) {
        arr.push([]);
        for (let col = 0; col < cols; col++) {
            arr[row][col] = fill;
        }
    }

    return arr;
}

let board = filledBoard(0, cols, rows);

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/views/index.html");
});
app.get('/funny', function(req, res){
    res.sendFile(__dirname + "/views/page.html");
});
app.use('/', express.static(__dirname + '/'));


const PORT = 80;
const HOST = '0.0.0.0';

serv.listen(PORT);
console.log('Server Running!');

function randomColor() {
    return "rgb(" + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + ")";
}

let io = require('socket.io')(serv, {});
const os = require('os');
io.sockets.on('connection', function (socket) {
    console.log("SOCKET CONNECTION");

    socket.IP = socket.handshake.address.replace('::ffff:', '');

    if(IPs.includes(socket.IP)){
        socket.disconnect();
        return;
    }

    IPs.push(socket.IP)

    socket.emit('init', {
        board: board,
        cols: cols,
        rows: rows,
        colors: colors,
        defaultColor: defaultColor,
        clientsCount: io.engine.clientsCount,
        isVIP: whitelist.includes(socket.IP),
    });

    if (clearVoteInProgress) {
        socket.emit('clearVoteStarted', {
            votes: clearVotes,
            clientsCount: io.engine.clientsCount
        });
    }

    io.emit("updateClientCount", {
        clientsCount: io.engine.clientsCount
    });

    if (clearVoteInProgress) {
        socket.emit('updateClearVote', {

        });
    }

    socket.on('startClearVote', function () {
        //if(!clearVoteInProgress){
        io.emit('clearVoteStarted', {
            votes: 0,
            clientsCount: io.engine.clientsCount
        });
        clearVoteInProgress = true;
        clearVoteTimer = setInterval(clearVoteCountDown, 1000);
        // i dont know what this is for but it was in the original code so i will keep it here for now UNTIL I KILL THE GOVERNMENT AND TAKE OVER THE WORLD
        // I WILL THEN REMOVE THIS CODE AND REPLACE IT WITH MY OWN CODE THAT WILL BE BETTER THAN THIS CODE AND WILL BE THE BEST CODE IN THE WORLD AND NO ONE WILL BE ABLE TO STOP ME
        // I WILL THEN RULE THE WORLD WITH AN IRON FIST AND NO ONE WILL BE ABLE TO STOP ME AND I WILL BE THE KING OF THE WORLD AND NO ONE WILL BE ABLE TO STOP ME
        //AND THE GOVERMENT WILL BE DESTROYED AND I WILL BE THE KING OF THE WORLD AND NO ONE WILL BE ABLE TO STOP ME AND I WILL RULE THE WORLD WITH AN IRON FIST
    });

    socket.on('clearVotePlaced', function (data) {
        if (!voters.includes(data.voterID)) {
            clearVotes++;
            voters.push(data.voterID);

            if (data.inFavor) {
                clearInFavor++;
            }

            console.log(`clear vote placed. Stance: ${data.inFavor}`);

            io.emit('clearVoteUpdate', {
                votes: clearVotes,
                clientsCount: io.engine.clientsCount
            });
        }
    });

    socket.on('cellPlaced', function (data) {
        console.log(`Cell placed at X: ${data.x}  Y: ${data.y}  of Color: ${data.color}  by Socket ID: ${data.placerID}`);
        board = data.board;
        io.emit('placeCell', {
            placerID: data.placerID,
            color: data.color,
            x: data.x,
            y: data.y
        });
    });

    socket.on("VIPClear", function () {
        if(whitelist.includes(socket.IP)){
            board = filledBoard(0, cols, rows);
            io.emit('updateBoard', {
                board: board
            });
        }
    });

    socket.on('disconnect', function () {
        console.log("SOCKET DISCONNECT");
        let IpIndex = IPs.indexOf(socket.IP);
        IPs.splice(IpIndex, 1);
        io.emit("updateClientCount", {
            clientsCount: io.engine.clientsCount
        });
    });
});

function clearVoteCountDown() {
    console.log(`vote time remaining: ${clearVoteTimeRemaining}`);
    clearVoteTimeRemaining--;
    /*io.emit('clearVoteTimeRemaining', {
        time: clearVoteTimeRemaining
    });*/
    if (clearVoteTimeRemaining <= 0) {

        clearVoteInProgress = false;
        clearInterval(clearVoteTimer);
        clearVoteTimeRemaining = clearVoteTimeSeconds;
        voters = [];

        let clearVoteResult = (clearInFavor / clearVotes) >= 0.5;

        io.emit('clearVoteEnded', {
            result: clearVoteResult
        });
        
        console.log(`vote ended with result: ${clearVoteResult}`);
        clearVotes = 0;
        clearInFavor = 0;

        if (clearVoteResult) {
            board = filledBoard(0, cols, rows);
            io.emit('updateBoard', {
                board: board
            });
        }
    }
}