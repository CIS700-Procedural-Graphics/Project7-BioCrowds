import { rotateAroundWorldAxis, rotateWorldSpace, translateWorldSpace, scaleWorldSpace, v3, c, randColor } from './Util.js';
const THREE = require('three');
const MIN_VEL = 0.0;
const MAX_VEL = 0.1;

export default class Agent {
  constructor(pos, size, goal, color) {
    this.startPos = pos.clone();
    this.pos = pos;
    this.vel = v3(0, 0, 0);
    this.size = size;
    this.radius = size / 2;
    this.goal = goal.clone();
    this.color = color || randColor();
    this.markers = [];
  }
/*
New velocity is determined by summing contributions from all the markers the agent "owns". Each marker contribution consists of the displacement vector between the agent and the marker multiplied by some (non-negative) weight. The weighting is based on
 - Similarity between the displacement vector and the vector to agent's goal (the more similar, the higher the weight. A dot product works well)
 - Distance from agent (the further away, the less contribution) Each contribution is normalized by the total marker contributions (divide each contribution by sum total)

Clamp the velocity to some maximum (you probably want to choose a max speed such that you agent will never move further than its marker radius)
*/
  updateVelocity() {
    let w = this.markers.map(marker => {
        let m = new THREE.Vector3().subVectors(this.pos, marker.v);
        let g = new THREE.Vector3().subVectors(this.pos, this.goal);
        let m_mag = m.length();
        let g_mag = g.length();
        let weight = (1 + m.dot(g) / (m_mag * g_mag)) / (1 + m_mag)
        return weight;
    })
    let sum_w = w.reduce((acc, val) => {
      return acc + val;
    }, 0);
    this.vel = this.markers.map((marker, i) => {
      let displacement = new THREE.Vector3().subVectors(marker.v, this.pos);
      return displacement.multiplyScalar(w[i] / sum_w);
    }).reduce((acc, val) => {
      return acc.add(val);
    }, v3()).clampLength(MIN_VEL, MAX_VEL);
  }

  updatePosition() {
    this.pos.add(this.vel);
    translateWorldSpace(this.mesh, this.vel);
    // patrolling
    if (window.PATROL_MODE && this.pos.distanceToSquared(this.goal) < 10) {
      let tmp = this.goal;
      this.goal = this.startPos;
      this.startPos = tmp;
    }
  }

  genMesh() {
    let geo = new THREE.CylinderGeometry(1, 1, 4, 16);
    let mat = new THREE.MeshLambertMaterial({side: THREE.DoubleSide, color: this.color});
    this.mesh = new THREE.Mesh(geo, mat);

    // let agentSize = v3(0.25, 1, 0.25);
    // scaleWorldSpace(this.mesh, agentSize);
    // geo.scale(this.size / 16, this.size / 4, this.size / 16);
    translateWorldSpace(this.mesh, this.pos);

    return this.mesh;
  }

  // Creates a mesh for the markers currently taken for debugging
  genMarkerMesh() {
    let geo = new THREE.Geometry();
    let mat = new THREE.PointsMaterial({ color: this.color, size: 0.75});
    let mesh = new THREE.Points(geo, mat);
    geo.vertices.push(...this.markers.map(m => { return m.v; }));
    this.markerMesh = mesh;
    return mesh;
  }
}
