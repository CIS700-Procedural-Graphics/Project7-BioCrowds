const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

const GRID_SIZE = 400;
const HALF_GRID_SIZE = 200;
const MAX_AGENT_SPEED = 1;

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function weightFunction(agentPos, goalPos, markerPos) {
    // theta is the angle between goalPos - agentPos and markerPos - agentPos 
    var x = new THREE.Vector3(goalPos.x - agentPos.x, goalPos.y - agentPos.y, goalPos.z - agentPos.z);
    var y = new THREE.Vector3(markerPos.x - agentPos.x, markerPos.y - agentPos.y, markerPos.z - agentPos.z); 
    var theta = x.angleTo(y); // in radians

    return (1 + Math.cos(theta))/(1 + y.length());

}

class Grid {
    constructor() {
        this.size = GRID_SIZE; 
        var geometry = new THREE.PlaneGeometry( this.size, this.size);
        var material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
        var plane = new THREE.Mesh( geometry, material );

        var xAxis = new THREE.Vector3(1,0,0);
        plane.rotateOnAxis(xAxis, 1.5708);
        this.geom = plane; 
       
        this.cells = []; 
        this.agents = [];
        this.markers = [];
        this.numCells = 64;
        this.sqRtNumCells = Math.sqrt(this.numCells);
        this.cellSize = GRID_SIZE/this.sqRtNumCells; // square cells 

        for (var i = 0; i < this.sqRtNumCells; i++) {
            this.cells.push([]);
            for (var j = 0; j < this.sqRtNumCells; j++) {
                this.cells[i].push([]);
            }
        }
    }

    assignMarkersToCells() {
        var numMarkers = this.markers.length;

        for (var i = 0; i < numMarkers; i++) {
            var mPos = this.markers[i].position;

            var offsetX = (this.sqRtNumCells)/2;
            var offsetY = offsetX - 1; 

            var cellX = offsetX + Math.floor(mPos.x/this.cellSize); 
            var cellY = Math.floor(mPos.z/this.cellSize);
            if (cellY < 0) {
                cellY = offsetY + Math.abs(cellY);  
            } else {
                cellY = offsetY - cellY;
            }
            
            //console.log(mPos.x + ", " + mPos.z + " is in cell " + cellX + ", " + cellY);

            this.markers[i].cell.push(cellX);
            this.markers[i].cell.push(cellY);
            this.cells[cellX][cellY].push(this.markers[i]);
        }        
    }

    updateAgentCellPositions() {
        var numAgents = this.agents.length;
        for (var i = 0; i < numAgents; i++) {
            var aPos = this.agents[i].position;
            
            var offsetX = (this.sqRtNumCells)/2;
            var offsetY = offsetX - 1; 

            var cellX = offsetX + Math.floor(aPos.x/this.cellSize); 
            var cellY = Math.floor(aPos.z/this.cellSize);
            if (cellY < 0) {
                cellY = offsetY + Math.abs(cellY);  
            } else {
                cellY = offsetY - cellY;
            }
            
            //console.log(aPos.x + ", " + aPos.z + " is in cell " + cellX + ", " + cellY);
            this.agents[i].cell.length = 0;
            this.agents[i].cell.push(cellX);
            this.agents[i].cell.push(cellY);
        }
    }

