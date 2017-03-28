const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

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

    }
}

class Marker {
    constructor() {
        this.position = {x: getRandom(-100,100), y: 0, z: getRandom(-100,100)};
        this.claimed = false; 
    }
}

class Agent {
    constructor() {
        this.position = new THREE.Vector3(getRandom(-150,150), 10, getRandom(-150,150));
        this.velocity = 0.5; 
        this.goal = { x: getRandom(-100,100), y: 0, z: getRandom(-100,100)};
        this.orientation;
        this.size;
        this.markers = [];

        var geometry = new THREE.CylinderGeometry( 5, 5, 20, 32 );
        var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
        var cylinder = new THREE.Mesh( geometry, material );
        this.geom = cylinder;
    }

    move() {
         this.position += this.velocity;
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
    this.agents = [];

    this.initialize = function(numAgents, numMarkers) {
        this.numAgents = numAgents;
        this.numMarkers = numMarkers;
        for (var i = 0; i < numAgents; i++) {
            var a = new Agent();
            scene.add(a.geom);
            a.geom.position.set(a.position.x, a.position.y, a.position.z);

            this.agents.push(a);
            console.log(a.position);
            console.log("alskdf");
            console.log(a.geom.pos);
        }
    }

    this.step = function() {
        for (var i = 0; i < this.numAgents; i++) {
            this.agents[i].move();
        }
    }
}