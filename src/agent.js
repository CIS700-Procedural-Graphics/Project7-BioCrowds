const THREE = require('three')

var mat = new THREE.MeshBasicMaterial( {color: 0xf00ff} );

var radius = 0.3;
var spheregeo = new THREE.IcosahedronGeometry(radius, 2);
var sphere = new THREE.Mesh( spheregeo, mat );

export default class Agent
{
    constructor(pos, vel, _goal) //, _orientation)
    {
      this.name = "Agent";
      this.position = pos;
      this.velocity = vel;
      this.mesh = sphere.clone();
      this.goal = _goal;
      this.size = 1; //radius maybe
      this.markers = [];
      this.color = new THREE.Color(0xB266FF); //default is violet
    }

    drawagent(scene)
    {
      this.mesh.scale.set( 1,1,1 );
      this.mesh.position.set( this.position.x, this.position.y + radius, this.position.z );
      scene.add(this.mesh);
    }

    updateAgent()
    {//using speed independent of timestep for now
      this.velocity = new THREE.Vector3((this.goal.x - this.position.x ) * 0.05,
                                        (this.goal.y - this.position.y ) * 0.05,
                                        (this.goal.z - this.position.z ) * 0.05);

      this.position = new THREE.Vector3(this.position.x + this.velocity.x,
                                        this.position.y + this.velocity.y,
                                        this.position.z + this.velocity.z);
    }
}
