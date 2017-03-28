const THREE = require('three');
import Framework from './framework'
import DAT from 'dat-gui'

var time = 0;

var markers;
var agents;

var sqrtVal = 20.0;
var invSqrtVal = 1.0 / sqrtVal;
var numSamples = sqrtVal*sqrtVal;

//Parameters:
var speed = 5.0;
var searchRadius = 1; 
var numMarkersPerCell = 10;

var obstacle = false;
var obstacleXCoord = 0.0;
var obstacleYCoord = 0.0;
var obstacleGapWidth = 10.0;

class Agent {

  constructor(startPos, goal, color) 
  {
      this.position = startPos;
      this.goal = goal;
      this.marks = [];
      this.col = color;
  }

}

DAT.GUI.prototype.removeFolder = function(name) {
  var folder = this.__folders[name];
  if (!folder) {
    return;
  }
  folder.close();
  this.__ul.removeChild(folder.domElement.parentNode);
  delete this.__folders[name];
  this.onResize();
}

DAT.GUI.prototype.emptyFolder = function(name) {
  var folder = this.__folders[name];
  if (!folder) {
    return;
  }
  for (let i = 0; i < folder.__controllers.length; ++i) {
      folder.__controllers[i].remove();
  }
  folder.__controllers.length = 0;
  this.onResize();
}

// called after the scene loads
function onLoad(framework) {
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;
  var stats = framework.stats;

  // set camera position
  camera.position.set(0, 15, 15);
  camera.lookAt(new THREE.Vector3(0,0,0));

  // ground plan for agents to move on
  var groundGeo = new THREE.PlaneGeometry(20, 20, 20, 20);
  var groundMat = new THREE.MeshBasicMaterial( {color: 0xffffff, wireframe: true, side: THREE.DoubleSide} );
  var ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotateX(3.1415/2.0);
  ground.name = "grid";
  scene.add(ground);

   var options = {
      configuration: 'Cross',
      speed: 3.0,
      obstacle: false,
      obstacleXCoord: 0.0,
      obstacleYCoord: 0.0,
      obstacleGapWidth: 10.0
  }

  setUpCross(scene);

  gui.add(options, 'configuration', ['Cross', 'Doorway']).onChange(function(name){
      gui.emptyFolder('Scene Settings');
      if(name == 'Cross')
      {
          setUpCross(scene);
          sceneFolder.add(options, 'obstacle').onChange(function(val){
              obstacle = val;
              setUpCross(scene);
          });
          sceneFolder.add(options, 'obstacleXCoord', -10, 10).step(1).onChange(function(val){
              obstacleXCoord = val;
              setUpCross(scene);
          });
          sceneFolder.add(options, 'obstacleYCoord', -10, 10).step(1).onChange(function(val){
              obstacleYCoord = val;
              setUpCross(scene);
          });
      }
      if(name == 'Doorway')
      {
          obstacle = true;
          setUpPinhole(scene);
          sceneFolder.add(options, 'obstacle').onChange(function(val){
              obstacle = val;
              setUpPinhole(scene);
          });
          sceneFolder.add(options, 'obstacleYCoord', -10, 10).step(1).onChange(function(val){
              obstacleYCoord = val;
              setUpPinhole(scene);
          });
          sceneFolder.add(options, 'obstacleGapWidth', 2, 18).step(2).onChange(function(val){
              obstacleGapWidth = val;
              setUpPinhole(scene);
          });
      }
    });

  gui.add(options, 'speed', 0.0, 10.0).onChange(function(val){
      speed = val;
  });

  var sceneFolder = gui.addFolder('Scene Settings');
  sceneFolder.open();

  sceneFolder.add(options, 'obstacle').onChange(function(val){
      obstacle = val;
      setUpCross(scene);
  });
  sceneFolder.add(options, 'obstacleXCoord', -10, 10).step(1).onChange(function(val){
      obstacleXCoord = val;
      setUpCross(scene);
  });
  sceneFolder.add(options, 'obstacleYCoord', -10, 10).step(1).onChange(function(val){
      obstacleYCoord = val;
      setUpCross(scene);
  });

}

function createMarkers(x, y, scene)
{
    // var ptGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    // var ptMat = new THREE.MeshBasicMaterial( {color: 0xff00ff, side: THREE.DoubleSide} );

    for(var j = 0; j < numMarkersPerCell; j++)
    {
        var newX = (x+Math.random());
        var newY = (y+Math.random());
        var markerPos = new THREE.Vector2(newX-10.0, newY-10.0);
        markers.push(markerPos);
        // var pt = new THREE.Mesh(ptGeo, ptMat);
        // pt.position.set(newX-10.0, 0, newY-10.0);
        // scene.add(pt);
    }     
}

