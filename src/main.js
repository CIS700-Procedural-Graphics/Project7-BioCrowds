const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
require('three-lut')

import Framework from './framework'
import Agent from './agent'

const INFINITY = 1.7976931348623157E+10308;

var prevTime = new Date();
var currentTime = new Date();
var deltaTime = new THREE.Vector3(0.0, 0.0, 0.0);

var options = {
  numAgents: 10,
  numMarkersPerCell: 30,
  scene: 'circle'
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
var lookedAt = []; // TODO: 

const WHITE = new THREE.Color("rgb(255, 255, 255)"); 
const RED = new THREE.Color("rgb(255, 0, 0)");


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



  // Splat Markers
  splatMarkers(scene);
  buildScene(scene);

  // edit params and listen to changes like this
  // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });

  gui.add(options, 'scene', [ 'lines', 'circle']).onChange(function(newVal) {
    buildScene(scene);
  });

}


function buildScene(scene) {
   if (agents.length > 0) {
    for (var i = 0; i < agents.length; i++) {
      scene.remove(agents[i].mesh);
      scene.remove(agents[i].goal);
    }
    agents = [];
  }

  if (options.scene == 'lines') {
    // Agents
    var goalGeometry = new THREE.CylinderGeometry(7, 7, 25, 32);
    for (var i = 0.0; i < options.numAgents; i++) {
      var color = lookupTable.getColor(i / options.numAgents);
      var material = new THREE.MeshLambertMaterial({color: color});
      
      var goal = new THREE.Mesh(goalGeometry, material);
      goal.position.set(750.0 - i * 70.0, 0, 900.0);

      var position = new THREE.Vector3(250.0 + i * 70.0, 50.0, 10.0)
      agents.push(new Agent(goal, material, position, gridCellWidth, gridCellHeight));
    }

    for (var i = 0; i < options.numAgents; i++) {
      scene.add(agents[i].mesh);
      scene.add(agents[i].goal);
    }
  } 
  else if (options.scene == 'circle') {
    var circleGeo = new THREE.CircleGeometry(400, 20);
    var circleMat = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
    var circle = new THREE.Mesh( circleGeo, circleMat );
    //circle.rotateX(-Math.PI / 2.0);
    //circle.position.set(500, 0, 500);
    // scene.add(circle);

    for (var i = 0; i < 20; i++) {
      var color = lookupTable.getColor(i / 20);
      var material = new THREE.MeshLambertMaterial({color: color});
      
      var goal = new THREE.Mesh(goalGeometry, material);
      var goalV = circleGeo.vertices[(i + 10) % 20 + 1];
      goal.position.set(goalV.x + 500, 0.0, goalV.y + 500);

      var cirv = circleGeo.vertices[i + 1];
      var position = new THREE.Vector3(cirv.x + 500, 0.0, cirv.y + 500);
      agents.push(new Agent(goal, material, position, gridCellWidth, gridCellHeight));
    }

    for (var i = 0; i < options.numAgents; i++) {
      scene.add(agents[i].mesh);
      scene.add(agents[i].goal);
    }
  }
}

function splatMarkers(scene) {
  gridcells = [];

  for (var i = 0.0; i < gridX * gridY; i++) {
    var x = Math.floor(i / gridX);
    var y = i - gridX * x;

    // One Grid Cell
    var geometry = new THREE.Geometry();
    for (var j = 0; j < options.numMarkersPerCell; j++) {
      geometry.vertices.push(
        new THREE.Vector3(x * gridCellWidth +  Math.random() * gridCellWidth,
                          0,
                          y * gridCellHeight + Math.random() * gridCellHeight));
      geometry.colors.push(WHITE.clone());
    }
    
    var material = new THREE.PointsMaterial( { size: 5.0, vertexColors: THREE.VertexColors});
    var mesh = new THREE.Points(geometry, material);
    gridcells.push(mesh);
    scene.add(mesh);
  }
}

function getGridCellByIdx(i, j) {
  if (i < 0 || j < 0 || i > gridX || j > gridY) {
    return -1;
  }

  return i * gridX + j;
}

// called on frame updates
function onUpdate(framework) {
  prevTime = currentTime;
  currentTime = new Date();
  deltaTime.setScalar(1.0 / (currentTime - prevTime));

  if (agents.length > 0) {
    // Reset Everything
    lookedAt = []; // reset
    for (var a = 0; a < options.numAgents; a++) {
      for (var m = 0; m < agents[a].markers.length; m++) {
        agents[a].markers[m].geo.colors[agents[a].markers[m].mark].set(WHITE.clone());
      }

      agents[a].markers = [];

    }

    for (var lost = 0; lost < gridcells.length; lost++) {
      gridcells[lost].geometry.colorsNeedUpdate = true;
    }


    // TODO: Clean up this
    for (var a = 0; a < options.numAgents; a++) {
      var idx = getGridCellByIdx(agents[a].i, agents[a].j);
      helper(a, idx);
      lookedAt[idx] = true;

      idx = getGridCellByIdx(agents[a].i - 1, agents[a].j);
      helper(a, idx);
      lookedAt[idx] = true;

      idx = getGridCellByIdx(agents[a].i, agents[a].j - 1);
      helper(a, idx);
      lookedAt[idx] = true;

      idx = getGridCellByIdx(agents[a].i - 1, agents[a].j - 1);
      helper(a, idx);
      lookedAt[idx] = true;
    }

    for (var i = 0; i < options.numAgents; i++) {
      agents[i].update(deltaTime);
    }
  }
}

function helper(a, idx) {
    if (idx > 0 ) {//&& !lookedAt[idx]) {
    for (var m = 0; m < gridcells[idx].geometry.vertices.length; m++) {
        var min = 50;
        var marker = gridcells[idx].geometry.vertices[m];

        var c; // Current Agent

        for (var b = a; b < options.numAgents; b++) {
          var temp = marker.distanceTo(agents[b].position) - 20;
          if (temp < min) {
            c = agents[b];
            min = temp;
          }
        }

        if (c) {
          gridcells[idx].geometry.colors[m].set(c.material.color);
          c.markers.push({geo: gridcells[idx].geometry, mark: m});
        }
    }

      gridcells[idx].geometry.colorsNeedUpdate=true;
  }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);


// WEBPACK FOOTER //
// ./src/main.js