const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much

export default class Marker {
	constructor(position, geoColor) {
		this.position = position;
		this.geometry = new THREE.Geometry();
		this.geometry.vertices.push(new THREE.Vector3(position.x, position.y, position.z));
		this.geometry.verticesNeedUpdate = true;
		this.mesh = new THREE.Points(this.geometry, new THREE.PointsMaterial( { color : geoColor } ));
		this.owner = null;
	}
	
	// Determine the closest agent
	setOwner(sceneAgents) { // maybe pass in the uniform grid here. For now, naively check all agents in the scene
		var closestAgent = undefined;
		var minDist = 4;
		
		for(var i = 0; i < sceneAgents.length; i++) {
			var currentDist = sceneAgents[i].planePosition.distanceTo(this.position);
			if(currentDist < 4 && currentDist < minDist) {
				minDist = currentDist;
				closestAgent = sceneAgents[i];
			}
		}
		
		if(typeof closestAgent != "undefined") {
			this.owner = closestAgent;
			closestAgent.addMarker(this);
			this.mesh.material.color = this.owner.mesh.material.color;
		}
	}
	
	clearOwner() {
		this.owner = null;
		this.mesh.material.color = new THREE.Color(0xff0000);
	}
}