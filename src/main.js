
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
require('three-lut')

import Framework from './framework'
import Agent from './agent'

var prevTime = new Date();
var currentTime = new Date();
var deltaTime = new THREE.Vector3(0.0, 0.0, 0.0);

var options = {
  numAgents: 10,
  numMarkersPerCell: 30
}

// Color Look Up Table
const colors = 100;
const mode = 'rainbow';
const lookupTable = new THREE.Lut(mode, colors);

const gridX = 10.0;
const gridY = 10.0;

const planeX = 1000.0;
const planeY = 1000.0;

var gridCellWidth;
var gridCellHeight;

var agents = [];
var goals = [];
var gridcells = [];

var what = true;

// called after the scene loads
function onLoad(framework) {
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;
  var stats = framework.stats;

  // initialize a simple box and material
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
  directionalLight.color.setHSL(0.1, 1, 0.95);
  directionalLight.position.set(1, 3, 2);
  directionalLight.position.multiplyScalar(10);
  scene.add(directionalLight);

  // set camera position
  camera.position.set(500, 1000, 500);
  camera.lookAt(new THREE.Vector3(500, 0, 500));


  // Voronoi Diagram Plane
  var planeGeo = new THREE.PlaneGeometry(planeX, planeY, gridX, gridY);
  var planeMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide, wireframe: true});
  // var planeMaterial = new THREE.ShaderMaterial({
  //   uniforms: {
  //     u_amount: {
  //       type: "f",
  //       value: 1.0
  //     },
  //     u_albedo: {
  //       type: 'v3',
  //       value: new THREE.Color('#ffffff')
  //     }
  //   },
  //   vertexShader: require('./shaders/voronoi-vert.glsl'),
  //   fragmentShader: require('./shaders/voronoi-frag.glsl')
  // });
  var planeMesh = new THREE.Mesh(planeGeo, planeMaterial);
  planeMesh.rotateX(-Math.PI / 2.0);
  planeMesh.position.set(500, 0, 500);
  scene.add(planeMesh);

  // Update Grid Cell Widths and Heights
  gridCellWidth = planeX / gridX;
  gridCellHeight = planeY / gridY;

  // TEST OBJECTS DELETE ONCE DONE
  // Origin
  // var geometry = new THREE.BoxGeometry( 1, 1, 1 );
  // var material = new THREE.MeshLambertMaterial( {color: 0xff0000} );
  // var sphere = new THREE.Mesh( geometry, material );
  // sphere.position.set(0, 0.5, 0);
  // scene.add( sphere );

    var goalGeometry = new THREE.CylinderGeometry(7, 7, 25, 32);
    var agentGeometry = new THREE.CylinderGeometry(1, 1, 1);


  // var geometry = new THREE.CylinderGeometry( 5, 5, 20, 32 );
  // var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
  // var cylinder = new THREE.Mesh( geometry, material );
  // scene.add( cylinder );
  // Splat Markers
  // splatMarkers(scene);

  // Agents
  for (var i = 0.0; i < options.numAgents; i++) {
    var color = lookupTable.getColor(i / options.numAgents);
    var material = new THREE.MeshLambertMaterial({color: color});
    
    var goal = new THREE.Mesh(goalGeometry, material);
    goal.position.set(750.0 - i * 50.0, 0, 900.0);

    var position = new THREE.Vector3(250.0 + i * 50.0, 50.0, 10.0)
    agents.push(new Agent(goal, material, position));
  }

  for (var i = 0; i < options.numAgents; i++) {
    scene.add(agents[i].mesh);
    scene.add(agents[i].goal);
  }

  // edit params and listen to changes like this
  // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });
}


function splatMarkers(scene) {
  gridcells = [];

  for (var i = 0.0; i < gridX * gridY; i++) {
    var x = Math.floor(i / gridX);
    var y = i - gridX * x;

    // One Grid Cell
    var geometry = new THREE.Geometry();
    var colors = [];
    for (var j = 0; j < options.numMarkersPerCell; j++) {
      geometry.vertices.push(
        new THREE.Vector3(x * gridCellWidth +  Math.random() * gridCellWidth,
                          0,
                          y * gridCellHeight + Math.random() * gridCellHeight));
      var color = lookupTable.getColor(i / (gridX * gridY));
      geometry.colors.push(color);
    }
    var material = new THREE.PointsMaterial( { size: 5.0, vertexColors: THREE.VertexColors});
    var mesh = new THREE.Points(geometry, material);
    gridcells.push(mesh);
    scene.add(mesh);
  }
}

// called on frame updates
function onUpdate(framework) {
  prevTime = currentTime;
  currentTime = new Date();

  deltaTime.setScalar(1.0 / (currentTime - prevTime));

  if (agents.length > 0) {
    for (var i = 0; i < options.numAgents; i++) {
      agents[i].update(deltaTime);
    }
  }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);


// WEBPACK FOOTER //
// ./src/main.js