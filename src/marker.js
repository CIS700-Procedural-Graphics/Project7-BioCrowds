export default class Marker {

	// Position, velocity, goal, orientation, size, markers
	constructor(pos) {
		this.pos = pos;
	}

	setAgent(agent) {
		this.agent = agent;
	}

	setDist(dist) {
		this.dist = dist;
	}

	getDist() {
		return this.dist;
	}

	getAgent() {
		return this.agent;
	}

	getPos() {
		return this.pos;
	}

	reset() {
		this.agent = null;
		this.dist = null;
	}

}