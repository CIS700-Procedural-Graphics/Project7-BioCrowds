
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

var clock = new THREE.Clock();
var t = 0.0;

var grid = [];
var agents = [];
var markers = [];
var settings = {
  minMarkersPerGrid: 1,
  maxMarkersPerGrid: 1,
  //markersResolution: 2,
  gridResolution: 80,
  agentRadius: 0.5,
  numAgents: 20,
  displayMarkers: true
};


// returns a pair of ints to access grid
function coordToGrid(x, y) {
  return new THREE.Vector2(Math.floor((x + 5.0) * settings.gridResolution / 10.0), Math.floor((y + 5.0) * settings.gridResolution / 10.0));
}

// returns a centerpoint of the grid
function gridToCoord(x, y) {
  return new THREE.Vector2((x + 0.5) * 10.0 / settings.gridResolution - 5.0, (y + 0.5) * 10.0 / settings.gridResolution - 5.0)
}

var Agent = function(pos, vel, tgt) {
  return {
    position: new THREE.Vector3(pos.x, pos.y, pos.z),
    velocity: new THREE.Vector3(vel.x, vel.y, vel.z),
    target: new THREE.Vector3(tgt.x, tgt.y, tgt.z),
    markers: []
  }
}

var Marker = function(pos, agent) {
  return {
    pos: new THREE.Vector3(pos.x, pos.y, pos.z),
    agent: null
  }
}

function GridSquare(m, a) {
  this.markers = m;
  this.agents = a;
}

function generateGrid() {
  grid = []; // reset grid

  for (var i = 0; i < settings.gridResolution; i++) {
    var row = [];
    for (var j = 0; j < settings.gridResolution; j++) {
      var square = new GridSquare([], []);
      var numMarkers = Math.floor(Math.random() * 
        (1 + settings.maxMarkersPerGrid - settings.minMarkersPerGrid)) + settings.minMarkersPerGrid;
      var center = gridToCoord(i, j);
      for (var m = 0; m < numMarkers; m++)  {
        var shift = new THREE.Vector2((Math.random() - 0.5) * 10.0 / settings.gridResolution, 
          (Math.random() - 0.5) * 10.0 / settings.gridResolution);
        shift = shift.addVectors(shift, center);
        var marker = new Marker(new THREE.Vector3(shift.x, 0, shift.y), null);
        square.markers.push(marker);
        markers.push(marker);
      }

      row.push(square);
    }
    grid.push(row);

  }
}

function generateAgents(scene) {
  agents = []; // reset agents

  var agentsMat = new THREE.MeshPhongMaterial( {
    side: THREE.DoubleSide,
    color: 0xaa1111
  });
  var agentsGeo = new THREE.SphereGeometry(0.1);

  for (var i = 0; i < settings.numAgents; i++) {
    var theta = Math.PI * 2 * i / settings.numAgents;
    var p = (new THREE.Vector3(Math.cos(theta), 0.01, Math.sin(theta))).multiplyScalar(4.5);
    var t = (new THREE.Vector3(Math.cos(theta + Math.PI), 0.01, Math.sin(theta + Math.PI))).multiplyScalar(4.5);
    var cell = coordToGrid(p.x, p.z);

    var agent = new Agent(p, new THREE.Vector3(0,0,0), t);
    var aMesh = new THREE.Mesh(agentsGeo, agentsMat);
    aMesh.userData.agentID = i;
    aMesh.position.set(p.x, 0.1, p.z);
    scene.add(aMesh);
    agents.push(agent);
    grid[cell.x][cell.y].agents.push(agent);
  }
}

function generateAgentsRows(scene) {
  agents = []; // reset agents

  var agentsMat = new THREE.MeshPhongMaterial( {
    side: THREE.DoubleSide,
    color: 0xaa1111
  });
  var agentsGeo = new THREE.SphereGeometry(0.1);

  for (var i = 0; i < settings.numAgents; i++) {
    var sign = i % 2 == 0;
    var s = sign?1:-1;
    var p = new THREE.Vector3(i / settings.numAgents * 9 - 4.5, 0.01, s * -4.5);
    var t = new THREE.Vector3(i / settings.numAgents * 9 - 4.5, 0.01, s * 4.5); 
    var cell = coordToGrid(p.x, p.z);

    var agent = new Agent(p, new THREE.Vector3(0,0,0), t);
    var aMesh = new THREE.Mesh(agentsGeo, agentsMat);
    aMesh.userData.agentID = i;
    aMesh.position.set(p.x, 0.1, p.z);
    scene.add(aMesh);
    agents.push(agent);
    grid[cell.x][cell.y].agents.push(agent);
  }
}



function setWeightedVel(agent) {
  var pos = agent.position;
  var tgt = agent.target;
  var toTarget = (new THREE.Vector3(0, 0, 0)).subVectors(tgt, pos);
  toTarget.y = 0;
  if (toTarget.length() < 0.01) {
    return;
  }

  // sum and record all weights
  var totalWeight = 0.0;
  var weights = [];
  var displacements = [];

  for (var m = 0; m < agent.markers.length; m++) {
    var mpos = agent.markers[m].pos;
    var toMark = (new THREE.Vector3(0, 0, 0)).subVectors(mpos, pos);
    toMark.y = 0.0;
    var wf = 1.0 / (1.0 + toMark.length());
    
    wf = wf * (1.0 + toMark.dot(toTarget) / toMark.length() / toTarget.length());
    totalWeight += wf;
    weights.push(wf);
    displacements.push(toMark);
  }


  var totalVelocity = new THREE.Vector3(0, 0, 0);
  if (totalWeight == 0.0) {
    return;
  }

  for (var i = 0; i < weights.length; i++) {
    displacements[i].multiplyScalar(weights[i] / totalWeight);
    totalVelocity.add(displacements[i]);
  }

  // clamp maximum to max radial influence
  if (totalVelocity.length() > settings.agentRadius) {
    totalVelocity = totalVelocity.normalize().multiplyScalar(settings.agentRadius);
  }
  
  agent.velocity = totalVelocity;
}

