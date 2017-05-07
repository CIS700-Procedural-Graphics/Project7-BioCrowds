const THREE = require('three');
const Random = require("random-js");
const Ease = require("ease-component")
	
import Framework from './framework'

class Engine
{
	constructor(density, gridSize, agentCount, texture, texturePixels)
	{
		this.map = new Map(density, gridSize, texture, texturePixels);
		this.time = 0.0;
		this.clock = new THREE.Clock();
		this.agentCount = agentCount;
		this.target = new THREE.Vector2();
		this.movingTarget = true;
		this.targetMesh = null;
		this.container = new THREE.Object3D();

	}

	initialize(scene)
	{
		var target = new THREE.Vector2( this.map.width, this.map.height );
		this.map.initializeAgents(this.agentCount, this.container, target);
		this.initializeScene(this.container);
		this.container.position.set(-this.map.width * .5, 0, -this.map.height*.5);
		scene.add(this.container);
	}

	initializeScene(scene)
	{
		var pointsGeometry = new THREE.Geometry();
		var markersMaterial = new THREE.PointsMaterial( { color: 0x00ee00 } )
		markersMaterial.size = .1;
		markersMaterial.vertexColors = true;
		var markers = this.map.markers;

		for(var m = 0; m < markers.length; m += 3)
		{
			var x = markers[m];
			var y = markers[m + 1];
			var w = markers[m + 2];
			pointsGeometry.vertices.push(new THREE.Vector3( x, 0, y ));
			pointsGeometry.colors.push(new THREE.Color(w,w,w));
		}

		var markerPoints = new THREE.Points( pointsGeometry, markersMaterial );
		scene.add( markerPoints );

		var lineGeo = new THREE.Geometry();

		for(var x = 0; x <= this.map.width; x++)
		{
			lineGeo.vertices.push(new THREE.Vector3( x, 0, 0 ));
			lineGeo.vertices.push(new THREE.Vector3( x, 0, this.map.height ));
		}

		for(var x = 0; x <= this.map.width; x++)
		{
			lineGeo.vertices.push(new THREE.Vector3( 0, 0, x ));
			lineGeo.vertices.push(new THREE.Vector3( this.map.width, 0, x ));
		}

		var lineMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
		lineMaterial.linewidth = 2;
		var lineMesh = new THREE.LineSegments(lineGeo, lineMaterial);
		scene.add(lineMesh);

		var targetCylinder = new THREE.CylinderBufferGeometry( .5, .5, .1, 16 );
		var targetMaterial = new THREE.MeshBasicMaterial( { color: 0xff00ff } );
		this.targetMesh = new THREE.Mesh( targetCylinder, targetMaterial );
		scene.add( this.targetMesh );
	}

	update()
	{
		if(this.movingTarget)
		{
			this.target.x = Math.cos(this.time * .1) * this.map.width * .5 + this.map.width * .5;
			this.target.y = Math.sin(this.time * .1) * this.map.height * .5 + this.map.height * .5;

			if(this.targetMesh != null)
				this.targetMesh.position.set(this.target.x, 0, this.target.y);
		}

	 	var deltaTime = Math.min(this.clock.getDelta(), 1.0 / 30.0);
	 	this.time += deltaTime;
		this.map.update(deltaTime, this.target)
	}
}

class Map
{
	constructor(density, gridSize, texture, texturePixels)
	{
		this.density = density;
		this.grid = []
		this.width = gridSize;
		this.height = gridSize;
		this.agents = []; // The raw array
		this.generator = Random.engines.mt19937();
		this.markers = new Float32Array(this.density * this.width * this.height * 3);

		this.texture = texture;
		this.texturePixels = texturePixels;

		for(var i = 0; i < this.width * this.height; i++)
			this.grid.push(new Array());

		this.initializeMarkers();
	}

	initializeAgents(agentCount, scene, target)
	{
		var cylinder = new THREE.CylinderBufferGeometry( .075, .075, .05, 8 );
		var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );

		var r = new Random(this.generator);

