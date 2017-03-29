
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import Noise from './noise'
import {other} from './noise'


// ====================================================== GLOBAL VARIABLES ======================================================
var globalMarkersList = [];
var globalAgentsList = [];
var numAgents = 20;

//creates 20x20 grid, 121 vertices, each grid cell has width & height of 2
var gridDivisions = 10;
var gridDimension = 20;
var gridWidth = gridDimension;
var gridHeight = gridDimension;

var agentMeshRadius = 0.25;
var clock = new THREE.Clock();

var geometry = null;
var particles = null;

var guiVars = function() {
  this.simulation1 = false;
  this.simulation2 = false;
}

var guiVariables = {
  SimulationType : 1
}

// ====================================================== ON LOAD FUNCTION ======================================================
// called after the scene loads
function onLoad(framework) {
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;
  var stats = framework.stats;

  // set camera position
  camera.position.set(1, 1, 50);
  camera.lookAt(new THREE.Vector3(0,0,0));

  // edit params and listen to changes like this
  // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });


  // ========================== SCENE SET UP ==========================

  //add a starfield to the background of a scene
  var starsGeometry = new THREE.Geometry();
  for ( var i = 0; i < 10000; i ++ ) {
  	var star = new THREE.Vector3();
  	star.x = THREE.Math.randFloatSpread( 2000 );
  	star.y = THREE.Math.randFloatSpread( 2000 );
  	star.z = THREE.Math.randFloatSpread( 2000 );
  	starsGeometry.vertices.push( star )
  }//end for loop
  var starsMaterial = new THREE.PointsMaterial( { color: 0x888888 } );
  var starField = new THREE.Points( starsGeometry, starsMaterial );
  starField.userData = { keepMe: true };
  scene.add( starField );


  //create ground plane
  var gridGeometry = new THREE.PlaneGeometry( gridWidth, gridHeight, gridDivisions, gridDivisions); //width, height, widthSegments, heightSegments
  gridGeometry.rotateX(Math.PI / 2.0);  //make the grid flat
  gridGeometry.translate(gridDivisions, 0.0, gridDivisions);  //move grid so that it starts at (0, 0, 0) on bottom left corner
  var gridMaterial = new THREE.MeshBasicMaterial( {color: 0xf00fff, side: THREE.DoubleSide, wireframe: true} );
  var grid = new THREE.Mesh( gridGeometry, gridMaterial );
  grid.userData = { keepMe: true };
  scene.add( grid );


  // ========================== START SIMULATIONS ==========================
  //spawn agents with specified goal points

  gui.add(guiVariables, 'SimulationType', { Simulation1 : 1, Simulation2 : 2, Simulation3 : 3} ).onChange(function(newVal) {
    clearScene2(scene, newVal);
  });


}//end onLoad

  // ====================================================== ON UPDATE FUNCTION ======================================================