function updateSimulation(dt) {
  
  // clear all velocities and ownership
  for (var a = 0; a < agents.length; a++) {
    agents[a].velocity = new THREE.Vector3(0, 0, 0);
    agents[a].markers = [];
  }
  for (var m = 0; m < markers.length; m++) {
    markers[m].agent = null;
  }

  // list of active markers for this iteration
  var activeMarkers = [];
  var gridRadius = Math.round(settings.agentRadius * settings.gridResolution / 10.0);

  for (var a = 0; a < agents.length; a++) {
    var g = coordToGrid(agents[a].position.x, agents[a].position.z);

    for (var rx = -gridRadius; rx <= gridRadius; rx++) {
      for (var ry = -gridRadius; ry <= gridRadius; ry++) {
        if (rx + g.x < 0 || rx + g.x >= settings.gridResolution) continue;
        if (ry + g.y < 0 || ry + g.y >= settings.gridResolution) continue;
        var sq = grid[g.x + rx][g.y + ry];

        for (var i = 0; i < sq.markers.length; i++) {
          if (sq.markers[i].agent == null) {
            sq.markers[i].agent = agents[a];
            activeMarkers.push(sq.markers[i]);
          } else {
            var currDist = sq.markers[i].pos.distanceToSquared(sq.markers[i].agent.position);
            var newDist = sq.markers[i].pos.distanceToSquared(agents[a].position);
            if (newDist < currDist) sq.markers[i].agent = agents[a];
          }
        }
      }    
    }
  } 

  // add all active markers to lists
  for (var am = 0; am < activeMarkers.length; am++) {
    var ag = activeMarkers[am].agent;
    ag.markers.push(activeMarkers[am]);
  }

  var min = new THREE.Vector3(-4.99, -5, -4.99);
  var max = new THREE.Vector3(4.99, 5, 4.99);
  
  // update all positions
  for (var a = 0; a < agents.length; a++) {

    // find velocity
    setWeightedVel(agents[a]);

    if (agents[a].velocity.length > settings.agentRadius) {
      agents[a].velocity = agents[a].velocity.normalize().multiplyScalar(settings.agentRadius);
    }
    agents[a].position.addScaledVector(agents[a].velocity, dt);
    agents[a].position.clamp(min, max)
  }

  // clear cell agents
  for (var i = 0; i < settings.gridResolution; i++) {
    for (var j = 0; j < settings.gridResolution; j++) {
      grid[i][j].agents = [];
    } 
  }

  // update cell agents
  for (var a = 0; a < agents.length; a++) {
    var g = coordToGrid(agents[a].position.x, agents[a].position.z);
    grid[g.x][g.y].agents.push(agents[a]);
  } 
}

// called after the scene loads
function onLoad(framework) {
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;
  var stats = framework.stats;

  camera.position.set(1, 1, 5);
  camera.lookAt(new THREE.Vector3(0,0,0));

  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.9 );
  directionalLight.color.setHSL(0.1, 1, 0.95);
  directionalLight.position.set(3, 2, 2);
  directionalLight.position.multiplyScalar(10);
  scene.add(directionalLight);

  var planeGeo = new THREE.PlaneGeometry(10, 10, 20, 20);
  var planeMat = new THREE.MeshPhongMaterial( {
    side: THREE.DoubleSide,
    color: 0xdddddd
  });
  planeGeo.applyMatrix( new THREE.Matrix4().makeRotationX(-Math.PI / 2.0));

  var plane = new THREE.Mesh(planeGeo, planeMat);
  scene.add(plane);

  // initialize sumulation data
  generateGrid();
  generateAgents(scene);

  var marks = new THREE.Geometry();
  var marksMat = new THREE.PointsMaterial({
    color: 0xaaddff,
    size: 0.01
  });
  for (var i = 0; i < settings.gridResolution; i++) {
    for (var j = 0; j < settings.gridResolution; j++) {
      var square = grid[i][j];
      for (var m = 0; m < square.markers.length; m++)  {
        marks.vertices.push(new THREE.Vector3(square.markers[m].pos.x, 0.0, square.markers[m].pos.z));
      }
    }
  }
  var mMesh = new THREE.Points(marks, marksMat);
  mMesh.name = "markers";
  scene.add(mMesh);

  var obj = { CircleScenario:function(){ generateAgents(scene)},
            RowsScenario:function(){ generateAgentsRows(scene)}};

  gui.add(obj,'CircleScenario');
  gui.add(obj,'RowsScenario');
  gui.add(settings, 'numAgents', 10, 50);
  
}

// called on frame updates
function onUpdate(framework) {
  var dt = clock.getDelta();
  
  if (grid.length > 0 && agents.length > 0) {
    updateSimulation(dt);
    framework.scene.traverse(function(object) {
      if (object instanceof THREE.Mesh) {
        if ('agentID' in object.userData) {
          var a = agents[object.userData.agentID];
          object.position.set(a.position.x, a.position.y, a.position.z);
        }
      }
    });
  }

}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);