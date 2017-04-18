
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import Agent from './agent'

var grid;
var scene;
var ownedMarkerPoints;

function Marker(x,y,z){
  this.position = new THREE.Vector3(x,y,z);
  this.isOwned = false;
}

function Grid(size){
 this.size = size;
 this.position = new THREE.Vector3(this.size/2.0, 0.0, this.size/2.0);
 this.cells = [];
 this.agents = [];

 //1. create grid of size x size of cells
 //assuming each cell is 1x1
 for (var r = 0; r < this.size; r++){
    for (var c = 0; c < this.size; c++){
      var cell = new Cell();
      cell.position = new THREE.Vector3(0.5 + c,0.0,0.5 + r);
      this.cells.push(cell);
    }
 }

 //2. sprinkle markers
 //sprinkles markers randomly throughout cell
 //adds them to marker array, does not render them in scene
 this.sprinkleMarkers = function(cell, count){
  var maxX = cell.position.x + 1.0/2.0;
  var minX = cell.position.x - 1.0/2.0;
  var maxZ = cell.position.z + 1.0/2.0;
  var minZ = cell.position.z - 1.0/2.0;

  for (var i = 0; i < count; i++){
    var randX = Math.random()*(maxX-minX)+minX;
    var randZ = Math.random()*(maxZ-minZ)+minZ;
    var marker = new Marker(randX, 0.0, randZ);
    cell.markers.push(marker);
  }
  
 };

 //sprinkle 50 markers in each cell
 for (var c = 0; c < this.cells.length; c++){
  this.sprinkleMarkers(this.cells[c], 100);
 }


 //returns the cell that this position
 this.getCellAtPos = function(pos){
  
  var index = (Math.floor(pos.x) + 
    this.size * Math.floor(pos.z));
  
  return this.cells[index];
 
 };

 //return the closest four cells
 this.getClosestCells = function(cell){

  var closeCells = [cell];

  //get the cells at adjacent positions
  var topPos = cell.position.clone();
  topPos.z += 1.0;
  var topCell = this.getCellAtPos(topPos);
  if(topCell)
    closeCells.push(topCell);

  var topLeftPos = cell.position.clone();
  topLeftPos.z += 1.0;
  topLeftPos.z -= 1.0;
  var topLeftCell = this.getCellAtPos(topLeftPos);
  if (topLeftCell)
    closeCells.push(topCell);

  var topRightPos = cell.position.clone();
  topRightPos.z += 1.0;
  topRightPos.z += 1.0;
  var topRightCell = this.getCellAtPos(topRightPos);
  if (topRightCell)
    closeCells.push(topRightCell);

  var botPos = cell.position.clone();
  botPos.z -= 1.0;
  var botCell = this.getCellAtPos(botPos);
  if(botCell)
    closeCells.push(botCell);

  var botLeftPos = cell.position.clone();
  botLeftPos.z -= 1.0;
  botLeftPos.z -= 1.0;
  var botLeftCell = this.getCellAtPos(botLeftPos);
  if (botLeftCell)
    closeCells.push(botLeftCell);

  var botRightPos = cell.position.clone();
  botRightPos.z -= 1.0;
  botRightPos.z += 1.0;
  var botRightCell = this.getCellAtPos(botRightPos);
  if (botRightCell)
    closeCells.push(botRightCell);

  var leftPos = cell.position.clone();
  leftPos.x -= 1.0;
  var leftCell = this.getCellAtPos(leftPos);
  if(leftCell)
    closeCells.push(leftCell);

  var rightPos = cell.position.clone();
  rightPos.x += 1.0;
  var rightCell = this.getCellAtPos(rightPos);
  if(rightCell)
    closeCells.push(rightCell);

  return closeCells;
 };

 //returns the closest agent to this marker
 //only looks at agents in adjacent cells
 this.getClosestAgent = function(marker){
  var closestAgent;
  var closestAgentDist = Infinity;
  var maxRadius = 1.0; //max dist from agent/marker

  for (var i = 0; i < grid.agents.length; i++){
      var currAgent = grid.agents[i];
      var currAgentDist = marker.position.distanceTo(currAgent.position);
      if(currAgentDist < maxRadius && currAgentDist < closestAgentDist){
        closestAgent = currAgent;
        closestAgentDist = currAgentDist;
      }
  }

  return closestAgent;

 };

 this.clearAgents = function(){

  scene.children.forEach(function(object){
    if (object.geometry.type == "ConeGeometry"){
      scene.remove(object);
    }
  });

 }

 //frees ownership of markers
 this.freeMarkers = function(){
  for (var c = 0; c < this.cells.length; c++){
    for (var m = 0; m < this.cells[c].markers.length; m++ ){
      this.cells[c].markers[m].isOwned = false;
    }
  }
 }

}

function Cell(){
  this.position = new THREE.Vector3(0.0,0.0,0.0);
  this.markers = [];
}