    updateAgentMarkers() {
        for (var i = 0; i < this.agents.length; i++) {
            var mPos = this.agents[i].position;
            var gPos = this.agents[i].goal;
            if (mPos.distanceTo(gPos) > 10) { 
                var cellX = this.agents[i].cell[0];
                var cellY = this.agents[i].cell[1];

                var minX = cellX-1 < 0 ? 0 : cellX-1;
                var minY = cellY-1 < 0 ? 0 : cellY-1;
                var maxX = cellX+1 > this.sqRtNumCells-1 ? 0 : cellX+1;
                var maxY = cellY+1 > this.sqRtNumCells-1 ? 0 : cellY+1;


                var markersInCell = this.cells[cellX][cellY];
                var markersInCell1 = this.cells[minX][cellY];
                var markersInCell2 = this.cells[maxX][cellY];
                var markersInCell3 = this.cells[cellX][minY];
                var markersInCell4 = this.cells[cellX][maxY];
                var markersToCheck = markersInCell.concat(markersInCell1.concat(markersInCell2.concat(markersInCell3.concat(markersInCell4))));
                
                for (var j = 0; j < markersToCheck.length; j++) {
                    if (!markersToCheck[j].claimed) {
                        var distance = markersToCheck[j].position.distanceTo(this.agents[i].position);
                        if (distance <= this.agents[i].perceptionRadius) {
                            this.agents[i].capturedMarkers.push(markersToCheck[j]);
                            
                            markersToCheck[j].claimed = true;
                            var material = new THREE.MeshBasicMaterial( {color: this.agents[i].geom.material.color} );
                            markersToCheck[j].geom.material = material;
                        }
                    }
                }
            }  else {
                if (this.agents[i].capturedMarkers.length > 0) {
                    // release markers when goal is reached
                    for (var k = 0; k < this.agents[i].capturedMarkers; k++) {
                        this.agents[i].capturedMarkers[k].claimed = false;
                        var material = new THREE.MeshBasicMaterial( {color: 'black'} );
                        this.agents[i].capturedMarkers[k].geom.material = material;
                        this.agents[i].capturedMarkers.length = 0;
                    }
                }
                //console.log(this.grid.agents[i].geom.material.color.getStyle() + " agent reached its goal!");
            } 
        }
    }

}

class Marker {
    constructor() {
        this.position = new THREE.Vector3(getRandom(-(HALF_GRID_SIZE - 1),HALF_GRID_SIZE - 1), 0, getRandom(-(HALF_GRID_SIZE - 1),HALF_GRID_SIZE - 1));
        this.claimed = false; 
        var geometry = new THREE.CylinderGeometry( 1, 1, 0.25, 32);
        var material = new THREE.MeshBasicMaterial( {color: 'black'} );
        var cylinder = new THREE.Mesh( geometry, material );
        this.geom = cylinder; 
        this.cell = [];
    }
}

class Agent {
    constructor() {
        this.position = new THREE.Vector3(getRandom(-(HALF_GRID_SIZE - 1),HALF_GRID_SIZE- 1), 5, getRandom(-(HALF_GRID_SIZE - 1),HALF_GRID_SIZE - 1));
        this.velocity = 0.5; 
        this.goal = new THREE.Vector3(getRandom(-(HALF_GRID_SIZE - 1),HALF_GRID_SIZE - 1), 0, getRandom(-(HALF_GRID_SIZE - 1),HALF_GRID_SIZE - 1));
        this.orientation;
        this.perceptionRadius = 20;
        this.markers = [];

        this.colors = ["aqua","aquamarine","azure","beige","bisque","blanchedalmond","blue","blueviolet","brown","burlywood","cadetblue","chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson","cyan","darkcyan","darkgoldenrod","darkgrey","darkgreen","darkkhaki","darkmagenta","darkolivegreen","darkorange","darkorchid","darkred","darksalmon","darkseagreen","darkslateblue","darkslategray","darkslategrey","darkturquoise","darkviolet","deeppink","deepskyblue","dimgray","dimgrey","dodgerblue","firebrick","floralwhite","forestgreen","fuchsia","gold","goldenrod","gray","grey","green","greenyellow","honeydew","hotpink","indianred","indigo","khaki","lavender","lavenderblush","lawngreen","lemonchiffon","lightblue","lightcoral","lightcyan","lightgoldenrodyellow","lightgray","lightgrey","lightgreen","lightpink","lightsalmon","lightseagreen","lightskyblue","lightslategray","lightslategrey","lightsteelblue","lightyellow","lime","limegreen","linen","magenta","maroon","mediumaquamarine","mediumblue","mediumorchid","mediumpurple","mediumseagreen","mediumslateblue","mediumspringgreen","mediumturquoise","mediumvioletred","midnightblue","mintcream","mistyrose","moccasin","navajowhite","navy","oldlace","olive","olivedrab","orange","orangered","orchid","palegoldenrod","palegreen","paleturquoise","palevioletred","papayawhip","peachpuff","peru","pink","plum","powderblue","purple","red","rosybrown","royalblue","saddlebrown","salmon","sandybrown","seagreen","seashell","sienna","silver","skyblue","snow","springgreen","steelblue","tan","teal","thistle","tomato","turquoise","violet","yellow"];

        var random = getRandomInt(0, 139);
        var geometry = new THREE.CylinderGeometry( 2, 2, 10, 32 );
        var material = new THREE.MeshBasicMaterial({ color: this.colors[random]});
        var cylinder = new THREE.Mesh( geometry, material );
        this.geom = cylinder;

        var geometry2 = new THREE.CylinderGeometry( 5, 5, 0.25, 4 );
        var material2 = new THREE.MeshBasicMaterial({ color: this.colors[random]});
        var cylinder2 = new THREE.Mesh( geometry2, material2 );
        this.goalGeom = cylinder2; 

        this.cell = [];
        this.capturedMarkers = [];
    }