//configuration where 5 agents start on each cardinal direction of the board and need to get to the opposite side
function setUpCross(scene)
{
    //clear scene except for grid
    var obj;
    for( var i = scene.children.length - 1; i >= 0; i--) {
      if(scene.children[i].name != "grid")
      {
          obj = scene.children[i];
          scene.remove(obj);
      }
    }

    markers = [];
    for(var i = 0; i < numSamples; i++)
    {
        var y = 1.0*Math.floor(i / sqrtVal);
        var x = 1.0*(i % sqrtVal);
        if(!obstacle || 
          ((x - 10 < obstacleXCoord - searchRadius || x - 10 >= obstacleXCoord + searchRadius) || 
            (y - 10 < obstacleYCoord - searchRadius || y - 10 >= obstacleYCoord + searchRadius)))
        {
            createMarkers(x, y, scene);
        }
    }

    if(obstacle)
    {
        var obGeo = new THREE.BoxGeometry(searchRadius*2, 1, searchRadius*2);
        var obMat = new THREE.MeshBasicMaterial( {color: 0x8b8b8b, side: THREE.DoubleSide} );
        var ob = new THREE.Mesh(obGeo, obMat);
        ob.position.set(obstacleXCoord, 0.5, obstacleYCoord);
        scene.add(ob);
    }

    var col1 = 0xff0000;
    var col2 = 0x0000ff;
    var col3 = 0x00ff00;
    var col4 = 0xffff00;

    agents = [];
    for(var i = -2; i <= 2; i++)
    {
        var thisPos = new THREE.Vector2(2*i, 10);
        var thisGoal = new THREE.Vector2(2*i, -10);
        var thisAgent = new Agent(thisPos, thisGoal, col1);
        agents.push(thisAgent);
    }
    for(var i = -2; i <= 2; i++)
    {
        var thisPos = new THREE.Vector2(2*i, -10);
        var thisGoal = new THREE.Vector2(2*i, 10);
        var thisAgent = new Agent(thisPos, thisGoal, col2);
        agents.push(thisAgent);
    }
    for(var i = -2; i <= 2; i++)
    {
        var thisPos = new THREE.Vector2(10, 2*i);
        var thisGoal = new THREE.Vector2(-10, 2*i);
        var thisAgent = new Agent(thisPos, thisGoal, col3);
        agents.push(thisAgent);
    }
    for(var i = -2; i <= 2; i++)
    {
        var thisPos = new THREE.Vector2(-10, 2*i);
        var thisGoal = new THREE.Vector2(10, 2*i);
        var thisAgent = new Agent(thisPos, thisGoal, col4);
        agents.push(thisAgent);
    }

    for(var i = 0; i < agents.length; i++)
    {
        var agGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.0);
        var col = new THREE.Color(agents[i].col);
        var agMat = new THREE.MeshBasicMaterial( {color: col, side: THREE.DoubleSide} );
        var ag = new THREE.Mesh(agGeo, agMat);
        ag.name = "agent" + i; //used in onUpdate
        ag.position.set(agents[i].position.x, 0.5, agents[i].position.y);
        scene.add(ag);
    }
} 

