const THREE = require('three');

export function Agent(pos) {
	this.position = pos;//[pos.x,pos.y,pos.z];
    this.forward = new THREE.Vector3(1,0,0);
	this.velocity = new THREE.Vector3(0,0,0);
	this.orientation = [1,1,1];
    this.size = [1,1,1];
	this.goal = new THREE.Vector3(0,0,0);
	this.color = 0xFFFFFF;
    this.markers = [];
    this.mesh = null;
    
    this.updatePosition = function(agents) {
        
        var x = Math.floor(this.position.x);
        var z = Math.floor(this.position.z);
        var tile_agents = agents[x][z];

        var index = tile_agents.indexOf(this);

        if (index > -1) {
            tile_agents.splice(index, 1);
        } else {
            console.log("WARNING: Agent index should always exist.")
        }
        
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;

        if (this.mesh) {                     
            this.mesh.scale.set(0.3,0.3,0.3);
            this.mesh.position.x = this.position.x;
            this.mesh.position.z = this.position.z;
        }
        
        var new_x = Math.floor(this.position.x);
        var new_z = Math.floor(this.position.z);

        if (typeof agents[new_x] == 'undefined') {
            agents[new_x] = [];
        }

        if (typeof agents[new_x][new_z] == 'undefined') {
            agents[new_x][new_z] = [];
        }
        agents[new_x][new_z].push(this);
        
    }
}

function createAgent(pos) {
    
    var agent = new Agent(pos);

//    var triangleGeometry = new THREE.Geometry(); 
//    triangleGeometry.vertices.push(new THREE.Vector3(0.0, 0, 0.4));  
//    triangleGeometry.vertices.push(new THREE.Vector3(1.0, 0, 0.0)); 
//    triangleGeometry.vertices.push(new THREE.Vector3( 0.0, 0, -0.4));
//    triangleGeometry.vertices.push(new THREE.Vector3(0.0, 0.4, 0.0));  
//
//    triangleGeometry.faces.push(new THREE.Face3(0, 1, 2));
//    triangleGeometry.faces.push(new THREE.Face3(0, 3, 1));
//    triangleGeometry.faces.push(new THREE.Face3(1, 3, 2));
//    triangleGeometry.faces.push(new THREE.Face3(2, 3, 0));
    var cylinder = new THREE.CylinderGeometry(0.4, 0.4, 2);

    var material = new THREE.MeshBasicMaterial({ 
        color:0xFF0000, 
        side:THREE.DoubleSide 
    });

    var mesh = new THREE.Mesh(cylinder, material); 
    mesh.position.set(pos.x, pos.y+0.21, pos.z);
    mesh.scale.set(0.3,0.3,0.3);
    
    agent.mesh = mesh;

    return agent;
}

