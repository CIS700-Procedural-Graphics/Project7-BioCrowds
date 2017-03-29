
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

var clock;
var SIZE = 200;
var NUM_AGENTS = 200;
var NUM_MARKERS = 12000;
var markers = [];
var agents = [];

var options = {
  agent: {
    names: ['random', 'ring'],
    ring: function(i) {
      var rad = Math.random() * 2 * Math.PI;
      var radius = SIZE / 4;
      return new THREE.Vector2(radius * Math.cos(rad), radius * Math.sin(rad));
    },
    random: function(i) {
      return new THREE.Vector2((Math.random() - 0.5) * SIZE, (Math.random() - 0.5) * SIZE);
    }
  },
  dest: {
    names: ['center', 'corners4', 'rows'],
    center: function(i) {
      return new THREE.Vector2(0,0);
    },
    corners4: function(i) {
      var r = Math.random();
      var c = SIZE / 2;
      return r < 0.25 ? new THREE.Vector2(-c, -c) :
             r < 0.50 ? new THREE.Vector2(-c, c) :
             r < 0.75 ? new THREE.Vector2(c, -c) :
             new THREE.Vector2(c, c);
    },
    rows: function(i) {
      return i < NUM_AGENTS / 2 ? new THREE.Vector2(SIZE / 2, (((i) / (0.5 * NUM_AGENTS)) * (0.5 * SIZE))) :
             new THREE.Vector2(-SIZE / 2, ((i / (0.5 * NUM_AGENTS)) * (0.5 * SIZE)));
    }
  }
}

var config = {
  agent: options.agent.random,
  dest: options.dest.center
}

var configGui = {
  agent: '',
  dest: ''
}


var grid = {};
function bin(x,y) {
  var binRes = 4;
  var xb = Math.floor(binRes * x / (0.5 * SIZE));
  var yb = Math.floor(binRes * y / (0.5 * SIZE));
  var key = {x: xb, y: yb};
  return key;
}


function loadAgents() {
  // generate agents
  agents = [];
  for (var i = 0; i < NUM_AGENTS; i++) {
    agents.push({
        name    : "agent"+i,
        pos     : config.agent(i),
        vel     : new THREE.Vector2(0, 0),
        dest    : config.dest(i),
        markers : [],
        color   : Math.floor(Math.random()*16777215)
      });
  }
}

// called after the scene loads
function onLoad(framework) {
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;
  var stats = framework.stats;

  // LOOK: the line below is synyatic sugar for the code above. Optional, but I sort of recommend it.
  // var {scene, camera, renderer, gui, stats} = framework;

  // generate markers
  grid = {};
  for (var i = 0; i < NUM_MARKERS; i++) {
    var marker = {
      name  : "marker"+i,
      pos   : new THREE.Vector2((Math.random() - 0.5) * SIZE, (Math.random() - 0.5) * SIZE)
    };
    var key = bin(marker.pos.x, marker.pos.y);
    var keyStr = key.x + "," + key.y;
    if (!grid[keyStr]) {
        grid[keyStr] = [];
    }
    grid[keyStr].push(marker);
    markers.push(marker);
  }

  loadAgents();

  for (var i = 0; i < NUM_AGENTS; i++) {
    var agent = agents[i];
    // var agentGeo = new THREE.BoxGeometry(1,2,1);
    var agentGeo = new THREE.CylinderGeometry(1, 1, 2, 16);
    var agentMat = new THREE.MeshBasicMaterial({color: agent.color, side: THREE.DoubleSide});
    var agentMesh = new THREE.Mesh(agentGeo, agentMat);
    agentMesh.name = agent.name;
    agentMesh.position.set(agent.pos.x, 1, agent.pos.y);
    scene.add(agentMesh);
  }

  // for (var i = 0; i < NUM_MARKERS; i++) {
  //   var marker = markers[i];
  //   var markerGeo = new THREE.BoxGeometry(1,1,1);
  //   var markerMat = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide});
  //   var markerMesh = new THREE.Mesh(markerGeo, markerMat);
  //   markerMesh.position.set(marker.pos.x, 0.5, marker.pos.y);
  //   markerMesh.name = marker.name;
  //   scene.add(markerMesh);
  // }

  clock = new THREE.Clock();

  var geometry = new THREE.PlaneGeometry(SIZE + 10, SIZE + 10);
  var material = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide});
  var mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  scene.add(mesh);


  // set camera position
  camera.position.set(50, 50, 20);
  camera.lookAt(new THREE.Vector3(0,0,0));


  // edit params and listen to changes like this
  // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });

  gui.add(configGui, 'agent', options.agent.names).onChange(function(newVal) {
    config.agent = options.agent[newVal];
    loadAgents();
  });

  gui.add(configGui, 'dest', options.dest.names).onChange(function(newVal) {
    config.dest = options.dest[newVal];
    loadAgents();
  });
}

