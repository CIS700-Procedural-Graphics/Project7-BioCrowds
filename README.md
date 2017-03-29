# BioCrowds

#### Issues
- With visual debug on, don't go over 50*50 markers (setting the slider to 50), it will mostly crash.
- With visual debug off, it runs at 75*75 markers and 50 new agents created repeatedly. Although, if the agent speed is too less, they just get stuck.
- Sometimes the agents bump into each other if the marker density is too low, or if there are just too many agents. I'm trying to figure out some fix for it.
- Also, my agents get too close to each other before coming to a halt, which makes it look like they collide. But if you look closely, they slow down if there is some other agent in their way. I'm not sure why this happens.

#### Scenarios
- Agents start on one side of the plane and go to a random point on the other side.
- Agents spawn on a circle and go to the diametrically opposite point on the circle (with some offset).

#### Demo
https://rms13.github.io/Project7-BioCrowds
