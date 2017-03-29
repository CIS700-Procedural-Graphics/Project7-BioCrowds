const THREE = require('three');

export function Marker(pos) {
	this.position = pos;
	this.color = 0xFFFFFF;
    this.agent = null;
    this.weight = 0;
}

function assignAgentTo(marker, agents, availability, width) {
            
    var x = Math.floor(marker.position.x);
    var z = Math.floor(marker.position.z);
    var min = [x-1, z-1];
    var max = [x+1, z+1];
    if (min[0] < 0)
        min[0] = 0;
    
    if (min[1] < 0)
        min[1] = 0;
    
    if (max[0] > width-1)
        max[0] = width-1;
    
    if (max[1] > width-1)
        max[1] = width-1;
    
    var closest_agent = null;
    var closest_dist = Number.MAX_VALUE;
    
    for (var i = min[0]; i <= max[0]; i++) {
        
        if (typeof agents[i] == 'undefined') {
            continue;
        }
        
        for (var j = min[1]; j <= max[1]; j++) { 
           
            var tile_agents = agents[i][j];
            if (tile_agents) {

                for (var k = 0; k < tile_agents.length; k++) {

                    var dist = tile_agents[k].position.distanceTo(marker.position);
                    
                    if (dist < closest_dist && dist < 2.0) {
                        closest_agent = tile_agents[k];
                        closest_dist = dist;
                    }

                }
            }
           
        }
    }
    
    if (closest_agent) {
        closest_agent.markers.push(marker);
        marker.agent = closest_agent;
    }

}

function assignMarkersTo(agents, markers, availability, width) {
    
    //clear all markers assigned to agents
    for (var i = 0; i <= agents.length; i++) {
        
        if (typeof agents[i] == 'undefined') {
            continue;
        }
        
        for (var j = 0; j <= agents[i].length; j++) { 
            
            var tile_agents = agents[i][j];
            if (tile_agents) {

                for (var k = 0; k < tile_agents.length; k++) {
                    var dist = tile_agents[k].markers = [];
                }
            }           
        }
    }
    

    for (var i = 0; i < markers.length; i++) {
             
        for (var j = 0; j < markers.length; j++) { 
           
            var tile_markers = markers[i][j];
            if (tile_markers) {

                for (var k = 0; k < tile_markers.length; k++) {

                    assignAgentTo(tile_markers[k], agents, availability, width);

                }
            }
           
        }
    }
 
}

export default function MarkerField(num_markers_per_field, field_width) {
	
	this.markers = null;
    this.density = num_markers_per_field;
    this.width = field_width;
    this.markersData = [];
    this.markersAvailability = [];
    
    this.createGridLines = function() {      

        var plane = new THREE.Mesh(
            new THREE.PlaneGeometry( this.width, this.width, this.width, this.width),
            new THREE.MeshBasicMaterial( {
                color: 0xFFFFFF,
                wireframe: true
            } )
        );
        plane.rotation.x = Math.PI/2;
        plane.position.x = this.width/2;
        plane.position.y = 0;
        plane.position.z = this.width/2;  
        return plane;
    }
        
    this.createField = function() {
        
        var squareGeometry = new THREE.Geometry(); 
        squareGeometry.vertices.push(new THREE.Vector3(0.0, 0.0, this.width)); 
        squareGeometry.vertices.push(new THREE.Vector3(this.width, 0.0, this.width)); 
        squareGeometry.vertices.push(new THREE.Vector3(this.width, 0.0, 0.0)); 
        squareGeometry.vertices.push(new THREE.Vector3(0.0, 0.0, 0.0)); 
        squareGeometry.faces.push(new THREE.Face3(0, 1, 2)); 
        squareGeometry.faces.push(new THREE.Face3(0, 2, 3)); 
        var squareMaterial = new THREE.MeshBasicMaterial({ 
        color:0x0000000, 
        side:THREE.DoubleSide 
        }); 
        var squareMesh = new THREE.Mesh(squareGeometry, squareMaterial); 
        squareMesh.position.set(0.0, 0.0, 0.0); 
        return squareMesh; 
        
    }
    
    this.createMarkers = function() {
        
        var markersGeo = new THREE.Geometry();
        var markerMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF, size: 0.05 });
        
        for (var i = 0; i < this.width; i+= 1.0/this.density) {
            var row = Math.floor(i);

            if (typeof this.markersData[row] == 'undefined') {
                this.markersData[row] = [];
                this.markersAvailability[row] = [];           
            }

            for (var j = 0; j < this.width; j+= 1.0/this.density) {
                
                var col = Math.floor(j);
                if (typeof this.markersData[row][col] == 'undefined') {
                    this.markersData[row][col] = [];
                    this.markersAvailability[row][col] = [];
                }
                
                var x = i+Math.random()/this.density;
                var z = j+Math.random()/this.density;
                this.markersData[row][col].push(new Marker(new THREE.Vector3(x, 0, z)));
                this.markersAvailability[row][col].push(1);

                markersGeo.vertices.push(new THREE.Vector3(x,0,z));
            }     
        }
        
        console.log(this.markersData);
        this.markers = new THREE.Points(markersGeo, markerMaterial);
        return this.markers;
    }
 
    this.assignMarkersToAgents = function(agents) {
        assignMarkersTo(agents, this.markersData, this.markersAvailability, this.width);
    };
	   
}