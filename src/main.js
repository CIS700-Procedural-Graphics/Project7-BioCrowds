
// Skybox texture from: https://github.com/mrdoob/three.js/tree/master/examples/textures/cube/skybox

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

var startTime = Date.now();

///////////////////////////SLIDERS///////////////////////////////

var Sliders = function() {
    this.scenario = 1;
    this.numAgents = 100;
    this.perception = 5;
};
var sliders = new Sliders();

///////////////////////DATA STRUCTURES///////////////////////////

var radius = 1.0;
var gridCellWidth;
var resolution; 
var gridWidth;
var markersPerCell;

var allAgents = new Set();
var allMarkers = new Set();
var cellToMarkers = new Array();
var allMeshes = new Set();
var lines = new THREE.LineSegments();

///////////////////////////CLASSES///////////////////////////////

class Marker {
    constructor(x, z) {
        this.pos = new THREE.Vector2(x, z);
        this.agent = null;
        this.weight = 0.0;
    }
};

class Agent {
    constructor(p, g) {
        this.mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 4), 
            new THREE.ShaderMaterial( {
              uniforms: {
                /*
                  // float initialized to 0
                  time: { type: "f", value: 0.0 },
                  // float initialized to 0
                  freq: { type: "f", value: 0.0 },
                  //float initialized to 25
                  amp: { type: "f", value: 10.0 }
                */
              },
              vertexShader: require('./shaders/iridescence-vert.glsl'),
              fragmentShader: require('./shaders/iridescence-frag.glsl')
            }));
        this.mesh.position.set(p.x, 4/2, p.y);
        this.vel = new THREE.Vector2(0, 0);
        this.goal = g;
        this.markers = new Set();
    }
};

/////////////////////////////////////////////////////////////////

// called after the scene loads
function onLoad(framework) {
    var scene = framework.scene;
    var camera = framework.camera;
    var renderer = framework.renderer;
    var gui = framework.gui;
    var stats = framework.stats;
    var controls = framework.controls;

    // Set light
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.color.setHSL(0.1, 1, 0.95);
    directionalLight.position.set(1, 3, 2);
    directionalLight.position.multiplyScalar(10);
    scene.add(directionalLight);  

    // set skybox
    var loader = new THREE.CubeTextureLoader();
    var urlPrefix = '/images/skymap/';
    var skymap = new THREE.CubeTextureLoader().load([
        urlPrefix + 'px.jpg', urlPrefix + 'nx.jpg',
        urlPrefix + 'py.jpg', urlPrefix + 'ny.jpg',
        urlPrefix + 'pz.jpg', urlPrefix + 'nz.jpg'
    ] );
    scene.background = skymap;

    //initialize everything for the first time
    restart(framework);

    // edit params and listen to changes like this
    // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage

    gui.add(sliders, 'scenario', { Standoff: 1, FourCorners: 2, OneCorner: 3 } ).name("scenario").onFinishChange(function(newVal) {
            restart(framework);
    });  

    //add numAgents slider for user to adjust
    gui.add(sliders, 'numAgents', 50.0, 300.0).step(50.0).onFinishChange(function(newVal) {
        restart(framework);
    });

    //add perception slider for user to adjust
    gui.add(sliders, 'perception', 5.0, 10.0).step(1.0).onFinishChange(function(newVal) {
        restart(framework);
    });

}

/////////////////////////////////////////////////////////////////

