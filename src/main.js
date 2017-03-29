
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import Noise from './noise'
import {other} from './noise'
import DAT from 'dat-gui'

//Gloabal List of Agents, Grids and Goals
var AgentList = [];    
var GoalList = [];
var Grids = [];

//Global Simulation variables
var start = true;
var scene;
var scene1 = true;
var scene2 = false;

var prob = 0.01;
var obs_p = {
    Obstacle_Prob: 0.01
}


//GRID CLASS
var Grid = function(){
    var Grid = {};
    
    Grid.bound1; //these are the LB and the UB does not matter which is which
    Grid.bound2;
    
    Grid.MarkerList = []; //they are a set of positions randomly distributed in space to guide the Agents
    Grid.LookupGrids = []; //it stores the index of the grids surrounding it that the agent in the grid will use to lookup markers in the neighbouring grids
    
    return Grid;
}

//GOAL CLASS
var Goal = function(){
    var Goal = {};
    
    Goal.geometry;
    Goal.position;
    Goal.selected = false;
    Goal.domain = 10; //this is the field of influence around the goal post
    
    return Goal;
}

//MARKER CLASS
var Marker = function(){
    var Marker = {};
    
    Marker.geometry;
    Marker.position;
    Marker.owned = false;
    
    return Marker;
}

//AGENT CLASS
var Agent = function(){
    var Agent = {};

    Agent.geometry;
    Agent.position; //current position
    Agent.velocity = 0.1; //current velocity 
    Agent.goal; //goal object
    Agent.size; //radius of the cylinder
    Agent.marker_pos = []; //list of marker positions owened currently by the agent
    
    Agent.index = undefined; //index of the grid the marker is currently in. Used for cleanup and updating markers
    
    Agent.reached = false;
    
    return Agent;
};

//Misc Functions

function Add_Grid(x, z, size, no_of_markers, scene)
{
    var new_G = new Grid();
    
    new_G.bound1 = new THREE.Vector3(x,0,z);
    new_G.bound2 = new THREE.Vector3(x-size, 0, z-size);
    
    var rock = false
    if(x < 15 && x > -15 && z < 15 && z > -15)
        if(THREE.Math.randFloat(0,1) <= prob)
            rock = true;
      
    if(rock !== true)
    {
        for(var i = 0; i < no_of_markers; i++)
        {
            new_G.MarkerList.push(Add_To_MarkerList(scene, x, z, size));
        }
        rock = false;
    }
    else
    {
        var geometry = new THREE.BoxGeometry( 3, 1, 3 );
        var material = new THREE.MeshBasicMaterial( {color: 0x00ffff} );
        var cube = new THREE.Mesh( geometry, material );
        cube.position.set(x - 5, 0.5,z-5);
        scene.add( cube );
        rock = false;
    }    
    
    new_G.LookupGrids = Fetch_from_Grid_Lookup_Table(x, z); 
    
    Grids.push(new_G);
}   

function Fetch_from_Grid_Lookup_Table(x, z)
{
    var list = [];
    
    if(x == 25 && z == 25)
        return list = [0,1, 5, 6];
    if(x == 25 && z == 15)
        return list = [1,0,2,5,6,7];
    if(x == 25 && z == 5)
        return list = [2,1,3,6,7,8];
    if(x == 25 && z == -5)
        return list = [3,2,4,7,8,9];
    if(x == 25 && z == -15)
        return list = [4,3,8,9];
    if(x == 15 && z == 25)
        return list = [5,0,1,6,10,11];
    if(x == 15 && z == 15)
        return list = [6,0,1,2,5,7,10.0,11,12];
    if(x == 15 && z == 5)
        return list = [7,1,2,3,6,8,11,12,13];
    if(x == 15 && z == -5)
        return list = [8,2,3,4,7,9,12,13,14];
    if(x == 15 && z == -15)
        return list = [9,3,4,8,13,14];
    if(x == 5 && z == 25)
        return list = [10,5,6,11,15,16];
    if(x == 5 && z == 15)
        return list = [11, 5,6,7,10,12,15,16,17];
    if(x == 5 && z == 5)
        return list = [12, 6,7,8,11,13,16,17,18];
    if(x == 5 && z == -5)
        return list = [13, 7,8,9,12,14,17,18,19];
    if(x == 5 && z == -15)
        return list = [14, 8,9,13,18,19];
    if(x == -5 && z == 25)
        return list = [15, 10,11,16,20,21];
    if(x == -5 && z == 15)
        return list = [16, 10,11,12,15,17,20,21,22];
    if(x == -5 && z == 5)
        return list = [17, 11,12,13,16,18,21,22,23];
    if(x == -5 && z == -5)
        return list = [18, 12,13,14,17,19,22,23,24];
    if(x == -5 && z == -15)
        return list = [19, 13,14,18,23,24];
    if(x == -15 && z == 25)
        return list = [20, 15,16,21];
    if(x == -15 && z == 15)
        return list = [21, 15,16,17,20,22];
    if(x == -15 && z == 5)
        return list = [22, 16,17,18,21,23];
    if(x == -15 && z == -5)
        return list = [23, 17,18,19,22,24];
    if(x == -15 && z == -15)
        return list = [24, 18,19,23];
}