// called on frame updates
function onUpdate(framework) {
  var deltaT = clock.getDelta();


  //for every agent
  for(var i = 0; i < globalAgentsList.length; i++)
  {
    var currAgent = globalAgentsList[i];

    //empty out the agent's markers list. reassign below
    currAgent.markers = [];

    //find the grid cell neighbors of the current agent
    var agentNeighborCells = getClosestCells(currAgent.position, gridDivisions, gridWidth, gridHeight);


    //keep track of markers within agent's neighborhood
    var distAgentToMarker = [];

    //only iterate through globalMarkersList for each cell in the agent's neighborhood
    for(var j = agentNeighborCells[0].startX; j <= agentNeighborCells[0].endX; j += gridWidth)
    {
      for(var k = agentNeighborCells[0].startY; k <= agentNeighborCells[0].endY; k += gridHeight)
      {
        //find the markers within the neighborhood area of the agent
        for(var l = 0; l < globalMarkersList.length; l++)
        {
          var currMarker = globalMarkersList[l];

          //if the marker is in the neighborhood area, calculate its distance to agent and add it to distAgentToMarker list
          if(currMarker.position.x >= agentNeighborCells[0].startX && currMarker.position.x <= agentNeighborCells[0].endX)
          {
            if(currMarker.position.z >= agentNeighborCells[0].startY && currMarker.position.z <= agentNeighborCells[0].endY)
            {
              var dist = Math.sqrt(Math.pow(currMarker.position.x - currAgent.position.x, 2) +
                                    Math.pow(currMarker.position.y - currAgent.position.y, 2) +
                                    Math.pow(currMarker.position.z - currAgent.position.z, 2));

              distAgentToMarker.push({key: dist, value: currMarker});

              //if marker isn't already owned, set its agent to be dist. and add to agent's marker list
              //else, do the same but if only current marker's agent is < dist
              if(currMarker.agent == -1)
              {
                currMarker.agent = dist;
                currAgent.markers.push(currMarker);
              }
              else      //if marker is owned, but new dist is less than current one, update it
              {
                if(dist < currMarker.agent)
                {
                  currMarker.agent = dist;
                  currAgent.markers.push(currMarker);
                }
              }//end else


            }//end Y check
          }//end X check
        }//end for marker


      }//end for grid cell y
    }//end for grid cell x



    //calculate agent's velocity (should be zero if no markers)
    var agentV = new THREE.Vector3(0.0, 0.0, 0.0);
    if(currAgent.markers.length > 0)
    {
      //calculate weight sum of agent's markers
      var weightSum = 0.0;
      for(var n = 0; n < currAgent.markers.length; n++)
      {
        var _marker = currAgent.markers[n];
        var markerWeight = 0.0;

        var _m = new THREE.Vector3(_marker.position.x - currAgent.position.x, _marker.position.y - currAgent.position.y, _marker.position.z - currAgent.position.z);
        var _g = new THREE.Vector3(currAgent.goal.x - currAgent.position.x, currAgent.goal.y - currAgent.position.y, currAgent.goal.z - currAgent.position.z);
        if(_m.length() >= 0.0001 || _g.length() >= 0.0001)
        {
          //use the equation w = 1 + cos 0 (don't divide 1 + ||m||)
          markerWeight = 1.0 + (_m.dot(_g) / (_m.length() * _g.length()));
        }
        weightSum += markerWeight;
      }//end for agent's markers


      //calculate markers' velocity and sum them
      var markerV = new THREE.Vector3(0.0, 0.0, 0.0);
      for(var p = 0; p < currAgent.markers.length; p++)
      {
        var _marker = currAgent.markers[p];
        var markerWeight = 0.0;

        var _m = new THREE.Vector3(_marker.position.x - currAgent.position.x, _marker.position.y - currAgent.position.y, _marker.position.z - currAgent.position.z);
        var _g = new THREE.Vector3(currAgent.goal.x - currAgent.position.x, currAgent.goal.y - currAgent.position.y, currAgent.goal.z - currAgent.position.z);
        if(_m.length() >= 0.0001 || _g.length() >= 0.0001)
        {
          //use the equation w = 1 + cos 0 (don't divide 1 + ||m||)
          markerWeight = 1.0 + (_m.dot(_g) / (_m.length() * _g.length()));
          markerV = new THREE.Vector3(_m.x * (markerWeight / weightSum), _m.y * (markerWeight / weightSum), _m.z * (markerWeight / weightSum));
        }

        agentV = new THREE.Vector3(agentV.x + markerV.x, agentV.y + markerV.y, agentV.z + markerV.z);

      }//end for agent's markers
    }//end if agent's marker list is nonzero

    agentV = new THREE.Vector3(agentV.x * deltaT, agentV.y * deltaT, agentV.z * deltaT);

    //cap the velocity to make sure agents don't collide with each other
    var velocityCap = currAgent.radius - agentMeshRadius;

    var velocityMagnitude = agentV.length();
    if(velocityMagnitude > velocityCap)
    {
      agentV = agentV.normalize() * velocityCap;
    }

    //give the agents a little nudge towards goal in case they get stuck
    if(agentV.length() < 0.003)
    {
      var factor = 0.001;
      agentV = new THREE.Vector3(agentV.x + factor * (currAgent.goal.x - currAgent.position.x), agentV.y + factor * (currAgent.goal.y - currAgent.position.y), agentV.z + factor * (currAgent.goal.z - currAgent.position.z));

      // agentV = new THREE.Vector3(agentV.x + (0.1 * currAgent.goal.x), agentV.y + (0.1 * currAgent.goal.y), agentV.z + (0.1 * currAgent.goal.z));   //(this shoots agents off the grid)
    }

    //ONCE I GET THE FINAL POSITION, reassign the agent's mesh position to it
    currAgent.velocity = agentV;
    currAgent.position = new THREE.Vector3(currAgent.position.x + agentV.x, currAgent.position.y + agentV.y, currAgent.position.z + agentV.z);
    currAgent.mesh.position.set(currAgent.position.x, currAgent.position.y, currAgent.position.z);

  }//end for all agents


}//end onUpdate



