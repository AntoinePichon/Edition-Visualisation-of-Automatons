var edit = 0;
var already = true;
var current_graph = 0;
var id;
var activity = false;
var time = 10000;
var graph_available = [];
var element = document.getElementById('myonoffswitch');
var sig_edit = 0;

// Confirmation when saving file
function doConfirm(id, msg, yesFn, noFn) {
  var confirmBox = $(id);
  confirmBox.find(".message").text(msg);
  confirmBox.find(".yes,.no").unbind().click(function () {
    confirmBox.hide();
  });
  confirmBox.find(".yes").click(yesFn);
  confirmBox.find(".no").click(noFn);
  confirmBox.show();
}

function doConfirmLoad(id, msg, loadFn, cancelFn) {
  var confirmBox = $(id);
  confirmBox.find(".message").text(msg);
  confirmBox.find(".load,.cancel").unbind().click(function () {
    confirmBox.hide();
  });
  confirmBox.find(".load").click(loadFn);
  confirmBox.find(".cancel").click(loadFn);
  confirmBox.show();
}


// Play automaton behavior

/* var play = false;
$(document).ready(function() {
var icon = $('.play');
icon.click(function() {
   icon.toggleClass('active');
   if(play == false){
    play = true;
    socket.emit('play', play);
   }else if (play == true) {
    play = false;
    socket.emit('play', play);
  }

   return false;
});
}); */


// Initialisation communication socket
var socket = io.connect('http://localhost:4567');

socket.emit('new_client', id);

socket.on('id', function(given_id){
id = given_id;
console.log("MY ID IS :" + id);
});

socket.on('message', function(message) {
console.log(message);
});

socket.on('saved_graph', function(saved_graph){
  graph_available = saved_graph;
  $("ul").remove();
  $("option").remove();
  var ul = document.createElement("ul");
  var select = document.getElementById("select_file");
  for (var i = 0; i < graph_available.length; i++) {
    var graph_file = document.createTextNode(graph_available[i]);
    var li = document.createElement("li");

    li.appendChild(graph_file);
    ul.appendChild(li);
    ul.setAttribute('id', 'upload');
    var graph_file2 = document.createTextNode(graph_available[i]);
    var option = document.createElement("option");
    option.appendChild(graph_file2);
    select.appendChild(option);
  }
var element = document.getElementById("color-form");
element.appendChild(ul);

$("ul li").addClass(function( index ) {
  return "graph-" + index;
});

});


$(function(){
    $("#color-form").on('click','li',function (){
        var confirms = confirm('Do you want to upload ' + $(this).html());
        if(confirms)
          socket.emit('upload_graph', $(this).html());
    });
})


// Update saved graph on server
socket.on('update_saved_graph', function(saved_graph){
  graph_available = saved_graph;
  console.log('Graph dispo = ' + saved_graph);
  $("ul").remove();
  $("option").remove();
  var ul = document.createElement("ul");
  var select = document.getElementById("select_file");
  $("ul").attr('class', 'graph_available');
  for (var i = 0; i < graph_available.length; i++) {
    var graph_file = document.createTextNode(graph_available[i]);
    var li = document.createElement("li");
    li.appendChild(graph_file);
    ul.appendChild(li);

    var graph_file2 = document.createTextNode(graph_available[i]);
    var option = document.createElement("option");
    option.appendChild(graph_file2);
    select.appendChild(option);
  }
  var element = document.getElementById("color-form");
  element.appendChild(ul);

  $("ul li").addClass(function( index ) {
  return "graph-" + index;
});

});

// Reception of edit messages events
// Lorsqu'on clique sur le bouton d'édition (de off à on), on émet un sig_edit au serveur
element.addEventListener ('click', function () {
  if($('#myonoffswitch').is(':checked')){
    socket.emit('ack_edit', sig_edit);
  }else{
    socket.emit('return', sig_edit);
  }
});

socket.on('already_edit', function(already_edit) {
      $(".alr").text(already_edit);
      $(".alr").fadeIn('fast');
      $(document).ready(function() {
        setTimeout(function() { 
          $('.alr').fadeOut('slow');
        }, 2000);
      });
  already = true;
  $('#myonoffswitch').removeAttr('checked');
  checkBox();
});

// Lorsqu'on reçoit un signal "nobody_edit" on a l'accès
socket.on('nobody_edit', function(nobody_edit) {
      $(".nbd").text(nobody_edit);
      $(".nbd").fadeIn('fast');
      $(document).ready(function() {
        setTimeout(function() { 
          $('.nbd').fadeOut('slow');
        }, 2000);
      });
  already = false;
  $('#myonoffswitch').attr('checked', true);
});

socket.on('can_edit', function(message){
      $(".ced").text(message);
      $(".ced").fadeIn('fast');
      $(document).ready(function() {
        setTimeout(function() { 
          $('.ced').fadeOut('slow');
        }, 2000);
      });
  
  //$('#myonoffswitch').attr('checked', true);

// alert(message)
});

// if check, client can edit else can't
function checkBox(){
 if($('#myonoffswitch').is(':checked'))
  edit = 1;
else
  edit = 0;
}

// Activity timer
function timerActivity(){
 if(activity){
  activity = false;
  console.log('Activité detecté');
 }else{
  console.log('Aucune activité');
  if($('#myonoffswitch').is(':checked')){
    socket.emit('return', sig_edit);
    edit=0;
  }
  $('#myonoffswitch').removeAttr('checked');
 }
 setTimeout('timerActivity();', time);
}

setTimeout('timerActivity();', time);


