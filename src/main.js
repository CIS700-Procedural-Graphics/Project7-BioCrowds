
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import Crowd from './biocrowd.js'
  
// called after the scene loads
function onLoad(framework) {
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;
  var stats = framework.stats;
  
  // set camera position
  camera.position.set(0, 20, 20);
  camera.lookAt(new THREE.Vector3(0,0,0));
  camera.fov = 40;
  camera.updateProjectionMatrix();
  //scene.add(adamCube);

  // edit params and listen to changes like this
  // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });

  //play/pause
  framework.play = 1;
  gui.add(framework, 'play', {Pause: 0, Play: 1});

  //start the time
  framework.prevTime = Date.now();
  framework.stepCount = 0;

  /////////////////////////
  //
  // Generate the biocrowd
  //
  framework.crowdParams = {
    numAgents: 24,
    gridW: 20,
    gridD: 20,
    markerDensity: 8,
    gridSecW: 2, //marker grid sector width. make sure radius of agent's 
                  // marker radius can fit within here
    gridSecD: 2,
    showAgentMarkers: false,
    doObstacle: true, //not working
    grouping: 0, //scenario - 0 or 1 so far
    speed: 1.0,
    personalSpaceFactor: 1.8, //above 1.8 and the circle scenario with obstacles gets stuck
  }
  framework.createCrowd = function() {
    while(framework.scene.children.length > 0){ 
      framework.scene.remove(scene.children[0]); 
    }    
    var crowd = new Crowd(framework.crowdParams, scene);
    framework.crowd = crowd;
  }

  framework.createCrowd();

  gui.add(framework, 'createCrowd').name('Restart Crowd');
  gui.add(framework.crowdParams, 'numAgents',1,400).onChange(function(){
    framework.createCrowd();
  })
  gui.add(framework.crowdParams, 'grouping', {Streams: 0, Circle: 1} ).name('Scenario').onChange(function(){
    framework.createCrowd();
  });
  gui.add(framework.crowdParams, 'doObstacle' ).name('Use Obstacles').onChange(function(){
    framework.createCrowd();
  });
  gui.add(framework.crowdParams, 'speed', 0.1,10);
  gui.add(framework.crowdParams, 'personalSpaceFactor', 1.0, 5.0 );
}

// called on frame updates
function onUpdate(framework) {
  //console.log(`the time is ${new Date()}`);
  var msec = Date.now();
  var dTimeSec = (msec - framework.prevTime) / 1000.0;
  if( typeof framework.crowd != 'undefined' && framework.play == 1 ){
    framework.prevTime = msec;
    if( framework.stepCount < 99999 ){
      //console.log("Step: ",framework.stepCount);
      framework.crowd.doStep( dTimeSec, msec );
    }
    framework.stepCount++;
  }
  //console.log(adamMaterial.uniforms.uTimeMsec.value);
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);