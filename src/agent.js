const THREE = require('three');

export default class Agent {

	// Position, velocity, goal, orientation, size, markers
	constructor(name, pos, vel, goal, size, markers) {
		this.init(name, pos, vel, goal, size, markers);
	}

	init(name, pos, vel, goal, size, markers) {
		this.name = name;
		this.pos = pos;
		this.vel = vel;
		this.goal = goal;
		this.size = size;
		this.markers = markers;
	}

	clearMarkers() {
		this.markers = [];
	}

	addMarker(marker) {
		this.markers.push(marker);
		// console.log(this.markers);
	}

	removeMarker(marker) {
		var idx = this.markers.indexOf(marker);
		if (idx > -1) {
			this.markers = this.markers.splice(idx, 1);
		}
	}

	setSize(size) {
		this.size = size;
	}

	getMarkers() {
		this.markers;
	}

	getName() {
		return this.name;
	}

	getPos() {
		return this.pos;
	}

	getSize() {
		return this.size;
	}

	getDistToGoal() {
		return Math.pow(this.pos.x - this.goal.x, 2) + Math.pow(this.pos.y - this.goal.y, 2)
	}

	getGoalDir() {
		return new THREE.Vector2(this.goal.x - this.pos.x, this.goal.y - this.pos.y);
	}

	update() {
		this.vel = new THREE.Vector2(0,0);

		// console.log(this.getDistToGoal())
		// if (this.getDistToGoal() < 1) {return;}

		var goalDir = this.getGoalDir();
		var cumWeight = 0;
		
		// console.log(this.name + " " + this.markers.length)

		for (var x = 0; x < this.markers.length; x++) {
			var marker = this.markers[x];
			var mPos = marker.getPos();
			var markerDir = new THREE.Vector2(mPos.x - this.pos.x, mPos.y - this.pos.y);

			// Get weight for this marker
			var numerator = goalDir.normalize().dot(markerDir.normalize()) + 1;
			var denominator = Math.sqrt(Math.pow(this.pos.x - mPos.x, 2) + Math.pow(this.pos.y - mPos.y, 2)) + 1;
			var weight = numerator / denominator;

			// Update velocity
			this.vel.x += markerDir.x * weight;
			this.vel.y += markerDir.y * weight;
			cumWeight += weight;

		}
		// console.log(this.vel);

		this.vel.x /= cumWeight;
		this.vel.y /= cumWeight;

		this.vel.x = this.vel.x ? this.vel.x : 0;
    	this.vel.y = this.vel.y ? this.vel.y : 0;
		// console.log(this.vel);
	}

	updatePos(delta) {
		this.pos.x += this.vel.x * delta;
		this.pos.y += this.vel.y * delta;
		// console.log(this.vel);
	}
}