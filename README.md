### [See it here!](https://sknop8.github.io/BioCrowds/)

# BioCrowds
Biocrowds is a crowd simulation algorithm based on the formation of veination patterns on leaves. It prevents agents from colliding with each other on their way to their goal points using a notion of "personal space". Personal space is modelled with a space colonization algorithm. Markers (just points) are scattered throughout the simulation space, on the ground. At each simulation frame, each marker becomes "owned" by the agent closest to it (with some max distance representing an agent's perception). Agent velocity at the next frame is then computed using a sum of the displacement vectors to each of its markers. Because a marker can only be owned by one agent at a time, this technique prevents agents from colliding.

![](https://github.com/sknop8/Project7-BioCrowds/blob/9273a8ab734c540429c5cd28fc1bb7999079d368/crowdgif.gif)
