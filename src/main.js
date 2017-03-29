const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import Crowd from './crowd.js'

var crowd;
var framectr = 0;
var anim = false;
var agents = 5;
var speed = 30;
var sceneSelect = 1;
var visualDebug = true;
var numMarkers = 50;

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
  camera.position.set(25, 10, 25);
  camera.lookAt(new THREE.Vector3(10,0,10));

  // initialize LSystem and a Turtle to draw
  crowd = new Crowd(scene,1,visualDebug,numMarkers);
  framectr = 0;

  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });

  var update= new GUIoptions();
  gui.add(update,'StartPause').onclick;
  gui.add(update,'Reset').onChange(function(newVal) {
      clearScene(crowd);
      crowd = new Crowd(scene,sceneSelect,visualDebug,numMarkers);
  });
  gui.add(update, 'VisualDebug', true).onChange(function(newVal) {
      visualDebug = newVal;
      clearScene(crowd);
      crowd = new Crowd(scene,sceneSelect,visualDebug,numMarkers);
  });
    gui.add(update, 'NewAgents', 0, 50, 1).onChange(function(newVal) {
        agents = newVal;
    });
    gui.add(update, 'AgentSpeed', 10, 40, 1).onChange(function(newVal) {
        speed = newVal;
    });
    gui.add(update, 'Markers_SqRoot', 25, 100, 50).onChange(function(newVal) {
        numMarkers = newVal;
        clearScene(crowd);
        crowd = new Crowd(scene,sceneSelect,visualDebug,numMarkers);
    });
    var sx = gui.add(update, 'Scene1', false).listen();
    sx.onChange(function(val) {
        clearScene(crowd);
        sceneSelect = 0;
        crowd = new Crowd(scene,sceneSelect,visualDebug,numMarkers);
        update.Scene1=true;
        update.Scene2=false;
    });
    var sy = gui.add(update, 'Scene2', true).listen();
    sy.onChange(function(val) {
        clearScene(crowd);
        sceneSelect = 1;
        crowd = new Crowd(scene,sceneSelect,visualDebug,numMarkers);
        update.Scene1=false;
        update.Scene2=true;
    });
}

var GUIoptions = function()
{
	this.StartPause=function(){
        anim = !anim;
	};
    this.Reset=function(){};
    this.NewAgents = 5;
    this.AgentSpeed = 30;
    this.Scene1 = false;
    this.Scene2 = true;
    this.VisualDebug = true;
    this.Markers_SqRoot = 50;
    // var AgentsPerFrame;

}

// clears the scene by removing all geometries added by turtle.js
function clearScene(crowd) {
  var obj;
  for( var i = crowd.scene.children.length - 1; i > 3; i--) {
      obj = crowd.scene.children[i];
      crowd.scene.remove(obj);
  }
}

// function doLsystem(lsystem, iterations, turtle) {
//     turtle.renderSymbols(result);
// }

// called on frame updates
function onUpdate(framework) {
    if(anim)
        crowd.moveAgents(framectr,agents,speed,sceneSelect,visualDebug);
    framectr++;
    if(framectr>=60)
        framectr=0;
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