// ====================================================== AGENT CLASS ======================================================
function Agent(pos, vel, goal, orientation, radius, markers, mesh)
{
  this.position = pos;              //vector3 (no Y)
  this.velocity = vel;              //vector3 (no Y)
  this.goal = goal;                 //vector3 (no Y)
  this.orientation = orientation;   //vector3 (no Y)
  this.radius = radius;             //number
  this.markers = markers;           //list of Marker class objects
  this.mesh = mesh;                 //Cylinder geometry
}//end constructor

// ====================================================== MARKER CLASS ======================================================
function Marker(id, pos, neighbors, agent)
{
  this.id = id;                   //number
  this.position = pos;            //vector3
  this.neighbors = neighbors;     //list of grid cells in form of {startx, starty, endx, endy} dimensions of grid cell)
  this.agent = agent;             //number (if it's -1, then no agent owns it, else an agent owns it)
}

// ====================================================== GET CLOSEST CELLS ======================================================
//find the domain and range of grid cell neighbors for each marker
function getClosestCells(_currPos, gridDiv, gridW, gridH)
{
  var neighbors = [];
  var boxWidth = gridW / gridDiv;
  var boxHeight = gridH / gridDiv;
  var _startX = 0.0;
  var _startY = 0.0;
  var _endX = 0.0;
  var _endY = 0.0;

  //establish current grid cell boundaries of agent
  for(var i = 0; i < gridW; i += boxWidth)
  {
    if(_currPos.x >= i && _currPos.x <= i + boxWidth)
    {
      _startX = i;
      _endX = i + boxWidth;
    }
  }

  for(var j = 0; j < gridH; j += boxHeight)
  {
    if(_currPos.z >= j && _currPos.z <= j + boxHeight)
    {
      _startY = j;
      _endY = j + boxHeight;
    }
  }

  //boundary cases
  if(_startX == 0)
  {
    _startX += boxWidth;
  }
  if(_startX == 20)
  {
    _startX -= boxWidth;
  }

  if(_startY == 0)
  {
    _startY += boxHeight;
  }
  if(_startY == 20)
  {
    _startY -= boxHeight;
  }

  if(_endX == 20)
  {
    _endX -= boxWidth;
  }
  if(_endY == 20)
  {
    _endY -= boxHeight;
  }

  //either multiply the values in if cases by 2 or subtract and add boxWidth and boxHeight here
  neighbors.push({startX: _startX - boxWidth, startY: _startY - boxHeight, endX: _endX + boxWidth, endY: _endY + boxHeight});

  return neighbors;
}

