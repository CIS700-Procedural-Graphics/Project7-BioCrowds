//skybox images from: https://github.com/simianarmy/webgl-skybox/tree/master/images

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
var OBJLoader = require('three-obj-loader');
var RAND = require('random-seed').create(Math.random());

import Agent from './agent'
import Marker from './marker'
OBJLoader(THREE);

//------------------------------------------------------------------------------
var PI = 3.14;
var Timer = new THREE.Clock();

var guiParameters = {
	numagents: 15,
	searchRadius: 1.0,
	gridsize: 20, //technically = guiParameters.agentsize * 20, --> use that formula when making things dynamic
	gridCellDensity: 20,
	maxmarkercount: 250,
	unoccupiedMarkerColor: [ 255, 255, 255 ],
	simulation: 1,
	obstacles: 2,
	pause: false
}

var grid = new Array(guiParameters.gridsize*guiParameters.gridsize);//each grid contains a list of markers
                                            //its a 1D array with samrt indexing, ie every xth row
                                            //is x*gridsize_z*gridCellDensity from the start
var agentList = [];

var markerindex;
var colors;

var particles_mesh = new THREE.Points( new THREE.BufferGeometry(), new THREE.PointsMaterial( { sizeAttenuation : false, size: 3.0, vertexColors: THREE.VertexColors } ) );
particles_mesh.geometry.dynamic = true;


//------------------------------------------------------------------------------

function changeGUI(gui, camera, scene)
{
	gui.add(guiParameters, 'simulation', { circle: 1, opposingLines: 2 } ).onChange(function(newVal){
		onreset(scene);
	});
	gui.add(guiParameters, 'obstacles', 2, 5).name("Number of Obstacles").step(1).onChange(function(newVal) {
		onreset(scene);
	});
	gui.add(guiParameters, 'gridCellDensity', 5, guiParameters.maxmarkercount).name("Marker Density").onChange(function(newVal) {
		onreset(scene);
	});
	gui.add(guiParameters, 'numagents', 2, 50).name("Number of Agents").step(1).onChange(function(newVal) {
		onreset(scene);
	});
	gui.add(guiParameters, 'pause').name("Pause").onChange(function(newVal) {});
}

//------------------------------------------------------------------------------

function setupLightsandSkybox(scene, camera, renderer)
{
  // Set light
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
  directionalLight.color.setHSL(0.1, 1, 0.95);
  directionalLight.position.set(1, 3, 2);
  directionalLight.position.multiplyScalar(10);
  scene.add(directionalLight);

  renderer.setClearColor( 0x000 );

  //set plane
  var geometry = new THREE.PlaneGeometry( guiParameters.gridsize, guiParameters.gridsize, 1 );
  var material = new THREE.MeshBasicMaterial( {color: 0x070707, side: THREE.DoubleSide} );
  var plane = new THREE.Mesh( geometry, material );
  plane.rotateX(90 * 3.14/180);
  plane.position.set(10,-0.02,10);
  scene.add( plane );

  var gridHelper = new THREE.GridHelper( guiParameters.gridsize*0.5, guiParameters.gridsize );
  gridHelper.position.set(10,0,10);
  scene.add( gridHelper );

  // set camera position
  camera.position.set(10, 13, 10);
  camera.lookAt(new THREE.Vector3(10,0,10));
}

function onreset(scene)
{
	cleanscene(scene);
	addPlaneAndMarkers(scene);
	resetMarkers();
	generateObstacles(scene)
}

function addPlaneAndMarkers(scene)
{
	//set plane
	var geometry = new THREE.PlaneGeometry( guiParameters.gridsize, guiParameters.gridsize, 1 );
	var material = new THREE.MeshBasicMaterial( {color: 0x000, side: THREE.DoubleSide} );
	var plane = new THREE.Mesh( geometry, material );
	plane.rotateX(90 * 3.14/180);
	plane.position.set(10,-0.02,10);
	scene.add( plane );

	var gridHelper = new THREE.GridHelper( guiParameters.gridsize*0.5, guiParameters.gridsize );
	gridHelper.position.set(10,0,10);
	scene.add( gridHelper );

	particles_mesh.geometry.setDrawRange( 0, guiParameters.gridsize * guiParameters.gridsize * guiParameters.gridCellDensity );
	scene.add(particles_mesh);

	if(guiParameters.simulation == 1)
	{
		spawnagents_circle(scene);
	}
	else
	{
		spawnagents_line(scene);
	}	
}

