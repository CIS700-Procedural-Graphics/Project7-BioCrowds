const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import Marker from './marker'
import {AGENT_HEIGHT, Agent} from './agent'

var sceneLoader = {};
var planeMesh;
var planeScale = 40;

// Uniform grid for acceleration
var grid = new Array();
// initialize the grid to be a 2d array
for(var i = 0; i < planeScale + 4; i++) {
  grid.push(new Array());
  for(var j = 0; j < planeScale + 4; j++) { //each 2d array index must contain a set of markers
    grid[i][j] = new Array();
  }
}

var sceneMarkers = new Array();
var sceneAgents = new Array();

// Timekeeping
var clock = new THREE.Clock();

// called after the scene loads
function onLoad(framework) {
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;
  var stats = framework.stats;

  // Initialize a simple box and material
  var light = new THREE.DirectionalLight( 0xffffff, 10 );
  light.color.setHSL(0.1, 1, 0.95);
  light.position.set(1 * 20, 10 * 20, 2 * 20);
  scene.add(light);
  
  // Add the ground plane
  var planeGeometry = new THREE.PlaneGeometry(1, 1);
  var planeMaterial = new THREE.MeshBasicMaterial( {color: 0x778899, side: THREE.DoubleSide} );
  planeMesh = new THREE.Mesh( planeGeometry, planeMaterial );
  planeMesh.rotateX(90 * Math.PI / 180);
  planeMesh.scale.x = planeScale;
  planeMesh.scale.y = planeScale;
  scene.add(planeMesh);
  
  // Place and add the markers to the scene using stratified sampling
  var startPos = new THREE.Vector3(planeMesh.position.x, planeMesh.position.y, planeMesh.position.z);
  startPos.x -= planeScale / 2 + 0.5;
  startPos.z -= planeScale / 2 + 0.5;
  
  var endPos = new THREE.Vector3(planeMesh.position.x, planeMesh.position.y, planeMesh.position.z);
  endPos.x += planeScale / 2;
  endPos.z += planeScale / 2;
  
  var maxDist = endPos.length();
  
  for(var i = startPos.x; i < endPos.x; i += 0.75) {
    for(var j = startPos.z; j < endPos.z; j += 0.75) {
      //var markerColor = lerpColor(new THREE.Color(0xCCCCFF), new THREE.Color(0x00FF00), (new THREE.Vector3(i, planeMesh.position.y, j)).length() / maxDist);
      var pos = new THREE.Vector3(i + Math.random(), planeMesh.position.y, j + Math.random());
      var currentMarker = new Marker(pos, 0xff0000);
      
      var xIndex = Math.ceil(pos.x) + planeScale / 2;
      var yIndex = Math.ceil(pos.z) + planeScale / 2;
      
      grid[xIndex][yIndex].push(currentMarker);
      
      sceneMarkers.push(currentMarker);
      scene.add(currentMarker.mesh);
    }
  }
  
  sceneLoader.framework = framework;
  sceneLoader.startPos = startPos;
  sceneLoader.endPos = endPos;
  
  sceneLoader.loadScene2(framework, startPos, endPos);
  
  // set camera position
  camera.position.set(10, 24, 36);
  camera.lookAt(new THREE.Vector3(0,0,0));
    
  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });
  
  gui.add(sceneLoader, 'loadScene1');
  gui.add(sceneLoader, 'loadScene2');
  
}

sceneLoader.loadScene1 = function() {
  clearScene(this.framework);
  
  // Add the agents to the scene (one in a circular fashion and the other along the edges of the plane) (need two scenarios)
  for(var i = this.startPos.x; i < this.endPos.x; i += 5) {
    var startPos1 = new THREE.Vector3(i, planeMesh.position.y + AGENT_HEIGHT / 2, this.endPos.z);
    var goalPos1 = new THREE.Vector3(i, planeMesh.position.y, -this.endPos.z); // leave the goal position in the plane (to be aligned with the markers)
    var currentAgent1 = new Agent(startPos1, goalPos1, new THREE.Color( Math.random(), Math.random(), Math.random() ));
    
    var startPos2 = new THREE.Vector3(i, planeMesh.position.y + AGENT_HEIGHT / 2, -this.endPos.z);
    var goalPos2 = new THREE.Vector3(i, planeMesh.position.y, this.endPos.z); // leave the goal position in the plane (to be aligned with the markers)
    var currentAgent2 = new Agent(startPos2, goalPos2, new THREE.Color( Math.random(), Math.random(), Math.random() ));
    
    sceneAgents.push(currentAgent1);
    sceneAgents.push(currentAgent2);
    this.framework.scene.add(currentAgent1.mesh);
    this.framework.scene.add(currentAgent2.mesh);
  }
}

sceneLoader.loadScene2 = function() {
  clearScene(this.framework);
  
  var radius = 10;
  var incr = Math.PI / 6;
  for(var theta = 0; theta < Math.PI - incr; theta += incr) {
    var posX = Math.cos(theta) * radius;
    var posY = Math.sin(theta) * radius;
    
    var pos1 = new THREE.Vector3(posX, planeMesh.position.y + AGENT_HEIGHT / 2, posY);
    var goalPos1 = new THREE.Vector3(-posX, planeMesh.position.y, -posY);
    var currentAgent1 = new Agent(pos1, goalPos1, new THREE.Color( Math.random(), Math.random(), Math.random() ));
    
    var pos2 = new THREE.Vector3(-posX, planeMesh.position.y + AGENT_HEIGHT / 2, -posY);
    var goalPos2 = new THREE.Vector3(posX, planeMesh.position.y, posY);
    var currentAgent2 = new Agent(pos2, goalPos2, new THREE.Color( Math.random(), Math.random(), Math.random() ));
    
    sceneAgents.push(currentAgent1);
    sceneAgents.push(currentAgent2);
    this.framework.scene.add(currentAgent1.mesh);
    this.framework.scene.add(currentAgent2.mesh);
  }
}

function lerpColor(colorA, colorB, w) {
  var r = (1 - w) * colorA.r + w * colorB.r;
  var g = (1 - w) * colorA.g + w * colorB.g;
  var b = (1 - w) * colorA.b + w * colorB.b;
  return new THREE.Color(r, g, b);
}

// clears the scene by removing all geometries added by turtle.js
function clearScene(framework) {
  sceneAgents = new Array();
  for(var i = framework.scene.children.length - 1; i > sceneMarkers.length + 1; i--) {
    var obj = framework.scene.children[i];
    framework.scene.remove(obj);
  }
}

// called on frame updates
function onUpdate(framework) {
  var timestep = clock.getDelta();
  
  // Clear the owner of every marker
  for(var i = 0; i < sceneMarkers.length; i++) {
    sceneMarkers[i].clearOwner();
  }
  
  // For each agent, compute the next direction the agent should move in
  for(var i = 0; i < sceneAgents.length; i++) {
    var currentAgent = sceneAgents[i];
    currentAgent.setNearbyMarkers(grid, sceneAgents);
    currentAgent.computeNewDirection();
    
    var velocity = currentAgent.direction.clone();
    velocity.multiplyScalar(timestep);
    velocity.multiplyScalar(5);
    
    currentAgent.position.add(velocity);
    currentAgent.planePosition.add(velocity);
    currentAgent.mesh.position.add(velocity);
    currentAgent.goalDirection = currentAgent.goalDirection.subVectors(currentAgent.goalPos, currentAgent.position);
    currentAgent.goalDirection.normalize();
    currentAgent.clearMarkers();
  }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
