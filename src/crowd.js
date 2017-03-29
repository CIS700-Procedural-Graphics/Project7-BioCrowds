const THREE = require('three');
import Grid from './grid.js'
import Agent from './agent.js'
import Marker from './marker.js'

export default class Crowd {
  constructor(renderengine) {
  	this.renderengine = renderengine;
  	this.markers = [];
  	this.agents = [];
  	this.board = new Grid(2.0, 100.0);

  	this.create_agents();
  	this.create_markers();
  	this.renderengine.render_plane(100.0);
  	this.renderengine.render_agents(this.agents);
  	this.renderengine.render_markers(this.markers);
  }

  create_agents() {
  	var agent_1_pos = new THREE.Vector3(-49, 1, 49);
  	var agent_2_pos = new THREE.Vector3(49, 1, 49);
  	var agent_1_goal = new THREE.Vector3(49, 0, -49);
  	var agent_2_goal = new THREE.Vector3(-49, 0, -49);
  	var zero = new THREE.Vector3(0, 0, 0);

  	var agent_1 = new Agent(0, agent_1_pos, zero, agent_1_goal, 2.0, 0x00ff00);
  	var agent_2 = new Agent(1, agent_2_pos, zero, agent_2_goal, 2.0, 0x0000ff);
	this.agents.push(agent_1);
	this.agents.push(agent_2);
	var agent_1_gs = this.board.find_absolute_grid(agent_1_pos.x, agent_1_pos.z);
	var agent_2_gs = this.board.find_absolute_grid(agent_2_pos.x, agent_2_pos.z);
	this.board.grid[agent_1_gs.z][agent_1_gs.x].push(agent_1);
	this.board.grid[agent_2_gs.z][agent_2_gs.x].push(agent_2);
  }

  create_markers() {
	for (var i = 0; i < 2000; i++) {
		var x = Math.random() * 98 - 49;
		var z = Math.random() * 98 - 49;
		var marker = new Marker(new THREE.Vector3(x, 0.5, z));
		this.markers.push(marker);
	}
  }

  /* 
	update() - for each agent in the crowd, the velocity is calculated based off of the markers that belongs to each agent. 
  */ 
  update() {
  	this.update_marker_ownership();
  	this.update_agent_velocities();
  	this.renderengine.update_agents(this.agents);
  	this.renderengine.update_markers(this.markers);
  }

  update_marker_ownership() {
  	for (var i = 0; i < this.markers.length; i++) {
  		var marker = this.markers[i];
  		var ngs = this.board.find_nearest_grid(marker.position.x, marker.position.z);
  		var top_left = {x: ngs.x -1, z: ngs.z - 1};
  		var top = {x: ngs.x, z: ngs.z - 1};
  		var left = {x: ngs.x - 1, z: ngs.z};
  		var grid = this.board.grid;
  		var eligible_agents = [];
  		if (grid[top_left.z][top_left.x].length !== 0) {
  			grid[top_left.z][top_left.x].forEach(function(agent) {
  				eligible_agents.push(agent);
  			});
  		}
  		if (grid[top.z][top.x].length !== 0) {
  			grid[top_left.z][top_left.x].forEach(function(agent) {
  				eligible_agents.push(agent);
  			});
		}
  		if (grid[left.z][left.x].length !== 0) {
  			grid[top_left.z][top_left.x].forEach(function(agent) {
  				eligible_agents.push(agent);
  			});
   		}
  		this.assign_marker_to_agent(eligible_agents, marker);
  	}
  }

  assign_marker_to_agent(agents, marker) {
  	if (agents.length === 0) {
  		marker.color = 0xff0000;
  		marker.owned = false;
  		marker.agent = null;
  		return;
  	}
  	var closest = {dist: marker.position.distanceTo(agents[0].position), agent: agents[0]};
  	agents.forEach(function(agent) {
  		var test_dist = marker.position.distanceTo(agent.position);
  		if (test_dist < closest.dist) {
  			closest.dist = test_dist;
  			closest.agent = agent;
  		}
  	});
  	marker.agent = closest.agent;
  	marker.color = closest.agent.color;
  	marker.owned = true;
  	return;
  }

  update_agent_velocities() {
  	for (var i = 0; i < this.agents.length; i++) {
  		if (this.agents[i].position.distanceTo(this.agents[i].goal) > 2.0) {
  			// TODO
  			// below calulcation for position should use the formulaic velocity calculation
	  		var dir_vector = new THREE.Vector3(this.agents[i].goal.x - this.agents[i].position.x, 0, this.agents[i].goal.z - this.agents[i].position.z).normalize();
	  		// END TODO

	  		var old_x = this.agents[i].position.x;
	  		var old_z = this.agents[i].position.z;
	  		var old_gs = this.board.find_absolute_grid(old_x, old_z);
	  		this.agents[i].position.add(dir_vector.divideScalar(5.0));

	  		// check if the movement of this agent causes it to leave its current grid
			var agent_gs = this.board.find_absolute_grid(this.agents[i].position.x, this.agents[i].position.z);
			if (old_gs.x != agent_gs.x && old_gs.z != agent_gs.z) {
				var idx = this.board.grid[old_gs.z][old_gs.x].indexOf(this.agents[i]);
				this.board.grid[old_gs.z][old_gs.x].splice(idx, 1);
				this.board.grid[agent_gs.z][agent_gs.x].push(this.agents[i]);
			}
	  	}
  	}
  }
}