function cleanscene(scene)
{
  //remove all objects from the scene
  for( var i = scene.children.length - 1; i >= 0; i--)
  {
    var obj = scene.children[i];
    scene.remove(obj);
  }
}

function resetMarkers()
{
	for( var k = 0; k<guiParameters.maxmarkercount ; k++)
	{
		for( var i = 0; i<guiParameters.gridsize ; i++)
		{
			for(var j = 0;  j<guiParameters.gridsize ; j++)
			{
				var index = k*guiParameters.gridsize*guiParameters.gridsize + i*guiParameters.gridsize + j;

				markerindex = k*guiParameters.gridsize*guiParameters.gridsize*3 + i*guiParameters.gridsize*3 + j*3;

				colors[ markerindex ]     = guiParameters.unoccupiedMarkerColor[0];
				colors[ markerindex + 1 ] = guiParameters.unoccupiedMarkerColor[1];
				colors[ markerindex + 2 ] = guiParameters.unoccupiedMarkerColor[2];

				grid[index].closestDistance = 9999.0;
				grid[index].ownerindex = -1;
			}
		}
	}

	particles_mesh.geometry.attributes.color.needsUpdate = true;
}

//------------------------------------------------------------------------------

function markers(scene)
{
	//generate a grid and scatter randomly in each cell a bunch of points that serve as markers
	//each grid cell should have an individual list of markers --> this helps us quickly find the
	//markers near an agent based on the grid cell its in and those surrounding it
	var x,z;
	var randpos;
	var index;

	var num_particles = guiParameters.gridsize * guiParameters.gridsize * guiParameters.maxmarkercount; //100 is the max gridcell density
	var positions = new Float32Array( num_particles * 3 );
	colors = new Float32Array( num_particles * 3 );

	for( var k = 0; k<guiParameters.maxmarkercount ; k++)
	{
		for( var i = 0; i<guiParameters.gridsize ; i++)
		{
			for(var j = 0;  j<guiParameters.gridsize ; j++)
			{
				x = Math.random() + i;
				z = Math.random() + j;

				randpos = new THREE.Vector3( x, 0.001, z );

				index = k*guiParameters.gridsize*guiParameters.gridsize + i*guiParameters.gridsize + j;

				markerindex = k*guiParameters.gridsize*guiParameters.gridsize*3 + i*guiParameters.gridsize*3 + j*3;

				positions[ markerindex ]     = randpos.x;
				positions[ markerindex + 1 ] = randpos.y;
				positions[ markerindex + 2 ] = randpos.z;

				colors[ markerindex ]     = guiParameters.unoccupiedMarkerColor[0];
				colors[ markerindex + 1 ] = guiParameters.unoccupiedMarkerColor[1];
				colors[ markerindex + 2 ] = guiParameters.unoccupiedMarkerColor[2];

				grid[index] = new Marker( randpos, markerindex );
			}
		}
	}

	particles_mesh.geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
	particles_mesh.geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
	particles_mesh.geometry.attributes.color.dynamic = true;

	// draw range
	particles_mesh.geometry.setDrawRange( 0, guiParameters.gridsize * guiParameters.gridsize * guiParameters.gridCellDensity );
}

