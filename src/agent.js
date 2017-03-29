const THREE = require('three');

export default class Agent {
  constructor(id, pos, vel, goal, size, col) {
  	this.id = id;
    this.position = pos;
    this.velocity = vel;
    this.goal = goal
    this.size = size;
    this.markers = [];
    this.color = col;
    this.mesh = null;
  }
} 