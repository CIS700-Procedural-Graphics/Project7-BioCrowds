const THREE = require('three')

export default class Marker
{
    constructor(pos)
    {
      this.owner = undefined;
      this.position = pos;
      this.closestDistance = -1.0;
    }
}
