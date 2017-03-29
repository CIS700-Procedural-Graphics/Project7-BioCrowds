const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import framework from './framework'
import Grid from './grid'
// Set up GUI variables

var GRIDSIZE = 10;

var appConfig = function() {
   this.scenario = "circle";
   this.AGENT_SIZE = 0.2;
   this.MORE_ROW_AGENTS = 0.4;
   this.NUM_AGENTS = 10;
   this.MARKER_DENSITY = 50;
   this.RADIUS = 2;
   this.CIRCLE_RADIUS = GRIDSIZE / 2;
   this.TIMESTEP = .05;
   this.markers = false;
}
// Init shader variables
var config = new appConfig();
var grid;

// called after the scene loads
function onLoad(framework) {
    var scene = framework.scene;
    var camera = framework.camera;
    var renderer = framework.renderer;
    var gui = framework.gui;
    var stats = framework.stats;

    // load a simple obj mesh
    var objLoader = new THREE.OBJLoader();
   
    // set camera position
    camera.position.set(0, 2, 10);
    camera.lookAt(new THREE.Vector3(0,0,0));
    
    // Set up plane 
    grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config);
    grid.setup();

    // edit params and listen to changes like this
    gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
        camera.updateProjectionMatrix();
    });

    gui.add(config, 'markers').onChange(function(newVal) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config);
        grid.setup();
    });

    gui.add(config, 'scenario', { Circle: 'circle', Rows: 'rows'}).onChange(function(value) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config);
        grid.setup();
    });

    gui.add(config, 'AGENT_SIZE', 0.1, 0.5).onChange(function(newVal) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config);
        grid.setup();
    });

    gui.add(config, 'MORE_ROW_AGENTS', 0, 0.4).onChange(function(newVal) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config);
        grid.setup();
    });

    gui.add(config, 'NUM_AGENTS', 0, 100).onChange(function(newVal) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config);
        grid.setup();
    });

    gui.add(config, 'MARKER_DENSITY', 0, 100).onChange(function(newVal) {
         grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config);
        grid.setup();
    });

    gui.add(config, 'RADIUS', 0.1, 10).onChange(function(newVal) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config);
        grid.setup();
    });

    gui.add(config, 'CIRCLE_RADIUS', 0, 10).onChange(function(newVal) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config);
        grid.setup();
    });

    //gui.add(config, 'TIMESTEP', 0.025, 0.5).onChange(function(newVal) {
        //grid.clearScene();
        //grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config);
        //grid.setup();
    //});
}

// called on frame updates
function onUpdate(framework) {
    if (!(grid === undefined)) {
        grid.tick();
    }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
framework.init(onLoad, onUpdate);