function clearScene2(scene, val) {
    var to_remove = [];

    scene.traverse ( function( child ) {
        if ( !child.userData.keepMe === true ) {
            to_remove.push( child );
         }
    } );

    for ( var i = 0; i < to_remove.length; i++ ) {
        scene.remove( to_remove[i] );
    }

    //refresh the lists before each simulation
    globalAgentsList = [];
    particles = [];

    scatterMarkers(scene);

    if(val == 1)
    {
      createSimulation1(scene);
    }
    else if(val == 2)
    {
      createSimulation2(scene);
    }
    else {
      createSimulation3(scene);
    }
}

function scatterMarkers(scene)
{
  var sampleDensity = 6;
  var sqrtVal = gridDimension * sampleDensity;
  var numSamples = sqrtVal * sqrtVal;
  var invSqrtVal = 1.0 / (sqrtVal);
  particles = new THREE.Geometry();

  for(var i = 0; i < numSamples; i++)
  {
    var x = 1.0 * Math.floor(i % sqrtVal);
    var y = 1.0 * Math.floor(i / sqrtVal);

    var sample_X = (x + Math.random()) * gridDimension / sqrtVal;
    var sample_Y = (y + Math.random()) * gridDimension / sqrtVal;

    var sample = new THREE.Vector3(sample_X, 0.0, sample_Y);

    var newMarker = new Marker(i, sample, [], -1);
    globalMarkersList.push(newMarker);

    particles.vertices.push(new THREE.Vector3(sample.x, sample.y, sample.z));
  }//end for loop

  var particleMaterial = new THREE.PointsMaterial({ color: 0x00ff00, size: 0.15 } );
  var particlesField = new THREE.Points(particles, particleMaterial);
  //particlesField.userData = {keepMe: true};
  scene.add(particlesField);
}

function createSimulation1(scene)
{
  globalAgentsList = [];
  for(var i = 0; i < numAgents; i++)
  {
      //starting positions both groups of agents are opposite sides of each other, with goals being the other side
      var startPos = null;
      var startVel = null;
      var goal = null;
      var startOrient = null;
      var radius = null;
      var agentMarkers = null;  //THIS SHOULD CONSTANTLY BE CHANGING. NEED TO CREATE FUNCTION THAT GIVES AGENT ITS MARKERS
      var agent = null;
      var agentMesh = null;

      startPos = new THREE.Vector3(i, 0.0, 0.0);    //for 10 markers: i * 2.0 + 1, 0.0, 0.0
      goal = new THREE.Vector3(i, 0.0, gridDimension);

      startVel = new THREE.Vector3(0.0, 0.0, 0.0);
      startOrient = new THREE.Vector3(goal.x - startPos.x, goal.y - startPos.y, goal.z - startPos.z);
      radius = 3;
      agentMarkers = [];

      //create new mesh for the agent and assign its position and orientation with the ones above
      var cylinderGeo = new THREE.CylinderGeometry( agentMeshRadius, agentMeshRadius, agentMeshRadius);    //radius top, radius bottom, height, radius segments, height segments
      var cylinderMaterial = new THREE.MeshBasicMaterial( {color: 0x0000ff} );
      agentMesh = new THREE.Mesh( cylinderGeo, cylinderMaterial );
      agentMesh.position.set(startPos.x, startPos.y, startPos.z);
      scene.add( agentMesh );

      agent = new Agent(startPos, startVel, goal, startOrient, radius, agentMarkers, agentMesh);
      globalAgentsList.push(agent);

  }//end for every agent
}

