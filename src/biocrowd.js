
const THREE = require('three'); 

//An individual agent
class Agent {
    constructor(radius, color, startV2, goalV2, crowdParams){
        this.radius = radius; //radius of cylinder mesh representing the agent
        this.markerRadius = radius * 6; //radius within which markers are considered
        this.startPos = startV2;
        this.pos = new THREE.Vector2( startV2.x, startV2.y);
        this.goal = goalV2;
        this.unitsPerSecond = 1.0; //units per second
        this.unitsPerStep = 0.035;
        this.assignedMarkers = [];
        this.color = color;
        var height = radius * 2.5;
        var geom = new THREE.CylinderGeometry( radius * 0.5, radius, height);
        var material = new THREE.MeshBasicMaterial( {color: this.color} );
        this.cylinder = new THREE.Mesh( geom, material );
        this.posY = height / 2.0;
        this.cylinder.position.set( this.pos.x, this.posY, this.pos.y );
        this.reachedGoal = false;
        this.crowdParams = crowdParams;

        //points geometry for markers
        this.pointsGeometry = new THREE.Geometry();
        var mat = new THREE.PointsMaterial({ color: 0xeeeeee })
        mat.size = 2.5;
        mat.sizeAttenuation = false;
        this.markersObj = new THREE.Points(this.pointsGeometry, mat);
        this.markersObj.position.set(0,0,0);
        
    }

    //add a marker to the list at position x,y
    addMarker( markerVec2 ){
        this.assignedMarkers.push( markerVec2 ); //can just use ref to marker
    }

    //given the current set of markers assigned to this agent,
    // compute the displacement for current step
    computeMove( dTimeSec /* time step in seconds */, msecNow ){
        var weightSum = 0;
        var goalDirec =  new THREE.Vector2();
        goalDirec.subVectors( this.goal, this.pos );
        goalDirec.normalize();
        var directions = []; //array of all direction  
        var maxMarkerDist = 0;      
        for( var m = 0; m < this.assignedMarkers.length; m++ ){
            var marker = this.assignedMarkers[m];
            var markerDirec = new THREE.Vector2(); //need new one for each marker
            //get dot of center to marker and center to goal
            markerDirec.subVectors( marker, this.pos );
            var markerDist = markerDirec.length();
            maxMarkerDist = Math.max( maxMarkerDist, markerDist );
            markerDirec.normalize();
            var dot = markerDirec.dot( goalDirec );
            //the weight for this marker
            var weight = (1.0 + dot) / (1.0 + markerDist );
            weightSum += weight;
            directions.push( markerDirec.multiplyScalar( weight ) );
        }
        //now sum each vector, weighted by net weight
        var vecSum = new THREE.Vector2(0,0);
        for( var i=0; i < directions.length; i++ )
            vecSum.add( directions[i].divideScalar( weightSum ) );
        vecSum.normalize(); //this is the direction to move
        //vecSum.multiplyScalar( dTimeSec * this.unitsPerSecond );
        vecSum.multiplyScalar( this.unitsPerStep * this.crowdParams.speed );

        //random pertubation to help with agents getting stuck against each other
        var rand = getRand2d( msecNow % 17, msecNow % 87 );
        if( rand < 0 ){ //< 0 to disable this
            //swap x & y to get a a vector perpendicular to current direction
            var perp = new THREE.Vector2( vecSum.y, vecSum.x );
            vecSum.add( perp.multiplyScalar(rand) );
        }
        
        //Only move if the furthest marker assigned to this agent is
        // beyond some threshold. Doesn't help with them initially being smushed
        // together, but does prevent them from smooshing together when things
        // get jammed up.
        if( maxMarkerDist > this.radius * this.crowdParams.personalSpaceFactor ){
            this.pos.add( vecSum );
            this.cylinder.position.set( this.pos.x, this.posY, this.pos.y );
        }
        //have we reached the goal?
        var dist = vecSum.subVectors(this.goal, this.pos).length();
        if( dist < this.radius * 2 ){
            this.reachedGoal = true;
            //console.log("reached goal");
        }

        //console.log("agent: this.assignedMarkers.length, directions, vecSum, pos, cyliner.pos: ", this.assignedMarkers.length, directions, vecSum, this.pos,  this.cylinder.position );        
    }
}

