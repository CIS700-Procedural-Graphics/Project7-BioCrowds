const THREE = require('three')

var mat = new THREE.MeshBasicMaterial( {color: 0xffff00} );

var cylgeo = new THREE.CylinderGeometry( 5, 5, 20, 32 );
var cylinder = new THREE.Mesh( cylgeo, mat );

var spheregeo = new THREE.SphereGeometry( 10, 10, 10 );
var sphere = new THREE.Mesh( spheregeo, mat );

export default class Agent
{
    constructor(pos, vel, _goal, _orientation)
    {
      this.name = "Agent";
      this.position = pos;
      this.velocity = vel;
      this.goal = _goal;
      this.orientation = _orientation;
      this.size = 1; //radius maybe
      this.markers = [];
      this.color = new THREE.Color(0xB266FF); //default is violet
    }

    printState()
    {
      //for debugging purposes
      console.log("Name: " + this.name);
      console.log("Position: " + this.position);
      console.log("Velocity: " + this.velocity);
      console.log("Goal: " + this.goal);
      console.log("Orientation: " + this.orientation);
    }

    drawagent(scene)
    {
      var agentmesh1 = sphere.clone();
      var agentmesh2 = cylinder.clone();
      agentmesh1.mesh.scale.set( 1,1,1 );
      agentmesh1.mesh.position.set( position.x, position.y+5, position.z );
      agentmesh2.mesh.scale.set( 1,1,1 );
      agentmesh2.mesh.position.set( position.x, position.y, position.z );
      scene.add(agentmesh1);
      scene.add(agentmesh2);
    }
}