		for(var i = 0; i < agentCount; i++)
		{
			var mesh = new THREE.Mesh( cylinder, material );
			scene.add( mesh );

			var pos = new THREE.Vector2( i * this.width / agentCount, .5 + r.real(-.2, .2));
			var agent = new Agent(.1, mesh, pos, target);
			this.addAgent(agent);
		}
	}

	addAgent(agent)
	{
		this.agents.push(agent);

		var currentIndex = this.getCellIndex(agent.position);

		if(currentIndex != -1)
		{
			this.grid[currentIndex].push(agent);
			agent.currentCellIndex = currentIndex;
		}
	}

	getCellIndex(position)
	{
		var x = Math.floor(position.x);
		var y = Math.floor(position.y);

		var index = y * this.width + x;

		if(x >= 0 && x < this.width && y >= 0 && y < this.height)
			return index;

		return -1;
	}

	update(deltaTime, target)
	{
		// Update our agent data structure
		for(var a = 0; a < this.agents.length; a++)
			this.agents[a].cleanMarkerContribution();
		
		this.updateMarkers();

		// Update our agent data structure
		for(var a = 0; a < this.agents.length; a++)
		{
			var agent = this.agents[a];
			agent.target = target;

			if(agent.isValid())
				agent.update(deltaTime);

			var currentIndex = this.getCellIndex(agent.position);

			if(agent.currentCellIndex != currentIndex)
			{
				if(agent.currentCellIndex != -1)
				{
					var agentIndex = this.grid[agent.currentCellIndex].indexOf(agent);
					this.grid[agent.currentCellIndex].splice(agentIndex, 1);
				}

				if(currentIndex != -1)
					this.grid[currentIndex].push(agent);

				// console.log("Moved from " + agent.currentCellIndex + " to " + currentIndex);
				agent.currentCellIndex = currentIndex;

			}
		}
	}

	// Initially, these were evaluated in runtime, but
	// when the user wants high density markers it becomes very inefficient
	initializeMarkers()
	{
		for(var x = 0; x < this.width; x++)
		{
			for(var y = 0; y < this.height; y++)
			{
				var seed = y * this.width + x;
				this.generator.seed(seed);

				var r = new Random(this.generator);

				var textureIndex = (y/this.height) * this.texture.image.height * this.texture.image.width + (x/this.width) * this.texture.image.width;
				var pixel = this.texturePixels[textureIndex];

				for(var s = 0; s < this.density; s++)
				{
					var u = r.real(0, 1, true);
					var v = r.real(0, 1, true);

					var index = seed * this.density + s;

					this.markers[index * 3] = x + u;
					this.markers[index * 3 + 1] = y + v;
					this.markers[index * 3 + 2] = pixel;
				}	
			}
		}
	}

	// TODO: Only iterate markers on occupied cells and adjacent...
	updateMarkers()
	{
		var marker = new THREE.Vector2();
		var size = this.width * this.height * this.density;

		for(var m = 0; m < size; m++)
		{
			//if(this.markers[m*3+2] > .5)
			{
				marker.x = this.markers[m * 3];
				marker.y = this.markers[m * 3 + 1];
				var weight = this.markers[m * 3 + 2];
				var agent = this.getNearestAgent(marker);

				if(agent != null)
					agent.assignMarker(marker, weight);
			}
		}
	}

	getNearestAgent(position)
	{
		var minDistance = this.width * this.height;
		var minAgent = null;

		// Average case is O(1), although if all the agents are in the same
		// cell, it degenerates to O(n)... if we expect this, we can use a 
		// quad tree per cell
		for(var x = -1; x <= 1; x++)
		{
			for(var y = -1; y <= 1; y++)
			{
				var cellX = Math.floor(position.x + x);
				var cellY = Math.floor(position.y + y);

				if(cellX >= 0 && cellX < this.width && cellY >= 0 && cellY < this.height)
				{
					var index = cellY * this.width + cellX;
					var cellAgents = this.grid[index];

					for(var a = 0; a < cellAgents.length; a++)
					{
						var agent = cellAgents[a];

						if(agent.isValid())
						{
							var length = position.distanceTo(agent.position) - agent.radius;

							if(length < minDistance)
							{
								minDistance = length;
								minAgent = agent;
							}
						}
					}
				}
			}
		}

		return minAgent;
	}
}

class Agent
{
	constructor(radius, mesh, startPosition, target, scene)
	{
		this.mesh = mesh;
		this.position = startPosition.clone();
		this.maxSpeed = 5.0;
		this.velocity = new THREE.Vector2();
		this.velocityTarget = new THREE.Vector2();
		this.target = target;
		this.radius = radius;
		this.currentContribution = new THREE.Vector2();
		this.currentCellIndex = -1;

		this.toTarget = startPosition.clone().sub(target);
		this.toTarget.normalize();

		// this.lineGeo = new THREE.Geometry();
		// this.lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
		// this.lineMesh = new THREE.Line(this.lineGeo, this.lineMaterial);
		// this.mesh.add(this.lineMesh);
	}

