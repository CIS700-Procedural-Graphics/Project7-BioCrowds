//skybox images from: https://github.com/simianarmy/webgl-skybox/tree/master/images

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
var OBJLoader = require('three-obj-loader');
import Agent from './agent'
import Marker from './marker'
OBJLoader(THREE);

//------------------------------------------------------------------------------
var guiParameters = {
  goal_x: 0.01,
  goal_z: 0.01
}

var crowds_Material = new THREE.ShaderMaterial({
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
  vertexShader: require('./shaders/crowds-vert.glsl'),
  fragmentShader: require('./shaders/crowds-frag.glsl')
});

var gridsize_x = 30;
var gridsize_z = 30;
var gridcellsize = 1;
var gridCellDensity = 10;
var grid = new Array(gridsize_x*gridsize_z);//each grid contains a list of markers
                                            //its a 1D array with samrt indexing, ie every xth row
                                            //is x*gridsize_z*gridCellDensity from the start

var agentList = [];

var particleGeo = new THREE.Geometry();
var particles_mesh = new THREE.Points( particleGeo, new THREE.PointsMaterial( { color: 0x1971ff, sizeAttenuation : false, size: 6.0 } ) );
particles_mesh.geometry.dynamic = true;

//------------------------------------------------------------------------------

function changeGUI(gui, camera, scene)
{
  /*
  gui.add(guiParameters, 'goal_x', -30.0, 30.0).onChange(function(newVal) {
    guiParameters.goal_x = newVal;
    onreset(scene);
  });
  gui.add(guiParameters, 'goal_z', -30.0, 30.0).onChange(function(newVal) {
    guiParameters.goal_z = newVal;
    onreset(scene);
  });
  */
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
  crowds_Material.lightVec = directionalLight.position;

  // set skybox
  var loader = new THREE.CubeTextureLoader();
  var urlPrefix = 'images/skymap/';
  var skymap = new THREE.CubeTextureLoader().load([
      urlPrefix + 'px.jpg', urlPrefix + 'nx.jpg',
      urlPrefix + 'py.jpg', urlPrefix + 'ny.jpg',
      urlPrefix + 'pz.jpg', urlPrefix + 'nz.jpg'
  ] );
  scene.background = skymap;

  //set plane
  var geometry = new THREE.PlaneGeometry( 30, 30, 1 );
  var material = new THREE.MeshBasicMaterial( {color: 0x696969, side: THREE.DoubleSide} );
  var plane = new THREE.Mesh( geometry, material );
  plane.rotateX(90 * 3.14/180);
  plane.position.set(0,-0.02,0);
  scene.add( plane );

  // set camera position
  camera.position.set(0, 5, -15);
  camera.lookAt(new THREE.Vector3(0,0,0));
}

function onreset(scene)
{
  cleanscene(scene);

  //set plane
  var geometry = new THREE.PlaneGeometry( 30, 30, 1 );
  var material = new THREE.MeshBasicMaterial( {color: 0x696969, side: THREE.DoubleSide} );
  var plane = new THREE.Mesh( geometry, material );
  plane.rotateX(90 * 3.14/180);
  plane.position.set(0,-0.02,0);
  scene.add( plane );
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


//------------------------------------------------------------------------------
function spawnagent()
{
  var agent
}

function markers(scene)
{
  //generate a grid and scatter randomly in each cell a bunch of points that serve as markers
  //each grid cell should have an individual list of markers --> this helps us quickly find the
  //markers near an agent based on the grid cell its in and those surrounding it
  var x,z;
  var randpos;
  var index;

  var geoverts = particles_mesh.geometry.vertices;

  for( var i = -gridsize_x*0.5; i<gridsize_x*0.5 ; i++)
  {
    for( var j = -gridsize_z*0.5; j<gridsize_z*0.5 ; j++)
    {
      for( var k = 0; k<gridCellDensity ; k++)
      {
        x = Math.random()*gridcellsize + i*gridcellsize;
        z = Math.random()*gridcellsize + j*gridcellsize;

        randpos = new THREE.Vector3( x, 0.001, z );

        index = i*gridsize_x*gridsize_z*gridCellDensity + j*gridsize_z*gridCellDensity + k;
        grid[index] = new Marker( randpos );

        geoverts.push( randpos );
      }
    }
  }
  particles_mesh.geometry.verticesNeedUpdate = true;
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
  guiParameters.goal_x = (-10.0 + Math.random() * 20.0);
  guiParameters.goal_z = (-10.0 + Math.random() * 20.0);

  markers(scene);
  scene.add(particles_mesh);
}

// called on frame updates
function onUpdate(framework)
{

}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