function getRand2d( x, y ){
    var vec = new THREE.Vector2(x,y);
    return Math.abs( ( Math.sin( vec.dot( new THREE.Vector2(12.9898,78.233))) * 43758.5453 ) % 1 );    
    //return ( Math.sin( vec.dot( new THREE.Vector2(12.9898,78.233))) * 43758.5453 ) % 1;    
}

function new3Darray( w, h ){
    var arr = new Array(w);
    for( var i=0; i < w; i++){
        arr[i] = new Array(h);
        for( var j=0; j < h; j++ ){
            arr[i][j] = [];
        }
    }
    return arr;
}

class Markers{
    constructor(params){
        this.gridW = params.gridW;
        this.gridD = params.gridD;
        //Get an int for number of grid sectors, then recalc sector width/depth
        this.gridSecNW = Math.round( this.gridW / params.gridSecW ); //# of grid sectors along width
        this.gridSecND = Math.round( this.gridD / params.gridSecD );
        this.gridSecW = this.gridW / this.gridSecNW; //width of grid sectors
        params.gridSecW = this.gridSecW; 
        this.gridSecD = this.gridD / this.gridSecND;
        params.gridSecD = this.gridSecD;
        this.markerDensity = params.markerDensity;
        this.markers = [];
        this.doObstacle = params.doObstacle;
        this.obstacles = [{ center: new THREE.Vector2(-2,1), 
                          radius: 1.2, },
                          { center: new THREE.Vector2(-10,6), 
                          radius: 2, },
                          { center: new THREE.Vector2(2,1), 
                          radius: 1.5, },
                          { center: new THREE.Vector2(0,3.4), 
                          radius: 1.2, }
                         ];
        //markers
        //
        //make a 2D array of sectors to eacho hold array of marker positions
        //console.log("this.gridSecNW, this.gridSecND: ", this.gridSecNW, this.gridSecND );
        this.markersBySector = new3Darray( this.gridSecNW, this.gridSecND );
        var geometry = new THREE.Geometry();
        var gridStep = 1.0 / this.markerDensity;
        var diff = new THREE.Vector2();
        for( var i=0; i < this.gridW * this.markerDensity; i++)
          for( var j=0; j < this.gridD * this.markerDensity; j++){
            //offset should be max < 1/2 of space between markers
            var x = -this.gridW/2.0 + (i * gridStep) + ( getRand2d( i, j ) / this.markerDensity / 2.1 );
            var z = -this.gridD/2.0 + (j * gridStep) + ( getRand2d( j, i ) / this.markerDensity / 2.1 );
            //check for obstacle
            var skip = false;
            if( this.doObstacle ){
                for( var o in this.obstacles ){
                    var dist = diff.subVectors( new THREE.Vector2(x,z), this.obstacles[o].center ).length();
                    if( dist < this.obstacles[o].radius )
                        skip = true;;
                }
            }
            if(skip)
                continue;
            //store them right in a geometry for display
            geometry.vertices.push( new THREE.Vector3( x, 0, z ) );
            //store also in the grid sector array for quick assignemtn to agents
            var sectorX = Math.floor( (x + this.gridW/2.0) / this.gridSecW );
            var sectorZ = Math.floor( (z + this.gridD/2.0) / this.gridSecD );
            this.markersBySector[ sectorX ][ sectorZ ].push( new THREE.Vector2(x,z) );
          }

        //geometry
        geometry.verticesNeedUpdate = true;
        var mat = new THREE.PointsMaterial({ color: 0xffff00 })
        mat.size = 1.5;
        mat.sizeAttenuation = false;
        this.markersObj = new THREE.Points(geometry, mat);
        this.markersObj.position.set(0,0,0);

    }
}

