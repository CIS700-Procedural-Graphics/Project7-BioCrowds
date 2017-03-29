const THREE = require('three')
const OBJLoader = require('three-obj-loader')(THREE)

export function Agent()
{
	this.position = new THREE.Vector3(0,0,0);
	this.velocity = new THREE.Vector3(0,0,0);
	this.goal = new THREE.Vector3(0,0,0);
	this.geometry = null;
	this.markers = []; // marker id??
}

export function Marker()
{
	this.position = new THREE.Vector3(0,0,0);
	this.geometry = null;
	this.agent = -1;
}

export function Cell()
{
	this.markers = [];
	this.agents = [];
}

var Material1 = new THREE.MeshLambertMaterial( {color: 0xf7f7e6} ); //whitish lambert

export default class Crowd
{
	constructor(scene,sceneSelect,visualDebug,numMarkers)
  	{
		this.scene = scene;
		this.markers = [];
		this.agents = [];

		this.cells = [];
		for(var i=0; i<20; i++)
		{
			var cellrow = [];
			for(var j=0; j<20; j++)
			{
				var cell = new Cell();
				// cell.minx = i*2; cell.miny = j*2;
				// cell.maxx = i*2 + 2; cell.maxy = j*2 + 2;
				cellrow.push(cell);
			}
			this.cells.push(cellrow);
		}

		this.createTerrain();
		this.generateMarkers(visualDebug,numMarkers);
		if(sceneSelect === 0)
			this.generateAgents(20);
		else if(sceneSelect === 1)
			this.generateAgentsScene2(20);
	};

	createTerrain()
	{
		var geometry1 = new THREE.PlaneGeometry(20,20,100);
		var material1 = new THREE.MeshPhongMaterial( {color: 0xdb6f23, side: THREE.DoubleSide} );
		var plane1 = new THREE.Mesh( geometry1, material1 );
		plane1.position.set(10,0,10);
		plane1.rotateX(90*3.14/180);
		this.scene.add( plane1 );
	};

	generateMarkers(visualDebug,numMarkers)
	{
		var num = numMarkers;
		var geom = new THREE.Geometry();
		this.materials = [];
		for(var i=0; i<num; i++)
		{
			for(var j=0; j<num; j++)
			{
				var m = new Marker();
				var geometry = new THREE.SphereGeometry(0.05,8,8);
			//	var material = new THREE.MeshLambertMaterial( {color: 0xffffff} );
				var material = new THREE.MeshLambertMaterial( {color: 0xffffff} );
		        var sphere = new THREE.Mesh(geometry,material);
		        sphere.position.set(i*20/num+Math.random(),0,j*20/num+Math.random());

				if(visualDebug===true)
		        	this.scene.add(sphere);

				this.materials.push(material);

				// sphere.updateMatrix();
				// geom.mergeMesh(sphere);//.geometry, sphere.matrix, i*j);

				//m.id = i*j;
				m.position.set(sphere.position.x,sphere.position.y,sphere.position.z);
				m.geometry = sphere;

				var x = Math.round(m.position.x);
				var z = Math.round(m.position.z);
				x = Math.min(Math.max(0, x), 19); // CLAMP
				z = Math.min(Math.max(0, z), 19); // CLAMP

				this.cells[x][z].markers.push(m);

				this.markers.push(m);
			}
		}

		//  var materialList = new THREE.MeshFaceMaterial(this.materials);
		//  var mesh = new THREE.Mesh( geom, materialList );
		//  this.scene.add( mesh );
		//console.log(this.cells);
	};

