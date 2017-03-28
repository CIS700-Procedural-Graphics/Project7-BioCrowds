
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

var clock;
var NUM_AGENTS = 100;
var NUM_MARKERS = 1000;
var markers = [];
var agents = [];

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
  for (var i = 0; i < NUM_MARKERS; i++) {
    markers.push({
      name  : "marker"+i,
      pos   : new THREE.Vector2((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100)
    });
  }

  // generate agents
  for (var i = 0; i < NUM_AGENTS; i++) {
    agents.push({
        name    : "agent"+i,
        pos     : new THREE.Vector2((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100),
        vel     : new THREE.Vector2(0, 0),
        dest    : new THREE.Vector2(0, 0),//new THREE.Vector2((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100),
        markers : [],
        color   : Math.floor(Math.random()*16777215)
      });
  }

  for (var i = 0; i < NUM_AGENTS; i++) {
    var agent = agents[i];
    var agentGeo = new THREE.BoxGeometry(1,10,1);
    var agentMat = new THREE.MeshBasicMaterial({color: agent.color, side: THREE.DoubleSide});
    var agentMesh = new THREE.Mesh(agentGeo, agentMat);
    agentMesh.name = agent.name;
    agentMesh.position.set(agent.pos.x, 0, agent.pos.y);
    scene.add(agentMesh);
  }

  for (var i = 0; i < NUM_MARKERS; i++) {
    var marker = markers[i];
    var markerGeo = new THREE.BoxGeometry(1,1,1);
    var markerMat = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide});
    var markerMesh = new THREE.Mesh(markerGeo, markerMat);
    markerMesh.position.set(marker.pos.x, 0, marker.pos.y);
    markerMesh.name = marker.name;
    scene.add(markerMesh);
  }


  clock = new THREE.Clock();






  var geometry = new THREE.PlaneGeometry(100,100);
  var material = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide});
  var mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  scene.add(mesh);

  var geometry = new THREE.BoxGeometry(1,100,1);
  var material = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide});
  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // set camera position
  camera.position.set(50, 50, 20);
  camera.lookAt(new THREE.Vector3(0,0,0));


  // edit params and listen to changes like this
  // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });
}

var count = 0;
// called on frame updates
function onUpdate(framework) {

  if (markers.length == 0 || agents.length == 0) {
    return;
  }
  var delta = clock.getDelta() * 2;

    // assign agents to markers
    for (var i = 0; i < markers.length; i++) {
      var marker = markers[i];
      var closestAgent = null;
      var minDist = 99999;
      for (var j = 0; j < agents.length; j++) {
        var agent = agents[j];
        var dist = Math.sqrt(Math.pow(agent.pos.x - marker.pos.x, 2) + Math.pow(agent.pos.y - marker.pos.y, 2));
        if (dist < minDist && dist < 5) {
          closestAgent = agent;
          minDist = dist;
        }
      }
      if (closestAgent) {
        closestAgent.markers.push(marker);
        var mesh = framework.scene.getObjectByName(marker.name);
        if (mesh) {
          mesh.material = new THREE.MeshBasicMaterial({color: closestAgent.color, side: THREE.DoubleSide});
          mesh.geometry.uvsNeedUpdate = true;
          mesh.needsUpdate = true;
        }
      } else {
        var mesh = framework.scene.getObjectByName(marker.name);
        if (mesh) {
          mesh.material = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide});
          mesh.geometry.uvsNeedUpdate = true;
          mesh.needsUpdate = true;
        }
      }
    }
    // return;
    count++;
    // return;
    // compute velocities
    for (var i = 0; i < agents.length; i++) {
      var agent = agents[i];
      var destVec = new THREE.Vector2(agent.dest.x - agent.pos.x, agent.dest.y - agent.pos.y);///agent.dest.sub(agent.pos);
      var cumulativeWeight = 0;
      var velocity = new THREE.Vector2(0,0);
      for (var j = 0; j < agent.markers.length; j++) {
        var marker = agent.markers[j];
        var markerVec = new THREE.Vector2(marker.pos.x - agent.pos.x, marker.pos.y - agent.pos.y);
        var similarity = (destVec.normalize().dot(markerVec.normalize()) + 1) / 2;
        var displacement = Math.sqrt(Math.pow(agent.pos.x - marker.pos.x, 2) + Math.pow(agent.pos.y - marker.pos.y, 2));//agent.pos.distanceTo(marker.pos);//Math.sqrt(Math.pow(marker.x - agent.x, 2) + Math.pow(marker.y - agent.y, 2));
        var weight = similarity * (1 / displacement);
        velocity.x += markerVec.x * weight;
        velocity.y += markerVec.y * weight;
        cumulativeWeight += weight;
      }
      velocity.x /= cumulativeWeight;
      velocity.y /= cumulativeWeight;

      velocity.x = Math.max(Math.min(velocity.x, 10), -10);
      velocity.y = Math.max(Math.min(velocity.y, 10), -10);
      // console.log(velocity);

      agents[i].vel.x += velocity.x * delta;
      agents[i].vel.y += velocity.y * delta;

      agents[i].pos.x += agents[i].vel.x * delta;
      agents[i].pos.y += agents[i].vel.y * delta;
    }


  for (var i = 0; i < agents.length; i++) {
    var agent = agents[i];
    var mesh = framework.scene.getObjectByName(agent.name);
    if (mesh) {
      mesh.position.set(agent.pos.x, 0, agent.pos.y);
      mesh.needsUpdate = true;
    }
  }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
