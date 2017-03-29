
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
const OBJLoader = require('three-obj-loader')(THREE)
import Grid from './grid.js'
import Agent from './agent.js'
import Marker from './marker.js'
import Crowd from './crowd.js'
import RenderEngine from './renderengine.js'
import Framework from './framework'

var crowd, renderengine;
var time = 0.0;
// called after the scene loads
function onLoad(framework) {
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;
  var stats = framework.stats;

  // initialize a simple box and material
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.25 );
  directionalLight.color.setHSL(0.1, 1, 0.95);
  directionalLight.position.set(1, 3, 2);
  directionalLight.position.multiplyScalar(10);
  scene.add(directionalLight);

  var ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  // set camera position
  camera.position.set(50, 50, 100);
  camera.lookAt(new THREE.Vector3(0,0,0));

  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });

  renderengine = new RenderEngine(scene);
  crowd = new Crowd(renderengine);
}

// called on frame updates
function onUpdate(framework) {
  time += 1.0;
  if (crowd) {
    crowd.update(time);
  }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
