//skybox images from: https://github.com/simianarmy/webgl-skybox/tree/master/images

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
var OBJLoader = require('three-obj-loader');
import Cell from './cell'
OBJLoader(THREE);

//------------------------------------------------------------------------------

var guiParameters = {
  numberOfCells: 10,
  connectivity: 0.3,
  roomSizeMin: 3.0, //controls min of width and length of rooms
  roomSizeMax: 6.0 //controls max of width and length of rooms
}

var floor_Material = new THREE.ShaderMaterial({
  uniforms:
  {
    color:
    {
        type: "v3",
        value: new THREE.Color(0xB266FF) // violet
    },
    lightVec:
    {
        type: "v3",
        value: new THREE.Vector3( 10, 10, 10 )
    }
  },
  vertexShader: require('./shaders/floor-vert.glsl'),
  fragmentShader: require('./shaders/floor-frag.glsl')
});

var cellList = [];

//------------------------------------------------------------------------------

function changeGUI(gui, camera, scene)
{
  var Map2DFolder = gui.addFolder('2D Map parameters');
  Map2DFolder.add(guiParameters, 'numberOfCells', 10, 150).step(1).onChange(function(newVal) {
    guiParameters.numberOfCells = newVal;
    onreset(scene);
  });
  Map2DFolder.add(guiParameters, 'connectivity', 0.1, 0.9).onChange(function(newVal) {
    guiParameters.connectivity = newVal;
    onreset(scene);
  });
  Map2DFolder.add(guiParameters, 'roomSizeMin', 2.5, 7.5).onChange(function(newVal) {
    guiParameters.roomSizeMin = newVal;
    onreset(scene);
  });
  Map2DFolder.add(guiParameters, 'roomSizeMax', 4.5, 9.5).onChange(function(newVal) {
    guiParameters.roomSizeMax = newVal;
    onreset(scene);
  });

  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });
}

function setupLightsandSkybox(scene, camera)
{
  // Set light
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
  directionalLight.color.setHSL(0.1, 1, 0.95);
  directionalLight.position.set(1, 3, 2);
  directionalLight.position.multiplyScalar(10);
  scene.add(directionalLight);
  floor_Material.lightVec = directionalLight.position;

  // set skybox
  var loader = new THREE.CubeTextureLoader();
  var urlPrefix = 'images/skymap/';
  var skymap = new THREE.CubeTextureLoader().load([
      urlPrefix + 'px.jpg', urlPrefix + 'nx.jpg',
      urlPrefix + 'py.jpg', urlPrefix + 'ny.jpg',
      urlPrefix + 'pz.jpg', urlPrefix + 'nz.jpg'
  ] );
  scene.background = skymap;

  // set camera position
  camera.position.set(0, 5, -15);
  camera.lookAt(new THREE.Vector3(0,0,0));
}

function onreset(scene)
{
  cleanscene(scene);
}

function cleanscene(scene)
{
  //remove all objects from the scene
  for( var i = scene.children.length - 1; i >= 0; i--)
  {
    var obj = scene.children[i];
    scene.remove(obj);
  }
}

//------------------------------------------------------------------------------

function spawn2DCells(scene)
{
  for(var i=1;i<guiParameters.numberOfCells+1; i++)
  {
    var centx = Math.random()*100;
    var centz = Math.random()*100;

    var w = guiParameters.roomSizeMin + Math.random()*(guiParameters.roomSizeMax-guiParameters.roomSizeMin);
    var l = guiParameters.roomSizeMin + Math.random()*(guiParameters.roomSizeMax-guiParameters.roomSizeMin);

    var geo_plane = new THREE.PlaneGeometry( w, l, 1 );
    var mat_rand = new THREE.MeshBasicMaterial( { color: (new THREE.Color(Math.random(), Math.random(), Math.random())).getHex(), side: THREE.DoubleSide } );
    var plane = new THREE.Mesh( geo_plane, mat_rand );

    var cent = new THREE.Vector3( centx, 0.001, centz );

    var cell = new Cell("undetermined", cent, w, l, plane);
    cellList.push(cell);
    cellList[i-1].drawCell(scene);
  }
}

//------------------------------------------------------------------------------
// called after the scene loads
function onLoad(framework)
{
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;
  var stats = framework.stats;

  setupLightsandSkybox(scene, camera);
  changeGUI(gui, camera, scene);

  spawn2DCells(scene);
}

// called on frame updates
function onUpdate(framework)
{

}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