export default function Crowd(agent_density, grid_length) {
	
    this.agentsData = [];
    //this.spacing = Math.sqrt(grid_length * grid_length / num_agents);
    this.spacing = 1.0/agent_density;
    this.gridWidth = grid_length;
    this.scenario = 1;
    
    this.createAgents = function() {  
        var spacing_ceil = Math.ceil(this.spacing);
        
        switch (this.scenario) {
            case 1:        
                for (var i = 0; i < this.gridWidth/2; i+=spacing_ceil) {

                    var row = Math.floor(i);

                    for (var j = 0; j < this.gridWidth/2-row; j+=spacing_ceil) {

                        var col = Math.floor(j);

                        var x = i+Math.random()*this.spacing;
                        var z = j+Math.random()*this.spacing;
                        var agent = createAgent(new THREE.Vector3(x,0,z));
                        agent.goal.x = this.gridWidth-1;
                        agent.goal.z = this.gridWidth-1;

                        var floor_x = Math.floor(x);
                        var floor_z = Math.floor(z);

                        if (!this.agentsData[floor_x]) {
                            this.agentsData[floor_x] = [];
                        }

                        if (!this.agentsData[floor_x][floor_z]) {
                            this.agentsData[floor_x][floor_z] = [];
                        }
                        this.agentsData[floor_x][floor_z].push(agent);
                    }  
                }
                for (var i = this.gridWidth-spacing_ceil; i >= this.gridWidth/2; i-=spacing_ceil) {

                    var row = Math.floor(i);

                    for (var j = this.gridWidth-spacing_ceil; j >= this.gridWidth/2+(this.gridWidth-spacing_ceil-row); j-=spacing_ceil) {

                        var col = Math.floor(j);

                        var x = i+Math.random()*this.spacing;
                        var z = j+Math.random()*this.spacing;
                        var agent = createAgent(new THREE.Vector3(x,0,z));
                        agent.goal.x = 0;
                        agent.goal.z = 0;

                        var floor_x = Math.floor(x);
                        var floor_z = Math.floor(z);

                        if (!this.agentsData[floor_x]) {
                            this.agentsData[floor_x] = [];
                        }

                        if (!this.agentsData[floor_x][floor_z]) {
                            this.agentsData[floor_x][floor_z] = [];
                        }
                        this.agentsData[floor_x][floor_z].push(agent);
                    }  
                }
            break;
            case 2:
            for (var i = 0; i < this.gridWidth; i+=spacing_ceil) {

                    var row = Math.floor(i);

                    for (var j = 0; j < 3; j+=spacing_ceil) {

                        var col = Math.floor(j);

                        var x = i+Math.random()*this.spacing;
                        var z = j+Math.random()*this.spacing;
                        var agent = createAgent(new THREE.Vector3(x,0,z));
                        agent.goal.x = x;
                        agent.goal.z = this.gridWidth;

                        var floor_x = Math.floor(x);
                        var floor_z = Math.floor(z);

                        if (!this.agentsData[floor_x]) {
                            this.agentsData[floor_x] = [];
                        }

                        if (!this.agentsData[floor_x][floor_z]) {
                            this.agentsData[floor_x][floor_z] = [];
                        }
                        this.agentsData[floor_x][floor_z].push(agent);
                    }  
                }
                for (var i = this.gridWidth-spacing_ceil; i >= 0; i-=spacing_ceil) {

                    var row = Math.floor(i);

                    for (var j = this.gridWidth-spacing_ceil; j >= this.gridWidth-spacing_ceil-2; j-=spacing_ceil) {

                        var col = Math.floor(j);

                        var x = i+Math.random()*this.spacing;
                        var z = j+Math.random()*this.spacing;
                        var agent = createAgent(new THREE.Vector3(x,0,z));
                        agent.goal.x = x;
                        agent.goal.z = 0;

                        var floor_x = Math.floor(x);
                        var floor_z = Math.floor(z);

                        if (!this.agentsData[floor_x]) {
                            this.agentsData[floor_x] = [];
                        }

                        if (!this.agentsData[floor_x][floor_z]) {
                            this.agentsData[floor_x][floor_z] = [];
                        }
                        this.agentsData[floor_x][floor_z].push(agent);
                    }  
                }      
            break;
            case 3:
                for (var i = 0; i < this.gridWidth; i+=spacing_ceil) {

                    var row = Math.floor(i);

                    for (var j = 0; j < this.gridWidth; j+=spacing_ceil) {

                        var col = Math.floor(j);

                        var x = i+Math.random()*this.spacing;
                        var z = j+Math.random()*this.spacing;
                        var agent = createAgent(new THREE.Vector3(x,0,z));

                        var floor_x = Math.floor(x);
                        var floor_z = Math.floor(z);

                        if (typeof this.agentsData[floor_x] == 'undefined') {
                            this.agentsData[floor_x] = [];
                        }

                        if (typeof this.agentsData[floor_x][floor_z] == 'undefined') {
                            this.agentsData[floor_x][floor_z] = [];
                        }
                        this.agentsData[floor_x][floor_z].push(agent);
                    }  
                } 
            break;
            default:
                console.log('Not an existing scenario.');
            break;
        }
     
        return this.agentsData;
    }
	   
}