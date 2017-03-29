const THREE = require('three');


export default class Agent {

	// Agent Constructor
	constructor(goal, material, position = new THREE.Vector3(0, 0, 0), gridCellWidth, gridCellHeight, velocity = new THREE.Vector3(0.0, 0.0, 10.0), 
				orientation = new THREE.Vector3(1, 0, 0), size = new THREE.Vector3(0.25, 0.25, 1)) {

		// Seriously a dummy vector so I can us vector math
		// TODO: Get rid of this.
		this.v3 = new THREE.Vector3(0.0, 0.0, 0.0);

		this.maxSpeed = 10.0;
		this.position = position;
		this.velocity = velocity;

		// Goal
		this.goal = goal;
		
		this.orientation = orientation;
		this.markers = []; // Markers are initially empty
		this.size = size;
		
		// Color
		this.color = 0xffffff;

		// Cylinder
		this.geometry = new THREE.CylinderGeometry(20, 20, 100, 32);
		this.material = material;
		//this.material = new THREE.MeshBasicMaterial({color: this.color})
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.position.set(position.x, position.y, position.z); // = position;

		this.gridCellWidth = gridCellWidth;
		this.gridCellHeight	= gridCellHeight;

		this.i = Math.floor((this.position.x + 0.5 * this.gridCellWidth) / this.gridCellWidth);
		this.j = Math.floor((this.position.z + 0.5 * this.gridCellWidth) / this.gridCellHeight);
	};

	update(deltaTime) {
		// Update Cell Grid
		this.i = Math.floor((this.position.x + 0.5 * this.gridCellWidth) / this.gridCellWidth);
		this.j = Math.floor((this.position.z + 0.5 * this.gridCellWidth) / this.gridCellHeight);

		var toGoal = new THREE.Vector3(0.0, 0.0, 0.0);
		toGoal.add(this.goal.position);
		toGoal.sub(this.position);

		var sum = new THREE.Vector3(0.0, 0.0, 0.0);
		var sumWeight = 0.0;
		var theta;
		var weight;
		
		var weights = [];
		var toMarkers = [];
		for (var m = 0; m < this.markers.length; m++) {
			var toMarker = new THREE.Vector3(0.0, 0.0, 0.0);
			toMarker.add(this.markers[m].geo.vertices[this.markers[m].mark]);
			toMarker.sub(this.position);

			theta = toGoal.angleTo(toMarker);
			weight = (1.0 + Math.cos(theta)) / (1 + toMarker.length());
			sumWeight += weight;
			weights.push(weight);
			toMarkers.push(toMarker);
		}

		var velSum = new THREE.Vector3(0.0, 0.0, 0.0);
		for (var n = 0; n < this.markers.length; n++) {
			velSum.add(toMarkers[n].multiplyScalar(weights[n] / sumWeight));
		}

		// Slight Jiggle
		if (velSum.length < 0.01) {
			velSum.x = 0.01;
		}
		this.velocity = velSum;


		this.position.add(this.v3.multiplyVectors(this.velocity, deltaTime));
		this.mesh.position.set(this.position.x, this.position.y, this.position.z);
	};
}

