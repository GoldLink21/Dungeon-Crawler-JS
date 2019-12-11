# Changelog

## 0.4.0
### Additions
+ Added story to the game
+ 2 Levels preceding the former 1st level
+ New active item system
+ More actives that just haven't been added yet
    - Hooks
    - Bouncy and Tower Shields
    - Key magnets
+ New tile for hooks to grab onto

### Changes
* Revamped the whole styles around the game
* Game canvas scales with the size of the page
* Backround gradiant
* Reverted to info above canvas
* Moved floor indicator to top left corner of canvas insted of in info
* Shield can now be held indefinitely

### Removals
- Removed the never released themed floors
- Shield and key indicators that were never released
- Removed some old code

## 0.3.0 (Never Released!)
### Additions
+ Achievement System!!
+ Key overlay
+ Shield Delay Indicator
+ New floor implementing checkpoints
+ New floor with many enemies and mini lava traps
+ New way of making floors in the code to improve development speed
+ New cold theme for next set of floors
+ New color coding system for sets of floors
+ Added shortcuts through a variety of levels
+ Ice!! Complete with sliding physics
+ Small button for input without keyboard (It's garbage though)

### Changes
* Added a 15 loop minimum for toggling the console
* Made using the console easier and faster
* Changed the id system to utilize a single function
* Implemented the rock, tile under, and entity mechanics from my other game
* New Delay when stepping on the next floor tile, with invincibility
* Increased the minimum length of floor 10 
* Improved dart performance
* Enabled space to close the tell window
* Floor 13 shortcut modified to make it take longer

### Removals
- Nothing really

## 0.2.0
### Additions
+ New floor with many rocks
+ Many shortcuts to levels based on number of game loops
+ An external console for running the js without access to the console
+ Ability to track the way the player dies

### Changes
* Added randomization to the looks of things, such as the path tiles and rocks
* Revamped timing system again to allow timing of other things at the same time
* Redid trap timing system to allow starting at a value to fill in gaps at level start
* Adjusted tell size
* Game loop key shifting is now gradual

## 0.1.0
### Additions
+ Added CHANGELOG.md
+ Added version checking
+ Added Checkpoints that haven't been implemented yet
+ Added mini lava tiles that haven't been implemented
+ Pauses movement and timer when tab loses focus
+ New crossbow texture for traps. To be changed later. Shows direction of traps
+ New pickup for increasing the player's speed
+ .gitignore for .DS_Store files

### Changes
* New rock and dart texture courtesy of Noble
* Revamped Timing systems
* Added new tile system for the ability to customize the colors and images dynamically

### Removals
- Removed support for the boardIs function. Use b(x,y).is(...types)