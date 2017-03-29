const THREE = require('three');

export default class RenderEngine {

	constructor(scene) {
		this.scene = scene;
  	}

  	clear_scene() {
  		var to_remove = [];
  		this.scene.traverse(function(child) {
  			if (child instanceof THREE.Mesh) {
  				to_remove.push(child);
  			}
  		});
  		for (var i = 0; i < to_remove.length; i++) {
  			this.scene.remove(to_remove[i]);
  		}
  	}

  	render_plane(size) {
	  	var plane_geo = new THREE.PlaneGeometry(size, size);
		var plane_mesh = new THREE.Mesh(plane_geo, new THREE.MeshLambertMaterial( {color: 0xFFFFFF, side: THREE.DoubleSide}));
		plane_mesh.rotation.x = Math.PI / 2.0;
		plane_mesh.position.set(0.0, 0.0, 0.0);
		this.scene.add(plane_mesh);
  	}

  	render_agents(agents) {
	 	var sphere_geo = new THREE.SphereGeometry(0.75, 24, 24);
		var agent; 
		for (var i = 0; i < agents.length; i++) {
			agent = new THREE.Mesh(sphere_geo, new THREE.MeshLambertMaterial( {color: agents[i].color, side: THREE.DoubleSide}));
			agent.position.set(agents[i].position.x, agents[i].position.y, agents[i].position.z);
			agents[i].mesh = agent;
			this.scene.add(agent);
		}
  	}
 
  	render_markers(markers) {
		var cube_geo = new THREE.BoxGeometry(0.5, 0.01, 0.5);
		var marker;
		for (var i = 0; i < markers.length; i++) {
			marker = new THREE.Mesh(cube_geo, new THREE.MeshLambertMaterial( {color: markers[i].color, side: THREE.DoubleSide}));
			marker.position.set(markers[i].position.x, markers[i].position.y, markers[i].position.z);
			markers[i].mesh = marker;
			this.scene.add(marker);
		}
  	}

 	update_agents(agents) {
 		for (var i = 0; i < agents.length; i++) {
 			var pos = agents[i].position;
 			var mesh = agents[i].mesh;
 			mesh.position.set(pos.x, pos.y, pos.z);
 			mesh.geometry.verticesNeedUpdate = true;
 		}
  	}

  	update_markers(markers) {
  		markers.forEach(function(marker) {
  			marker.mesh.material.color.setHex(marker.color);
  		});
  	}
}
