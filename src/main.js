
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
const OBJLoader = require('three-obj-loader')(THREE)
import Grid from './grid.js'
import Agent from './agent.js'
import Marker from './marker.js'
import Crowd from './crowd.js'
import RenderEngine from './renderengine.js'
import Framework from './framework'

var crowd, renderengine;
var time = 0;
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

  var background_loader = new THREE.TextureLoader();
  var background = new THREE.TextureLoader().load('nyc.jpg');
  scene.background = background;

  var audio_listener = new THREE.AudioListener();
  var track = new THREE.Audio(audio_listener);
  var audio = new THREE.AudioLoader();
  audio.load('move.m4a', function(buffer) {
    track.setBuffer(buffer);
    track.setLoop(true);
    track.setVolume(0.5);
    track.play();
    renderengine = new RenderEngine(scene);
    crowd = new Crowd(renderengine, 'top-down');
    gui.add(crowd, 'scenario', ['top-down', 'circle']).onChange(function(val) {
      crowd.reset_board();
      crowd.scenario = val;
      crowd.create_agents();
      crowd.populate_board();
      crowd.renderengine.render_plane(100.0);
      crowd.renderengine.render_agents(crowd.agents);
      crowd.renderengine.render_markers(crowd.markers);
    });
    gui.add(crowd, 'debug').onChange(function(val) {
      crowd.markers.forEach(function(marker) {
        marker.mesh.visible = val;
      });
    });
  });

  // set camera position
  camera.position.set(50, 50, 100);
  camera.lookAt(new THREE.Vector3(0,0,0));

  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });


}

// called on frame updates
function onUpdate(framework) {
  time += 1;
  if (crowd && time % 5 === 0) {
    crowd.update();
  }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
