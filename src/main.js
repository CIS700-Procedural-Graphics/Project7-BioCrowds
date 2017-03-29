
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import Agent from './agent'
import Marker from './marker'


var goals = {
	options : ['corner', 'center'],
	corner : function(i) {
		var d = Math.pow(-1, i) * (fieldSize / 3)
		return new THREE.Vector2(d, d);
	},
	center : function(i) {
		return new THREE.Vector2(0, 0);
	}
}

var start = {
	options : ['random', 'circle'],
	random : function() {
		return new THREE.Vector2((Math.random() - 0.5) * fieldSize, (Math.random() - 0.5) * fieldSize);
	},
	circle : function() {
		var angle = Math.random() * Math.PI * 2;
		var x = Math.cos(angle) * fieldSize/3;
		var y = Math.sin(angle) * fieldSize/3;
		return new THREE.Vector2(x,y);
	}
}

var fieldSize = 100;
var numMarkers = 5000;
var numAgents = 50;
var maxAgentSize = 5;
var distBuffer = 30;
var speed = 0.5;

var markers = [];
var agents = [];
var grid = {};

var config = {
	goal : "corner",
	start : "circle"
}

function createMarkers() {
	for (var i = 0; i < numMarkers; i++) {
		var pos = new THREE.Vector2((Math.random() - 0.5) * fieldSize, (Math.random() - 0.5) * fieldSize);
		var m = new Marker(pos);

		markers.push(m);

		var xG = Math.floor(pos.x / maxAgentSize);
		var yG = Math.floor(pos.y / maxAgentSize);
		var gridIdx = xG + '-' + yG;
		if (!grid[gridIdx]) {
			grid[gridIdx] = [];
		}
		grid[gridIdx].push(m);
	}
}

function createAgents() {
	agents = [];
	for (var i = 0; i < numAgents; i++) {
		var name = "agent" + i;

		var posFunction = start[config.start];
		var pos = posFunction();
		var vel = new THREE.Vector2(0, 0);


		var goalFunction = goals[config.goal];
		var goal = goalFunction(i);
		var size = 1;

		var agent = new Agent(name, pos, vel, goal, size, []);
		agents.push(agent);
	}
}

// called after the scene loads
function onLoad(framework) {
	var scene = framework.scene;
	var camera = framework.camera;
	var renderer = framework.renderer;
	var gui = framework.gui;
	var stats = framework.stats;

	// set camera position
	camera.position.set(1, 1, 100);
	camera.lookAt(new THREE.Vector3(0,0,0));

	// Create plane
	var squareGeometry = new THREE.PlaneGeometry(fieldSize, fieldSize);
    var squareMaterial = new THREE.MeshBasicMaterial({ 
         color:0xFFFFFF, 
         side:THREE.DoubleSide 
     }); 

    var squareMesh = new THREE.Mesh(squareGeometry, squareMaterial); 
    squareMesh.position.set(0,0,0);
	scene.add(squareMesh);

	// Create markers and agents
	createMarkers();
	createAgents();

	console.log(grid)

	// // Add markers to scene
	// for (var i = 0; i < numMarkers; i++) {
	// 	var markerGeom = new THREE.CircleGeometry(1,8);
	// 	var markerMaterial = new THREE.MeshBasicMaterial({ 
 //        	color:0x000000, 
 //        	side:THREE.DoubleSide 
 //     	});

 //     	var markerMesh = new THREE.Mesh(markerGeom, markerMaterial);
 //     	var markerPos = markers[i].getPos();
 //     	markerMesh.position.set(markerPos.x, markerPos.y, 1);
 //     	scene.add(markerMesh);
	// }

	// Add agents to scene
	for (var i = 0; i < numAgents; i++) {
		var agent = agents[i];


		var agentGeom = new THREE.CircleGeometry(agent.getSize(),8);
		var agentMaterial = new THREE.MeshBasicMaterial({ 
        	color:0x00FF00, 
        	side:THREE.DoubleSide 
     	});

     	var agentMesh = new THREE.Mesh(agentGeom, agentMaterial);
     	var agentPos = agents[i].getPos();
     	agentMesh.position.set(agentPos.x, agentPos.y, 1);
     	agentMesh.name = agent.getName();
     	scene.add(agentMesh);
	}

	// edit params and listen to changes like this
	// more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
	gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
		camera.updateProjectionMatrix();
	});

	gui.add(config, 'goal', goals.options).onChange(function(newVal){
		config.goal = newVal;
		createAgents();
	});

	gui.add(config, 'start', start.options).onChange(function(newVal){
		config.start = newVal;
		createAgents();
	});
}

// called on frame updates
function onUpdate(framework) {
	if (markers.length == 0 || agents.length == 0) {
		return;
	}

	for (var x = 0; x < markers.length; x++) {
		markers[x].reset();
	}

	// Assign markers to agents
	for (var x = 0; x < agents.length; x++) {
		var agent = agents[x];
		agent.clearMarkers();

		var pos = agent.getPos();
		var xG = Math.max(Math.floor(pos.x / maxAgentSize) - 1, -Math.floor(fieldSize / 2 / maxAgentSize));
		var yG = Math.max(Math.floor(pos.y / maxAgentSize) - 1, -Math.floor(fieldSize / 2 / maxAgentSize));

		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 3; j++) {
				var gridIdx = (xG + i) + '-' + (yG + j);
				if (!grid[gridIdx]) {break;}

				if (grid[gridIdx]) {
					for (var y = 0; y < grid[gridIdx].length; y++) {
						var marker = grid[gridIdx][y];
						var mPos = marker.getPos();

						var dist = (Math.pow(pos.x - mPos.x, 2) + Math.pow(pos.y - mPos.y, 2));
						// console.log(dist);
						if (dist < distBuffer) {

							// Check case where marker is already assigned
							if (!marker.getAgent()) {
								agent.addMarker(marker);
								marker.setAgent(agent);
								marker.setDist(dist);
							} else if (marker.getDist() > dist) {
								// var oldAgent = marker.getAgent();
								// oldAgent.removeMarker(marker);
								agent.addMarker(marker);
								marker.setAgent(agent);
								marker.setDist(dist);
							}



						}
					}
				}
			}
		}
		agents[x] = agent;
	}

	// Compute velocities and update scene
	for (var x = 0; x < agents.length; x++) {
		agents[x].update();
		agents[x].updatePos(speed);

		var mesh = framework.scene.getObjectByName(agents[x].getName());
		if (mesh) {
			var pos = agents[x].getPos();
			mesh.position.set(pos.x, pos.y, 1);
			mesh.needsUpdate = true;
		}
	}
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);