// called on frame updates
function onUpdate(framework) {

    for (var a of allAgents.values()) {
        for (var m of a.markers.values()) {
            m.agent = null;
            m.weight = 0.0;
        }
        a.markers.clear();
    }

    //for each agent, find 4 closest cells
    for (var a of allAgents.values()) {

        var p = new THREE.Vector2(a.mesh.position.x, a.mesh.position.z).divideScalar(gridCellWidth);
        var currCell = new THREE.Vector2(p.x, p.y).floor();
        var offset = new THREE.Vector2(p.x, p.y).sub(currCell).round();
        //find the shared corner of 4 closest cells
        var sharedCorner = new THREE.Vector2(currCell.x, currCell.y).add(offset);

        //iterate through 4 closest cells
        for (var cellx = -1; cellx < 1; cellx++) {
            for (var cellz = -1; cellz < 1; cellz++) {

                var cellIndex = new THREE.Vector2(sharedCorner.x, sharedCorner.y).add(new THREE.Vector2(cellx, cellz));
                //make sure cell index is not out of bounds
                if (cellIndex.x >= 0 && cellIndex.y >= 0 && cellIndex.x < resolution && cellIndex.y < resolution) {
                    var markerSet = cellToMarkers[cellIndex.x][cellIndex.y];
                    //iterate through markers in cell
                    for (var marker of markerSet.values()) {
                        var markerPos = new THREE.Vector3(marker.pos.x, 0, marker.pos.y);
                        //check if marker within perception field of agent AND
                        //if marker.agent is null OR new agent is closer to marker than old agent
                        //set marker.agent to new agent
                        if (markerPos.distanceTo(a.mesh.position) <= sliders.perception &&
                            ( marker.agent == null || markerPos.distanceTo(a.mesh.position) < markerPos.distanceTo(marker.agent.mesh.position) )) {
                            marker.agent = a;
                        }
                    }
                }

            }
        }

    }

    //add all markers with an assigned agent to the respective agent
    //O(m) time, instead of removing markers from set of replaced agent above, which is O(m log(m))
    for (var m of allMarkers.values()) {
        if (m.agent != null) {
            m.agent.markers.add(m);
        }
    }
    
    /*
    //debugging purposes, draw marker lines
    lines.material.dispose();
    lines.geometry.dispose();
    framework.scene.remove(lines);
    var linesMaterial = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 10});
    var linesGeom = new THREE.Geometry();
    for (var a of allAgents.values()) {
        for (var m of a.markers.values()) {
            linesGeom.vertices.push(new THREE.Vector3(a.mesh.position.x, a.mesh.position.y, a.mesh.position.z));
            linesGeom.vertices.push(new THREE.Vector3(m.pos.x, 0, m.pos.y));
        }
    }
    lines = new THREE.LineSegments( linesGeom, linesMaterial );
    framework.scene.add(lines);
    */
    
    //perform biocrowd algorithm
    for (var a of allAgents.values()) {

        if (a.goal.distanceTo(new THREE.Vector2(a.mesh.position.x, a.mesh.position.z)) > 1) {
            var totalWeights = 0.0;
            //accumulate marker influences
            for (var marker of a.markers.values()) {
                var g = new THREE.Vector2(a.goal.x - a.mesh.position.x, a.goal.y - a.mesh.position.z);
                var m = new THREE.Vector2(marker.pos.x - a.mesh.position.x, marker.pos.y - a.mesh.position.z);
                marker.weight = (1.0 + ( g.dot(m) / (g.length() * m.length()))) / (1.0 + m.length());
                totalWeights += marker.weight;
            }

            var totalVelocity = new THREE.Vector2(0.0, 0.0);
            for (var marker of a.markers.values()) {

                var v = new THREE.Vector2(marker.pos.x - a.mesh.position.x, marker.pos.y - a.mesh.position.z); 
                v.multiplyScalar(marker.weight);
                v.divideScalar(totalWeights);
                totalVelocity.add(v);
            }

            //update agent velocity
            a.velocity = totalVelocity;
            a.mesh.position.set(a.mesh.position.x+totalVelocity.x, a.mesh.position.y, a.mesh.position.z+totalVelocity.y);
        }
    }

}

/////////////////////////////////////////////////////////////////

