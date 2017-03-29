
// Skybox texture from: https://github.com/mrdoob/three.js/tree/master/examples/textures/cube/skybox

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import Crowd, {Agent} from './agent.js'
import MarkerField, {Marker} from './marker.js'

var crowd = null;
var markerField = null;
var scene = null;

var line_material = new THREE.LineBasicMaterial({
                  color: 0xFFFFFF
                });
var line_geometry = new THREE.Geometry();
var line_segments = new THREE.LineSegments(line_geometry, line_material);
var temp_vel = new THREE.Vector3(0,0,0);
var temp_displacement = new THREE.Vector3(0,0,0);
var temp_vector_to_goal = new THREE.Vector3(0,0,0);

var config = {
    pause : false,
	grid_width : 20,
	marker_density : 5.0,
	agent_density : 0.5,
    agent_speed : 1,
    goal_x : 0,
    goal_y : 0,
    goal_z : 0,
    scenario: 1
}

// called after the scene loads
function onLoad(framework) {
    scene = framework.scene;
    var camera = framework.camera;
    var renderer = framework.renderer;
    var gui = framework.gui;
    var stats = framework.stats;
    var controls = framework.controls;

    // Basic Lambert white
    var lambertWhite = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });

    // Set light
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.color.setHSL(0.1, 1, 0.95);
    directionalLight.position.set(1, 3, 2);
    directionalLight.position.multiplyScalar(10);
  
    var grid_width = 20;
    var marker_density = 5;
    var agent_density = 0.5;
    
    //TODO: look at center and offset grid data
    camera.position.set(grid_width/2, grid_width, grid_width/2);
    camera.lookAt(new THREE.Vector3(grid_width/2,0,grid_width/2));
    controls.target.set(grid_width/2, 0, grid_width/2);

    scene.add(directionalLight);
    
    markerField = new MarkerField(marker_density, grid_width);
    var grid = markerField.createGridLines();
    var field = markerField.createField();
    var markers = markerField.createMarkers();
    field.position.y = -0.1;
    scene.add(grid);
    scene.add(field);
    scene.add(markers);
    
    crowd = new Crowd(agent_density, grid_width);
    var agents = crowd.createAgents();
    //console.log(agents);
    
    console.log(agents);
    
    for (var i = 0; i <= agents.length; i++) {
        
        if (!agents[i]) {
            continue;
        }
        
        for (var j = 0; j <= agents[i].length; j++) { 
            
            var tile_agents = agents[i][j];
            if (tile_agents) {
                
                for (var k = 0; k < tile_agents.length; k++) {
                    scene.add(tile_agents[k].mesh);
                }
            }           
        }
    }
    

    markerField.assignMarkersToAgents(crowd.agentsData); 
    
    scene.add(line_segments);
    
    line_segments.name = "debug";

	gui.add(config, 'grid_width', 10, 50).step(10).name("Grid Width").onChange( function(width)
    {
        config.grid_width = width;
        reset();
    });
    
    gui.add(config, 'agent_density', 0.1, 1.0).name("Agent Density").onChange( function(agentDensity)
    {
        config.agent_density = agentDensity;
        reset();
    });
    
    gui.add(config, 'agent_speed', 1, 5).name("Agent Speed").onChange( function(agentSpeed)
    {
        config.agent_speed = agentSpeed;
        reset();
    });
    
    gui.add(config, 'marker_density', 3, 10, 1).name("Marker Density").onChange( function(markerDensity)
    {
        config.marker_density = markerDensity;
        reset();
    });
    
    gui.add(config, 'scenario', { Opposite: 1, Lined: 2, Home: 3 } ).name("Scenario").onChange(function(newScenario) {
        config.scenario = newScenario;
        reset();
    });  	
    
    gui.add(config, 'goal_x', 0, 50).name("Goal X Position").onChange( function(goal_x)
    {
        config.goal_x = goal_x;
        for (var i = 0; i <= agents.length; i++) {

            if (!agents[i]) {
                continue;
            }

            for (var j = 0; j <= agents[i].length; j++) { 

                var tile_agents = agents[i][j];
                if (tile_agents) {

                    for (var k = 0; k < tile_agents.length; k++) {
                        tile_agents[k].goal.x = Math.min(goal_x-1,config.grid_width-1);
                    }
                }           
            }
        }
    });
    
    gui.add(config, 'goal_z', 0, 50).name("Goal Z Position").onChange( function(goal_z)
    {
        config.goal_z = goal_z;
        for (var i = 0; i <= agents.length; i++) {

            if (!agents[i]) {
                continue;
            }

            for (var j = 0; j <= agents[i].length; j++) { 

                var tile_agents = agents[i][j];
                if (tile_agents) {

                    for (var k = 0; k < tile_agents.length; k++) {
                        tile_agents[k].goal.z = Math.min(goal_z-1,config.grid_width-1);
                    }
                }           
            }
        }
    });
    
    gui.add(config, 'pause').name("Pause").onChange(function(value) {

        if (value) {
          config.pause = value;
        } else {
          config.pause = value;
        }
    });
    
    var reset = function() {
        scene.remove(markers);
        scene.remove(grid);
        scene.remove(field);
        camera.position.set( config.grid_width/2,  config.grid_width,  config.grid_width/2);
        camera.lookAt(new THREE.Vector3( config.grid_width/2,0, config.grid_width/2));
        controls.target.set( config.grid_width/2, 0,  config.grid_width/2);

        markerField = new MarkerField(config.marker_density, config.grid_width);
        grid = markerField.createGridLines();
        scene.add(grid);
        field = markerField.createField();
        field.position.y = -0.1;
        scene.add(field);
        markers = markerField.createMarkers();
        scene.add(markers);
        
        for (var i = 0; i <= agents.length; i++) {

            if (!agents[i]) {
                continue;
            }

            for (var j = 0; j <= agents[i].length; j++) { 

                var tile_agents = agents[i][j];
                if (tile_agents) {

                    for (var k = 0; k < tile_agents.length; k++) {
                        scene.remove(tile_agents[k].mesh);
                    }
                }           
            }
        }
        crowd = new Crowd(config.agent_density, config.grid_width);
        crowd.scenario = Math.round(config.scenario);
        console.log(crowd.scenario);
        agents = crowd.createAgents();
        
            
        for (var i = 0; i <= agents.length; i++) {

            if (!agents[i]) {
                continue;
            }

            for (var j = 0; j <= agents[i].length; j++) { 

                var tile_agents = agents[i][j];
                if (tile_agents) {

                    for (var k = 0; k < tile_agents.length; k++) {
                        scene.add(tile_agents[k].mesh);
                    }
                }           
            }
        }
    }
}


