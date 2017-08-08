const THREE = require('three')
var RAND = require('random-seed').create(Math.random());

var cylindergeo = new THREE.CylinderGeometry( 1, 2, 1 );

export default class Agent
{
    constructor(pos, vel, _goal, mat, _color) //, _orientation)
    {
      this.position = pos;
      this.velocity = vel;
      this.color = _color;
      this.mesh = new THREE.Mesh( cylindergeo, mat );
      this.goal = _goal;
      this.size = 1; //radius maybe
      this.markers = [];      
    }

    drawagent(scene)
    {
      this.mesh.scale.set( 0.2, 0.2, 0.2 );
      this.mesh.position.set( this.position.x, this.position.y + 0.1, this.position.z );
      scene.add(this.mesh);
    }

    updateAgent()
    {
      //using speed independent of timestep for now
      this.velocity = new THREE.Vector3((this.goal.x - this.position.x ) * 0.05,
                                        (this.goal.y - this.position.y ) * 0.05,
                                        (this.goal.z - this.position.z ) * 0.05);

      this.position = new THREE.Vector3(this.position.x + this.velocity.x,
                                        this.position.y + this.velocity.y,
                                        this.position.z + this.velocity.z);
    }
}