function update_Agents(speed)
{
    //FREE THE MARKERS!... AND AGENTS DATA
    free_data();
    
    for(var i = 0 ; i < AgentList.length; i++)
    {

        if(AgentList[i].geometry !== undefined)
        {
    
            if(AgentList[i].reached !== true)
            {
                
            var index = get_grid_index(AgentList[i].position);
            AgentList[i].index = index;
        
            
            //LOOP FOR LOOKINGUP AND OWENING MARKERS
//            debugger;
            for(var j = 0; j < Grids[index].LookupGrids.length; j++)
            {

                for(var k = 0; k < Grids[Grids[index].LookupGrids[j]].MarkerList.length; k++)
                {
                    if(Grids[Grids[index].LookupGrids[j]].MarkerList[k].owned == false)
                    {
                        var a_index = undefined;
                        var min_dist = 50000000.0;
                        for(var l = 0; l < AgentList.length; l++)
                        {
                            var d = AgentList[l].position.distanceTo(Grids[Grids[index].LookupGrids[j]].MarkerList[k].position);
                            if(d < min_dist && d <= 4.0)
                            {
                                a_index = l;
                                min_dist = d; 
                                
                            }
                        }
                        
                        if(a_index !== undefined)
                        {   
                            AgentList[a_index].marker_pos.push(Grids[Grids[index].LookupGrids[j]].MarkerList[k].position);
                            //change marker to owned and change its color
                            Grids[Grids[index].LookupGrids[j]].MarkerList[k].owned = true;
                            Grids[Grids[index].LookupGrids[j]].MarkerList[k].geometry.material.color.setHex(AgentList[a_index].geometry.material.color.getHex());
                        }
                        
                    }
                    
                    
                    
                    
//                    if(AgentList[i].position.distanceTo(Grids[Grids[index].LookupGrids[j]].MarkerList[k].position) <= 5.0)
//                    {
//                        
//                        AgentList[i].marker_pos.push(Grids[Grids[index].LookupGrids[j]].MarkerList[k].position);
//                    
//                        //change marker to owned and change its color
//                        Grids[Grids[index].LookupGrids[j]].MarkerList[k].owned = true;
//                        Grids[Grids[index].LookupGrids[j]].MarkerList[k].geometry.material.color.setHex(AgentList[i].geometry.material.color.getHex());
//                    }
                
                }
            }
            
//            debugger;
            //LOOP FOR CLACULATING THE WEIGHT AND FINAL VELOCITY OF THE AGENT
            var total_weight = 0;
            var individual_weights = [];
            var mi  = [];
            var g = get_displacement(AgentList[i].goal.position, AgentList[i].position);
            for(var l = 0; l < AgentList[i].marker_pos.length; l++)
            {
                mi.push(get_displacement(AgentList[i].marker_pos[l], AgentList[i].position)); 
                individual_weights.push(get_weight(mi[mi.length - 1], g));
                total_weight += individual_weights[individual_weights.length - 1];
            }
            
            //FINAL VELOCITY
            var final_velocity = new THREE.Vector3(0,0,0);
            for(var p = 0; p < mi.length; p++)
            { 
                final_velocity = add_velocity(final_velocity, get_fin_vel(mi[p], individual_weights[p], total_weight));      
            }
            
//            debugger;
            var S = Math.min(final_velocity.length(), 0.5);
            final_velocity = get_fin_vel(final_velocity, S, final_velocity.length());
            final_velocity = add_velocity(AgentList[i].position, final_velocity);
            AgentList[i].geometry.position.set(final_velocity.x, final_velocity.y, final_velocity.z);
            AgentList[i].position = final_velocity;
            
//            var new_pos = new THREE.Vector3(0,0,0);
//            new_pos = get_Diff(AgentList[i].goal.position, AgentList[i].position, speed);
//            AgentList[i].geometry.position.set(new_pos.x, new_pos.y, new_pos.z);
//            AgentList[i].position = new_pos;
//            AgentList[i].geometry.verticesNeedUpdate = true
          
        }
        }
    }
    //debugger;
}

