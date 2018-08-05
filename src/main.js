
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import Crowd from './crowd.js'

var crowd;
var options = {
    configuration: 'circle',
    numMarkers: 2000,
    numAgents: 10,
    obstacle: false,
    pause: true,
    debug: true
};

function onLoad(framework) {
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;
  var stats = framework.stats;

  var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
  scene.add( directionalLight );
  scene.background = new THREE.Color('skyblue');

  camera.position.set(-200, 280, 300);
  camera.lookAt(new THREE.Vector3(0,0,0));

  gui.add(options, 'configuration', [ 'circle', 'corners' ]).onChange(function(newVal) {
    crowd.reset();
    crowd.initialize(options.numAgents, options.numMarkers, options.configuration, options.debug, options.obstacle);
  });
  gui.add(options, 'numMarkers', 0, 6000).step(500).onChange(function(newVal) {
    crowd.reset();
    crowd.initialize(options.numAgents, newVal, options.configuration, options.debug, options.obstacle);
  });
  gui.add(options, 'numAgents', 0, 20).step(2).onChange(function(newVal) {
    crowd.reset();
    crowd.initialize(newVal, options.numMarkers, options.configuration, options.debug, options.obstacle);
  });
  gui.add(options, 'obstacle').onChange(function(newVal) {
    crowd.reset();
    crowd.initialize(options.numAgents, options.numMarkers, options.configuration, options.debug, options.obstacle);
  });
  gui.add(options, 'pause'); 
  gui.add(options, 'debug').onChange(function(newVal) {
    if (newVal) {
      crowd.showMarkers();
    }
    else {
      crowd.removeMarkers();
    }
  }); 
}

function onUpdate(framework) {
  if (crowd) {
    if (!options.pause) {
      crowd.update();
    }
  } 
  else {
    crowd = new Crowd(framework.scene);
    crowd.initialize(options.numAgents, options.numMarkers, options.configuration, options.debug, options.obstacle);
  }
}

Framework.init(onLoad, onUpdate);