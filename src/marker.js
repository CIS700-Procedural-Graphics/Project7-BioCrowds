const THREE = require('three')

export default class Marker
{
    constructor(pos, _index)
    {
      this.position = pos;
      this.markerindex = _index;
      this.closestDistance = 9999.0;
    }
}