function spawnagents_circle(scene)
{
	agentList = [];
	var segments = guiParameters.numagents;
	var radius = Math.sqrt(guiParameters.gridsize*guiParameters.gridsize*0.25 + guiParameters.gridsize*guiParameters.gridsize*0.25)
	var circlegeo = new THREE.CircleGeometry( radius*0.5, guiParameters.numagents ); //radius, segments
	circlegeo.rotateX(-PI*0.5);
	circlegeo.translate(10,0,10);

	for(var i=1; i<(segments+1); i++)
	{
		var pos = new THREE.Vector3( circlegeo.vertices[i].x, circlegeo.vertices[i].y, circlegeo.vertices[i].z);

		var oppIndex = (i+Math.ceil(segments*0.5))%segments;
		if(oppIndex == 0)
		{
			oppIndex = segments;
		}
		var _goal = new THREE.Vector3( circlegeo.vertices[oppIndex].x,
									   circlegeo.vertices[oppIndex].y,
									   circlegeo.vertices[oppIndex].z );

		var vel = new THREE.Vector3((pos.x - _goal.x),
									(pos.y - _goal.y),
									(pos.z - _goal.z));

		var agent_mat = new THREE.MeshBasicMaterial();
		agent_mat.color = new THREE.Color( RAND.random(), RAND.random(), RAND.random() );

		var agent = new Agent(pos, vel, _goal, agent_mat, agent_mat.color);
		agentList.push(agent);
		agentList[i-1].drawagent(scene);
	}
}

function spawnagents_line(scene)
{
	agentList = [];

	for(var i=0; i<guiParameters.numagents; i++)
	{
		var xpos = (i/guiParameters.numagents)*guiParameters.gridsize*0.95 ;

		var pos = new THREE.Vector3( xpos+0.65, 0.001, 2.0 );
		var _goal = new THREE.Vector3( xpos+0.65, 0.1, 18.0 );
		var vel = new THREE.Vector3((pos.x - _goal.x), (pos.y - _goal.y), (pos.z - _goal.z));

		var agent_mat = new THREE.MeshBasicMaterial();
		agent_mat.color = new THREE.Color( RAND.random(), RAND.random(), RAND.random() );

		var agent = new Agent(pos, vel, _goal, agent_mat, agent_mat.color);

		agentList.push(agent);
		agentList[i].drawagent(scene);
	}
}

//------------------------------------------------------------------------------

function crowdSimUpdate()
{
	// Assigns markers based on the closest
	for (var i = 0; i < agentList.length; i++) 
	{
		if(agentList[i] && particles_mesh.geometry.attributes.color)
		{
			clearmarkers(agentList[i]);
		}
	}

	for (var i = 0; i < agentList.length; i++) 
	{
		if(agentList[i])
		{
			getMarkers(agentList[i], i);
		}
	}

	for (var i = 0; i < agentList.length; i++) 
	{
		if(agentList[i])
		{
			colorMarkers(agentList[i]);
		}
	}

	if(particles_mesh.geometry.attributes.color)
	{
		particles_mesh.geometry.attributes.color.needsUpdate = true;
	}

	for (var i = 0; i < agentList.length; i++) 
	{
		if(agentList[i])
		{
			agentList[i].updateAgent();
		}
	}
}

function clearmarkers(agent)
{
	for(var i=0; i<agent.markers.length; i++)
	{
		markerindex = agent.markers[i].markerindex;

		colors[ markerindex ]     = 0;
		colors[ markerindex + 1 ] = 0;
		colors[ markerindex + 2 ] = 0;

		agent.markers[i].ownerindex = -1;
		agent.markers[i].closestDistance = 9999.0;
	}

	agent.markers = [];
}

