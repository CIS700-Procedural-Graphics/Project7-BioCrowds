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
  searchRadius: 1.5,
  gridsize: 20, //technically = guiParameters.agentsize * 20, --> use that formula when making things dynamic
  gridCellDensity: 75,
  goal_x: 0.01,
  goal_z: 0.01
}

var grid = new Array(guiParameters.gridsize*guiParameters.gridsize);//each grid contains a list of markers
                                            //its a 1D array with samrt indexing, ie every xth row
                                            //is x*gridsize_z*gridCellDensity from the start
var agentList = [];
var allcurrentmarkers = [];

var markerindex;
var colors;

var particles_mesh = new THREE.Points( new THREE.BufferGeometry(), new THREE.PointsMaterial( { sizeAttenuation : false, size: 3.0, vertexColors: THREE.VertexColors } ) );
particles_mesh.geometry.dynamic = true;


//------------------------------------------------------------------------------

function changeGUI(gui, camera, scene)
{
  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });
  gui.add(guiParameters, 'gridCellDensity', 10, 500).onChange(function(newVal) {
    onreset(scene);
  });
  gui.add(guiParameters, 'numagents', 10, 50).step(1).onChange(function(newVal) {
    onreset(scene);
  });
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
  var material = new THREE.MeshBasicMaterial( {color: 0x000, side: THREE.DoubleSide} );
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

  spawnagents(scene);
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

//------------------------------------------------------------------------------

function markers(scene)
{
  //generate a grid and scatter randomly in each cell a bunch of points that serve as markers
  //each grid cell should have an individual list of markers --> this helps us quickly find the
  //markers near an agent based on the grid cell its in and those surrounding it

  var x,z;
  var randpos;
  var index;

  var num_particles = guiParameters.gridsize * guiParameters.gridsize * 250; //100 is the max gridcell density
  var positions = new Float32Array( num_particles * 3 );
  colors = new Float32Array( num_particles * 3 );

  for( var k = 0; k<250 ; k++)
  {
    for( var i = 0; i<20 ; i++)
    {
      for(var j = 0;  j<20 ; j++)
      {         
        x = Math.random() + i;
        z = Math.random() + j;

        randpos = new THREE.Vector3( x, 0.001, z );

        index = k*20*20 + 
                i*20 +
                j;

        markerindex = k*20*20*3 + 
                      i*20*3 +
                      j*3;

        positions[ markerindex ]     = randpos.x;
        positions[ markerindex + 1 ] = randpos.y;
        positions[ markerindex + 2 ] = randpos.z;

        colors[ markerindex ]     = k/100;
        colors[ markerindex + 1 ] = k/100;
        colors[ markerindex + 2 ] = k/100;

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

function spawnagents(scene)
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

function crowdSimUpdate()
{
  // Assigns markers based on the closest
  if(particles_mesh.geometry.attributes.color)
  {
    clearmarkers(agentList[i]);
  }

  for (var i = 0; i < agentList.length; i++) 
  {
    if(agentList[i])
    {
      getMarkers(agentList[i], i);
    }
  }

  if(particles_mesh.geometry.attributes.color)
  {
    assignMarkers();
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
  for(var i=0; i<allcurrentmarkers.length; i++)
  {    
    markerindex = allcurrentmarkers[i].markerindex;

    colors[ markerindex ]     = 0;
    colors[ markerindex + 1 ] = 0;
    colors[ markerindex + 2 ] = 0;

    allcurrentmarkers[i].closestDistance = 9999.0;
  }

  allcurrentmarkers = [];
}

function getMarkers(agent, agentindex)
{
  var agentPos = agent.position;
  var x = Math.floor(agentPos.x);
  var z = Math.floor(agentPos.z);
  var index;

  for( var k = 0; k<guiParameters.gridCellDensity ; k++)
  {
    for (var _i = -1; _i < 1; _i++) 
    {
      for (var _j=-1; _j < 1; _j++) 
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

        index = k*20*20 + 
                i*20 +
                j;

        var marker = grid[index];

        if ( ((agentPos.x + guiParameters.searchRadius) >= marker.position.x || 
              (agentPos.x - guiParameters.searchRadius) <= marker.position.x) && 
             ((agentPos.z + guiParameters.searchRadius) >= marker.position.z || 
              (agentPos.z - guiParameters.searchRadius) <= marker.position.z ) )
        {
          allcurrentmarkers.push(marker);       
        }
      }
    }
  }
}

function assignMarkers()
{
  for (var i = 0; i < allcurrentmarkers.length; i++) 
  {
    var minDistAgentIndex = -1;
    var marker = allcurrentmarkers[i];
    for (var j = 0; j < agentList.length; j++) 
    {
      var agentpos = agentList[j].position;
      var dist = agentpos.distanceTo(marker.position);

      if(dist<marker.closestDistance)
      {
        minDistAgentIndex = j;
        marker.closestDistance = dist;
      }
    }

    if(minDistAgentIndex != -1)
    {
      agentList[minDistAgentIndex].markers.push(marker);

      markerindex = marker.markerindex;

      colors[ markerindex ]     = agentList[minDistAgentIndex].color.r;
      colors[ markerindex + 1 ] = agentList[minDistAgentIndex].color.g;
      colors[ markerindex + 2 ] = agentList[minDistAgentIndex].color.b;
    }
  }
}

function moveAgent(agent)
{

  // temp_vector_to_goal.x = agent.goal.x - agent.position.x;
  // temp_vector_to_goal.y = agent.goal.y - agent.position.y;
  // temp_vector_to_goal.z = agent.goal.z - agent.position.z;

  // if (temp_vector_to_goal.length() < 0.5)
  //     continue;

  // for (var m = 0; m < markers.length; m++) {
      
  //     var marker = markers[m];
  //     temp_displacement.x = marker.position.x - agent.position.x;
  //     temp_displacement.y = marker.position.y - agent.position.y;
  //     temp_displacement.z = marker.position.z - agent.position.z;

  //     var dot = temp_displacement.dot(temp_vector_to_goal);
      
  //     var cos_theta = dot / (temp_displacement.length() * temp_vector_to_goal.length());
      
  //     marker.weight = (1.0 + cos_theta)  / (1.0 + temp_displacement.length());

  //     sum_weight += marker.weight;
      
  // }

  // for (var m = 0; m < markers.length; m++) {
      
  //     var marker = markers[m];
  //     temp_displacement.x = marker.position.x - agent.position.x;
  //     temp_displacement.y = marker.position.y - agent.position.y;
  //     temp_displacement.z = marker.position.z - agent.position.z;
      
  //     marker.weight = marker.weight / sum_weight;
      
  //     temp_vel.add(temp_displacement.multiplyScalar(marker.weight));
  // }
                  
  // agent.velocity = temp_vel.multiplyScalar(0.1*config.agent_speed);


  // agent.updatePosition(agents);
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
  guiParameters.goal_x = (-10.0 + Math.random() * 20.0);
  guiParameters.goal_z = (-10.0 + Math.random() * 20.0);

  markers(scene);
  scene.add(particles_mesh);

  colors = particles_mesh.geometry.attributes.color.array;

  spawnagents(scene);
}

// called on frame updates
function onUpdate(framework)
{
  crowdSimUpdate();
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
