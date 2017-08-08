const THREE = require('three')
var RAND = require('random-seed').create(Math.random());

var cylindergeo = new THREE.CylinderGeometry( 1, 2, 1 );

var markerweights = [];

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

    updateAgentPosition()
    {
      //using speed independent of timestep for now
      this.velocity = new THREE.Vector3((this.goal.x - this.position.x ) * 0.05,
                                  (this.goal.y - this.position.y ) * 0.05,
                                  (this.goal.z - this.position.z ) * 0.05);

      this.position = new THREE.Vector3(this.position.x + this.velocity.x,
                                        this.position.y + this.velocity.y,
                                        this.position.z + this.velocity.z);

      this.mesh.position.set( this.position.x, this.position.y + 0.1, this.position.z );
    }

    updateAgent()
    {      
      var displacements = [];
      markerweights = [];
      var totalWeight = 0.0;

      var dotproduct;
      var numerator, denominator;

      var temp_vector_to_goal = (new THREE.Vector3(0, 0, 0)).subVectors(this.goal, this.position);
      temp_vector_to_goal.y = 0.0;

      if (temp_vector_to_goal.length() < 0.1) 
      {
        return;
      }

      // sum and record all weights
      for(var i=0; i<this.markers.length; i++)
      {
        var temp_vector_to_marker = (new THREE.Vector3(0, 0, 0)).subVectors(this.markers[i].position, this.position);
        temp_vector_to_marker.y = 0.0;

        numerator = (1.0 + temp_vector_to_marker.dot(temp_vector_to_goal) / temp_vector_to_marker.length() / temp_vector_to_goal.length());
        denominator = 1 + temp_vector_to_marker.length();
        var markerweight = (numerator)/(denominator);

        totalWeight += markerweight;
        markerweights.push(markerweight);
        displacements.push(temp_vector_to_marker);
      }

      var totalVelocity = new THREE.Vector3(0,0,0);
      if (totalWeight <= 0.0) 
      {
        this.velocity = new THREE.Vector3(0.1,0,0.1);
      }
      else
      {
        for(var i=0; i<markerweights.length; i++)
        {
          displacements[i].multiplyScalar(markerweights[i] / totalWeight);
          totalVelocity.add(displacements[i]);
        }

        this.velocity = totalVelocity;
      }




      this.position = new THREE.Vector3(this.position.x + totalVelocity.x,
                                        this.position.y + totalVelocity.y,
                                        this.position.z + totalVelocity.z);

      this.mesh.scale.set(0.2, 0.2, 0.2);
      this.mesh.position.set( this.position.x, this.position.y + 0.1, this.position.z );
    }
}
