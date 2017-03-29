## Stauffer Notes - Project Seven - Biocrowds

It's working pretty well. They get mushed together at the beginning because they're spawned practically on top of each other. You can see some of the drop back as the vanguard advances, because of a simple 'personal space' heuristic.

# Options

1. RestartCrowd - press to start over
2. numAgents - change the total number of agents that are spawned. For the 'Streams' scenario, the number is split evenly between three groups.
3. Scenario
	a. 'Streams' has three groups each at a different spawn point, each heading towards a different goal. As the number of agents gets large, I like how they create a roadblock in the middle of the obstacles and the agents in the back peel off and backtrack a bit to go around the other way.
	b. 'Circle' is a simple circle of agents all going towards the center
4. Use Obstacles - toggle to enable/disable a few simple obstacles. With larger numbers of agents in a row and lower 'personal space factor', you start to see some of the cheat across the edge of the obstacles.
5. Speed - overall speed factor. Simple changes the per-step position change when the obstacle is free to move.
6. Personal Space Factor - This is a multiplier applied to the agent's radius to create a simple buffer zone. Of the markers assigned to the agent at a given step, if the furthest one is closer than the edge of this buffer, the agent won't move. It's rough, but it keeps agents from getting close to each other as they approach more or less head-on. You can see the agents maintain good space when they're less jammed up.

