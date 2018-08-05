# [BioCrowds](https://anvidalal.github.io/Biocrowds/)

# Introduction
Biocrowds is a crowd simulation algorithm based on the formation of veination patterns on leaves. It prevents agents from colliding with each other on their way to their goal points using a notion of "personal space". Personal space is modelled with a space colonization algorithm. Markers (just points) are scattered throughout the simulation space, on the ground. At each simulation frame, each marker becomes "owned" by the agent closest to it (with some max distance representing an agent's perception). Agent velocity at the next frame is then computed using a sum of the displacement vectors to each of its markers. Because a marker can only be owned by one agent at a time, this technique prevents agents from colliding.

<img src="1.gif" width="300"> <img src="2.gif" width="300">

# Demo
You can play with a demo of my project on [here](https://anvidalal.github.io/Biocrowds/).