function free_data()
{
    for(var i = 0 ; i < AgentList.length; i++)
    {
        if(AgentList[i].geometry !== undefined)
        {
//            debugger;
            if(AgentList[i].index !== undefined)
            {
                for(var j = 0; j < Grids[AgentList[i].index].LookupGrids.length; j++)
                {
                    for(var k = 0; k < Grids[Grids[AgentList[i].index].LookupGrids[j]].MarkerList.length; k++)   
                    {
                        if(Grids[Grids[AgentList[i].index].LookupGrids[j]].MarkerList[k].owned !== false)
                        {
                            Grids[Grids[AgentList[i].index].LookupGrids[j]].MarkerList[k].owned = false;
                            Grids[Grids[AgentList[i].index].LookupGrids[j]].MarkerList[k].geometry.material.color.setHex(0xffff00);
                        }   
                    }
                }
            
//            debugger;
                AgentList[i].marker_pos.length = 0;
                AgentList[i].index = undefined;
            }
        }
    }
}

function get_fin_vel(m, wi, twi)
{
    var temp = m;
    temp.x = m.x * wi / twi;
    temp.y = 1;
    temp.z = m.z * wi / twi;
    
    return temp;
}

function add_velocity(velO, velN)
{
    var temp = velO;
    temp.x = velO.x + velN.x;
    temp.y = 1;
    temp.z = velO.z + velN.z;
    
    return temp;
}

function get_weight(m, g)
{
    var denominator = 1 + m.length();
    m.normalize();
    g.normalize();
    var cosTheta = m.dot(g);
    var numerator = 1 + cosTheta;
    var weight = numerator / denominator;
    return weight;
}

function get_displacement(m_pos, a_pos)
{
    var temp = new THREE.Vector3(0,0,0);
    temp.x = m_pos.x - a_pos.x;
    temp.y = 1;
    temp.z = m_pos.z - a_pos.z;

    return temp;
}

function get_grid_index(pos)
{
    for(var i = 0; i < Grids.length; i++)
    {
        var top_bound = (pos.x <= Grids[i].bound1.x && pos.z <= Grids[i].bound1.z);
        var bottom_bound = (pos.x >= Grids[i].bound2.x && pos.z >= Grids[i].bound2.z);
        
        if(top_bound && bottom_bound)
        {
            return i;
        }
    }
}

function get_Diff(pos1, pos2, speed)
{
    //debugger;
    var temp_pos = new THREE.Vector3(pos1.x, pos1.y, pos1.z);
    temp_pos.x = pos2.x + (pos1.x - pos2.x) * speed; 
    temp_pos.y = pos2.y; 
    temp_pos.z = pos2.z + (pos1.z - pos2.z) * speed;

    return temp_pos;
}

