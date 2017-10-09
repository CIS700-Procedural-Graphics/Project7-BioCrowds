const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import { BioCrowd, Agent } from './biocrowd'
import { getConfig } from './agentconfig'

let scene;
let crowd;
let clock;
const GRID_SIZE = 30;
const NUM_MARKERS = 5000;
let DEBUG = false;
let controls = {
  debug: false,
  config: 1,
  pause: false
}
const agentGeo = new THREE.CylinderGeometry( 0.2, 0.2, 1 );
const agentMat = new THREE.MeshBasicMaterial( { color: 0x5599ff } );

// called after the scene loads
function onLoad(framework) {
    scene = framework.scene;
    const camera = framework.camera;
    const renderer = framework.renderer;
    const gui = framework.gui;
    const stats = framework.stats;

    // Basic Lambert white
    const lambertWhite = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });

    // Set light
    const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.color.setHSL(0.1, 1, 0.95);
    directionalLight.position.set(1, 3, 2);
    directionalLight.position.multiplyScalar(10);

    renderer.setClearColor(0xeeeeee, 1);

    const objLoader = new THREE.OBJLoader();


    // set camera position
    camera.position.set(-5, 20, 40);
    camera.lookAt(new THREE.Vector3(GRID_SIZE / 2, -5, GRID_SIZE / 2));

    scene.add(directionalLight);

    // edit params and listen to changes like this
    // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
    gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
        camera.updateProjectionMatrix();
    });

    const planeGeo = new THREE.PlaneBufferGeometry(GRID_SIZE, GRID_SIZE);
    const planeMat = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide } );
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.rotation.x = Math.PI / 2
    planeMesh.position.setX(GRID_SIZE / 2)
    planeMesh.position.setZ(GRID_SIZE / 2)
    planeMesh.position.setY(-0.5)
    scene.add(planeMesh);

    // Initialize bio crowd
    SetupCrowd();

    if (controls.debug) {
      ShowMarkers();
    }

    gui.add(controls, 'config', {CONF1: 1, CONF2: 2}).onChange(() => {
      SetupCrowd();
    });

    gui.add(controls, 'debug').onChange(() => {
      controls.debug ? ShowMarkers() : HideMarkers();
    });

    gui.add(controls, 'pause');


    clock = new THREE.Clock();
    clock.start();
}

function ShowMarkers() {
  if (!crowd) return;
  const markerGeo = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
  const markerMat1 = new THREE.MeshBasicMaterial( { color: 0x000000 } );
  const markerMat2 = new THREE.MeshBasicMaterial( { color: 0xff0000 } );

  for (let m in crowd.markers){
    let pos = crowd.markers[m];
    let markerMesh;

    if ((Math.floor(pos.x) + Math.floor(pos.z)) % 2 == 0 ) {
      markerMesh = new THREE.Mesh(markerGeo, markerMat2);
    } else {
      markerMesh = new THREE.Mesh(markerGeo, markerMat1);
    }
    markerMesh.position.set(pos.x, -0.4, pos.z);
    markerMesh.name = "marker" + m;
    scene.add(markerMesh);
  }

  const tileGeo = new THREE.PlaneBufferGeometry(1,1);
  const tileMat = new THREE.MeshBasicMaterial( { color: 0xdddddd, side: THREE.DoubleSide } );

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if((i + j) % 2 == 0) {
        const tileMesh = new THREE.Mesh(tileGeo, tileMat);
        tileMesh.rotation.x = Math.PI / 2;
        tileMesh.position.set(i + 0.5, -0.45, j + 0.5);
        tileMesh.name = "tile-" + i + "-" + j;
        scene.add(tileMesh);
      }
    }
  }
}

function HideMarkers() {
  if (!crowd) return;
  for (let m in crowd.markers){
    scene.remove(scene.getObjectByName("marker" + m, true));
  }
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if((i + j) % 2 == 0) {
        scene.remove(scene.getObjectByName("tile-" + i + "-" + j, true))
      }
    }
  }

}

function ClearScene() {
  if (!crowd) return;
  for (let i = 0; i < crowd.agents.length; i++) {
    scene.remove(scene.getObjectByName("agent" + i, true));
  }
}


function SetupCrowd() {
  ClearScene();
  crowd = new BioCrowd(GRID_SIZE, NUM_MARKERS);

  let conf = getConfig(controls.config, GRID_SIZE);

  crowd.SetupAgents(conf.startPositions, conf.endPositions);
}


// called on frame updates
function onUpdate(framework) {
  if (crowd && !controls.pause) {
    crowd.MoveAgents();
    const agents = crowd.agents;

    for (let i = 0; i < agents.length; i++) {
      if (!agents[i].done) {
        let pos = agents[i].pos;
        let name = "agent" + i;
        let agentMesh = scene.getObjectByName(name,true);
        const markerGeo = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );

        if (agentMesh) {
          agentMesh.position.set(pos.x,0,pos.z);

          // for(let j in agents[i].markers) {
          //     let m = agents[i].markers[j]
          //     let markerMesh = new THREE.Mesh(markerGeo, agentMesh.material);
          //     markerMesh.position.set(m.x, -0.5, m.z);
          //     scene.add(markerMesh)
          // }

        } else {
          const agentMat = new THREE.MeshBasicMaterial( { color: new THREE.Color(Math.random(), Math.random(), Math.random())} );
          let agentMesh = new THREE.Mesh(agentGeo, agentMat);
          agentMesh.position.set(pos.x, 0, pos.z);
          agentMesh.name = name;
          scene.add(agentMesh);
        }
      }
    }
  }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
