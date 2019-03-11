#Changelog

##0.2.1
###Additions
+ New floor with many rocks
+ Many shortcuts to levels based on number of game loops
+ An external console for running the js without access to the console
+ Ability to track the way the player dies

###Changes
* Added randomization to the looks of things, such as the path tiles and rocks
* Revamped timing system again to allow timing of other things at the same time
* Redid trap timing system to allow starting at a value to fill in gaps at level start
* Adjusted tell size
* Game loop key shifting is now gradual

##0.1.0
###Additions
+ Added CHANGELOG.md
+ Added version checking
+ Added Checkpoints that haven't been implemented yet
+ Added mini lava tiles that haven't been implemented
+ Pauses movement and timer when tab loses focus
+ New crossbow texture for traps. To be changed later. Shows direction of traps
+ New pickup for increasing the player's speed
+ .gitignore for .DS_Store files
###Changes
* New rock and dart texture courtesy of Noble
* Revamped Timing systems
* Added new tile system for the ability to customize the colors and images dynamically
###Removals
- Removed support for the boardIs function. Use b(x,y).is(...types)