function createSimulation2(scene)
{
  globalAgentsList = [];
  for(var i = 0; i < numAgents; i++)
  {
    var startPos = null;
    var startVel = null;
    var goal = null;
    var startOrient = null;
    var radius = null;
    var agentMarkers = null;
    var agent = null;
    var agentMesh = null;

      if(i % 2 == 0)  //blue agents
      {
        startPos = new THREE.Vector3(i * 1.0 + 1.0, 0.0, 0.0);
        goal = new THREE.Vector3(i * 1.0 + 1.0, 0.0, gridDimension);

        startVel = new THREE.Vector3(0.0, 0.0, 0.0);
        startOrient = new THREE.Vector3(goal.x - startPos.x, goal.y - startPos.y, goal.z - startPos.z);
        radius = 3;
        agentMarkers = [];

        //create new mesh for the agent and assign its position and orientation with the ones above
        var cylinderGeo = new THREE.CylinderGeometry( agentMeshRadius, agentMeshRadius, agentMeshRadius);    //radius top, radius bottom, height, radius segments, height segments
        var cylinderMaterial = new THREE.MeshBasicMaterial( {color: 0x0000ff} );
        agentMesh = new THREE.Mesh( cylinderGeo, cylinderMaterial );
        agentMesh.position.set(startPos.x, startPos.y, startPos.z);
        scene.add( agentMesh );

        agent = new Agent(startPos, startVel, goal, startOrient, radius, agentMarkers, agentMesh);
        globalAgentsList.push(agent);
      }//end if
      else    //red agents
      {
        startPos = new THREE.Vector3(i * 1.0, 0.0, gridDimension);
        goal = new THREE.Vector3(i * 1.0, 0.0, 0.0);

        startVel = new THREE.Vector3(0.0, 0.0, 0.0);
        startOrient = new THREE.Vector3(goal.x - startPos.x, goal.y - startPos.y, goal.z - startPos.z);
        radius = 3;
        agentMarkers = [];

        //create new mesh for the agent and assign its position and orientation with the ones above
        var cylinderGeo = new THREE.CylinderGeometry( agentMeshRadius, agentMeshRadius, agentMeshRadius);    //radius top, radius bottom, height, radius segments, height segments
        var cylinderMaterial = new THREE.MeshBasicMaterial( {color: 0xff0000} );
        agentMesh = new THREE.Mesh( cylinderGeo, cylinderMaterial );
        agentMesh.position.set(startPos.x, startPos.y, startPos.z);
        scene.add( agentMesh );

        agent = new Agent(startPos, startVel, goal, startOrient, radius, agentMarkers, agentMesh);
        globalAgentsList.push(agent);
      }//end else
  }//end for loop
}


function createSimulation3(scene)
{
  globalAgentsList = [];
  for(var i = 0; i < numAgents; i++)
  {
      //starting positions both groups of agents are opposite sides of each other, with goals being the other side
      var startPos = null;
      var startVel = null;
      var goal = null;
      var startOrient = null;
      var radius = null;
      var agentMarkers = null;
      var agent = null;
      var agentMesh = null;

      var circleRadius = 8;
      startPos = new THREE.Vector3(circleRadius * Math.cos(Math.PI * i / 2.0) + gridDimension / 2,
                                    0.0,
                                    circleRadius * Math.sin(Math.PI * i / 2.0) + gridDimension / 2);
      goal = new THREE.Vector3(gridDimension / 2, 0, gridDimension / 2);

      startVel = new THREE.Vector3(0.0, 0.0, 0.0);
      startOrient = new THREE.Vector3(goal.x - startPos.x, goal.y - startPos.y, goal.z - startPos.z);
      radius = 3;
      agentMarkers = [];

      //create new mesh for the agent and assign its position and orientation with the ones above
      var cylinderGeo = new THREE.CylinderGeometry( agentMeshRadius, agentMeshRadius, agentMeshRadius);    //radius top, radius bottom, height, radius segments, height segments
      var cylinderMaterial = new THREE.MeshBasicMaterial( {color: 0x0000ff} );
      agentMesh = new THREE.Mesh( cylinderGeo, cylinderMaterial );
      agentMesh.position.set(startPos.x, startPos.y, startPos.z);
      scene.add( agentMesh );

      agent = new Agent(startPos, startVel, goal, startOrient, radius, agentMarkers, agentMesh);
      globalAgentsList.push(agent);

  }//end for every agent
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
