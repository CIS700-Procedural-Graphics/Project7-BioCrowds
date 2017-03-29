import Agent from './Agent.js'
import { rotateWorldSpace, translateWorldSpace, min, v3, v2 } from './Util.js';
const THREE = require('three');


class Marker {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.takenBy = undefined;
    this.distanceToSquared = Infinity;
    this.v = v3(x, 0, y);
  }
}

export default class Grid {
  constructor(agentSize, gridSize, scenario, numMarkers) {
    this.agentSize = agentSize;
    this.halfSize = agentSize / 2;
    this.halfSizeSq = this.halfSize * this.halfSize;
    this.gridSize = gridSize;
    this.resolution = gridSize / this.halfSize;
    this.resolutionSq = this.resolution * this.resolution;
    // resolution has to be an integer :\
    this.grid = new Array(this.resolution);
    for (let i = 0; i < this.resolution; i++) {
      this.grid[i] = new Array(this.resolution);
      for (let j = 0; j < this.resolution; j++) {
        this.grid[i][j] = [];
      }
    }
    this.agents = [];
    this.markers = [];
    this.numMarkers = numMarkers;
    this.scatter();
    this.scenarioSetup();
    this.setScenario(scenario);
  }

  scatter() {
    let markersPerCell = Math.floor(this.numMarkers / this.resolutionSq);
    for (let i = 0; i < this.resolution; i++) {
      for (let j = 0; j < this.resolution; j++) {
        for (let k = 0; k < markersPerCell; k++) {
          let px = i * this.halfSize + Math.random() * this.halfSize;
          let py = j * this.halfSize + Math.random() * this.halfSize;
          let marker = new Marker(px, py);
          this.markers.push(marker)
          this.grid[i][j].push(marker);
        }
      }
    }
  }

  addAgent(agent) {
    this.agents.push(agent);
  }

  setAgents(agents) {
    this.agents = agents;
  }

  scenarioSetup() {
    this.scenario = {};

    this.scenario['default'] = [
      new Agent(v3(50, 0, 0), this.agentSize, v3(50, 0, 99)),
      new Agent(v3(50, 0, 99), this.agentSize, v3(50, 0, 0))
    ];


    this.scenario['side to side'] = [];
    for (let i = 0; i < 10; i++) {
      let start = v3(99, 0, Math.random() * 99);
      let end = v3(0, 0, Math.random() * 99);
      this.scenario['side to side'].push(new Agent(start, this.agentSize, end));
    }
    for (let i = 0; i < 10; i++) {
      let start = v3(0, 0, Math.random() * 99);
      let end = v3(99, 0, Math.random() * 99);
      this.scenario['side to side'].push(new Agent(start, this.agentSize, end));
    }

    this.scenario['ring'] = [];
    for (let i = 0; i < 10; i++) {
      let ratio = Math.tan(Math.PI * i / 10);
      let v = v2(1, ratio).normalize().multiplyScalar(i % 2 === 0 ? -40 : 40);
      let start = v3(v.x + this.gridSize / 2, 0, v.y + this.gridSize / 2);
      let end = v3(-v.x + this.gridSize / 2, 0, -v.y + this.gridSize / 2);
      this.scenario['ring'].push(new Agent(start, this.agentSize, end));
    }
  }

  setScenario(scenario) {
    this.setAgents(this.scenario[scenario]);
  }

  assignMarkers() {
    // precomputation
    this.agents.forEach(agent => {
      // reset
      agent.markers.forEach(marker => {
        marker.takenBy = undefined;
        marker.distanceToSquared = Infinity;
      });
      agent.markers = [];

      // marker lookup
      this.getRelevantMarkers(agent.pos.x, agent.pos.z).forEach(marker => {
        let dist = marker.v.distanceToSquared(agent.pos);
        if (dist < this.halfSizeSq && dist < marker.distanceToSquared) {
          marker.takenBy = agent;
          marker.distanceToSquared = dist;
        }
      });
    });

    // inverse assignment
    this.markers.forEach(marker => {
      if (marker.takenBy) {
        marker.takenBy.markers.push(marker);
      }
    });
  }

  getRelevantMarkers(x, y) {
    x = Math.floor(x / this.halfSize);
    y = Math.floor(y / this.halfSize);
    let markers = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let dx = x + i;
        let dy = y + j;
        if (0 <= dx && dx < this.resolution && 0 <= dy && dy < this.resolution) {
          markers = markers.concat(this.grid[dx][dy]);
        }
      }
    }
    return markers;
  }

  genMesh() {
    let geo = new THREE.PlaneGeometry(this.gridSize, this.gridSize, this.resolution);
    let mat = new THREE.MeshLambertMaterial({side: THREE.DoubleSide});
    let mesh = new THREE.Mesh(geo, mat);
    rotateWorldSpace(mesh, v3(90, 0, 0))
    translateWorldSpace(mesh, v3(50, 0, 50));
    return mesh;
  }

  genMarkerMesh() {
    let geo = new THREE.Geometry();
    let mat = new THREE.PointsMaterial({ color: 'black', size: 0.75});
    let mesh = new THREE.Points(geo, mat);
    this.markerMesh = mesh;
    this.markers.forEach(marker => {
      if (!marker.takenBy) {
        geo.vertices.push(marker.v);
      }
    });
    return mesh;
  }

  resetMarkers() {
    this.markers.forEach(marker => {
      marker.takenBy = undefined;
    });
  }
}
