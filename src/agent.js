const THREE = require('three')

// an agent class that will be used to simulate and draw an agent
// Various fields such as: position, velocity, goal, orientation, size, markers, geometry  

export default class Agent {
	constructor(scene) {
		this.position = new THREE.Vector3(0,0,0);
		this.velocity = new THREE.Vector3(0,0,0); 
		this.goal = new THREE.Vector3(0,0,0);
		this.scene = scene;
		this.orientation = 0; // specify in degrees, convert later to radians 
		this.mesh = null; 	
		this.markers = []; // an array of markers 
	}
}

// make a marker struct: position, pointer to agent owner 
    