export default class Crowd {
    constructor(params, scene){
        this.numAgents = params.numAgents;
        this.agents = [];
        this.scene = scene;
        this.gridW = params.gridW;
        this.gridD = params.gridD;
        this.doObstacle = params.doObstacle;

        //generate markers and points object for them
        this.markers = new Markers(params);
        scene.add( this.markers.markersObj );

        //generate agents
        // var start = new THREE.Vector2(9, 4);
        // var goal  = new THREE.Vector2(-10, -5);
        // this.addAgent(0.4, 0xaa11cc, start, goal );
        var starts = [];
        var numGroups = 0;
        this.colors = [ 0xaa11bb, 0xcc8811, 0x1133aa ];
        if( params.grouping == 0 ){
            starts = [ new THREE.Vector2( 5,-9 ),
                        new THREE.Vector2( -4,-9 ),
                        new THREE.Vector2( -1,9 ), ];
            this.goals = [ new THREE.Vector2( -9.7,9.7 ),
                        new THREE.Vector2( 9.7,9.7 ),
                          new THREE.Vector2( 1,-9.7 ), ];
            numGroups = 3;
            for( var i=0; i < this.numAgents; i++ ){
                var group = i % numGroups;
                var xoff = (getRand2d( i+1, -2*(group+1) ) - 0.5 ) * 8.0;
                //console.log( "xoff ", xoff);
                var start = new THREE.Vector2( starts[group].x + xoff, starts[group].y );
                this.addAgent( 0.25, this.colors[group], start, this.goals[group], params );
            }
        }else{
            //circle
            for( var i=0; i < this.numAgents; i++ ){
                var angle = 6.282 * i / this.numAgents;
                var radius = 8;
                var x = Math.cos( angle ) * radius;
                var z = Math.sin( angle ) * radius;
                var pos = new THREE.Vector2(x,z);
                this.goals = [ new THREE.Vector2(0,0) ];
                this.addAgent( 0.25, this.colors[0], pos, this.goals[0], params );
            }
        }
        
        //make goal objects
        for( var i=0; i < this.goals.length; i++ ){
            var geom = new THREE.SphereGeometry(0.6,24,24);
            var material = new THREE.MeshBasicMaterial( {color: this.colors[i]} );
            var goalObj = new THREE.Mesh( geom, material );
            goalObj.position.set( this.goals[i].x, 0, this.goals[i].y );
            this.scene.add( goalObj );
        }
        //dbg
        //console.log("scene JSON: ", scene.toJSON());
    }

    addAgent( radius, color, startV2, goalV2, crowdParams ){
        var agent = new Agent( radius, color, startV2, goalV2, crowdParams );
        this.agents.push( agent );
        this.scene.add( agent.cylinder );
        //this.scene.add( agent.markersObj);
    }

    doStep( dTimeSec /* time step in seconds */, msecNow){
        //console.log("dTimeSec: ",dTimeSec)
        this.assignMarkers();
        for( var a = 0; a < this.agents.length; a++ ){
            //test moving target
            //var change = new THREE.Vector2(-0.02,0);
            //this.agents[a].goal.add(change);
            this.agents[a].computeMove( dTimeSec, msecNow );
            if( this.agents[a].reachedGoal ){
                //remove the agent
                this.agents[a].cylinder.visible = false;
                this.agents[a].markersObj.visible = false;
                if( this.agents.length == 1 )
                    this.agents = [];
                else
                    this.agents.splice(a,1);
            }
        }
    }

