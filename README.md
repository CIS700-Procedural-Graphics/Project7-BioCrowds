# BioCrowds

## Implementation
1. Randomly generate markers on the plane and bin them into an 8x8 grid

2. Generate agents randomly with a position and destination

3. For each update: Assign the markers within a radius of an agent to that agent. If two agents claim the same marker, the closer one ultimately claims it. For each set of markers claimed by an agent, calculate the new weighted velocity[1].


## Crowd Arrangements
* Random
* Ring
* Center
* Corners4
* Rows
* Famous (agent's dest set to the current position of the first agent)


## Demo
Demo: https://iambrian.github.io/Project7-BioCrowds/
![BioCrowds](https://i.imgur.com/RwcteZV.png)

## References
[1] BioCrowds formulas: https://cis700-procedural-graphics.github.io/files/biocrowds_3_21_17.pdf