function restart(framework) {

    //disposes all meshses of markers, agents, and plane
    for (var mesh of allMeshes) {
        mesh.material.dispose();
        mesh.geometry.dispose();
        framework.scene.remove(mesh);
    }

    gridCellWidth = (sliders.perception+1.0) * 2.0;
    resolution = 10.0; 
    gridWidth = gridCellWidth * resolution;
    //markersPerCell = gridCellWidth/(sliders.perception*0.1) * (sliders.numAgents/50.0);
    markersPerCell = gridCellWidth;

    // set camera position
    framework.camera.position.set(gridWidth/2, gridWidth, gridWidth/2);
    framework.camera.lookAt(new THREE.Vector3(gridWidth/2,0,gridWidth/2));
    framework.controls.target.set(gridWidth/2, 0, gridWidth/2);

    //initialize the ground
    var planeGeometry = new THREE.PlaneGeometry(gridWidth, gridWidth);
    var planeMaterial = new THREE.MeshLambertMaterial({color: 0x696969, side: THREE.DoubleSide, shading: THREE.FlatShading });
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    //apply rotation
    plane.rotation.x = Math.PI/2;
    plane.position.x = gridWidth/2;
    plane.position.z = gridWidth/2;
    plane.position.y = -0.1;
    framework.scene.add(plane);
    allMeshes.add(plane);
    
    //clear old agents and setup new agents
    allAgents.clear();
    if (sliders.scenario == 1) {
        setupAgents1(framework);
    }
    else if (sliders.scenario == 2) {
        setupAgents2(framework);
    }
    else {
        setupAgents3(framework);
    }

    //debugging purposes
    var pMaterial = new THREE.PointsMaterial( { color: 0XA9A9A9 } );
    var points = new THREE.Points(new THREE.Geometry(), pMaterial);
    framework.scene.add(points);
    allMeshes.add(points);

    allMarkers.clear();
    //generate markers
    for (var cellx = 0; cellx < resolution; cellx++) {
        cellToMarkers[cellx] = new Array();
        for (var cellz = 0; cellz < resolution; cellz++) {
            cellToMarkers[cellx][cellz] = new Set();

            //stratified sampling in one grid cell
            for (var i = 0; i < markersPerCell; i++) {
                for (var j = 0; j < markersPerCell; j++) {
                    
                    //var x = gridCellWidth*cellx + gridCellWidth/markersPerCell*i + Math.random()*gridCellWidth/markersPerCell;
                    //var z = gridCellWidth*cellz + gridCellWidth/markersPerCell*j + Math.random()*gridCellWidth/markersPerCell;
                    var x = gridCellWidth*cellx + i;
                    var z = gridCellWidth*cellz + j;
                    var newMarker = new Marker(x, z);
                    cellToMarkers[cellx][cellz].add(newMarker);
                    allMarkers.add(newMarker);

                    //debugging purposes
                    points.geometry.vertices.push(new THREE.Vector3(x, 0, z));
                }
            }

        }
    }

}

/////////////////////////////////////////////////////////////////

function setupAgents1(framework) {

    for (var i = 0; i < sliders.numAgents/2; i++) {
        var zpos = Math.random()*(gridWidth - radius);
        var a = new Agent(new THREE.Vector2(0 + radius, zpos),
                            new THREE.Vector2(gridWidth - radius, zpos));
        allAgents.add(a);
        framework.scene.add(a.mesh);
        allMeshes.add(a.mesh);
    }

    for (var i = 0; i < sliders.numAgents/2; i++) {
        var zpos = Math.random()*(gridWidth - radius);
        var a = new Agent(new THREE.Vector2(gridWidth - radius, zpos),
                            new THREE.Vector2(0 + radius, zpos));
        allAgents.add(a);
        framework.scene.add(a.mesh);
        allMeshes.add(a.mesh);
    }
}

function setupAgents2(framework) {

    var cornerWidth = gridWidth / 9.0;

    for (var i = 0; i < sliders.numAgents / 4.0; i++) {
        var a = new Agent(new THREE.Vector2(radius + Math.random()*cornerWidth, radius + Math.random()*cornerWidth),
                            new THREE.Vector2(gridWidth - radius, gridWidth - radius));
        allAgents.add(a);
        framework.scene.add(a.mesh);
        allMeshes.add(a.mesh);
    }

    for (var i = 0; i < sliders.numAgents / 4.0; i++) {
        var a = new Agent(new THREE.Vector2(gridWidth - radius - cornerWidth + Math.random()*cornerWidth, radius + Math.random()*cornerWidth),
                            new THREE.Vector2(0 + radius, gridWidth - radius));
        allAgents.add(a);
        framework.scene.add(a.mesh);
        allMeshes.add(a.mesh);
    }

    for (var i = 0; i < sliders.numAgents / 4.0; i++) {
        var a = new Agent(new THREE.Vector2(radius + Math.random()*cornerWidth, gridWidth - radius - cornerWidth + Math.random()*cornerWidth),
                            new THREE.Vector2(gridWidth - radius, 0 + radius));
        allAgents.add(a);
        framework.scene.add(a.mesh);
        allMeshes.add(a.mesh);
    }

    for (var i = 0; i < sliders.numAgents / 4.0; i++) {
        var a = new Agent(new THREE.Vector2(gridWidth - radius - cornerWidth + Math.random()*cornerWidth, gridWidth - radius - cornerWidth + Math.random()*cornerWidth),
                            new THREE.Vector2(0 + radius, radius));
        allAgents.add(a);
        framework.scene.add(a.mesh);
        allMeshes.add(a.mesh);
    }
}

function setupAgents3(framework) {
    //generate agents
    for (var i = 0; i < sliders.numAgents; i++) {
        var a = new Agent(new THREE.Vector2(Math.random()*gridWidth, Math.random()*gridWidth),
                            new THREE.Vector2(0, 0));
        allAgents.add(a);
        framework.scene.add(a.mesh);
        allMeshes.add(a.mesh);
    }
}


// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);