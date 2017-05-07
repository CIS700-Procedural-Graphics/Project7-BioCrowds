# Bio crowds

A small implementation of the biocrowds algorithm. It currently supports obstacle maps, where pixels are considered weights for each marker. It currently runs with 750 agents and around 64k markers.

Because one of the problems with this algorithm is its inability to plan ahead of obstacles, the target moves so agents have the chance to get out of local minima.