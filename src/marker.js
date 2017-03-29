export default class Marker {
	constructor(position) {
		this.position = position;
		this.color = 0xff0000;
		this.owned = false;
		this.mesh = null;
		this.agent = null;
	}
}