function getRandomColor() 
{
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function Add_To_MarkerList(scene, x, z, size)
{
    var geometry = new THREE.SphereGeometry( 0.1, 5, 5 );
    var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    var sphere = new THREE.Mesh( geometry, material );
    var a = new THREE.Vector3( THREE.Math.randInt(x-size, x), 0, THREE.Math.randInt(z-size, z) );
    sphere.position.set(a.x, a.y, a.z);
    scene.add( sphere );
    
    var new_M = new Marker();
    
    new_M.geometry = sphere;
    new_M.position = sphere.position;
    
    return new_M;
}

function Add_To_GoalList(geom)
{
    var new_goal = new Goal();
    
    new_goal.geometry = geom;
    new_goal.position = geom.position;
    
    GoalList.push(new_goal);
}

function Add_To_AgentList(geom)
{
//    debugger;
    var new_agent = new Agent();
    
    new_agent.geometry = geom;
    new_agent.position = geom.position;
    
    //selecting a goal from the available goals
    if(GoalList.length == 10)
        var index = select_goal1();
    else
        var index = select_goal2(geom.position.x);
    
    new_agent.goal = GoalList[index];
    new_agent.goal.geometry.material.color.setHex(geom.material.color.getHex());
    
    new_agent.size = 2;
    
    AgentList.push(new_agent);
}

function select_goal1()
{
    var index = 0;
    var goal_selected = false;
    while(goal_selected != true)
    {
        index = THREE.Math.randInt(0, GoalList.length - 1);
        if(GoalList[index].selected == false)
        {
            goal_selected = true;
            GoalList[index].selected = true;
        }
    }
    
    return index;
} 

function select_goal2(x)
{
    if(x > 0)
    {
        var index = 0;
        var goal_selected = false;
        while(goal_selected != true)
        {
            index = THREE.Math.randInt(0, 9);
            if(GoalList[index].selected == false)
            {
                goal_selected = true;
                GoalList[index].selected = true;
            }
        }
    
        return index;        
    }
    else if(x < 0)
    {
        var index = 0;
        var goal_selected = false;
        while(goal_selected != true)
        {
            index = THREE.Math.randInt(10, 19);
            if(GoalList[index].selected == false)
            {
                goal_selected = true;
                GoalList[index].selected = true;
            }
        }
    
        return index;  
    }
}

var st = function(){
    this.Play_Pause = function(){
        start = !start;
    }
}

var rs = function(){
    this.Reset = function(){
        Clear_Scene();
        if(scene1 !== false)
            Create_Scene1();
        else
            Create_Scene2();
    }
}

var rs1 =  function(){
    this.Scene1 = function(){
        Clear_Scene();
        Create_Scene1();
        scene1 = true;
        scene2 = false;
    }
}

var rs2 =  function(){
    this.Scene2 = function(){
        Clear_Scene();
        Create_Scene2();
        scene2 = true;
        scene1 = false;
    }
}

function Clear_Scene()
{
    while(scene.children.length > 0)
    { 
        scene.remove(scene.children[0]); 
    }
    GoalList.length = [];
    AgentList.length = [];
    Grids.length = [];
    start = true;
}

function Create_Scene1()
{
    //create a BASE PLANE
    var base_plane_geom = new THREE.PlaneGeometry(50, 50);
    var base_plane_material = new THREE.MeshBasicMaterial( {color: 0x666666, side: THREE.DoubleSide} );
    var plane = new THREE.Mesh( base_plane_geom, base_plane_material );
    base_plane_geom.rotateX(90 * 3.14 / 180);
    scene.add( plane );
   
    //Create a grid structure of Markers on the plane
    Grids.clear;
    var size = 10;
    var number_of_markers = 120;
    
    for(var i = 25 ; i > -25; i -= size)
    {
        for(var j = 25 ; j > -25; j -= size)
        {
            Add_Grid(i, j, size, number_of_markers, scene);
        }
    }
    
    //debugger;
    //Create a bunch of Goals for the Agents
    for(var j = 0 ; j < 10; j++)
    {
        GoalList.clear;
        var goal_geometry = new THREE.CylinderGeometry( 0.4, 0.4, 10, 10 );
        var goal_material = new THREE.MeshBasicMaterial( {color: 0xFF0000} );
        var goal_cylinder = new THREE.Mesh( goal_geometry, goal_material );
        var pos_g = new THREE.Vector3(-23, 5, -22 + j * 5);
        goal_cylinder.position.set(pos_g.x, pos_g.y, pos_g.z);
        Add_To_GoalList(goal_cylinder);
        scene.add(goal_cylinder);       
    }
    
    //Create a bunch of Agents
    for(var k = 0; k < 10; k++)
    {
        AgentList.clear;
        var cyl_geometry = new THREE.CylinderGeometry( 0, .5, 2, 10 );
        var cyl_material = new THREE.MeshBasicMaterial( {color: getRandomColor()} );
        var cylinder = new THREE.Mesh( cyl_geometry, cyl_material );
        var pos_a = new THREE.Vector3(23, 1, -22 + k * 5);
        cylinder.position.set(pos_a.x, pos_a.y, pos_a.z);
        Add_To_AgentList(cylinder);
        scene.add(cylinder);
    }
}

function Create_Scene2()
{
    //create a BASE PLANE
    var base_plane_geom = new THREE.PlaneGeometry(50, 50);
    var base_plane_material = new THREE.MeshBasicMaterial( {color: 0x666666, side: THREE.DoubleSide} );
    var plane = new THREE.Mesh( base_plane_geom, base_plane_material );
    base_plane_geom.rotateX(90 * 3.14 / 180);
    scene.add( plane );
   
    //Create a grid structure of Markers on the plane
    Grids.clear;
    var size = 10;
    var number_of_markers = 120;
    
    for(var i = 25 ; i > -25; i -= size)
    {
        for(var j = 25 ; j > -25; j -= size)
        {
            Add_Grid(i, j, size, number_of_markers, scene);
        }
    }
    
    //Create a bunch of Goals for the Agents on one side
    for(var j = 0 ; j < 10; j++)
    {
        GoalList.clear;
        var goal_geometry = new THREE.CylinderGeometry( 0.5, 0.5, 10, 10 );
        var goal_material = new THREE.MeshBasicMaterial( {color: 0xFF0000} );
        var goal_cylinder = new THREE.Mesh( goal_geometry, goal_material );
        var pos_g = new THREE.Vector3(-23, 5, -22 + j * 5);
        goal_cylinder.position.set(pos_g.x, pos_g.y, pos_g.z);
        Add_To_GoalList(goal_cylinder);
        scene.add(goal_cylinder);
    }
    
    //Create a bunch of Goals for the Agents on other side
    for(var j = 0 ; j < 10; j++)
    {
        GoalList.clear;
        var goal_geometry = new THREE.CylinderGeometry( 0.5, 0.5, 10, 10 );
        var goal_material = new THREE.MeshBasicMaterial( {color: 0xFF0000} );
        var goal_cylinder = new THREE.Mesh( goal_geometry, goal_material );
        var pos_g = new THREE.Vector3(23, 5, -22 + j * 5);
        goal_cylinder.position.set(pos_g.x, pos_g.y, pos_g.z);
        Add_To_GoalList(goal_cylinder);
        scene.add(goal_cylinder);
    }
    
    //Create a bunch of Agents on one side
    for(var k = 0; k < 10; k++)
    {
        AgentList.clear;
        var cyl_geometry = new THREE.CylinderGeometry( 0, .5, 2, 10 );
        var cyl_material = new THREE.MeshBasicMaterial( {color: getRandomColor()} );
        var cylinder = new THREE.Mesh( cyl_geometry, cyl_material );
        var pos_a = new THREE.Vector3(23, 1, -22 + k * 5);
        cylinder.position.set(pos_a.x, pos_a.y, pos_a.z);
        Add_To_AgentList(cylinder);
        scene.add(cylinder);
    }
    
    //Create a bunch of Agents on the other side
    for(var k = 0; k < 10; k++)
    {
        AgentList.clear;
        var cyl_geometry = new THREE.CylinderGeometry( 0, .5, 2, 10 );
        var cyl_material = new THREE.MeshBasicMaterial( {color: getRandomColor()} );
        var cylinder = new THREE.Mesh( cyl_geometry, cyl_material );
        var pos_a = new THREE.Vector3(-23, 1, -22 + k * 5);
        cylinder.position.set(pos_a.x, pos_a.y, pos_a.z);
        Add_To_AgentList(cylinder);
        scene.add(cylinder);
    }
    
}


//End of Misc Functions    

// called after the scene loads
function onLoad(framework) {
  scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;
  var stats = framework.stats;
    var audio = framework.audio;
    
  // set camera position
  camera.position.set(0, 40, 40);
  camera.lookAt(new THREE.Vector3(0,0,0));

    
    //Create a Scene
    Create_Scene1();
    
    //start stop button
    var stsp = new st();
    gui.add(stsp, 'Play_Pause').onclick;
    
    //reset scene button
    var rss = new rs();
    gui.add(rss, 'Reset').onclick;

    //render scene 1
    var rsc1 = new rs1();
    gui.add(rsc1, "Scene1").onclick;
    
    //render scene 2
    var rsc2 = new rs2();
    gui.add(rsc2, "Scene2").onclick;
    
    //obstacle probality
    gui.add(obs_p, "Obstacle_Prob", 0, 0.1).onChange(function(newVal) {
        prob = newVal;
        Clear_Scene();
        if(scene1 !== false)
            Create_Scene1();
        else
            Create_Scene2();
    });
}


// called on frame updates
function onUpdate(framework) {

    //debugger;
    var clock = new THREE.Clock();
    clock.start;
    var speed = 0.005;
    speed += clock.getDelta();
    
    if(start !== false)
        update_Agents(speed);

}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);

// console.log('hello world');

// console.log(Noise.generateNoise());

// Noise.whatever()

// console.log(other())