    move() {
        var m = new THREE.Vector3(); // motion vector
        var wDenominator = 0; 
        for (var i = 0; i < this.capturedMarkers.length; i++) {
            // using the function f from the paper here: http://www.sciencedirect.com/science/article/pii/S0097849311001713
            wDenominator += weightFunction(this.position, this.goal, this.capturedMarkers[i].position);
        }

        for (var j = 0; j < this.capturedMarkers.length; j++) {
            var markerPos = this.capturedMarkers[j].position;
            var agentPos = this.position;
            var vector = new THREE.Vector3(markerPos.x - agentPos.x, 0, markerPos.z - agentPos.z); 
            var w = (wDenominator == 0) ? weightFunction(this.position, this.goal, this.capturedMarkers[j].position) : weightFunction(this.position, this.goal, this.capturedMarkers[j].position) / wDenominator;
            m = m.add(vector.multiplyScalar(w));

            this.capturedMarkers[j].claimed = false;
            var material = new THREE.MeshBasicMaterial( {color: 'black'} );
            this.capturedMarkers[j].geom.material = material;
        }

        var s = Math.min(m.length(), MAX_AGENT_SPEED);
        var v = m.normalize().multiplyScalar(s);
        this.position = this.position.add(v);

        this.capturedMarkers.length = 0;
    }
}

export default function BioCrowdsSystem(scene, axiom, grammar, iterations) {
    // defaults
    this.numAgents = 0;
    this.numMarkers = 0;
    this.grid = {};

    this.initialize = function(numAgents, numMarkers) {
        this.numAgents = numAgents;
        this.numMarkers = numMarkers;
        this.grid = new Grid();
        this.grid.agents.length = 0;
        this.grid.markers.length = 0;
        scene.add(this.grid.geom);

        for (var i = 0; i < numAgents; i++) {
            var a = new Agent();
            scene.add(a.geom);
            a.geom.position.set(a.position.x, a.position.y, a.position.z);

            scene.add(a.goalGeom);
            a.goalGeom.position.set(a.goal.x, a.goal.y, a.goal.z);

            this.grid.agents.push(a);
        }

        for (var j = 0; j < numMarkers; j++) {
            var m = new Marker();
            scene.add(m.geom);
            m.geom.position.set(m.position.x, m.position.y, m.position.z);

            this.grid.markers.push(m);
        }

        this.grid.assignMarkersToCells();
    }

    this.step = function() {
        for (var i = 0; i < this.numAgents; i++) {
            var agent = this.grid.agents[i];
            var remainingDistance = agent.position.distanceTo(agent.goal);
            this.grid.updateAgentCellPositions();
            this.grid.updateAgentMarkers();
            
            if (remainingDistance > 10) {
                agent.move();
                agent.geom.position.set(agent.position.x, agent.position.y, agent.position.z);
            }
        }
    }
}