var unclaimedMarkerMat = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide});
// called on frame updates
function onUpdate(framework) {

  if (markers.length == 0 || agents.length == 0) {
    return;
  }

  var delta = clock.getDelta() * 20;
  var d = new Date();
  var time = d.getTime();

  for (var i = 0; i < agents.length; i++) {
    var agent = agents[i];
    agent.markers = [];
    var key = bin(agent.pos.x, agent.pos.y);

    for (var m = -1; m < 2; m++) {
      for (var n = -1; n < 2; n++) {
        var k = (key.x + m) + "," + (key.y + n);
        if (grid[k]) {
          for (var p = 0; p < grid[k].length; p++) {
            var marker = grid[k][p];
            var dist = (Math.pow(agent.pos.x - marker.pos.x, 2) + Math.pow(agent.pos.y - marker.pos.y, 2));
            if (dist < 25) {

              if ((marker.claim && marker.claim.dist > dist) || (marker.claim && marker.claim.time < time) || !marker.claim) {
                marker.claim = {
                  name: agent.name,
                  dist: dist,
                  time: time
                }
                agent.markers.push(marker);
              }
            }
          }
        }
      }
    }
  }

  // compute velocities
  for (var i = 0; i < agents.length; i++) {
    var agent = agents[i];
    var destVec = new THREE.Vector2(agent.dest.x - agent.pos.x, agent.dest.y - agent.pos.y);
    var cumulativeWeight = 0;
    var vel = new THREE.Vector2(0,0);
    for (var j = 0; j < agent.markers.length; j++) {
      var marker = agent.markers[j];
      console.log(marker.claim.name + "   " + agent.name);
      if (marker.claim.name == agent.name) {
        var markerVec = new THREE.Vector2(marker.pos.x - agent.pos.x, marker.pos.y - agent.pos.y);
        var similarity = (destVec.normalize().dot(markerVec.normalize()) + 1);
        var displacement = Math.sqrt(Math.pow(agent.pos.x - marker.pos.x, 2) + Math.pow(agent.pos.y - marker.pos.y, 2)) + 1;
        var weight = similarity / displacement;
        vel.x += markerVec.x * weight;
        vel.y += markerVec.y * weight;
        cumulativeWeight += weight;

        // var mesh = framework.scene.getObjectByName(marker.name);
        // if (mesh) {
        //   mesh.material = new THREE.MeshBasicMaterial({color: agent.color, side: THREE.DoubleSide});
        //   mesh.geometry.uvsNeedUpdate = true;
        //   mesh.needsUpdate = true;
        // }
      }
    }
    vel.x /= cumulativeWeight;
    vel.y /= cumulativeWeight;

    agents[i].vel.x = vel.x ? vel.x : 0;
    agents[i].vel.y = vel.y ? vel.y : 0;

    agents[i].vel.x = Math.max(Math.min(agents[i].vel.x, 2), -2);
    agents[i].vel.y = Math.max(Math.min(agents[i].vel.y, 2), -2);

    agents[i].pos.x += agents[i].vel.x * delta;
    agents[i].pos.y += agents[i].vel.y * delta;
  }


  for (var i = 0; i < agents.length; i++) {
    var agent = agents[i];
    var mesh = framework.scene.getObjectByName(agent.name);
    if (mesh) {
      mesh.position.set(agent.pos.x, 1, agent.pos.y);
      mesh.needsUpdate = true;
    }
  }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
