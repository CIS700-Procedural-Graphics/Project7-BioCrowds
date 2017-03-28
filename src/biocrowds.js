const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

const GRID_SIZE = 400;
const HALF_GRID_SIZE = 200;

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
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
        this.numCells = 16;
        this.sqRtNumCells = Math.sqrt(this.numCells);
        this.cellSize = GRID_SIZE/this.sqRtNumCells; // square cells 
    }

    assignMarkersToCells() {
        var numMarkers = this.markers.length;

        for (var i = 0; i < numMarkers; i++) {
            var mPos = this.markers[i].position;
            for (var j = 0; j < this.sqRtNumCells; j++) {
                var cellMinX = -HALF_GRID_SIZE + j * cellSize; 
                var cellMaxX = cellMinX + cellSize; 
                for (var k = 0; k < sqRtNumCells; k++) {
                    var cellMinY = -HALF_GRID_SIZE + k * cellSize;
                    var cellMaxY = cellMinY + cellSize;
                    if (mPos.x > cellMinX && mPos.x <= cellMaxX) {
                        if (mPos.y > cellMinY && mPos.y <= cellMaxY) {
                            this.cells[j][k] = []; 
                            this.cells[j][k].push(this.markers[i]);
                            this.markers[i].cell.push(j);
                            this.markers[i].cell.push(k);   
                        }
                    } 
                }
            }
        }        
    }

    updateAgentPostiions() {
        console.log(this.agents.length);
        for (var i = 0; i < this.agents.length; i++) {
            var mPos = this.agents[i].position;
            
            var offsetX = (this.sqRtNumCells)/2;
            var offsetY = offsetX - 1; 
            console.log(this.cellSize);
            var cellX = offsetX + Math.floor(mPos.x/this.cellSize); 
            var cellY = Math.floor(mPos.z/this.cellSize);
            if (cellY < 0) {
                cellY = offsetY + Math.abs(cellY);  
            } else {
                cellY = offsetY - cellY;
            }
            
            console.log(mPos.x + ", " + mPos.z + " is in cell " + cellX + ", " + cellY);

        }
    }

}

class Marker {
    constructor() {
        this.position = {x: getRandom(-(HALF_GRID_SIZE - 1),HALF_GRID_SIZE - 1), y: 0, z: getRandom(-(HALF_GRID_SIZE - 1),HALF_GRID_SIZE - 1)};
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
        this.goal = { x: getRandom(-(HALF_GRID_SIZE - 1),HALF_GRID_SIZE - 1), y: 0, z: getRandom(-(HALF_GRID_SIZE - 1),HALF_GRID_SIZE - 1)};
        this.orientation;
        this.perceptionRadius = 4;
        this.markers = [];

        this.colors = ["aqua","aquamarine","azure","beige","bisque","blanchedalmond","blue","blueviolet","brown","burlywood","cadetblue","chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson","cyan","darkcyan","darkgoldenrod","darkgray","darkgrey","darkgreen","darkkhaki","darkmagenta","darkolivegreen","darkorange","darkorchid","darkred","darksalmon","darkseagreen","darkslateblue","darkslategray","darkslategrey","darkturquoise","darkviolet","deeppink","deepskyblue","dimgray","dimgrey","dodgerblue","firebrick","floralwhite","forestgreen","fuchsia","gainsboro","ghostwhite","gold","goldenrod","gray","grey","green","greenyellow","honeydew","hotpink","indianred","indigo","ivory","khaki","lavender","lavenderblush","lawngreen","lemonchiffon","lightblue","lightcoral","lightcyan","lightgoldenrodyellow","lightgray","lightgrey","lightgreen","lightpink","lightsalmon","lightseagreen","lightskyblue","lightslategray","lightslategrey","lightsteelblue","lightyellow","lime","limegreen","linen","magenta","maroon","mediumaquamarine","mediumblue","mediumorchid","mediumpurple","mediumseagreen","mediumslateblue","mediumspringgreen","mediumturquoise","mediumvioletred","midnightblue","mintcream","mistyrose","moccasin","navajowhite","navy","oldlace","olive","olivedrab","orange","orangered","orchid","palegoldenrod","palegreen","paleturquoise","palevioletred","papayawhip","peachpuff","peru","pink","plum","powderblue","purple","red","rosybrown","royalblue","saddlebrown","salmon","sandybrown","seagreen","seashell","sienna","silver","skyblue","snow","springgreen","steelblue","tan","teal","thistle","tomato","turquoise","violet","yellow"];

        var random = getRandomInt(0, 139);
        var geometry = new THREE.CylinderGeometry( 2, 2, 10, 32 );
        var material = new THREE.MeshBasicMaterial({ color: this.colors[random]});
        var cylinder = new THREE.Mesh( geometry, material );
        this.geom = cylinder;
    }

    move() {

         //this.position.x += this.velocity;
    }
}


// TODO: Turn the string into linked list 
export function stringToLinkedList(input_string) {
    // ex. assuming input_string = "F+X"
    // you should return a linked list where the head is 
    // at Node('F') and the tail is at Node('X')
    var shapes = input_string.split("");
    var ll = new LinkedList();
    for (var i = 0; i < shapes.length; i++) {
        ll.addNodeWithShape(shapes[i]);
    }
    return ll;
}

export default function BioCrowdsSystem(scene, axiom, grammar, iterations) {
    // defaults
    this.numAgents = 20;
    this.numMarkers = 100;
    this.grid = {};

    this.initialize = function(numAgents, numMarkers) {
        this.numAgents = numAgents;
        this.numMarkers = numMarkers;
        this.grid = new Grid();
        scene.add(this.grid.geom);

        for (var i = 0; i < numAgents; i++) {
            var a = new Agent();
            scene.add(a.geom);
            a.geom.position.set(a.position.x, a.position.y, a.position.z);

            this.grid.agents.push(a);
        }

        for (var j = 0; j < numMarkers; j++) {
            var m = new Marker();
            scene.add(m.geom);
            m.geom.position.set(m.position.x, m.position.y, m.position.z);
            this.grid.markers.push(m);
        }

        //this.grid.assignMarkersToCells();
        this.grid.updateAgentPostiions();
    }

    this.step = function() {
        for (var i = 0; i < this.numAgents; i++) {
            var agent = this.grid.agents[i];
            agent.move();
            agent.geom.position.set(agent.position.x, agent.position.y, agent.position.z);
        }
    }
}