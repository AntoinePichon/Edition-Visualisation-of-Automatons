var http = require('http');

var fs = require('fs');


// Chargement du fichier index.html affiché au client
var server = http.createServer(function(req, res) {
    fs.readFile('./index10.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});

// Chargement de socket.io
var io = require('socket.io').listen(server);

// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
        socket.emit('message', 'Vous êtes bien connecté !');

        //Quand serveur recoit message de type "Graphe"
        socket.on('Graphe', function(blob){
          console.log('Graphe bien reçu côté serveur : Fichier JSON : ' + blob);
        });
});

server.listen(8080);