//configuration where 10 agents start on either side of the board and need to get to the opposite side through a pinhole or doorway
function setUpPinhole(scene)
{
    //clear scene except for grid
    var obj;
    for( var i = scene.children.length - 1; i >= 0; i--) {
      if(scene.children[i].name != "grid")
      {
          obj = scene.children[i];
          scene.remove(obj);
      }
    }

    markers = [];
    for(var i = 0; i < numSamples; i++)
    {
        var y = 1.0*Math.floor(i / sqrtVal);
        var x = 1.0*(i % sqrtVal);
        if(!obstacle || ((x - 10 < obstacleGapWidth/2.0 && x - 10 >= -obstacleGapWidth/2.0) ||
           (y - 10 < obstacleYCoord - searchRadius || y - 10 >= obstacleYCoord + searchRadius)))
        {
            createMarkers(x, y, scene);
        }
    }

    if(obstacle)
    {
        var dim = (20 - obstacleGapWidth)/2.0;
        var obGeo = new THREE.BoxGeometry(dim, 1, searchRadius*2);
        var obMat = new THREE.MeshBasicMaterial( {color: 0x8b8b8b, side: THREE.DoubleSide} );
        var halfWidth = obstacleGapWidth/2.0;
        var ob1 = new THREE.Mesh(obGeo, obMat);
        ob1.position.set(halfWidth + (10-halfWidth)/2.0, 0.5, obstacleYCoord);
        scene.add(ob1);
        var ob2 = new THREE.Mesh(obGeo, obMat);
        ob2.position.set(-halfWidth - (10-halfWidth)/2.0, 0.5, obstacleYCoord);
        scene.add(ob2);
    }

    var col1 = 0xff0000;
    var col2 = 0x0000ff;

    agents = [];
    for(var i = 0; i < 10; i++)
    {
        var thisPos = new THREE.Vector2(2*i-10+1, 10);
        var thisGoal = new THREE.Vector2(10-2*i-1, -10);
        var thisAgent = new Agent(thisPos, thisGoal, col1);
        agents.push(thisAgent);
    }
    for(var i = 0; i < 10; i++)
    {
        var thisPos = new THREE.Vector2(2*i-10+1, -10);
        var thisGoal = new THREE.Vector2(10-2*i-1, 10);
        var thisAgent = new Agent(thisPos, thisGoal, col2);
        agents.push(thisAgent);
    }

    for(var i = 0; i < agents.length; i++)
    {
        var agGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.0);
        var col = new THREE.Color(agents[i].col);
        var agMat = new THREE.MeshBasicMaterial( {color: col, side: THREE.DoubleSide} );
        var ag = new THREE.Mesh(agGeo, agMat);
        ag.name = "agent" + i; //used in onUpdate
        ag.position.set(agents[i].position.x, 0.5, agents[i].position.y);
        scene.add(ag);
    }
} 

function updateMarkers()
{
    for(var k = 0; k < agents.length; k++)
    {
        agents[k].marks = [];
    }
    for(var i = 0; i < markers.length; i++)
    {
        var closestDist = searchRadius;
        var closestAgent = undefined;
        for(var j = 0; j < agents.length; j++)
        {
            var thisDist = Math.sqrt(Math.pow(agents[j].position.x - markers[i].x, 2) + Math.pow(agents[j].position.y - markers[i].y, 2));
            if(thisDist < closestDist)
            {
                closestDist = thisDist;
                closestAgent = agents[j];
            }
        }
        if(closestAgent != undefined)
        {
            closestAgent.marks.push(markers[i]);
        }
    }
}

// called on frame updates
function onUpdate(framework) {
    if(markers != undefined && agents != undefined)
    {
        updateMarkers();
        for(var i = 0; i < agents.length; i++)
        { 
            agents[i].markerDirs = agents[i].marks.map(function(marker) {
              var m = new THREE.Vector2();
              m.subVectors(marker, agents[i].position);
              return m;
            });
            agents[i].goalDir = new THREE.Vector2();
            agents[i].goalDir.subVectors(agents[i].goal, agents[i].position);
            agents[i].weights = agents[i].markerDirs.map(function(dir) {
              return 1.0 + dir.dot(agents[i].goalDir) / (dir.length() * agents[i].goalDir.length());
            });
            agents[i].totalWeight = agents[i].weights.reduce(function(a, b) {
              return a + b
            }, 0);
            agents[i].contributions = agents[i].weights.map(function(weight) {
              return weight / agents[i].totalWeight;
            });


            var weights = [];
            var total = 0;
            for(var j = 0; j < agents[i].marks.length; j++)
            {
                var m = new THREE.Vector2(); m.subVectors(agents[i].marks[j], agents[i].position);
                var g = new THREE.Vector2(); g.subVectors(agents[i].goal, agents[i].position);
                if(g.length() == 0.0 || m.length() == 0.0)
                {
                    weights[j] = 0.0;
                }
                else
                {
                    weights[j] = (1.0 + m.dot(g)/(m.length()*g.length()));
                }
                total += weights[j];
            }

            var finalVec = new THREE.Vector2(0.0, 0.0);
            for(var k = 0; k < weights.length; k++)
            {
                var contribution;
                if(total == 0.0)
                {
                    contribution = 0.0;
                }
                else
                {
                    contribution = weights[k]/total;
                }
                var m = new THREE.Vector2(); m.subVectors(agents[i].marks[k], agents[i].position);
                m.normalize();
                finalVec.add(m.multiplyScalar(contribution));
            }
            finalVec.multiplyScalar(speed/60.0);
            if(finalVec.length > searchRadius - 0.25)
            {
                finalVec = finalVec.normalize().multiplyScalar(searchRadius - 0.25);
            }
            agents[i].position.add(finalVec);
            var a = framework.scene.getObjectByName("agent" + i);
            a.position.set(agents[i].position.x, 0.5, agents[i].position.y);
        }
    }
    time++;
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);