	generateAgents(numAgents)
	{
		//var numAgents = 20;
		for(var i=0; i<numAgents; i++)
		{
			var a = new Agent();
			var geometry = new THREE.CylinderGeometry(0.05,0.1,1);
			var material = new THREE.MeshLambertMaterial( {color: Math.random() * 0xffffff} );
			//material.color.setHex( Math.random() * 0xffffff );

			var cylinder = new THREE.Mesh(geometry, material);
			cylinder.position.set(i*18/numAgents+Math.random(),0,0.5);
			this.scene.add(cylinder);

			// GOAL FOR DEBUGGING
			var g = Math.floor(Math.random() * 18 + 1);//20-i*20/numAgents
			a.goal = new THREE.Vector3(g,0,19);
			var geom = new THREE.SphereGeometry(0.1,8,8);
			var sphere = new THREE.Mesh(geom, material);
			sphere.position.set(a.goal.x,a.goal.y,a.goal.z);
			this.scene.add(sphere);

			a.position = new THREE.Vector3(cylinder.position.x,cylinder.position.y,cylinder.position.z);
			a.velocity = new THREE.Vector3(0,0,0);
			a.geometry = cylinder;

			var x = Math.round(a.position.x);
			var z = Math.round(a.position.z);
			x = Math.min(Math.max(0, x), 19); // CLAMP
			z = Math.min(Math.max(0, z), 19); // CLAMP

			for(var j=x-1; j<x+2; j++)
			{
				for(var k=z-1; k<z+2; k++)
				{
					if(j>=0 &&k>=0 &&j<20 &&j<20)
					{
						this.cells[j][k].agents.push(a);
					}
				}
			}
			this.agents.push(a);
		}
	};

	generateAgentsScene2(numAgents)
	{
		for(var i=0; i<numAgents; i++)
		{
			var a = new Agent();
			var geometry = new THREE.CylinderGeometry(0.05,0.1,1);
			var material = new THREE.MeshLambertMaterial( {color: Math.random() * 0xffffff} );
			//material.color.setHex( Math.random() * 0xffffff );

			var cylinder = new THREE.Mesh(geometry, material);


			var r = 8;
			var px = r*Math.cos((i)*4.44288293816);//*360*3.14/180/numAgents);
			var pz = r*Math.sin((i)*4.44288293816);
			// px = Math.min(Math.max(0, px), 19); // CLAMP
			// pz = Math.min(Math.max(0, pz), 19); // CLAMP
			cylinder.position.set(px+10, 0, pz+10);
			this.scene.add(cylinder);

			// GOAL FOR DEBUGGING
			// var g = Math.floor(Math.random() * 18 + 1);//20-i*20/numAgents
			a.goal = new THREE.Vector3(-px+11, 0, -pz+11);
			var geom = new THREE.SphereGeometry(0.1, 8, 8);
			var sphere = new THREE.Mesh(geom, material);
			sphere.position.set(a.goal.x, 0, a.goal.z);
			this.scene.add(sphere);

			a.position = new THREE.Vector3(cylinder.position.x, cylinder.position.y, cylinder.position.z);
			a.velocity = new THREE.Vector3(0,0,0);
			a.geometry = cylinder;

			var x = Math.round(a.position.x);
			var z = Math.round(a.position.z);
			x = Math.min(Math.max(0, x), 19); // CLAMP
			z = Math.min(Math.max(0, z), 19); // CLAMP

			for(var j=x-1; j<x+2; j++)
			{
				for(var k=z-1; k<z+2; k++)
				{
					if(j>=0 &&k>=0 &&j<20 &&j<20)
					{
						this.cells[j][k].agents.push(a);
					}
				}
			}
			this.agents.push(a);
		}
	}

