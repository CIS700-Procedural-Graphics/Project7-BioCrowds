const THREE = require('three')
var RAND = require('random-seed').create(Math.random());

var cylindergeo = new THREE.CylinderGeometry( 1, 2, 1 );
var totalWeight = 0;
var distToMarker = 0;
var distToGoal = 0;
var distToGoal1 = 0;
var totalVelocity = new THREE.Vector3(0,0,0);
var distBtwOldNewPos = 0;

export default class Agent
{
    constructor(pos, vel, _goal, mat, _color) //, _orientation)
    {
      this.position = pos;
      this.velocity = vel;
      this.color = _color;
      this.mesh = new THREE.Mesh( cylindergeo, mat );
      this.goal = _goal;
      this.markers = [];
      this.oldposition = new THREE.Vector3(pos.x,pos.y,pos.z);
      this.active = true;
      this.drawn = false;
    }

    drawagent(scene)
    {
      this.mesh.scale.set( 0.15, 0.15, 0.15 );
      this.mesh.position.set( this.position.x, this.position.y + 0.1, this.position.z );
      scene.add(this.mesh);
      this.drawn = true;
    }

    stopDrawingAgent(scene)
    {
      this.mesh.scale.set( 0.00001, 0.00001, 0.00001 );
      this.drawn = false;
    }

    updateAgent(markernum)
    {      
      var displacements = [];
      var markerweights = [];
      totalWeight = 0.0;

      var temp_vector_to_goal = (new THREE.Vector3(0, 0, 0)).subVectors(this.goal, this.position);
      temp_vector_to_goal.y = 0.0;
      distToGoal = temp_vector_to_goal.length();
      temp_vector_to_goal = temp_vector_to_goal.normalize();

      if (distToGoal < 0.15) 
      {
        this.active = false;
        return;
      }

      // sum and record all weights
      for(var i=0; i<this.markers.length; i++)
      {
        var temp_vector_to_marker = (new THREE.Vector3(0, 0, 0)).subVectors(this.markers[i].position, this.position);
        temp_vector_to_marker.y = 0.0;
        distToMarker = temp_vector_to_marker.length();
        temp_vector_to_marker = temp_vector_to_marker.normalize();

        var markerweight = (1.0 + temp_vector_to_marker.dot(temp_vector_to_goal))/(1 + distToMarker);

        totalWeight += markerweight;
        markerweights.push(markerweight);
        displacements.push(temp_vector_to_marker);
      }

      totalVelocity.x =0;
      totalVelocity.y =0;
      totalVelocity.z =0;

      var temp1_vector_to_goal = (new THREE.Vector3(0, 0, 0)).subVectors(this.goal, this.position);
      temp1_vector_to_goal.y = 0.0;
      distToGoal1 = temp1_vector_to_goal.length();

      if (totalWeight == 0.0) 
      {
        this.velocity = temp_vector_to_goal.multiplyScalar(0.05);
      }
      else
      {
        for(var i=0; i<markerweights.length; i++)
        {
          displacements[i].multiplyScalar(markerweights[i] / totalWeight);
          totalVelocity.add(displacements[i]);
        }

        this.velocity = totalVelocity.multiplyScalar(0.2);
      }

      this.oldposition.x = this.position.x;
      this.oldposition.x = this.position.y;
      this.oldposition.x = this.position.z;

      this.position.x = this.position.x + this.velocity.x;
      this.position.z = this.position.z + this.velocity.z;

      distBtwOldNewPos = this.oldposition.distanceTo(this.position);

      if(distBtwOldNewPos < 1.0)
      {
        markernum=markernum+10;
        markernum = markernum%250;
        return;
      }

      this.mesh.scale.set(0.15, 0.15, 0.15);
      this.mesh.position.set( this.position.x, this.position.y + 0.1, this.position.z );
    }
}
