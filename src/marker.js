const THREE = require('three')

export default class Marker
{
    constructor(pos, _index)
    {
      this.position = pos;
      this.markerindex = _index;
      this.closestDistance = 9999.0;
      this.ownerindex = -1;
      this.ownermarkerindex = 0;
      this.color = new THREE.Color( 0,0,0 );
    }
}
