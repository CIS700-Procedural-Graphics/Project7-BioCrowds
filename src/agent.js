const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much

var NEIGHBORHOOD_RADIUS = 3; // minimum distance threshold for how close a marker must be to be considered by this agent in GRID/TAXICAB UNITS
var MAX_SPEED = 8;
export var AGENT_HEIGHT = 2;

export class Agent {
	constructor(position, goalPos, geoColor) {
		this.position = position;
		this.planePosition = new THREE.Vector3(this.position.x, this.position.y - AGENT_HEIGHT / 2, this.position.z); // position in the ground plane
		
		this.geometry = new THREE.CylinderGeometry(0.5, 0.5, AGENT_HEIGHT);
		this.mesh = new THREE.Mesh(this.geometry, new THREE.MeshLambertMaterial( { color : geoColor } ));
		this.mesh.position.set(this.position.x, this.position.y, this.position.z);
		
		this.goalPos = goalPos;
		this.goalDirection = new THREE.Vector3(0, 0, 0);
		this.goalDirection = this.goalDirection.subVectors(goalPos, position).normalize();
		this.direction = this.goalDirection;
		this.nearbyMarkers = new Array();
	}
	
	addMarker(m) {
		this.nearbyMarkers.push(m);
	}
	
	clearMarkers() {
		this.nearbyMarkers = new Array();
	}
	
	setNearbyMarkers(grid, sceneAgents) {
		this.nearbyMarkers = new Array();
		
		var xIndex = Math.ceil(this.position.x) + 20;
		var yIndex = Math.ceil(this.position.z) + 20;
		
		for(var i = xIndex - NEIGHBORHOOD_RADIUS; i < xIndex + NEIGHBORHOOD_RADIUS; i++) {
			for(var j = yIndex  - NEIGHBORHOOD_RADIUS; j < yIndex + NEIGHBORHOOD_RADIUS; j++) {
				if(i < 0) {
					i = 0;
				}
				if(j < 0) {
					j = 0;
				}
				var currentCell = grid[i][j];
				for(var k = 0; k < currentCell.length; k++) {
					var currentMarker = currentCell[k];
					currentMarker.setOwner(sceneAgents);
				}
			}
		}
	}
	
	computeNewDirection() {
		var weightedDirection = new THREE.Vector3(0, 0, 0);
		var totalContribution = 0;
		for(var i = 0; i < this.nearbyMarkers.length; i++) {
			
			// Get the displacement vector between the current marker and this agent
			var currentMarker = this.nearbyMarkers[i];
			var displacement = new THREE.Vector3(0, 0, 0);
			displacement.subVectors(currentMarker.position, this.planePosition);
			var displacementMagnitude = displacement.length();
			
			displacement.normalize();
			
			// Compute the weight for this vector			
			var cosTheta = displacement.dot(this.goalDirection);
			var weight = (1 + cosTheta) / (1 + displacementMagnitude);
			
			// Account for distance from the agent
			var weightedDir = displacement.multiplyScalar(weight);
			weightedDirection.add(weightedDir);
			totalContribution += weight;
		}
		
		weightedDirection.multiplyScalar(1 / totalContribution);
		
		// Cap the speed at max speed
		if(weightedDirection.length() > MAX_SPEED) {
			weightedDirection.setLength(MAX_SPEED);
		}
		
		this.direction = weightedDirection;
	}
	
}