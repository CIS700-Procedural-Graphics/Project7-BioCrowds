const THREE = require('three'); 

function Agent() {
	this.mesh;
	this.vel;
	this.goal;
	this.orientation;
	this.size = 0.25;
	this.markers = [];
	this.color;
}

function Marker() {
	this.contribution;
	this.position;
	this.agent;
	this.colorIndex; // used to change the color
	this.agentIndex;
}

function Grid (scene, width, height, options) {
	this.AGENT_SIZE = options.AGENT_SIZE;
	this.MORE_ROW_AGENTS = 1 / options.MORE_ROW_AGENTS;
	this.NUM_AGENTS = options.NUM_AGENTS;
	this.MARKER_DENSITY = options.MARKER_DENSITY;
	this.RADIUS = options.RADIUS;
	this.CIRCLE_RADIUS = options.CIRCLE_RADIUS;
	this.TIMESTEP = options.TIMESTEP;
	this.SHOW_MARKERS = options.markers;

	this.scene = scene;
	this.w = width;
	this.h = height;
	this.plane;
	this.markerMesh;
	this.agents = [];
	this.markers = [];
	this.scenario = options.scenario;
	this.table = [];
	this.colors = [];

	// Location mapped to list of agents within cells
	for (var x = 0; x < this.w; x++) {
		var arr = [];
		for (var z = 0; z < this.h; z++) {
			arr[z] = [];
		}
		this.table[x] = arr;
	}

	this.clearScene = function() {
		if (!(this.plane === undefined)) {
			this.scene.remove(this.plane);
		}
		if (!(this.markerMesh === undefined) && this.SHOW_MARKERS) {
			this.scene.remove(this.markerMesh);
		}
		if (!(this.agents === undefined)) {
			for (var i = 0; i < this.agents.length; i++) {
				this.scene.remove(this.agents[i].mesh);
			}
		}
	}

	this.setup = function() {
		console.log("Setting up...");
		console.log("Scenario: " + this.scenario);

		var planeGeo = new THREE.PlaneGeometry(this.w, this.h, this.w, this.h);
    	var planeMat = new THREE.MeshBasicMaterial({color: 0xffffff, 
    		side: THREE.DoubleSide, wireframe: true});
    	var plane = new THREE.Mesh( planeGeo, planeMat );

    	plane.geometry.verticesNeedUpdate = true;
		plane.geometry.dynamic = true;

    	this.plane = plane;
    	this.scene.add(plane);
    	plane.rotation.x = Math.PI / 2;

    	this.scatterPoints();
    	this.initAgents();	
	}

	this.initAgents = function() {
		if (this.scenario == "rows") {
			this.initRows();
		}
		else if (this.scenario == "circle") {
			this.initCircle();
		}
	}

	this.initRows = function() {
		// Create front row
		for (var i = -this.w / 2; i < this.w / 2; i += this.MORE_ROW_AGENTS*this.AGENT_SIZE) {
			var agent = new Agent();
			agent.size = this.AGENT_SIZE;
			// Set up goal 
			agent.goal = new THREE.Vector3(i, this.AGENT_SIZE / 2, -this.w / 2 + 1);

			// Set up mesh
			var geometry = new THREE.CylinderGeometry( this.AGENT_SIZE, this.AGENT_SIZE, this.AGENT_SIZE, 10);
			var color = new THREE.Color();
    		color.setRGB(0, (Math.random() + 1) / 2, (Math.random() + 1) / 2);
    		agent.color = color;
			var material = new THREE.MeshBasicMaterial( {color: color} );
			var cylinder = new THREE.Mesh( geometry, material );
			agent.mesh = cylinder;

			// Set position
			agent.mesh.position.x = i;
			agent.mesh.position.y = this.AGENT_SIZE / 2;
			agent.mesh.position.z = this.w / 2 - 1;

			// Add to scene and store agent
			this.scene.add(agent.mesh);
			this.agents.push(agent);
		}

		// Create back row
		for (var i = -this.w / 2; i < this.w / 2; i += this.MORE_ROW_AGENTS*this.AGENT_SIZE) {
			var agent = new Agent();
			agent.size = this.AGENT_SIZE;
			// Set up goal 
			agent.goal = new THREE.Vector3(i, agent.size / 2, this.w / 2 - 1);

			// Set up mesh
			var geometry = new THREE.CylinderGeometry( this.AGENT_SIZE, this.AGENT_SIZE, this.AGENT_SIZE, 10);
			var color = new THREE.Color();
    		color.setRGB((Math.random() + 1) / 2, 0, (Math.random() + 1) / 2);
    		agent.color = color;
			var material = new THREE.MeshBasicMaterial( {color: color} );
			var cylinder = new THREE.Mesh( geometry, material );
			agent.mesh = cylinder;

			// Set position
			agent.mesh.position.x = i;
			agent.mesh.position.y = this.AGENT_SIZE / 2;
			agent.mesh.position.z = -this.w / 2 + 1;

			// Add to scene and store agent in table
			this.scene.add(agent.mesh);
			this.agents.push(agent);
		}
	}

	this.initCircle = function() {
		var t = 0;
		for (var i = 0; i < this.NUM_AGENTS; i++) {
			var agent = new Agent();
			agent.size = this.AGENT_SIZE;
			// Set up mesh
			var geometry = new THREE.CylinderGeometry( this.AGENT_SIZE, this.AGENT_SIZE, this.AGENT_SIZE, 10);
			var color = new THREE.Color();
    		color.setRGB(0, Math.random(), Math.random());
    		agent.color = color;
			var material = new THREE.MeshBasicMaterial( {color: color} );
			var cylinder = new THREE.Mesh( geometry, material );
			agent.mesh = cylinder;

			// Set position
			agent.mesh.position.x = this.CIRCLE_RADIUS * Math.sin(t);
			agent.mesh.position.y = agent.size / 2;
			agent.mesh.position.z = this.CIRCLE_RADIUS * Math.cos(t);

			// Add to scene and store agent in table
			this.scene.add(agent.mesh);
			this.agents.push(agent);

			// Set up goal 
			agent.goal = new THREE.Vector3(this.CIRCLE_RADIUS * Math.sin(t + Math.PI), 0, 
				this.CIRCLE_RADIUS * Math.cos(t + Math.PI));

			t += 2 * Math.PI / this.NUM_AGENTS;
		}
		
	}

	this.scatterPoints = function() {
		console.log("Scattering points...");
		var dotGeometry = new THREE.Geometry();

		for (var j = 0; j < this.MARKER_DENSITY; j++) {
			for (var i = 0; i < this.plane.geometry.vertices.length; i++) {
				if (this.plane.geometry.vertices[i].x == this.w / 2 || 
					this.plane.geometry.vertices[i].y == this.h / 2) {
					continue;
				}
				// Normalize floor grid vertices
				this.plane.geometry.vertices[i].x = Math.floor(this.plane.geometry.vertices[i].x);
				this.plane.geometry.vertices[i].y = Math.floor(this.plane.geometry.vertices[i].y);
				this.plane.geometry.vertices[i].z = Math.floor(this.plane.geometry.vertices[i].z);
	
				// Sample the position
				var x = this.plane.geometry.vertices[i].x;
				var z = this.plane.geometry.vertices[i].y;

				var x1 = x + Math.random();
            	var z1 = z + Math.random();

            	var markerPos = new THREE.Vector3(x1, 0, z1);
				
				var marker = new Marker();
				marker.position = markerPos;
				

				// Map the vertex to its grid
				this.table[x + this.w / 2][z + this.h / 2].push(marker);
				this.markers.push(marker);
				marker.colorIndex = this.markers.length - 1;

            	// Determine a color
            	var color = new THREE.Color();
    			color.setRGB(1, 1, 1);
				this.colors.push(color);

            	// Push the marker mesh to the geometry
				dotGeometry.vertices.push(markerPos);
			}	
		}
		

		// Add markers to the scene
		dotGeometry.colors = this.colors;
        var dotMaterial = new THREE.PointsMaterial( {size: 0.10, vertexColors: THREE.VertexColors} );
        this.markerMesh = new THREE.Points( dotGeometry, dotMaterial );   
        if (this.SHOW_MARKERS) {
        	this.scene.add( this.markerMesh );
        }
	}


	this.tick = function() {
		// Assigns markers based on the closest
		this.resetMarkerOwnership();
		for (var i = 0; i < this.agents.length; i++) {
			var agent = this.agents[i];
			var gridMarkers = this.getMarkers(agent.mesh.position);
			this.assignMarkers(agent, gridMarkers);
		}

		for (var i = 0; i < this.agents.length; i++) {
			var agent = this.agents[i];
			this.updateVelocity(agent);
			this.updatePosition(agent);
		}
	}

	this.updateVelocity = function(agent) {
		agent.vel = new THREE.Vector3(0, 0, 0);
		var totalContribution = 0.0;
		var x = agent.mesh.position;
		var g = new THREE.Vector3(x.x - agent.goal.x, x.y - agent.goal.y, x.z - agent.goal.z);
		for (var i = 0; i < agent.markers.length; i++) {
			var a = agent.markers[i].position;
			var m = new THREE.Vector3(x.x - a.x, x.y - a.y, x.z - a.z);
			agent.markers[i].contribution = (1 + m.dot(g) / (m.length() * g.length())) / (1 + m.length());
			//console.log(agent.markers[i].contribution);
			totalContribution += agent.markers[i].contribution;
		}

		for (var i = 0; i < agent.markers.length; i++) {
			var a = agent.markers[i].position;
			var m = new THREE.Vector3(a.x - x.x, a.y - x.y, a.z - x.z);
			//console.log(agent.markers[i].contribution / totalContribution);
			agent.vel.x += agent.markers[i].contribution / totalContribution*m.x;
			agent.vel.y += agent.markers[i].contribution / totalContribution*m.y;
			agent.vel.z += agent.markers[i].contribution / totalContribution*m.z;
			agent.markers[i].contribution = 0;
			//agent.markers[i].agent = undefined;
		}

		if (agent.vel.length() > this.RADIUS) {
			agent.vel.normalize().multiplyScalar(this.RADIUS);
		}

		agent.markers.length = 0;
	}

	this.updatePosition = function(agent) {
		agent.mesh.position.x += agent.vel.x * this.TIMESTEP;
		agent.mesh.position.y += agent.vel.y * this.TIMESTEP;
		agent.mesh.position.z += agent.vel.z * this.TIMESTEP;
	}

	this.assignMarkers = function(agent, gridMarkers) {
		for (var j = 0; j < gridMarkers.length; j++) {
			// distance to this agent
			var x = gridMarkers[j].position.x - agent.mesh.position.x;
			var y = gridMarkers[j].position.y - agent.mesh.position.y;
			var z = gridMarkers[j].position.z - agent.mesh.position.z;
			var currDistance = (new THREE.Vector3(x, y, z)).length();
			var unassigned = false;
			var closer = false;
			if (currDistance < this.RADIUS) {
				// Already assigned closest marker
				if (gridMarkers[j].agent === undefined) {
					// Assign new agent
					gridMarkers[j].agent = agent;
					agent.markers.push(gridMarkers[j]);
					gridMarkers[j].agentIndex = agent.markers.length - 1;

					// Update
					this.markerMesh.geometry.colors[gridMarkers[j].colorIndex] = 
					agent.color;
				} else {
					var x1 = gridMarkers[j].position.x - gridMarkers[j].agent.mesh.position.x;
					var y1 = gridMarkers[j].position.y - gridMarkers[j].agent.mesh.position.y;
					var z1 = gridMarkers[j].position.z - gridMarkers[j].agent.mesh.position.z;
					var closest = (new THREE.Vector3(x1, y1, z1)).length();
					closer = currDistance < closest;
					if (closer) {
						gridMarkers[j].agent.markers.splice(gridMarkers[j].agentIndex, 1);
						for (var i = 0; i < gridMarkers[j].agent.markers.length; i++) {
							gridMarkers[j].agent.markers[i].agentIndex = i;
						}
						// Assign new agent
						gridMarkers[j].agent = agent;
						agent.markers.push(gridMarkers[j]);
						gridMarkers[j].agentIndex = agent.markers.length - 1;		
						// Update color
						this.markerMesh.geometry.colors[gridMarkers[j].colorIndex] = 
						agent.color;
					}
				}
			}
			
		}
		this.markerMesh.geometry.colorsNeedUpdate = true;
	}

	// We're only interested in markers in the surrounding grid
	this.getMarkers = function(agentPos) {
		var x = Math.floor(agentPos.x) + this.w / 2;
		var z = Math.floor(agentPos.z) + this.h / 2;
		var markers = [];
		for (var a = -1; a <= 1; a++) {
			for (var b = -1; b <= 1; b++) {
				if (x + a > -1 && x + a < this.w && 
					z + b > -1 && z + b < this.h) {
					for (var i = 0; i < this.table[x + a][z + b].length; i++) {
						markers.push(this.table[x + a][z + b][i]);
					}
				}
			}
		}

		return markers;
	}

	this.resetMarkerOwnership = function() {
		for (var i = 0; i < this.markers.length; ++i) {
			this.markers[i].agent = undefined;
			this.markerMesh.geometry.colors[this.markers[i].colorIndex] = 
						new THREE.Color();
		}
	}

}

export default {
	Grid: Grid
}