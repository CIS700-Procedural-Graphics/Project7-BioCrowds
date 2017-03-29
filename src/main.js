const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import framework from './framework'
import Grid from './grid'
// Set up GUI variables
var appConfig = function() {
   this.scenario = "circle";
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

    var GRIDSIZE = 10;
    
    // Set up plane 
    grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config.scenario);
    grid.setup();

    // edit params and listen to changes like this
    gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
        camera.updateProjectionMatrix();
    });

    gui.add(config, 'scenario', { Circle: 'circle', Rows: 'rows'}).onChange(function(value) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, value); 
        grid.setup();
    });

    gui.add(grid, 'AGENT_SIZE', 0.1, 0.5).onChange(function(newVal) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config.scenario);
        grid.AGENT_SIZE = newVal; 
        grid.setup();
    });

    gui.add(grid, 'AGENT_SPACE', 0, 10).onChange(function(newVal) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config.scenario);
        grid.AGENT_SPACE = newVal; 
        grid.setup();
    });

    gui.add(grid, 'NUM_AGENTS', 0, 100).onChange(function(newVal) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config.scenario);
        grid.NUM_AGENTS = newVal; 
        grid.setup();
    });

    gui.add(grid, 'MARKER_DENSITY', 0, 100).onChange(function(newVal) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config.scenario);
        grid.MARKER_DENSITY = newVal; 
        grid.setup();
    });

    gui.add(grid, 'RADIUS', 0.1, 10).onChange(function(newVal) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config.scenario);
        grid.RAIDUS = newVal; 
        grid.setup();
    });

    gui.add(grid, 'CIRCLE_RADIUS', 0, 10).onChange(function(newVal) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config.scenario);
        grid.CIRCLE_RADIUS = newVal; 
        grid.setup();
    });

    gui.add(grid, 'TIMESTEP', 0.025, 0.5).onChange(function(newVal) {
        grid.clearScene();
        grid = new Grid.Grid(scene, GRIDSIZE, GRIDSIZE, config.scenario);
        grid.TIMESTEP = newVal; 
        grid.setup();
    });
}

// called on frame updates
function onUpdate(framework) {
    if (!(grid === undefined)) {
        grid.tick();
    }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
framework.init(onLoad, onUpdate);