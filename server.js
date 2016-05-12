//Initialisation des variables
  var express = require('express');
  var app = express();
  var server = require('http').createServer(app);
  var fs = require('fs');
  var save = 0;
  var id = 0;
  var lock; // false = graphe non bloqué, true = graphe bloqué
  var active = Math.floor(Math.random()*5);
  var random;
  var saved_graph = [];
  var upload_graph;

//  Chargement du fichier index.html affiché au client
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client.html');
});

// Répertoire public contenant les fichiers statiques à importer au HTML
app.use(express.static(__dirname + '/public/icons'));
app.use(express.static(__dirname + '/public/libraries'));
app.use(express.static(__dirname + '/public/main_js_file'));
app.use(express.static(__dirname + '/public/style'));

// Récupérer fichier .json stocké côté serveur
  var path = "./Graphs/";
  fs.readdir(path, function(err, items) {
    saved_graph = [];
    for (var i=0; i<items.length; i++) {
      if (items[i].indexOf(".json") >= 0){
        saved_graph.push(items[i]);
        console.log(items[i]);
      }
    }
  });

  // Chargement de socket.io
  var io = require('socket.io').listen(server);
  var j=0;

  // Quand un client se connecte, on le note dans la console
  io.sockets.on('connection', function (socket) {
    socket.emit('message', 'Vous êtes bien connecté !');
    socket.emit('saved_graph', saved_graph);

    socket.on('new_client', function(){
      socket.id = id;
      socket.emit('id', id);
      console.log(socket.id);
      id++;
    })

    // Mise en place d'un verrou pour protéger l'accès à un graphe déjà en cours d'édition
    // Si on reçoit un signal "sig_edit" on regarde la valeur de isLocked pour donner ou non l'accès en édition
    socket.on('ack_edit', function (sig_edit) {
      console.log('Vous avez reçu un signal d\'édition du client')
      if (lock == undefined) {
        socket.emit('nobody_edit', 'Vous avez désormais accès au graphe en mode édition');
        lock = socket.id;
      }else{
        // isLocked = false;
        socket.emit('already_edit','Ce graphe est déjà en cours d\'édition');
      }
      sig_edit = 0;
    });

    socket.on('return', function(sig_edit){
      console.log('Jeton laché');
      lock = undefined;
    })

    //Update save quand on downloade le graphe
    socket.on('Graphe_save', function(blob){
      var Graphs = [];
      save = String(blob.content);
      console.log('Graphe bien reçu côté serveur (Fichier JSON)');
      if(blob.new == 'yes'){ j = j+1;}
      fs.writeFile('./Graphs/Graph_n°'+ j + '.json', blob.content);
      Graphs.push('Graph_n°'+ j + '.json');
      // Récupérer fichier .json stocké côté serveur
      saved_graph = [];
      fs.readdir(path, function(err, items) {
        for (var i=0; i<items.length; i++) {
          if (items[i].indexOf(".json") >= 0){
              saved_graph.push(items[i]);
              console.log(items[i]);
          }
        }
        io.emit('update_saved_graph', saved_graph);
      });


    });

    //Update save toutes les 5 sec pour les clients qui n'ont pas accès à l'édition
    socket.on('Graphe_five', function(blob){
     save = String(blob);
     socket.broadcast.emit('Graphe_five', save);
     console.log('Graph sent to other clients');
    });

    // Lors d'un rafraichissement, charge save si != 0
    socket.on('Graphe_connect', function(blob){
      if(save == 0){
        save = String(blob);
      }
      console.log('Graph charged');
      io.emit('Graphe_connect', save);
    });

    socket.on('uploaded', function(blob){
      save = String(blob);
      console.log('Graph saved');
      io.emit('Graphe_connect', save);
    })

  /*  socket.on('play', function(play){
      if(play == true){
        random = setInterval( function(){
         active =  Math.floor(Math.random()*5);
         io.emit('changeActive', active);
       } , 1000 );
      }else if(play == false){
        clearInterval(random);
      }
    });
*/
    socket.on('upload_graph', function(file_name){
      console.log('Uploading ' + file_name);
      fs.readFile('./Graphs/' + file_name, 'utf8', function (err, data) {
        if (err) throw err;
        upload_graph = data;
        console.log(upload_graph);
        io.emit('Graphe_connect', upload_graph);
      });
    });

    socket.on('sendWord', function(testWord){
      var word=testWord;
      var tab = [];
      var activenodes= [];
      activenodes[0]=0;
      
      save1 = JSON.parse(save);
      for (var j=0; j<word.length; j++){
        var verif=0;
        var source=0;
        for (var i = 0; i < save1.edges.length; i++) {

          if(save1.edges[i].source==save1.active){
            source=1;

            //if (save1.edges[i].transition==word.charAt(j)){
            
            var reg= new RegExp(String(save1.edges[i].transition),"i");
            console.log(reg.test(word.charAt(j))); 
              if (reg.test(word.charAt(j))){
              save1.active=save1.edges[i].target;
              tab[j]=word.charAt(j);
              activenodes[j+1]=save1.active;
              verif=1;
            }
            
          }
        };
      
        if (source==0){
          
          socket.emit('messagelong',"Votre mot est trop long");
          j=word.length;
        }
        else if (verif==0){
              //ERREUR : NOEUD D'ERREUR : NOEUD À ID = -1 (TOUCHE POUR L'AJOUTER) 
              //socket.emit('messageError',"Ce mot n'est pas valable");
              socket.emit('activenodes',activenodes);
              j=word.length;
            }
        
      };
      console.log(activenodes);
      
      if (tab.length==word.length){
        console.log('done');
      socket.emit('activenodes',activenodes);
      }
    });


  });

  server.listen(8080);
