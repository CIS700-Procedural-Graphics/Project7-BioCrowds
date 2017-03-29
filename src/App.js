import Stats from 'stats-js'
import DAT from 'dat-gui'
const THREE = require('three');
const OrbitControls = require('three-orbit-controls')(THREE);
const OBJLoader = require('three-obj-loader')(THREE);

import Grid from './Grid.js';
import Agent from './Agent.js';

import { rotateAroundWorldAxis, v3 } from './Util.js';

window.DEBUG_MODE = true;
window.PATROL_MODE = true;
window.DEBUG_HYSTERESIS = true;
window.log = console.log;

export default class App {
  constructor() {
    this.scene = new THREE.Scene();
    this.gui = new DAT.GUI();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.stats = new Stats();
    this.agentSize = 8;
    this.scenario = 'default';
    this.numMarkers = 10000;
    this.gridSize = 100;
    this.grid = new Grid(this.agentSize, this.gridSize, this.scenario, this.numMarkers);
  }

  run() {
    this.controls.update();
    this.stats.begin();
    this.onUpdate();
    this.renderer.render(this.scene, this.camera);
    this.stats.end();
    requestAnimationFrame(this.run.bind(this));
  }

  setup() {
    this.cameraSetup();
    this.rendererSetup();
    this.statsSetup();
    this.lightSetup();
    this.guiSetup();
    this.sceneSetup();
  }

  cameraSetup() {
    this.camera.position.set(50, 100, 75);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enableZoom = true;
    this.controls.target.set(50, 0, 50);
    this.controls.rotateSpeed = 0.3;
    this.controls.zoomSpeed = 1.0;
    this.controls.panSpeed = 2.0;
  }

  rendererSetup() {
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x020202, 0);
  }

  statsSetup() {
    this.stats.setMode(1);
  }

  lightSetup() {
    let dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(1, 3, 2);
    dirLight.position.multiplyScalar(10);
    let ambientLight = new THREE.AmbientLight(0xffffff, 0.3);

    this.lights = [dirLight, ambientLight];
  }

  clearScene() {
    for(let i = this.scene.children.length - 1; i >= 0; i--) {
      let obj = this.scene.children[i];
      this.scene.remove(obj);
    }
    // this.scene.background = this.background;
  }

  guiSetup() {
    let gui = this.gui;
    gui.add(this, 'scenario', ['default', 'side to side', 'ring']).onChange(val => {
      this.isUpdating = true;
      this.clearScene()
      this.grid = new Grid(this.agentSize, this.gridSize, this.scenario, this.numMarkers);
      this.sceneSetup();
      this.isUpdating = false;
    });
    gui.add(this, 'numMarkers', 1000, 20000).step(1000).onChange(val => {
      this.isUpdating = true;
      this.clearScene()
      this.grid = new Grid(this.agentSize, this.gridSize, this.scenario, this.numMarkers);
      this.sceneSetup();
      this.isUpdating = false;
    });

    gui.add(this, 'agentSize', [1, 2, 4, 8, 10, 20, 25, 50]).onChange(val => {
      this.isUpdating = true;
      this.clearScene()
      this.grid = new Grid(this.agentSize, this.gridSize, this.scenario, this.numMarkers);
      this.sceneSetup();
      this.isUpdating = false;
    });

    gui.add(window, 'PATROL_MODE');
    gui.add(window, 'DEBUG_MODE').onChange(val => {
      if (val) {
        window.DEBUG_HYSTERESIS = true;
      }
    });
  }

  sceneSetup() {
    console.log("Setting up scene...");

    this.scene.add(...this.lights);
    this.scene.add(this.grid.genMesh());
    if (this.grid.agents.length > 0) {
      this.scene.add(...this.grid.agents.map(agent => {
        return agent.genMesh();
      }));
    }
    window.x = this.grid;
  }

  loadResources() {
    console.log("Loading Resources...");
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  onLoad() {
    document.body.appendChild(this.stats.domElement);
    document.body.appendChild(this.renderer.domElement);
    this.loadResources().then(() => {
      this.clearScene();
      this.setup();
      this.run();
    });
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onUpdate() {
    if (this.isUpdating) {
      return;
    }
    if (window.DEBUG_MODE) {
      this.scene.remove(this.grid.markerMesh);
      this.scene.add(this.grid.genMarkerMesh());
      this.grid.resetMarkers();
      this.grid.agents.forEach(agent => {
        this.scene.remove(agent.markerMesh);
        this.scene.add(agent.genMarkerMesh());
      })
    } else if (window.DEBUG_HYSTERESIS){
      this.scene.remove(this.grid.markerMesh);
      this.grid.agents.forEach(agent => {
        this.scene.remove(agent.markerMesh);
      });
      window.DEBUG_HYSTERESIS = false;
    }
    this.grid.assignMarkers();
    this.grid.agents.forEach(agent => {
      agent.updateVelocity();
      agent.updatePosition();
    });
  }
}
