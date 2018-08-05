const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

const SIZE = 400;

function getRandomPosition() {
  var max = SIZE / 2 - 1;
  var x = max * (2 * Math.random() - 1);
  var z = max * (2 * Math.random() - 1);
  return new THREE.Vector3(x, 0, z);
        
}

class Marker {
  constructor(obs, w, l) {
    this.position = getRandomPosition();
    this.free = true;
    this.obs = obs;
    this.w = w;
    this.l = l;
    if (obs && (this.position.x < w / 2 && this.position.x > - w / 2) && 
      (this.position.z < l / 2 && this.position.z > - l / 2))
    {
      this.free = false;
    }
    this.geom = this.makeMesh(); 
  }

  makeMesh() {
    var geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.5, 4);
    var material = new THREE.MeshLambertMaterial({color: 0x4c4c4c});
    var mesh = new THREE.Mesh(geometry, material);
    return mesh; 
  }
}

class Agent {
  constructor() {
    this.position = getRandomPosition();
    this.goal = getRandomPosition();
    this.markers = [];
    this.radius = 30;

    this.color = this.generateColor();
    this.geom = this.makeAgentMesh();
    this.goalGeom = this.makeGoalMesh();
    
    this.cells = {x: Infinity, z: Infinity};
  }

  makeAgentMesh() {
    var geometry = new THREE.CylinderGeometry(5, 5, 20, 32);
    geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, 10, 0) );
    var material = new THREE.MeshBasicMaterial({ color: this.color});
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  makeGoalMesh() {
    var geometry = new THREE.CylinderGeometry( 5, 5, 0.25, 8 );
    var material = new THREE.MeshBasicMaterial({color: this.color});
    var mesh = new THREE.Mesh(geometry, material);
    return mesh; 
  }

  generateColor() {
    var r = (Math.round(Math.random()* 127) + 127) / 255;
    var g = (Math.round(Math.random()* 127) + 127) / 255;
    var b = (Math.round(Math.random()* 127) + 127) / 255;
    return new THREE.Color(r, g, b);
  }

  differenceVector(v1, v2) {
    var x = v1.x - v2.x;
    var y = v1.y - v2.y;
    var z = v1.z - v2.z;

    return new THREE.Vector3(x, y, z);
  }

  getWeight(marker) {
      var x = this.differenceVector(this.goal, this.position);
      var y = this.differenceVector(marker.position, this.position); 
      var angle = x.angleTo(y);

      return (1 + Math.cos(angle))/(1 + y.length());
  }

  update() {
    var totalWeight = 0; 
    for (var i = 0; i < this.markers.length; i++) {
        totalWeight += this.getWeight(this.markers[i]);
    }

    var mv = new THREE.Vector3();
    for (var j = 0; j < this.markers.length; j++) {
        var factor = this.getWeight(this.markers[j]);
        if (totalWeight != 0) {
          factor /= totalWeight;
        }
        var dv = this.differenceVector(this.markers[j].position, this.position); 
        mv = mv.add(dv.multiplyScalar(factor));

        this.markers[j].free = true;
        var material = new THREE.MeshLambertMaterial( {color: 0x4c4c4c} );
        this.markers[j].geom.material = material;
    }

    var v = mv.normalize().multiplyScalar(1.0);
    this.position = this.position.add(v);

    this.markers.length = 0;
  }
}

class Grid {
  constructor() {
    this.size = SIZE; 
    this.geom = this.initPlaneGeom(); 
    this.markers = [];   
    this.agents = [];

    this.numCol = 8;
    this.cells = this.init2DArray(this.numCol);
    this.cellSize = this.size / this.numCol;

  }

  initPlaneGeom() {
    var geometry = new THREE.PlaneGeometry(this.size, this.size);
    var material = new THREE.MeshLambertMaterial({color: 0xb0b0b0, side: THREE.DoubleSide});
    var mesh = new THREE.Mesh( geometry, material );
    mesh.rotateX(Math.PI / 2);

    return mesh;
  }

  init2DArray(size) {
    var arr = [];
    for (var i = 0; i < size; i++) {
      arr.push([]);
      for (var j = 0; j < size; j++) {
          arr[i].push([]);
      }
    }
    return arr;
  }

  initCells() {
    for (var i = 0; i < this.markers.length; i++) {
      var cells = this.getCells(this.markers[i].position);
      this.cells[cells.x][cells.z].push(this.markers[i]);
    }        
  }

  updateACells() {
    for (var i = 0; i < this.agents.length; i++) {
        var cells = this.getCells(this.agents[i].position);
        this.agents[i].cells = cells;
    }
  }

  getCells(pos) {
    var x = this.numCol / 2 + Math.floor(pos.x / this.cellSize); 
    var z = Math.floor(pos.z / this.cellSize);

    if (z < 0) {
      z = this.numCol / 2 - 1 + Math.abs(z);  
    } 
    else {
      z = this.numCol / 2 - 1 - z;
    }

    return {x: x, z: z};
  }