	isValid()
	{
		return this.currentCellIndex != -1;
	}

	cleanMarkerContribution()
	{
		this.velocityTarget = new THREE.Vector2();
		// this.lineGeo = new THREE.Geometry();
		// this.lineMesh.geometry = this.lineGeo;
	}

	assignMarker(markerPosition, markerWeight)
	{
		var toMarker = markerPosition.clone().sub(this.position);
		var distance = toMarker.length() - this.radius;

		// We don't want contribution from inner markers, 
		// they will distort the velocity
		if(distance < 0)
			return;

		// this.lineGeo.vertices.push(new THREE.Vector3());
		// this.lineGeo.vertices.push(new THREE.Vector3(toMarker.x, 0, toMarker.y));

		if(toMarker.length() > 0)
			toMarker.normalize();

		var weight = toMarker.dot(this.toTarget) * .5 + .5;
		var distanceFalloff = Math.max(0.0, 1.0 - distance);
		this.velocityTarget.add(toMarker.clone().multiplyScalar(markerWeight * weight * distanceFalloff * distanceFalloff));
	}

	update(deltaTime)
	{
		if(this.velocityTarget.length() < .1)
			this.velocityTarget = new THREE.Vector2();

		this.velocity.lerp(this.velocityTarget, .15);

		// Clamp velocity
		var currentSpeed = this.velocity.length();
		currentSpeed = Math.min(currentSpeed, this.maxSpeed);

		if(this.velocity.length() > 0)
			this.velocity.normalize();

		this.velocity.multiplyScalar(currentSpeed);

		// Update position
		this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
		this.toTarget = this.target.clone().sub(this.position);

		if(this.toTarget.length() > 0)
			this.toTarget.normalize();

		this.mesh.position.set(this.position.x, 0, this.position.y);
		this.mesh.material.color = !this.isValid() ? new THREE.Color(0xffff00) : new THREE.Color( 0xff0000 );
	}
}

var engine = null;

function getPixelFlat( imagedata, index ) 
{
    var position = index * 4;
    var data = imagedata.data;    
    return { r: data[ position ], g: data[ position + 1 ], b: data[ position + 2 ] };
}

function loadTexturePixels(texture) 
{
	var canvas = document.createElement('canvas');
	canvas.width = texture.image.width;
	canvas.height = texture.image.height;

	var context = canvas.getContext( '2d' );
	context.drawImage( texture.image, 0, 0 );

	var data = context.getImageData( 0, 0, texture.image.width, texture.image.height );
	var pixels = new Float32Array(texture.image.width * texture.image.height);

	for(var i = 0; i < pixels.length; i++)
	{
		var pixel = getPixelFlat(data, i);
		pixels[i] = pixel.r / 255;
	}

	return pixels;
}

var UserSettings = 
{
	map : "Map1"
}

function onLoad(framework) 
{
	var scene = framework.scene;
	var camera = framework.camera;
	var renderer = framework.renderer;
	var gui = framework.gui;
	var stats = framework.stats;

	// Choose from accepted values
	gui.add(UserSettings, 'map', [ 'Map1', 'Map2', 'Map3' ] ).onChange(function(value) {
  
  		var path = 'images/map1.png';

  		if(value == 'Map2')
  			path = 'images/map2.png';
  		else if(value == 'Map3')
  			path = 'images/map3.png';

		var txLoader = new THREE.TextureLoader();
		txLoader.load(path, function(texture) {

			if(engine != null)
				scene.remove(engine.container);

			var texturePixels = loadTexturePixels(texture);
			engine = new Engine(16, 64, 750, texture, texturePixels);
			engine.initialize(scene);
		});
	});

	var txLoader = new THREE.TextureLoader();
	txLoader.load('images/map2.png', function(texture) {
		var texturePixels = loadTexturePixels(texture);
		engine = new Engine(16, 64, 750, texture, texturePixels);
		engine.initialize(scene);
	});

	// set camera position
	camera.position.set(20, 20, 20);
	camera.lookAt(new THREE.Vector3(0,0,0));
	camera.fov = 35;
	camera.updateProjectionMatrix();
}

function onResize(framework)
{
}

// called on frame updates
function onUpdate(framework) 
{
	if(engine != null)
		engine.update();
}

Framework.init(onLoad, onUpdate, onResize);