	moveAgents(framectr,num,speed,sceneSelect,visualDebug)
	{
		if(framectr===0 && sceneSelect===0)
			this.generateAgents(num);
		if(framectr===0 && sceneSelect===1)
			this.generateAgentsScene2(num);
	if(this.agents.length!==0)
	{

		var type = 2;
		// GO STRAIGHT:
		if(type===1)
		{
			for(var i=0; i<10; i++)
			{
				var a = this.agents[i];
				var d = a.position.distanceTo(a.goal);
				if(d>0.01)
				{
					a.velocity.set(a.goal.x - a.position.x,
									a.goal.y - a.position.y,
									a.goal.z - a.position.z);
					a.velocity.clamp(THREE.Vector3(0,0,0),THREE.Vector3(1,1,1));
					a.position.add(a.velocity.divideScalar(10));
					a.geometry.position.copy(a.position);

				}
			}
		}

		else
		{
			// USE MARKERS:
			for(var i=0; i<this.markers.length; i++)
			{
				this.markers[i].agent = null;
				this.markers[i].geometry.material.color.setHex(0xffffff);
			}

			for(var i=0; i<this.agents.length; i++)
				this.agents[i].markers = [];

			// FIND NEAREST AGENTS:
			for(var i=0; i<this.cells.length; i++)
			{
				for(var j=0; j<this.cells[i].length; j++)
				{
					var c = this.cells[i][j];
					if(c.agents.length===0) // only process markers if the cell has some agent..
						continue;

					// COMPARE ALL THE MARKERS TO ALL THE AGENTS IN THE CELLS
					for(var k=0; k<c.markers.length; k++)
					{
						var m = c.markers[k];
						var a;
						var minD = 0;
						for(var l=0; l<c.agents.length; l++)
						{
							a = c.agents[l];
							if(a.position.distanceTo(a.goal)<0.01) // STOP AGENT ONCE AT THE GOAL
							{
								continue;
							}
							var d = m.position.distanceTo(a.position);
							if((l===0 || d<minD) && d<1.5)
							{
								minD = d;
								m.agent = a;
							}
						}

						if(m.agent!==null)
						{
							m.agent.markers.push(m);
							if(visualDebug===true)
								m.geometry.material.color.setHex(m.agent.geometry.material.color.getHex());
						}
					}
				}
			}

			for(var i=0; i<this.cells.length; i++)
			{
				for(var j=0; j<this.cells[i].length; j++)
				{
					this.cells[i][j].agents = [];
				}
			}

			// FIND THE NEW VELOCITY OF THE AGENTS
			for(var i=0; i<this.agents.length; i++)
			{
				var a = this.agents[i];

				if(a===undefined)
					continue;

				var n = a.markers.length;

				a.velocity = THREE.Vector3(0,0,0);
				if(a.position.distanceTo(a.goal)<0.1) // STOP AGENT ONCE AT THE GOAL
				{
					//delete(this.agents[i]);
					this.scene.remove(a.geometry);
					this.agents.splice(i, 1);
					continue;
				}

			if(n!==0)
			{
				var dirAG = new THREE.Vector3(0,0,0);
				dirAG.set(a.goal.x - a.position.x,
						  a.goal.y - a.position.y,
						  a.goal.z - a.position.z) // dir to get to the goal
				dirAG = dirAG.normalize();

				var vel = new THREE.Vector3(0,0,0);
				for(var j=0; j<n; j++)
				{
					var m = a.markers[j];
					var distAM = a.position.distanceTo(m.position); // agent to marker distance
					if(distAM<0.0)
						distAM*=1.5;
					if(distAM<0)
						distAM-=0.1;
					else if(distAM>0)
						distAM+=0.1;

					if(distAM===0)
						distAM=0.001;
				//	var distW = (2 - distAM); // weight.. more dist => less weight
					var dir = new THREE.Vector3(0,0,0);
					dir.set(m.position.x - a.position.x,
							m.position.y - a.position.y,
							m.position.z - a.position.z);

					dir = dir.normalize(); // compute the direction
					var dot = dir.dot(dirAG);
					if(dot===0)
						dot=0.001;
					dir.multiplyScalar(Math.min(Math.max(-1.0, dot / n / distAM), 1.0)); // apply weight based on AM dist, AG dir, num M..
					vel.add(dir); // add the the velocity
				}

				a.velocity = vel.divideScalar(50-speed); // TIMESTEP
				a.position.add(a.velocity);
				a.geometry.position.copy(a.position);
			}

			var x = Math.round(a.position.x);
			var z = Math.round(a.position.z);
			x = Math.min(Math.max(0, x), 19); // CLAMP
			z = Math.min(Math.max(0, z), 19); // CLAMP

			for(var p=x-1; p<x+2; p++)
			{
				for(var q=z-1; q<z+2; q++)
				{
					if(p>=0 && q>=0 && p<20 && q<20)
					{
						this.cells[p][q].agents.push(a);
					}
				}
			}

			}

		}
	}
	};
}
