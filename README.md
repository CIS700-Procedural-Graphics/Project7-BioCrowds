# BioCrowds
Biocrowds is a crowd simulation algorithm based on the formation of veination patterns on leaves. It prevents agents from colliding with each other on their way to their goal points using a notion of "personal space". Personal space is modelled with a space colonization algorithm. Markers (just points) are scattered throughout the simulation space, on the ground. At each simulation frame, each marker becomes "owned" by the agent closest to it (with some max distance representing an agent's perception). Agent velocity at the next frame is then computed using a sum of the displacement vectors to each of its markers. Because a marker can only be owned by one agent at a time, this technique prevents agents from colliding.

# Agent
An agent encapsulates the following data
- Position
- Velocity
- Goal
- Size
- Markers
It also supports debugging functionality where it renders the markers it has available to it. In addition an agent is also an object if you make the position read-only.

## Grid/Marker Representation
The underlying optimization data structure is a uniform lookup grid for markers. It is able to support queries for nearby markers given an agent position. On average the # of markers >> # of agents, thus making this optimization crucial in rendering at >30 fps. In fact, the latency was brought down from ~30ms to ~5ms with the help of this optimization.
