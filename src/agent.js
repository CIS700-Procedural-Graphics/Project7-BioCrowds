const THREE = require('three')


export default class Agent{

  constructor(pos, vel, goal, orientation, radius, markers) {
    this.position = pos;
    this.velocity = vel;
    this.goal = goal;
    this.orientation = orientation;
    this.size = radius;
    this.markers = markers;
  }//end constructor



}