document.onload = (function(d3, saveAs, Blob, undefined){
"use strict";

var automate = 0;


// define graphcreator object
var GraphCreator = function(svg, nodes, edges, active, init, automate){
  var thisGraph = this;
  thisGraph.idct = 0;


  thisGraph.nodes = nodes || [];
  thisGraph.edges = edges || [];
  thisGraph.active = active;
  thisGraph.init = init;

  thisGraph.state = {
    selectedNode: null,
    selectedEdge: null,
    mouseDownNode: null,
    mouseDownLink: null,
    justDragged: false,
    justScaleTransGraph: false,
    lastKeyDown: -1,
    shiftNodeDrag: false,
    selectedText: null
  };

  // define arrow markers for graph links
  var defs = svg.append('svg:defs');
  defs.append('svg:marker')
  .attr('id', 'end-arrow')
  .attr('viewBox', '0 -5 10 10')
  .attr('refX', "32")
  .attr('markerWidth', 3.5)
  .attr('markerHeight', 3.5)
  .attr('orient', 'auto')
  .append('svg:path')
  .attr('d', 'M0,-5L10,0L0,5');

  // define arrow markers for leading arrow
  defs.append('svg:marker')
  .attr('id', 'mark-end-arrow')
  .attr('viewBox', '0 -5 10 10')
  .attr('refX', 7)
  .attr('markerWidth', 3.5)
  .attr('markerHeight', 3.5)
  .attr('orient', 'auto')
  .append('svg:path')
  .attr('d', 'M0,-5L10,0L0,5');


  thisGraph.svg = svg;
  thisGraph.svgG = svg.append("g")
  .classed(thisGraph.consts.graphClass, true);
  var svgG = thisGraph.svgG;

  // displayed when dragging between nodes
  thisGraph.dragLine = svgG.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0')
  .style('marker-end', 'url(#mark-end-arrow)');

  // svg nodes and edges
  thisGraph.paths = svgG.append("g").selectAll("g");
  thisGraph.circles = svgG.append("g").selectAll("g");

  thisGraph.drag = d3.behavior.drag()
  .origin(function(d){
    return {x: d.x, y: d.y};
  })
  .on("drag", function(args){
    if(edit == 1){
      thisGraph.state.justDragged = true;
      thisGraph.dragmove.call(thisGraph, args);
    }})
  .on("dragend", function() {
          // todo check if edge-mode is selected
        });

  // listen for key events
  d3.select(window).on("keydown", function(){
    if(edit == 1){
      thisGraph.svgKeyDown.call(thisGraph);
    }})
  .on("keyup", function(){
    if(edit == 1){
      thisGraph.svgKeyUp.call(thisGraph);
    }});
  svg.on("mousedown", function(d){ if(edit == 1){thisGraph.svgMouseDown.call(thisGraph, d);}});
  svg.on("mouseup", function(d){if(edit == 1){thisGraph.svgMouseUp.call(thisGraph, d);}});

  // listen for dragging
  var dragSvg = d3.behavior.zoom()
  .on("zoom", function(){
    if (d3.event.sourceEvent.shiftKey){
            // TODO  the internal d3 state is still changing
            return false;
          } else{
            thisGraph.zoomed.call(thisGraph);
          }
          return true;
        })
  .on("zoomstart", function(){
    var ael = d3.select("#" + thisGraph.consts.activeEditId).node();
    if (ael){
      ael.blur();
    }
    if (!d3.event.sourceEvent.shiftKey) d3.select('body').style("cursor", "move");
  })
  .on("zoomend", function(){
    d3.select('body').style("cursor", "auto");
  });

  svg.call(dragSvg).on("dblclick.zoom", null);

  // listen for resize
  window.onresize = function(){thisGraph.updateWindow(svg);};

  // handle download data
  d3.select("#download-input").on("click", function(){
    var saveEdges = [];
    thisGraph.edges.forEach(function(val, i){
      saveEdges.push({source: val.source.id, target: val.target.id, transition: thisGraph.edges[i].transition });   //////// HERE
    });
    var blob = new Blob([window.JSON.stringify({"active": thisGraph.active,"init": thisGraph.init, "nodes": thisGraph.nodes, "edges": saveEdges})], {type: "text/plain;charset=utf-8"});

if(d3.event.ctrlKey){
  saveAs(blob, "mydag.json");
}else{

    $(function () {
        doConfirm("#confirmBox", "Voulez vous créer un nouveau fichier JSON ?", function yes() {
          socket.emit('Graphe_save', {content: blob, new: 'yes' });
        }, function no() {
          socket.emit('Graphe_save', {content: blob, new: 'no' });
        });
    });

}
  });

// Handle Help Button
d3.select("#help").on("click", function() {

  $(function(){
    alert('                                                   [Controls] \n \n \n --> Shift + Click : New Node \n --> Shift + Click + Drag : New Edge \n --> Alt + Click on a Node : Change Name\'s Node \n --> Alt + Click on a Edge : Change Name\'s Edge \n --> Shift + Click on a Node : Self Loop \n --> P : Form/Graphs\'s List \n --> Suppr : Delete a Node/Edge selected \n --> Ctrl + Click on download : Send Current Graph to the Server  \n --> Ctrl + Click on upload : Upload a graph from your computer to the Server');
  });
});

  // download/save on load
  window.onload = function(){
    var saveEdges = [];
    thisGraph.edges.forEach(function(val, i){
      saveEdges.push({source: val.source.id, target: val.target.id, transition: thisGraph.edges[i].transition });   //////// HERE
    });
   var blob = new Blob([window.JSON.stringify({"active": thisGraph.active,"init": thisGraph.init, "nodes": thisGraph.nodes, "edges": saveEdges})], {type: "text/plain;charset=utf-8"});
    socket.emit('Graphe_connect', blob);

  };

  // Save graph every 5 second
  setInterval(function(){
    var saveEdges = [];
    thisGraph.edges.forEach(function(val, i){
      saveEdges.push({source: val.source.id, target: val.target.id, transition: thisGraph.edges[i].transition });   //////// HERE
    });
    var blob = new Blob([window.JSON.stringify({"active": thisGraph.active,"init": thisGraph.init, "nodes": thisGraph.nodes, "edges": saveEdges})], {type: "text/plain;charset=utf-8"});
    if(edit == 1){
      socket.emit('Graphe_five', blob);}}  , 5000);


  // Communication à la sauvegarde
  socket.on('Graphe_five', function(msg){
    if(edit == 0){
      automate = msg;
      console.log(automate);
      automate = JSON.parse(automate);
      console.log(automate.active);

      if(automate != 0){
        thisGraph.deleteGraph(true);
        thisGraph.nodes = automate.nodes;
        thisGraph.setIdCt(automate.nodes.length);
        var newEdges = automate.edges;
        newEdges.forEach(function(e, i){
          newEdges[i] = {source: thisGraph.nodes.filter(function(n){return n.id == e.source;})[0],
          target: thisGraph.nodes.filter(function(n){return n.id == e.target;})[0],
                       transition: newEdges[i].transition};          // Here
                     });
        thisGraph.edges = newEdges;
        thisGraph.init=automate.init;
        thisGraph.active = automate.active;
      }
    }});

  // Communication à la connection
  socket.on('Graphe_connect', function(msg){
    automate = msg;
    console.log(automate);
    automate = JSON.parse(automate);
    console.log(automate.active);

    if(automate != 0){
      thisGraph.deleteGraph(true);
      thisGraph.nodes = automate.nodes;
      thisGraph.setIdCt(automate.nodes.length);
      var newEdges = automate.edges;
      newEdges.forEach(function(e, i){
        newEdges[i] = {source: thisGraph.nodes.filter(function(n){return n.id == e.source;})[0],
        target: thisGraph.nodes.filter(function(n){return n.id == e.target;})[0],
                         transition: newEdges[i].transition};          // Here
                       });
      thisGraph.edges = newEdges;
      thisGraph.init = automate.init;
      thisGraph.active = automate.active;
    }
  });


  // handle uploaded data
   d3.select("#upload-input").on("click", function(){
     if(d3.event.ctrlKey){
       $(function () {
         doConfirmLoad("#uploadGraph", "Quelle fichier voulez-vous charger ?", function load() {
           var file = $("#select_file :selected").text();
           socket.emit('upload_graph', file);
         }, function cancel(){ });
       });
     }else{
       document.getElementById("hidden-file-upload").click();
     }
   });
   d3.select("#hidden-file-upload").on("change", function(){
     if (window.File && window.FileReader && window.FileList && window.Blob) {
       var uploadFile = this.files[0];
       var filereader = new window.FileReader();

       filereader.onload = function(){
         var txtRes = filereader.result;
         // TODO better error handling
         try{
           var jsonObj = JSON.parse(txtRes);
           thisGraph.deleteGraph(true);
           thisGraph.init = jsonObj.init;
           thisGraph.active = jsonObj.active;
           thisGraph.nodes = jsonObj.nodes;
           if( thisGraph.nodes.x == "" || thisGraph.nodes.y == ""){

             var tabnodes = [];
             for (var i = 0; i < thisGraph.nodes.length; i++) {



               if (i==0){
                 thisGraph.nodes[i].x=(Math.floor(Math.random() * 3 ))*width/3+200;
                 thisGraph.nodes[i].y=(Math.floor(Math.random() * 3 ))*height/3+100;
                 tabnodes[2*i]=thisGraph.nodes[i].x;
                 tabnodes[2*i+1]=thisGraph.nodes[i].y;
               }
               else {

                do{

                 var egal = 0;
                 thisGraph.nodes[i].x=(Math.floor(Math.random() * 3 ))*width/3+200;
                 thisGraph.nodes[i].y=(Math.floor(Math.random() * 3 ))*height/3+100;
                 for (var k = 0; k < tabnodes.length/2+2; k++) {
                  if (thisGraph.nodes[i].x == tabnodes[2*k] && thisGraph.nodes[i].y == tabnodes[2*k+1]){
                   egal = 1;
                 }
               }
             }while(egal==1);
             tabnodes[2*i]=thisGraph.nodes[i].x;
             tabnodes[2*i+1]=thisGraph.nodes[i].y;
           }
         };
       }

       thisGraph.setIdCt(jsonObj.nodes.length + 1);
       var newEdges = jsonObj.edges;
       newEdges.forEach(function(e, i){
         newEdges[i] = {source: thisGraph.nodes.filter(function(n){return n.id == e.source;})[0],
         target: thisGraph.nodes.filter(function(n){return n.id == e.target;})[0],
                            transition: newEdges[i].transition};          // Here
                          });
       thisGraph.edges = newEdges;
       thisGraph.updateGraph();

       socket.emit('uploaded', txtRes);
     }catch(err){
       window.alert("Error parsing uploaded file\nerror message: " + err.message);
       return;
     }
   };
   filereader.readAsText(uploadFile);

 } else {
   alert("Your browser won't let you save this graph -- try upgrading your browser to IE 10+ or Chrome or Firefox.");
 }

});

  // handle delete graph
  d3.select("#delete-graph").on("click", function(){
    thisGraph.deleteGraph(false);
  });
};

GraphCreator.prototype.setIdCt = function(idct){
  this.idct = idct;
};

GraphCreator.prototype.consts =  {
  selectedClass: "selected",
  initClass : "init",
  activeClass: "active",
  connectClass: "connect-node",
  circleGClass: "conceptG",
  graphClass: "graph",
  activeEditId: "active-editing",
  BACKSPACE_KEY: 8,
  DELETE_KEY: 46,
  ENTER_KEY: 13,
  nodeRadius: 50
};

/* PROTOTYPE FUNCTIONS */

GraphCreator.prototype.dragmove = function(d) {
  var thisGraph = this;
  if (thisGraph.state.shiftNodeDrag){
    thisGraph.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + d3.mouse(thisGraph.svgG.node())[0] + ',' + d3.mouse(this.svgG.node())[1]);
  } else{
    d.x += d3.event.dx;
    d.y +=  d3.event.dy;
    thisGraph.updateGraph();
  }
};

GraphCreator.prototype.deleteGraph = function(skipPrompt){
  var thisGraph = this,
  doDelete = true;
    var letter="";
    $(".lettrevalid").text(letter);
    $(".motvalid").text(letter);
    var motnonvalid="";
    $(".motnonvalid").text(motnonvalid);
    graph.changeActCol('#00BFFF');
    var badletter = "";
    $(".lettrevalid").text(badletter);
  if (!skipPrompt){
    doDelete = window.confirm("Press OK to delete this graph");
  }
  if(doDelete){
    thisGraph.nodes = [];
    thisGraph.edges = [];
    thisGraph.init = 0;
    thisGraph.active = 0;
    thisGraph.setIdCt(0);
          // remove textpath // SOLUTION PROVISOIRE
    for (var i = 0; i < 50; i++) {
      for(var j = 0; j<50; j++){
          d3.select(".a"+String(i)+""+String(j)+"").remove();
      }
    }
    thisGraph.updateGraph();
  }
};

/* select all text in element: taken from http://stackoverflow.com/questions/6139107/programatically-select-text-in-a-contenteditable-html-element */
GraphCreator.prototype.selectElementContents = function(el) {
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};


/* insert svg line breaks: taken from http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts */
GraphCreator.prototype.insertTitleLinebreaks = function (gEl, title) {
  var words = title.split(/\s+/g),
  nwords = words.length;
  var el = gEl.append("text")
  .attr("class", "text")
  .attr("text-anchor","middle")
  .attr("dy", "-" + (nwords-1)*7.5);

  for (var i = 0; i < words.length; i++) {
    var tspan = el.append('tspan').text(words[i]);
    if (i > 0)
      tspan.attr('x', 0).attr('dy', '15');
  }
};

/* used to modify the transition */
GraphCreator.prototype.insertTrans = function (gEl, d) {
  var el = gEl.append("text")
  .attr("class", "a" +String(d.source.id) + "" + String(d.target.id)+"" )
  .attr("fill", "grey")
  .attr("font-size","30px")
  .attr("dy", -4)
  .append("textPath")
  .attr("startOffset", "36%")
  .attr("xlink:href", "#a"+String(d.source.id)+String(d.target.id)+"")
  .text( d.transition );

};


// remove edges associated with a node
GraphCreator.prototype.spliceLinksForNode = function(node) {
  var thisGraph = this,
  toSplice = thisGraph.edges.filter(function(l) {
    return (l.source === node || l.target === node);
  });
  toSplice.map(function(l) {
    thisGraph.edges.splice(thisGraph.edges.indexOf(l), 1);
  });
};

GraphCreator.prototype.replaceSelectEdge = function(d3Path, edgeData){
  var thisGraph = this;
  d3Path.classed(thisGraph.consts.selectedClass, true);
  if (thisGraph.state.selectedEdge){
    thisGraph.removeSelectFromEdge();
  }
  thisGraph.state.selectedEdge = edgeData;
};

GraphCreator.prototype.replaceSelectNode = function(d3Node, nodeData){
  var thisGraph = this;
  d3Node.classed(this.consts.selectedClass, true);
  if (thisGraph.state.selectedNode){
    thisGraph.removeSelectFromNode();
  }
  thisGraph.state.selectedNode = nodeData;
};

GraphCreator.prototype.removeSelectFromNode = function(){
  var thisGraph = this;
  thisGraph.circles.filter(function(cd){
    return cd.id === thisGraph.state.selectedNode.id;
  }).classed(thisGraph.consts.selectedClass, false);
  thisGraph.state.selectedNode = null;
};

GraphCreator.prototype.removeSelectFromEdge = function(){
  var thisGraph = this;
  thisGraph.paths.filter(function(cd){
    return cd === thisGraph.state.selectedEdge;
  }).classed(thisGraph.consts.selectedClass, false);
  thisGraph.state.selectedEdge = null;
};

GraphCreator.prototype.pathMouseDown = function(d3path, d){
  var thisGraph = this,
  state = thisGraph.state;
  d3.event.stopPropagation();
  state.mouseDownLink = d;

  if (state.selectedNode){
    thisGraph.removeSelectFromNode();
  }

  var prevEdge = state.selectedEdge;
  if (!prevEdge || prevEdge !== d){
    thisGraph.replaceSelectEdge(d3path, d);
  } else{
    thisGraph.removeSelectFromEdge();
  }
};

// mousedown on node
GraphCreator.prototype.circleMouseDown = function(d3node, d){
  var thisGraph = this,
  state = thisGraph.state;
  d3.event.stopPropagation();
  state.mouseDownNode = d;
  if (d3.event.shiftKey){
    state.shiftNodeDrag = d3.event.shiftKey;
    // reposition dragged directed edge
    thisGraph.dragLine.classed('hidden', false)
    .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
    return;
  }
};

// useful ??
GraphCreator.prototype.textMouseDown = function(d3text, d){
  var thisGraph = this,
  state = thisGraph.state;
  d3.event.stopPropagation();
  state.mouseDownNode = d;
};

/* place editable text on node in place of svg text */
GraphCreator.prototype.changeTextOfNode = function(d3node, d){
  var thisGraph= this,
  consts = thisGraph.consts,
  htmlEl = d3node.node();
  d3node.selectAll("text").remove();
  var nodeBCR = htmlEl.getBoundingClientRect(),
  curScale = nodeBCR.width/consts.nodeRadius,
  placePad  =  5*curScale,
  useHW = curScale > 1 ? nodeBCR.width*0.71 : consts.nodeRadius*1.42;
  // replace with editableconent text
  var d3txt = thisGraph.svg.selectAll("foreignObject")
  .data([d])
  .enter()
  .append("foreignObject")
  .attr("x", nodeBCR.left + placePad )
  .attr("y", nodeBCR.top + placePad)
  .attr("height", 2*useHW)
  .attr("width", useHW)
  .append("xhtml:p")
  .attr("id", consts.activeEditId)
  .attr("contentEditable", "true")
  .text(d.title)
  .on("mousedown", function(d){
    d3.event.stopPropagation();
  })
  .on("keydown", function(d){
    d3.event.stopPropagation();
    if (d3.event.keyCode == consts.ENTER_KEY && !d3.event.shiftKey){
      this.blur();
    }
  })
  .on("blur", function(d){
    d.title = this.textContent;
    thisGraph.insertTitleLinebreaks(d3node, d.title);
    d3.select(this.parentElement).remove();
  });
  return d3txt;
};

// change text of transition
// only once. Why ?
GraphCreator.prototype.changeTextOfTextPath = function(d3node, d){
  var thisGraph= this,
  consts = thisGraph.consts,
  htmlEl = d3node.node();
  d3node.select(".a"+String(d.source.id)+""+String(d.target.id)+"").remove();
  var nodeBCR = htmlEl.getBoundingClientRect(),
  curScale = nodeBCR.width/consts.nodeRadius,
  placePad  =  5*curScale;
  /* useHW = curScale > 1 ? nodeBCR.width*0.71 : consts.nodeRadius*1.42;*/
  // replace with editableconent text
  var d3txt = thisGraph.svg.selectAll("foreignObject")
  .data([d])
  .enter()
  .append("foreignObject")
  .attr("x", nodeBCR.left + 50 /*- (nodeBCR.right-nodeBCR.left)/2 */ )
  .attr("y", nodeBCR.bottom - 50 /*-(nodeBCR.bottom - nodeBCR.top)/2*/ )
  .attr("height", 4*nodeBCR.height /*2*useHW*/)
  .attr("width", 4*nodeBCR.width/*useHW*/)
  .append("xhtml:p")
  .attr("id", consts.activeEditId)
  .attr("contentEditable", "true")
  .text(d.transition)
  .on("mousedown", function(d){
    d3.event.stopPropagation();
  })
  .on("keydown", function(d){
    d3.event.stopPropagation();
    if (d3.event.keyCode == consts.ENTER_KEY && !d3.event.altKey){
      this.blur();
    }
  })
  .on("blur", function(d){
    d.transition = this.textContent;
    thisGraph.insertTrans(d3node, d);
    d3.select(this.parentElement).remove();
  });
  return d3txt;
};

// mouseup on nodes
GraphCreator.prototype.circleMouseUp = function(d3node, d){
  var thisGraph = this,
  state = thisGraph.state,
  consts = thisGraph.consts;
  // reset the states
  state.shiftNodeDrag = false;
  d3node.classed(consts.connectClass, false);

  var mouseDownNode = state.mouseDownNode;

  if (!mouseDownNode) return;

  thisGraph.dragLine.classed("hidden", true);

  if (mouseDownNode !== d){
    // we're in a different node: create new edge for mousedown edge and add to graph
    var newEdge = {source: mouseDownNode, target: d, transition: " NT --->"};         //////   VOIR ICI
    var filtRes = thisGraph.paths.filter(function(d){
      return d.source === newEdge.source && d.target === newEdge.target;
    });
    if (!filtRes[0].length){
      thisGraph.edges.push(newEdge);
      thisGraph.updateGraph();
    }
  } else{
    // we're in the same node
    if (state.justDragged) {
      // dragged, not clicked
      state.justDragged = false;
    } else{
      // clicked, not dragged
      if (d3.event.altKey){
        // shift-clicked node: edit text content
        var d3txt = thisGraph.changeTextOfNode(d3node, d);
        var txtNode = d3txt.node();
        thisGraph.selectElementContents(txtNode);
        txtNode.focus();
      }else if(d3.event.shiftKey){
          var newEdge = {source: mouseDownNode, target: mouseDownNode, transition: " NT --->"};         //////   VOIR ICI
          var filtRes = thisGraph.paths.filter(function(d){
            return d.source === newEdge.source && d.target === newEdge.target;
          });
          if (!filtRes[0].length){
            thisGraph.edges.push(newEdge);
            thisGraph.updateGraph();
            thisGraph.updateGraph();
          }
          }else if(d3.event.ctrlKey){
        
        thisGraph.changeInitNode(d.id);
        
        

        thisGraph.updateGraph();
        } 

        else{
          if (state.selectedEdge){
            thisGraph.removeSelectFromEdge();
          }
          var prevNode = state.selectedNode;

          if (!prevNode || prevNode.id !== d.id){
            thisGraph.replaceSelectNode(d3node, d);
          } else{
            thisGraph.removeSelectFromNode();
          }
        }
      }
    }
    state.mouseDownNode = null;
    return;

}; // end of circles mouseup

GraphCreator.prototype.textMouseUp = function(d3node, d){
  var thisGraph = this,
  state = thisGraph.state,
  consts = thisGraph.consts;


  //if (d3.event.altKey){
        // shift-clicked node: edit text content
        var d3txt = thisGraph.changeTextOfTextPath(d3node, d);
        var txtNode = d3txt.node();
        thisGraph.selectElementContents(txtNode);
        txtNode.focus();
      //}

      return;

}; // end of text mouseup  //////////////////////  NOT WORKING

// mousedown on main svg
GraphCreator.prototype.svgMouseDown = function(){
  this.state.graphMouseDown = true;
};

  // mousedown on main svg
  GraphCreator.prototype.changeActiveNode = function(active){
    var thisGraph = this;

    thisGraph.active = active;

/*    switch(thisGraph.active){
    case 0: thisGraph.active = 1;
    break;
    case 1: thisGraph.active = 0;
    break;
  } */
  console.log("new node active")
  thisGraph.updateGraph();
};

GraphCreator.prototype.changeInitNode = function(init){
    var thisGraph = this;

    thisGraph.init = init;


  thisGraph.updateGraph();
};

// mouseup on main svg
GraphCreator.prototype.svgMouseUp = function(){
  var thisGraph = this,
  state = thisGraph.state;
  if (state.justScaleTransGraph) {
    // dragged not clicked
    state.justScaleTransGraph = false;
  } else if (state.graphMouseDown && d3.event.shiftKey){
    // clicked not dragged from svg
    var xycoords = d3.mouse(thisGraph.svgG.node()),
    d = {id: thisGraph.idct++, title: "new concept", x: xycoords[0], y: xycoords[1]};
    thisGraph.nodes.push(d);
    thisGraph.updateGraph();
    // make title of text immediently editable
    var d3txt = thisGraph.changeTextOfNode(thisGraph.circles.filter(function(dval){
      return dval.id === d.id;
    }), d),
    txtNode = d3txt.node();
    thisGraph.selectElementContents(txtNode);
    txtNode.focus();
  } else if (state.shiftNodeDrag){
    // dragged from node
    state.shiftNodeDrag = false;
    thisGraph.dragLine.classed("hidden", true);
  }
  state.graphMouseDown = false;
};

// keydown on main svg
GraphCreator.prototype.svgKeyDown = function() {
  var thisGraph = this,
  state = thisGraph.state,
  consts = thisGraph.consts;
  // make sure repeated key presses don't register for each keydown
  if(state.lastKeyDown !== -1) return;

  state.lastKeyDown = d3.event.keyCode;
  var selectedNode = state.selectedNode,
  selectedEdge = state.selectedEdge;

  switch(d3.event.keyCode) {
    case consts.BACKSPACE_KEY:
    case consts.DELETE_KEY:
    d3.event.preventDefault();
    if (selectedNode){
      thisGraph.nodes.splice(thisGraph.nodes.indexOf(selectedNode), 1);
      thisGraph.spliceLinksForNode(selectedNode);
      state.selectedNode = null;
      thisGraph.updateGraph();
      thisGraph.updateGraph(); // remove transition
    } else if (selectedEdge){
      thisGraph.edges.splice(thisGraph.edges.indexOf(selectedEdge), 1);
      state.selectedEdge = null;
      thisGraph.updateGraph();
      thisGraph.updateGraph();  // remove transition
    }
    break;
  }
};

GraphCreator.prototype.svgKeyUp = function() {
  this.state.lastKeyDown = -1;
};

// call to propagate changes to graph
GraphCreator.prototype.updateGraph = function(){

  var thisGraph = this,
  consts = thisGraph.consts,
  state = thisGraph.state;

  thisGraph.paths = thisGraph.paths.data(thisGraph.edges /*, function(d){        ////
    return String(d.source.id) + "+" + String(d.target.id);
  } */ );

  var paths = thisGraph.paths;

  // update existing paths
  paths.style('marker-end', 'url(#end-arrow)')
  .classed(consts.selectedClass, function(d){
    return d === state.selectedEdge;
  })
  .attr("d", function(d){
      if ( d.source.x === d.target.x && d.source.y === d.target.y ) {   // SELF-LOOP
       var dx = d.source.x - d.target.x ,
       dy = d.source.y - d.target.y,
       dr=10,
       a = Math.atan2(dx,dy),
       da = 0.4,
       b = 10;
       return "M" + d.target.x + "," + d.target.y + "q" + b*dr*Math.sin(a) + "," + (b*dr*Math.cos(a) + 15) + " " +
       (b*dr*Math.sin(a+da) + 15) + "," + (b*dr*Math.cos(a+da)- 5) + " " +  " T " + (d.target.x) + "," + (d.target.y );
      }else{                                                              // TRANSITION
        return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
      }
    });

  //// add new paths
  var pathss = paths.enter();

  // transition
  var textPath = pathss.append("text")
  .attr("class", function(d){ return  "a" +String(d.source.id) + "" + String(d.target.id) } )
  .attr("x", 0)
  .attr("y", 0)
  .attr("fill", "grey")
  .attr("dy", -4)
  .on("mousedown", function(d){if(edit == 1){thisGraph.textMouseDown.call(thisGraph, d3.select(this), d);}})
  .on("mouseup", function(d){ if(edit == 1){thisGraph.textMouseUp.call(thisGraph,d3.select(this.parentNode), d) }} )
  .append("textPath")
  .attr("startOffset", "36%")
  .attr("xlink:href", function(d){ return "#a" + String(d.source.id) + "" + String(d.target.id) });

    // path
    var pathsss = pathss.append("path")
    .attr("id", function(d){ return "a"+String(d.source.id) + "" + String(d.target.id)})
    .style('marker-end','url(#end-arrow)')
    .classed("link", true)
    .attr("d", function(d){
      if ( d.source.x === d.target.x && d.source.y === d.target.y ) {     //SELF LOOP
        var dx = d.source.x - d.target.x,
        dy = d.source.y - d.target.y,
        dr=10,
        dr = Math.sqrt(dx * dx + dy * dy),
        a = Math.atan2(dx,dy),
        da = 0.4,
        b = 10;
        return "M" + d.target.x + "," + d.target.y + "q" + b*dr*Math.sin(a) + "," + (b*dr*Math.cos(a) + 15) + " " +
        (b*dr*Math.sin(a+da) + 15) + "," + (b*dr*Math.cos(a+da)- 5) + " " +  " T " + d.target.x + "," + d.target.y;
     }else {   // NORMAL TRANSITION
      return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;}
    })
    .on("mousedown", function(d){ if(edit == 1){thisGraph.pathMouseDown.call(thisGraph, d3.select(this), d);}} )
    .on("mouseup", function(d){ if(edit == 1){state.mouseDownLink = null; }});

    // Write the transition on top of the arrow
    textPath.text(function(d){ return d.transition  });

    // remove textpath
    for (var i = 0; i < 10; i++) {
      for(var j = 0; j<10; j++){
        if(d3.select("#a"+String(i)+""+String(j)+"").empty()){
          d3.select(".a"+String(i)+""+String(j)+"").remove();
        }
      }
    }


  // remove old links
  paths.exit().remove();

  // update existing nodes
  thisGraph.circles = thisGraph.circles.data(thisGraph.nodes, function(d){ return d.id;});
  thisGraph.circles.attr("transform", function(d){return "translate(" + d.x + "," + d.y + ")";})
  .classed(consts.initClass, function(d){
    if( d.id == thisGraph.init){
      return true;
    }else {
      return false;}
    })
  .classed(consts.activeClass, function(d){
    if( d.id == thisGraph.active){
      return true;
    }else {
      return false;}
    });

      // Change radius and adjust arrow (not perfect)
      d3.selectAll("circle").attr("r", String(consts.nodeRadius));
      d3.selectAll("#end-arrow").attr("refX", consts.nodeRadius / 1.6);


  // add new nodes
  var newGs= thisGraph.circles.enter()
  .append("g");

  newGs.classed(consts.circleGClass, true)
  .attr("id", function(d){ return "id"+ String(d.id)})
   .classed(consts.initClass, function(d){
    if( d.id == thisGraph.init){
      return true;
    }else {
      return false;
    }
  })
  .classed(consts.activeClass, function(d){
    if( d.id == thisGraph.active){
      return true;
    }else {
      return false;
    }
  })
  .attr("transform", function(d){return "translate(" + d.x + "," + d.y + ")";})
  .on("mouseover", function(d){
    if(edit == 1){
      if (state.shiftNodeDrag){
        d3.select(this).classed(consts.connectClass, true);
      }
    }})
  .on("mouseout", function(d){
    if(edit == 1){
      d3.select(this).classed(consts.connectClass, false);
    }})
  .on("mousedown", function(d){
    if(edit == 1){
      thisGraph.circleMouseDown.call(thisGraph, d3.select(this), d);
    }})
  .on("mouseup", function(d){
    if(edit == 1){
      thisGraph.circleMouseUp.call(thisGraph, d3.select(this), d);
    }})
  .call(thisGraph.drag);

  newGs.append("circle")
  .attr("r", String(consts.nodeRadius));

  newGs.each(function(d){
    thisGraph.insertTitleLinebreaks(d3.select(this), d.title);
  });


  // remove old nodes
  thisGraph.circles.exit().remove();

};

GraphCreator.prototype.zoomed = function(){
  this.state.justScaleTransGraph = true;
  d3.select("." + this.consts.graphClass)
  .attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
};

GraphCreator.prototype.updateWindow = function(svg){
  var docEl = document.documentElement,
  bodyEl = document.getElementsByTagName('body')[0];
  var x = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth;
  var y = window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;
  svg.attr("width", x).attr("height", y);
};

// Change values in CSS
GraphCreator.prototype.changeIt = function (activecolor, nodecolor, transcolor, noderadius) {
  var thisGraph = this,
  consts = thisGraph.consts;

  if (!document.styleSheets) return;
  var theRules = new Array();
  if (document.styleSheets[0].cssRules)
    theRules = document.styleSheets[0].cssRules
  else if (document.styleSheets[0].rules)
    theRules = document.styleSheets[0].rules
  else return;
  theRules[theRules.length-3].style.stroke = transcolor;
  theRules[theRules.length-2].style.fill = nodecolor;
  theRules[theRules.length-1].style.fill = activecolor;
  consts.nodeRadius = noderadius;
}

  GraphCreator.prototype.changeActCol = function (activecolor) {
    var thisGraph = this,
    consts = thisGraph.consts;

    if (!document.styleSheets) return;
    var theRules = new Array();
    if (document.styleSheets[0].cssRules)
      theRules = document.styleSheets[0].cssRules
    else if (document.styleSheets[0].rules)
      theRules = document.styleSheets[0].rules
    else return;
    theRules[theRules.length-1].style.fill = activecolor;
  }
/**** MAIN ****/

// warn the user when leaving
window.onbeforeunload = function(){
  return "Make sure to save your graph locally before leaving :-)";
};

var docEl = document.documentElement,
bodyEl = document.getElementsByTagName('body')[0];

var width = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth,
height =  window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;

var xLoc = width/2 - 25,
yLoc = 100;


// initial node data
if(automate == 0){
  var init =0;
  var active = init;

  var nodes = [{title: "0", id: 0, x: xLoc, y: yLoc},
  {title: "1", id: 1, x: xLoc, y: yLoc + 200}];
  var edges = [{source: nodes[0], target: nodes[1], transition: "NO"}];    ////// VOIR ICI
}

/** MAIN SVG **/
var svg = d3.select("body").append("svg")
.attr("width", width)
.attr("height", height);
var graph = new GraphCreator(svg, nodes, edges, active, init, automate);
graph.setIdCt(2);

graph.updateGraph();

d3.timer( function(){graph.updateGraph()});
// socket.on( 'changeActive' , function(msg){
//   graph.changeActiveNode(msg);
//   console.log('active = ' + msg);
// });


// jQuery for the color form
$(document).ready(function(){

  document.getElementById('choices').onclick = function(){
    graph.changeIt($('#activeColor').val(), $('#nodeColor').val(), $('#transColor').val(), $('#nodeRadius').val());
    $("#color-form").css('display', 'none');
  }

  // Hide or show the form with the key P
  // $(document).keyup(function(touche){
  //   var appui = touche.which || touche.keyCode;
  //   if(appui == 80){ // si le code de la touche est égal à 80 (P)
  //     if( $("#color-form").css('display') != 'none'){
  //       $("#color-form").css('display', 'none');
  //     }else {
  //       $("#color-form").css('display', 'block');
  //     }
  //   }

  // });
});

  //submit test Word
  document.getElementById('wordchoice').onclick = function(){
    
    socket.emit('get_graph', graph);
    socket.on('get_graph', function(graph_received){

    current_graph = JSON.parse(String(graph_received));
    graph.changeActiveNode(current_graph.init);
    });
    var testWord = document.getElementById("testWord").value; 
    $(".lettrevalid").css('color','#00BFFF');
    $(".motvalid").text(testWord);
    socket.emit('sendWord',testWord);
    // graph.changeActiveNode(0);
    var letter="";
    $(".lettrevalid").empty();
    var motnonvalid="";
    $(".motnonvalid").empty();
    graph.changeActCol('#00BFFF');
    var badletter = "";
    
    

  }

  socket.on('messagelong', function(message) {
    alert(message);
  });

  socket.on('messageError', function(message) {
    
    $(".msgBox").text(message);
    $(".msgBox").fadeIn('fast');
    $(document).ready(function() {
      setTimeout(function() {
        $('.msgBox').fadeOut('slow');

      }, 2000);


  // var tmpWord="";
  // $(".motvalid").text(tmpWord);
    });
  });

  socket.on('activenodes', function(activenodes) {


   // Play automaton behavior
   var play = false;
   var i=1;
   var testWord = document.getElementById("testWord").value; 
   var tmpWord = testWord;
   var letter="";
   var badletter="";

   $(document).ready(function() {
    var icon = $('.play');
    icon.click(function() {
      if(activenodes.length-1==testWord.length){
        if(i<testWord.length+1){
          graph.changeActiveNode(activenodes[i]);

          tmpWord=tmpWord.substring(1,tmpWord.length);
          $(".motvalid").text(tmpWord);
          letter=testWord.substring(0,i);
          $(".lettrevalid").text(letter);
          i++;
          if(i==testWord.length+1){

      //graph.changeIt($('#32CD32'), $('#000000'), $('#000000'), 50);
      letter=testWord;
      $(".lettrevalid").css('color','#32CD32');
      $(".lettrevalid").text(letter);
      $(".motnonvalid").empty();
      graph.changeActCol('#32CD32');
      
    }
  }
}
else {
    console.log(i);
    console.log(activenodes.length);
  if(i<activenodes.length+1){
    graph.changeActiveNode(activenodes[i]);
      
    if(i<activenodes.length){
    tmpWord=tmpWord.substring(1,tmpWord.length);
    $(".motvalid").text(tmpWord);
    letter=testWord.substring(0,i);
    $(".lettrevalid").text(letter);
} 
  
    else {
      graph.changeActiveNode(activenodes[i-1]);
    
    tmpWord=tmpWord.substring(1,tmpWord.length);
    $(".motvalid").text(tmpWord);
    badletter=testWord.substring(i-1,i);
    $(".motnonvalid").text(badletter);
    $(".lettrevalid").text(letter);
    //i++;
      graph.changeActCol('#FF0000');
    }
    i++;
  }
}
  //    icon.toggleClass('active');
  //    if(play == false){
  //     play = true;
  //     socket.emit('play', play);
  //    }else if (play == true) {
  //     play = false;
  //     socket.emit('play', play);
  //   }
     // return false;
   });
});
});

})(window.d3, window.saveAs, window.Blob);