  updateMarkers() {
    for (var i = 0; i < this.agents.length; i++) {
      var dist = this.agents[i].position.distanceTo(this.agents[i].goal);
      if (dist < 10) {continue;}
      var all = this.getMarkers(this.agents[i]);
      
      for (var j = 0; j < all.length; j++) {
        if (!all[j].free) {continue;}
        var distance = all[j].position.distanceTo(this.agents[i].position);
        if (distance > this.agents[i].radius) {continue;}
        this.agents[i].markers.push(all[j]);          
        all[j].free = false;
        
        var material = new THREE.MeshBasicMaterial( {color: this.agents[i].geom.material.color} );
        all[j].geom.material = material;
      }
    }
  }

  getMarkers(agent) {
    var cells = agent.cells;
    var c = this.cells[cells.x][cells.z];

    var lx = Math.max(0, cells.x - 1);
    var l = this.cells[lx][cells.z];
    
    var rx = cells.x + 1 > this.numCol - 1 ? 0 : cells.x + 1;
    var r = this.cells[rx][cells.z];

    var bz = Math.max(0, cells.z - 1);
    var b = this.cells[cells.x][bz];

    var tz = cells.z + 1 > this.numCol - 1 ? 0 : cells.z + 1;
    var t = this.cells[cells.x][tz];
    
    return c.concat(l.concat(r.concat(b.concat(t))));
  }
}

export default function Crowd(scene) {
  
  this.initialize = function(numAgents, numMarkers, configuration, debug, obstacle) {
      this.numAgents = numAgents;
      this.numMarkers = numMarkers;
      this.config = configuration;
      this.debug = debug;
      this.obs = obstacle;
      this.obsW = 0;
      this.obsL = 0;  
      
      this.grid = new Grid();
      scene.add(this.grid.geom);

      if (this.obs) {
        this.obsW = Math.random() * 100 + 50;
        this.obsL = Math.random() * 100 + 50;        
        var geometry = new THREE.BoxGeometry(this.obsW, 40, this.obsL);
        geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, 20, 0));
        var material = new THREE.MeshBasicMaterial({color: 'black'});
        this.obsMesh = new THREE.Mesh( geometry, material );
        scene.add(this.obsMesh);
      }

      for (var j = 0; j < numMarkers; j++) {
        var m = new Marker(this.obs, this.obsW, this.obsL);
        if (this.debug) {
          scene.add(m.geom);
        }
        
        m.geom.position.set(m.position.x, m.position.y, m.position.z);
        this.grid.markers.push(m);
      }
 
      for (var i = 0; i < numAgents; i++) {
        var a = new Agent();
        if (this.config == 'circle') {
          var x = 0.25 * SIZE * Math.cos(2 * i * Math.PI / numAgents);
          var z = 0.25 * SIZE * Math.sin(2 * i * Math.PI / numAgents);
          a.position = new THREE.Vector3(x, 0, z);
          var gx = 0.45 * SIZE * Math.cos(2 * (numAgents - i) * Math.PI / numAgents);
          var gz = 0.45 * SIZE * Math.sin(2 * (numAgents - i) * Math.PI / numAgents);
          a.goal = new THREE.Vector3(gx, 0, gz);
          
        }

        else if (this.config == 'corners') {
          var offsetX = Math.random() * 30;
          var offsetZ = Math.random() * 30;

          if (Math.random() < 0.5) {
            a.position = new THREE.Vector3(SIZE / 2 - offsetX, 0, SIZE / 2 - offsetZ);
            a.goal = new THREE.Vector3( - SIZE / 2 + 20, 0, - SIZE / 2 + 20);
          }
          else {
            a.position = new THREE.Vector3( - (SIZE / 2) + offsetX, 0, SIZE / 2 - offsetZ);
            a.goal = new THREE.Vector3( SIZE / 2 - 20, 0, - SIZE / 2 + 20);
          }
        }

        scene.add(a.geom);
        a.geom.position.set(a.position.x, a.position.y, a.position.z);

        scene.add(a.goalGeom);
        a.goalGeom.position.set(a.goal.x, a.goal.y, a.goal.z);

        this.grid.agents.push(a);
      }

      this.grid.initCells();
  }

  this.update = function() {
    for (var i = 0; i < this.numAgents; i++) {
      var agent = this.grid.agents[i];
      var dist = agent.position.distanceTo(agent.goal);
      this.grid.updateACells();
      this.grid.updateMarkers();
      
      if (dist > 10) {
        agent.update();
        agent.geom.position.set(agent.position.x, agent.position.y, agent.position.z);
      }
    }
  }

  this.showMarkers = function() {
    for (var j = 0; j < this.numMarkers; j++) {
      scene.add(this.grid.markers[j].geom);
    }
  }

  this.removeMarkers = function() {
    for (var j = 0; j < this.numMarkers; j++) {
      scene.remove(this.grid.markers[j].geom);
    }
  }

  this.reset = function() {
    for (var i = 0; i < this.numAgents; i++) {
      var agent = this.grid.agents[i];
      scene.remove(agent.geom);
      scene.remove(agent.goalGeom);
    }
    this.grid.agents = [];
    for (var j = 0; j < this.numMarkers; j++) {
      scene.remove(this.grid.markers[j].geom);
    }
    this.grid.markers = [];
    this.grid.cells = [];
    scene.remove(this.obsMesh);

  }
}