// called after the scene loads
function onLoad(framework) {
  scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;
  var stats = framework.stats;

  // set camera position
  camera.position.set(1, 1, 2);
  camera.lookAt(new THREE.Vector3(0,0,0));

  // edit params and listen to changes like this
  // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });

  var adamMaterial = new THREE.ShaderMaterial({
    uniforms: {
      image: { // Check the Three.JS documentation for the different allowed types and values
        type: "t", 
        value: THREE.ImageUtils.loadTexture('./adam.jpg')
      }
    },
    vertexShader: require('./shaders/adam-vert.glsl'),
    fragmentShader: require('./shaders/adam-frag.glsl')
  });

  //set up grid
  grid = new Grid(5);
  var planeGeometry = new THREE.PlaneGeometry(grid.size,grid.size);
  var planeMat = new THREE.MeshBasicMaterial({color:0x2F4F4F });
  var plane = new THREE.Mesh(planeGeometry, planeMat);
  plane.position.set(grid.size/2.0, 0.0, grid.size/2.0);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  //debug the grid
  var cellGeo = new THREE.Geometry();
  var cellPointMat =  new THREE.PointsMaterial( { color: 0x00FFFF } );
  cellPointMat.sizeAttenuation = false;
  cellPointMat.size = 5.0;
  for (var i = 0; i < grid.cells.length; i++){
    cellGeo.vertices.push(grid.cells[i].position);
  }
  var cellPoints =  new THREE.Points( cellGeo, cellPointMat );
  scene.add(cellPoints);

  //debug the markers
  var markersGeo = new THREE.Geometry();
  var markersMat =  new THREE.PointsMaterial( { color: 0xFFA500 } );
  markersMat.sizeAttenuation = false;
  markersMat.size = 2.0;
  for (var c = 0; c < grid.cells.length; c++){
    for (var i = 0; i < grid.cells[c].markers.length; i++){
      markersGeo.vertices.push(grid.cells[c].markers[i].position);
    }
  }
  var markerPoints =  new THREE.Points( markersGeo, markersMat );
  scene.add(markerPoints);
  
  var ownedMarkersGeo = new THREE.Geometry();
  ownedMarkersGeo.verticesNeedUpdate = true;
  var ownedMarkersMat = new THREE.PointsMaterial( { color: 0x00FF00 } );
  ownedMarkersMat.sizeAttenuation = false;
  ownedMarkersMat.size = 5.0;
  ownedMarkerPoints = new THREE.Points(ownedMarkersGeo, ownedMarkersMat);
  scene.add(ownedMarkerPoints);

  //handle different scenarios
  var scenarios = function(){
    
    this.scenario1 = function(){
      console.log("scenario1");
      grid.clearAgents();
      grid.freeMarkers();
      
      var agent1 = new Agent();
      agent1.goal = new THREE.Vector3(2.5,0.0,4.5);
      grid.agents.push(agent1);
      scene.add(agent1.mesh);

      var agent2 = new Agent();
      agent2.position = new THREE.Vector3(4.5,0.0,4.0);
      agent2.goal = new THREE.Vector3(2.5,0.0,4.5);
      grid.agents.push(agent2);
      scene.add(agent2.mesh);


    };
    
    this.scenario2 = function(){
      console.log("scenario2");
    };

  };
  var myScenarios = new scenarios();
  gui.add(myScenarios, 'scenario1');
  //////////////////////////////////

}

// called on frame updates
function onUpdate(framework) {
  
  if(grid){
    
    //1. assign each marker to an agent
    //garuntees no two agents own the same marker
    for(var a = 0; a < grid.agents.length; a++){
      
      var agent = grid.agents[a];
      //look at the cell each agent occupies
      var agentCell = grid.getCellAtPos(agent.position);

      //for loop for adjcent cells 
      var adjacentCells = grid.getClosestCells(agentCell);
      for (var c = 0; c < adjacentCells.length; c++){
             //look at each marker in each of those cells
        var currCell = adjacentCells[c];
        if (currCell){

          for(var m = 0; m < currCell.markers.length; m++){
          
          var marker = currCell.markers[m];
          var closestAgent = grid.getClosestAgent(marker);
          //only give the marker to the agent if it's not owned
          if(closestAgent && !marker.isOwned){
            closestAgent.markers.push(marker);
            marker.isOwned = true;
            ownedMarkerPoints.geometry.verticesNeedUpdate = true;
            ownedMarkerPoints.geometry.elementsNeedUpdate = true;
            ownedMarkerPoints.geometry.vertices.push(marker.position);
          }
          // }else if (marker.isOwned){
          //   console.log("owned");
          // }
        
        }
      }else{
        // console.log(agent.position);
      }
    }
 

      //2. update each agent 
      //(position etc based on markers/goal)

      agent.update();
    }

    grid.freeMarkers();

  }


}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);