    // go through the markers and assign them to the agents
    assignMarkers() {
        //Setup the list of agents currently in each grid sector
        //
        //The idea is to speed up assignment by only considering
        // agents that are in the same or neighboring grid sector
        // as the marker
        var gridW2 = this.gridW / 2.0; //half of full grid width
        var gridD2 = this.gridD / 2.0;
        //2D array of empty arrays. Each element is a sector that holds an
        // array of agents that are in/next-to the the sector.
        var agentsBySector = new3Darray( this.markers.gridSecNW, this.markers.gridSecND );
        //console.log("agentsBySector: ", agentsBySector );
        //For each agent, find the nearest sectors and add
        // the agent to them
        //centerSecX is the sector number, starting from 0 and left
        var secW = this.markers.gridSecW; //sector width
        var secD = this.markers.gridSecD;
        for( var a = 0; a < this.agents.length; a++ ){
            var ag = this.agents[a];
            ag.assignedMarkers = []; //reset this for each step
            var centerSecX = Math.min( Math.round( ( ag.pos.x + gridW2 ) / secW ), this.markers.gridSecNW-1 );
            var centerSecZ = Math.min( Math.round( ( ag.pos.y + gridD2 ) / secD ), this.markers.gridSecND-1 );
            // console.log("assignMarkers: agent.pos: ", ag.pos)
            // console.log("gridW2, gridD2, secW, secD: ",gridW2, gridD2, secW, secD);
            // console.log("centerSecX, centerSecZ: ", centerSecX, centerSecZ );
            //these indecies are always valid
            agentsBySector[centerSecX][centerSecZ].push(ag);
            if( centerSecX > 0 ){
                agentsBySector[centerSecX-1][centerSecZ].push(ag);
            }
            if( centerSecZ > 0 ){
                agentsBySector[centerSecX][centerSecZ-1].push(ag);
            }
            if( centerSecX > 0 && centerSecZ > 0){
                agentsBySector[centerSecX-1][centerSecZ-1].push(ag);
            }
        }

        //Now go through each sector, and if there any agents in/near it,
        // go through all its markers and see which agent they belong to
        var diff = new THREE.Vector2();
        for( var i=0; i<this.markers.gridSecNW; i++){
          for( var j=0; j<this.markers.gridSecND; j++ ){
            if ( agentsBySector[i][j].length > 0 ){
                //One or more agents in here
                var secMarkers = this.markers.markersBySector[i][j];
                //console.log("assignMarkers: sector with agents: i, j, secMarkers.length: ", i, j, secMarkers.length);
                //For each marker in this section, check against all agents in
                // this sector
                for( var m = 0; m < secMarkers.length; m++){
                    var nearestAgent;
                    var nearestDist = 9999999;
                    var marker = secMarkers[m];
                    var foundOne = false;
                    for( var a in agentsBySector[i][j] ){
                        var ag = agentsBySector[i][j][a];
                        var dist = diff.subVectors( marker, ag.pos ).length();
                        //If it's within the agents marker radius and closer
                        // than any previous marker, choose it
                        //console.log("  agent.pos, marker pos, dist: ", ag.pos, marker, dist);
                        if( dist < nearestDist && dist < ag.markerRadius ){
                            nearestDist = dist;
                            nearestAgent = ag;
                            foundOne = true;
                        }
                    }
                    if( foundOne ){
                        //console.log("assignMarkers: found one!");
                        nearestAgent.addMarker( marker );
                    }
                }
            }
          }
        }

        //Create colored point for each agent's markers.
        //Probalby better to do this by using texture to set colors for the
        // main points mesh of markers
        for( var a = 0; a < this.agents.length; a++ ){
            var ag = this.agents[a];
            ag.pointsGeometry.vertices = []; //clear
            for( var m in ag.assignedMarkers ){
                var marker = ag.assignedMarkers[m];
                ag.pointsGeometry.vertices.push( new THREE.Vector3( marker.x, 0.05, marker.y ) );
            }
            ag.pointsGeometry.verticesNeedUpdate = true;
        }

    }// assignMarkers
}