function getMarkers(agent, agentindex)
{
	var agentPos = agent.position;
	var x = Math.floor(agentPos.x);
	var z = Math.floor(agentPos.z);
	var index;

	for( var k = 0; k<guiParameters.gridCellDensity ; k++)
	{
		for (var _i = -1; _i <= 1; _i++) 
		{
			for (var _j=-1; _j <= 1; _j++) 
			{
				var i = x+_i;
				var j = z+_j;

				if(i<0)
				{
					i=0;
				}
				else if(i>=guiParameters.gridsize)
				{
					i=guiParameters.gridsize-1;
				}
				if(j<0)
				{
					j=0;
				}
				else if(j>=guiParameters.gridsize)
				{
					j=guiParameters.gridsize-1;
				}

				index = k*guiParameters.gridsize*guiParameters.gridsize + i*guiParameters.gridsize + j;

				var marker = grid[index];

				var mpos = marker.position;
				var dist_r = agentPos.distanceTo(mpos);

				if(dist_r < guiParameters.searchRadius)
				{
					var dist = agentPos.distanceTo(mpos);

					if(dist<marker.closestDistance)
					{
						marker.closestDistance = dist;

						//remove marker from previous agent
						if(marker.ownerindex != -1)
						{
							colors[ markerindex ]     = guiParameters.unoccupiedMarkerColor[0];
							colors[ markerindex + 1 ] = guiParameters.unoccupiedMarkerColor[1];
							colors[ markerindex + 2 ] = guiParameters.unoccupiedMarkerColor[2];
							agentList[marker.ownerindex].markers.splice(marker.ownermarkerindex, 1);
						}				

						//add marker to new agent
						marker.ownerindex = agentindex;
						marker.ownermarkerindex = agent.markers.length;
						
						markerindex = marker.markerindex;

						marker.color.r = agent.color.r;
						marker.color.g = agent.color.g;
						marker.color.b = agent.color.b;

						agent.markers.push(marker);
					}
        		}
      		}
		}
  	}
}

function colorMarkers(agent)
{
	for( var i = 0; i<agent.markers.length ; i++)
	{
		var marker = agent.markers[i];

		colors[ marker.markerindex ]     = marker.color.r;
		colors[ marker.markerindex + 1 ] = marker.color.g;
		colors[ marker.markerindex + 2 ] = marker.color.b;
	}
}

//------------------------------------------------------------------------------

function generateObstacles(scene)
{
	for(var i=0; i<guiParameters.obstacles ;i++)
	{
		var obstaclepos = new THREE.Vector3(0,0,0);
		var obstacleradius = Math.random()*1.5 + 0.3;
		obstaclepos.x = obstacleradius + (Math.random() * (guiParameters.gridsize - obstacleradius*2));
		obstaclepos.y = 0.2;
		obstaclepos.z = obstacleradius + (Math.random() * (guiParameters.gridsize - obstacleradius*2));

		var obstacleGeo = new THREE.CylinderGeometry( obstacleradius, obstacleradius, 0.3, 24 );
		var obstacleMat = new THREE.MeshBasicMaterial( {color: 0xffff00} );
		var obstacle = new THREE.Mesh( obstacleGeo, obstacleMat );

		obstacle.position.set( obstaclepos.x, obstaclepos.y, obstaclepos.z );
		scene.add( obstacle );

		//deactivate overlapping markers
		deactivateOverlappingMarkers(obstacle.position, obstacleradius);
		//make sure agents don't spawn on them or even near them
	}
}

function deactivateOverlappingMarkers(obstaclePos, obstacleRadius)
{
	for( var k = 0; k<guiParameters.maxmarkercount ; k++)
	{
		for( var i = 0; i<guiParameters.gridsize ; i++)
		{
			for(var j = 0;  j<guiParameters.gridsize ; j++)
			{
				var index = k*guiParameters.gridsize*guiParameters.gridsize + i*guiParameters.gridsize + j;
				var marker = grid[index];

				var dist = obstaclePos.distanceTo(marker.position);

				if(dist<(obstacleRadius+0.5))
				{
					marker.closestDistance = -9999.0;

					//uncomment to see markers affected by the obstacle
					// colors[ marker.markerindex ]     = 255;
					// colors[ marker.markerindex + 1 ] = 0;
					// colors[ marker.markerindex + 2 ] = 0;
				}
			}
		}
	}
}

//------------------------------------------------------------------------------
// called after the scene loads
function onLoad(framework)
{
	var scene = framework.scene;
	var camera = framework.camera;
	var renderer = framework.renderer;
	var gui = framework.gui;
	var stats = framework.stats;

	setupLightsandSkybox(scene, camera, renderer);
	changeGUI(gui, camera, scene);

	markers(scene);
	scene.add(particles_mesh);

	colors = particles_mesh.geometry.attributes.color.array;

	generateObstacles(scene);

	spawnagents_circle(scene);
}

// called on frame updates
function onUpdate(framework)
{
	if(!guiParameters.pause)
	{
		crowdSimUpdate();
	}
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