var frame = 0;
// called on frame updates
function onUpdate(framework) {
    
    if (crowd && markerField && !config.pause) {
        
        markerField.assignMarkersToAgents(crowd.agentsData);
        
        var agents = crowd.agentsData;
        
        line_geometry.vertices = [];
        line_geometry.faces = [];
            
        for (var i = 0; i <= agents.length; i++) {

            if (!agents[i]) {
                continue;
            }

            for (var j = 0; j <= agents[i].length; j++) { 

                var tile_agents = agents[i][j];
                if (tile_agents) {

                    for (var k = 0; k < tile_agents.length; k++) {
                        var agent = tile_agents[k];
                        
                        temp_vel.x = 0;
                        temp_vel.y = 0;
                        temp_vel.z = 0;

                        var markers = agent.markers;
                        var sum_weight = 0;
                        
                        temp_vector_to_goal.x = agent.goal.x - agent.position.x;
                        temp_vector_to_goal.y = agent.goal.y - agent.position.y;
                        temp_vector_to_goal.z = agent.goal.z - agent.position.z;
                        
                        if (temp_vector_to_goal.length() < 0.5)
                            continue;
                        
                        for (var m = 0; m < markers.length; m++) {
                            
                            var marker = markers[m];
                            temp_displacement.x = marker.position.x - agent.position.x;
                            temp_displacement.y = marker.position.y - agent.position.y;
                            temp_displacement.z = marker.position.z - agent.position.z;
                
                            var dot = temp_displacement.dot(temp_vector_to_goal);
                            
                            var cos_theta = dot / (temp_displacement.length() * temp_vector_to_goal.length());
                            
                            marker.weight = (1.0 + cos_theta)  / (1.0 + temp_displacement.length());
                        
                            sum_weight += marker.weight;
                            
                        }
                        
                        for (var m = 0; m < markers.length; m++) {
                            
                            var marker = markers[m];
                            temp_displacement.x = marker.position.x - agent.position.x;
                            temp_displacement.y = marker.position.y - agent.position.y;
                            temp_displacement.z = marker.position.z - agent.position.z;
                            
                            marker.weight = marker.weight / sum_weight;
                            
                            temp_vel.add(temp_displacement.multiplyScalar(marker.weight));
                        }
                                        
                        agent.velocity = temp_vel.multiplyScalar(0.1*config.agent_speed);
                        
                    
                        agent.updatePosition(agents);
                        
                        //Uncomment to draw debug lines
//                        for (var m = 0; m < agent.markers.length; m++) {
//                                                   
//                            line_geometry.vertices.push(
//                                agent.position,
//                                agent.markers[m].position
//                            );
//                            
//                        }
                                             
                    }
                }           
            }
        }

        line_segments.geometry.verticesNeedUpdate = true;
        line_segments.geometry.dynamic = true;
        line_segments.geometry.elementsNeedUpdate = true;      
        
    }
    
    frame++;

}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);