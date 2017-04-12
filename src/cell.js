const THREE = require('three')

export default class Cell //class for rooms or corridors
{
	constructor( _name, _center, _width, _length, _mesh )
	{
		this.name = _name;
		this.center = _center.clone();
		this.mesh = _mesh.clone();
		this.width = _width;
		this.length = _length;
	}

	drawCell(scene)
	{
		this.mesh.scale.set( 1,1,1 );
		this.mesh.position.set( this.center.x, this.center.y, this.center.z );
		scene.add(this.mesh);
	}
}
