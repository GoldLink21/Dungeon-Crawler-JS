/*
This is all the floors in game and some of the functions related to making floors
*/

////////////////////////////////////////////////////
//These are the helper functions
const testFloorNum=9001
/**
 * Loads a specific floor
 * @param {number} floor The floor to load 
 */
function loadFloor(floor){
    game.curFloorDeaths=0
    removeDarts();
    Pickup.removeAll()
    curFloor=floor;
    //First checks if the floor exists, then will load everything properly
    if(isFloor(floor)){
        _portalId=0;
        board=getFloor(floor);
        player.resetPosition()
        player.hidden=false;
        trapInit()
    }else
        return true;
}

/**@returns the function of the floor to load, unless it doesn't exist, where it returns false */
function getFloor(n){
    //This is the loading of the first floor with debug options
    if(debug.changeFirstFloor){
        debug.changeFirstFloor=false;
        curFloor=debug.firstFloor
        return getFloor(debug.firstFloor)
    }
    if(floorFunc[n])
        return floorFunc[n]()
    else return false
}
/**Put all functions for the floors in here with their index */
var floorFunc={
    0:f0,1:f1,2:f2,
    3:f3,4:f4,5:f5,
    6:f6,7:f7,8:f8,
    9:f9,10:f10,11:f11,
    12:f12,13:f13,14:f14,
    //15:f15
}
floorFunc[testFloorNum]=floorTest

/**Used to determine if a floor exists */
function isFloor(n){
    return Boolean(floorFunc[n])
}

/**Loads the next floor */
function nextFloor(){
    //loadFloor returns false if there is no floor to load of curFloor
    if(loadFloor(++curFloor)){
        player.hidden=true;
        player.setPosition(0,0)
        board=setFloorAs(T.Path);
        game.onEnd=true;
        setHelpInfo("Press Enter to begin anew");
    }
}

/**
 * @returns {object[][]} A new array of the value type
 * @param {string} type The value of all items in the new array
 * @param {number} width The width to make the array
 * @param {number} height The height to make the array
 */
function setFloorAs(type,width=9,height=9){
    let temp=[];
    for(let i=0;i<height;i++){
        temp[i]=[];
        for(let j=0;j<width;j++)
            tile(temp,j,i,type)
    }
    return temp;
}

/**
 * @param {object[][]} arr The array to add the border to
 * @param {object} type The type to set the border of the array to
 */
function border(arr,type){
    for(let i=0;i<arr.length;i++)
        for(let j=0;j<arr[0].length;j++)
            if(j===0||j===arr[0].length-1||i===0||i===arr.length-1)
                arr[i][j]=type
}

/**Takes the array and adds a border around the whole thing, extending it 
 * @param {object[][]} arr*/
function addBorder(arr,type){
    for(let i=0;i<arr.length;i++){
        arr[i].unshift(type)
        arr[i].push(type)
    }
    var col=[]
    //Plus two to factor in it moving the size up
    for(let i=0;i<arr.length+2;i++)
        col[i]=type
    arr.unshift(col)
    arr.push(col)
}

/**
 * Sets the text of the help info to str. If -1 is passed in, will hide the element 
 * @param {string|false} str The string to make the help info, or hides it if false or nothing is passed in
 */
function setHelpInfo(str){
    var ele=document.getElementById('help')
    if(!str)
        ele.hidden=true;
    else{
        ele.textContent=str
        ele.hidden=false;
    }
}

/**
 * Changes the x and y's of arr to be the type
 * @param {object[][]} arr The array to edit
 * @param {number|number[]} x The value(s) of x that you want the tiles to be
 * @param {number|number[]} y The value(s) of y that you want the tiles to be
 * @param {object} type The type from the var T. Defaults to T.Path
 * @example tile(temp,0,[1,2,3],T.Wall) //sets (0,1) (0,2) (0,3) to T.Wall
 * @example tile(temp,[1,2],[3,4],T.Lava) // sets (1,3) && (2,4) to T.Lava
 */
function tile(arr=[[]],x=[],y=[],type=T.Path){
    if(Array.isArray(x)){
  	    if(Array.isArray(y))
            for(let i=0;i<x.length;i++)
                //Goes through using each x and y as a pair, meaning they are all points
      	        arr[y[i]][x[i]]=type;
        else
            for(let i=0;i<x.length;i++)
                //Means that y is constant so all x's are at that y 
      	        arr[y][x[i]]=type;
    }else if(Array.isArray(y))
        for(let i=0;i<y.length;i++)
            //Means the x is constant and so all y's go at that x
    	    arr[y[i]][x]=type;
    else
        //Two constants passed in so it's just one point
  	    arr[y][x]=type;
}

/**
 * Short for Start and End. Sets the start and end points of an array in a single function
 * @param {object[][]} arr The array to edit
 * @param {number[]} start X and Y of Start
 * @param {number[]} end X and Y of End  
 */
function SaE(arr,start,end){
    arr[start[1]][start[0]]=T.Start;
    arr[end[1]][end[0]]=T.End;
}
/**Always increment after pairing multiple portals */
var _portalId=0
function _nextPortalId(){
    return ++_portalId
}

/**
 * This is used instead of T.Portal to make a new portal.
 * Just use the function for adding two portals at once, i.e. portals
 * @param {'A'|'B'|'C'} type The type of the portal
 */
function Portal(type,id){
    return{name:'portal',type:type,id:id,color:'rgb(165,165,165)',hasImage:'portal'+type+'.png'}
}

/**
 * Adds two way portals at p1 and p2 with the id passed in
 * @param {object[][]} arr The array to add to
 * @param {number[]} p1 [x,y] of the first portal, i.e Portal A 
 * @param {number[]} p2 [x,y] of the second portal, i.e Portal B
 * @param {number} id The id of the portals to link them together 
 */
function portals(arr,p1,p2,id=(_nextPortalId())){
    arr[p1[1]][p1[0]]=Portal('A',id);
    arr[p2[1]][p2[0]]=Portal('B',id);
}

/**This is used for making a new trap instead of T.Trap */
function Trap(dirs=Dir.Up,delay){
    return{name:'trap',dir: dirs,delay:delay,color:'peru'
}}

/**Makes a portal that doesn't have a way back on the other side. x and y are the destination */
function OneWayPortal(x,y){
    return{name:'portal',type:'C',id:-1,x:x,y:y,color:'rgb(165,165,165)',hasImage:'portalA.png'}
}

////////////////////////////////////////////////////
//These are the floors
//tiles are temp[y][x] (x,y) from top left starting at 0
function f0(){
    let temp=setFloorAs(T.Wall);
    tile(temp,[1,2,3],6);
    tile(temp,3,[4,5])
    tile(temp,[3,4,5],4);
    tile(temp,5,[2,3,4]);
    tile(temp,[5,6,7],2);
    tile(temp,1,5,T.Wall);
    tile(temp,[2,4,4,6],[5,5,3,3],T.Lava);
    tile(temp,[0,2,4],[6,4,2],Trap(Dir.Right,55));
    SaE(temp,[1,7],[7,1]);
    setHelpInfo('Use arrow keys or wasd to move. Avoid the lava tiles and the darts. The goal is to get to the gold tile.');
    return temp;
}
function f1(){ 
    let temp=setFloorAs(T.Wall);
    for(let i=1;i<8;i++)
        tile(temp,[1,3,5,7],i)
    tile(temp,[2,3,4,5,6],7);
    tile(temp,4,2);
    tile(temp,[3,5],1,T.Wall)
    tile(temp,[4,2,6,4,4],[7,6,6,1,6],T.Lava);
    tile(temp,[8],[6],Trap(Dir.Left,40));
    tile(temp,0,6,Trap(Dir.Right,40));
    tile(temp,4,0,Trap(Dir.Down,40));
    SaE(temp,[1,1],[7,1])
    setHelpInfo('Darts can fly over lava, which can lead to increased difficulty sometimes')
    return temp;
}
function f2(){
    let temp=setFloorAs(T.Wall);
    tile(temp,[2,3,5,6],1);
    tile(temp,[3,4,5],2);
    tile(temp,4,[3,4,5,6,7]);
    tile(temp,6,1,T.Lock)
    tile(temp,[3,4,5],[3,1,3],T.Lava);
    tile(temp,3,[4,6],Trap(Dir.Right,25))
    tile(temp,5,[4,6],Trap(Dir.Left,25))
    tile(temp,[2,6],0,Trap(Dir.Down,25))
    tile(temp,[2,6],2,Trap(Dir.Up,25))
    addKeys([4,7]);
    SaE(temp,[1,1],[7,1]);
    setHelpInfo("Grab the key to open the locked tile")
    return temp;
}
function f3(){
    let temp=setFloorAs(T.Wall);
    tile(temp,4,[1,2,3,4,5,6,7]);
    tile(temp,[1,2,3,5,6,7],4);
    tile(temp,[5,6,7],4,T.Lock);
    addKeys([4,1],[4,7],[1,4]);
    tile(temp,[5,5],[2,6],T.Lava);
    tile(temp,[6,6],[2,6],Trap(Dir.Left,45))
    tile(temp,2,3,Trap(Dir.Down,45))
    tile(temp,2,5,Trap(Dir.Up,45));
    SaE(temp,[4,4],[8,4])
    setHelpInfo()
    return temp;
}
function f4(){
    let temp=setFloorAs(T.Path)
    border(temp,T.Lava);
    tile(temp,2,[1,2,3,4,5,6,7],T.Lava)
    tile(temp,4,[1,2,3,4,5,6,7],T.Lava)
    tile(temp,6,[1,2,3,4,5,6,7],T.Lava)
    //I use the chance function to add some variation in the level design
    if(chance(1,2)){
        tile(temp,[2,4,6],1,T.Lock)
        addKeys([1,7],[3,7],[5,7])
        SaE(temp,[1,1],[7,7])
    }else{
        tile(temp,[2,4,6],7,T.Lock)
        addKeys([1,1],[3,1],[5,1])
        SaE(temp,[1,7],[7,1])
    }
    if(chance(1,2))
        tile(temp,8,[2,4,6],Trap(Dir.Left,40))
    else
        tile(temp,0,[2,4,6],Trap(Dir.Right,40))
    setHelpInfo()
    return temp;
}
function f5(){
    var temp=setFloorAs(T.Wall);
    tile(temp,1,[1,2,3,4,5,6]);
    tile(temp,[2,3,4],6);
    tile(temp,4,[2,3,4,5,6])
    tile(temp,[5,6,7],2)
    tile(temp,7,[3,4,5,6])
    tile(temp,[4,7,1],[1,7,7],T.Lava)
    tile(temp,[2,5,3,8,2],[4,5,3,4,2])
    tile(temp,[1,7],[8,8],Trap(Dir.Up,57));
    tile(temp,4,0,Trap(Dir.Down,57))
    SaE(temp,[0,1],[8,6]);
    setHelpInfo();
    return temp;
}
function f6(){
    var temp=setFloorAs(T.Wall,12,7);
    tile(temp,0,[2,3,4])
    for(let i=0;i<temp[0].length;i++){
        tile(temp,i,0,T.Hidden)
        tile(temp,i,4)
    }
    tile(temp,11,[1,2,3],T.Hidden);
    tile(temp,[1,3,5,7,9],3,Trap(Dir.Down,80))
    tile(temp,[2,4,6,8,10],5,Trap(Dir.Up,40));
    SaE(temp,[0,1],[11,4]);
    setHelpInfo("The darts are pretty small. Maybe you can use that to your advantage")
    return temp;
}
function f7(){
    let temp=setFloorAs(T.Lock)
    border(temp,T.Wall);
    //The chance here determines if the player will start with all needed
    //Keys or need to collect as they go, in favor of the former
    if(chance(1,9))
        player.keys=47;
    else
        for(let i=1;i<8;i++)for(let j=1;j<8;j++)addKeys([i,j])

    tile(temp,0,[2,3,4,5,6],Trap(Dir.Right,35));
    tile(temp,8,[2,3,4,5,6],Trap(Dir.Left,35));
    tile(temp,[2,3,4,5,6],0,Trap(Dir.Down,35));
    tile(temp,[2,3,4,5,6],8,Trap(Dir.Up,35));
    SaE(temp,[7,7],[1,1])
    setHelpInfo("You can also hit r to restart the current floor")
    return temp;
}
function f8(){
    let temp=setFloorAs(T.Wall)
    tile(temp,[1,4,4],[3,6,2],T.Rock)
    tile(temp,5,6,T.NoPushRock)
    tile(temp,1,[2,4,5,6,7])
    tile(temp,[2,3,4,5],7)
    tile(temp,3,[1,2,3,4,5,6])
    tile(temp,3,0,Trap(Dir.Down,55))
    tile(temp,[5,6,7],2)
    tile(temp,[1,7],[6,2],T.Lava)
    tile(temp,7,[3,4,5,6])
    SaE(temp,[1,1],[7,7])
    setHelpInfo('Walk into the rock to push it to the next tile. It can fill in lava pits so you can '+
    "walk over them. You can't push the rock on the slightly darker tile, but you can walk there")
    return temp;
}
function f9(){
    let temp=setFloorAs(T.Path)
    border(temp,T.Wall)
    portals(temp,[5,1],[1,7]/*,1*/);
    portals(temp,[3,1],[5,7]/*,2*/)
    portals(temp,[7,1],[3,7]/*,3*/)
    
    for(let i=2;i<7;i+=2)
        tile(temp,i,[1,2,3,4,5,6,7],T.Wall)
    tile(temp,0,4,Trap(Dir.Right,35))
    tile(temp,8,4,Trap(Dir.Left,35))
    tile(temp,[2,4,6],4,T.Lava)
    SaE(temp,[7,7],[1,1])
    setHelpInfo('I wonder what those new tiles are?')
    return temp;
}
function f10(){
    var temp=setFloorAs(T.Path,15,3);
    var p=0;
    for(let i=1;i<temp[0].length;i+=2)
        tile(temp,i+1,(p++%2),T.Lava)
    for(let i=0;i<temp[0].length;i++){
        if(i%4===2)
            tile(temp,i+1,2,Trap(Dir.Up,55))
        else
            tile(temp,i+1,2,T.Wall)
    }
    tile(temp,0,[2,1,0],T.Wall)
    SaE(temp,[1,0],[temp[0].length-1,1])
    setHelpInfo()
    return temp;
}
function f11(){
    var temp=setFloorAs(T.Path,7,10)
    border(temp,T.NoPushRock)
    tile(temp,6,[8,7,6],T.Lava)
    tile(temp,5,[9,8,7],T.Wall)
    tile(temp,4,[8,7],T.NoPushRock)
    tile(temp,5,0,Trap(Dir.Down,55))
    tile(temp,3,9,Trap(Dir.Up,55))
    tile(temp,0,5,Trap(Dir.Right,55))
    tile(temp,[3,5,1],[8,1,5],T.Rock)
    SaE(temp,[0,0],[6,9])
    setHelpInfo("I think this level rocks")
    return temp;
}
function f12(){
    var temp=setFloorAs(T.Wall,11,11)
    //General structure
    tile(temp,[0,3,0,8,9,3,6,10],[3,3,10,10,2,0,4,8])
    tile(temp,[4,3,0,1,2,6,6,10],[3,4,4,7,7,5,6,9])
    tile(temp,[4,5,6],0)
    tile(temp,9,[0,3,4,5])
    tile(temp,[8,7,6],9)
    tile(temp,0,[9,8,7])
    SaE(temp,[0,0],[10,10])
    portals(temp,[1,0],[10,0],1)//Dead End
    tile(temp,[1,3,4,5,2,3,5,7,10],[4,5,1,9,6,7,5,6,4],Portal('A',1))
    tile(temp,[8],[0],T.Lava)
    setHelpInfo("Good Luck")
    ///////////////////////////////////////////
    //Randomization of possible spawns
    var mustStart=[1,0],
        mustEnd=[10,8],
        startLoc=[[5,0],[3,5],[1,6],[10,6],[8,2],[7,6],[5,8]],
        endLoc=[[0,3],[3,3],[3,0],[8,10],[0,10],[6,4],[9,2]];

    shuffleSimilar(startLoc,endLoc)

    startLoc.unshift(mustStart)
    endLoc.push(mustEnd)

    //Pair them together
    var i=0;
    startLoc.forEach(loc=>{
        var el=endLoc[i++]
        temp[loc[0]][loc[1]]=OneWayPortal(el[0],el[1])
    })
    return temp
}

function f13(){
    var temp=setFloorAs(T.Wall,5,10)
    SaE(temp,[0,0],[4,0])
    tile(temp,2,8)
    tile(temp,0,[1,2])
    tile(temp,4,[1,2])
    tile(temp,1,[2,3,4,5,6,7,8])
    tile(temp,3,[2,3,4,5,6,7,8])

    tile(temp,1,9,Trap(Dir.UP,35))
    tile(temp,3,1,Trap(Dir.Down,35))

    pShield(0,2)
    setHelpInfo("Take your shield in hand and use it with space to block those pesky darts")
    return temp
}

function f14(){
    let temp=setFloorAs(T.Wall,11,11);
    tile(temp,[1,2,3,4,7,8],5);
    tile(temp,5,[1,2,3,4,6,7,8,9])
    tile(temp,[1,2,3,6,7,8,9],1)
    tile(temp,[1,2,3,4,6,7,8,9],9)
    tile(temp,[6,4,4,5,4],[5,1,5,6,9],T.Bars);
    for(let i=2;i<temp.length;i+=4)
        tile(temp,[2,3,4,6,7,8],i,Trap(Dir.Up,28-i))

    new Switch(9,1,{onActivate:()=>{
        b(5,6,T.Path)
        new Switch(9,9,{onActivate:()=>{
            b(4,1,T.Path)
            new Switch(1,1,{onActivate:()=>{
                b(4,5,T.Path)
                new Switch(1,5,{onActivate:()=>{
                    b(4,9,T.Path)
                    sToggleTile(1,9,6,5)
                }})
            }})
        }})
    }})
    SaE(temp,[5,5],[9,5])
    setHelpInfo('The blue circle is a switch that you can activate. Who knows what it could do')
    return temp;
}

function f15(){
    var temp=setFloorAs(T.Path)
    border(temp,T.Bars)
    SaE(temp,[2,2],[6,6])
    tile(temp,3,1,Trap(Dir.Down,15))
    return temp
}

function floor(){
    var temp = setFloorAs(T.Lava,13,13)
    //temp[12][12]=T.End
    SaE(temp,[0,0],[12,12])
    return temp
}
/**Debug testing map */
function floorTest(){
    var temp=setFloorAs(T.Path,11,11);
    SaE(temp,[0,0],[temp[0].length-1,temp.length-1])
    tile(temp,1,0,T.Hidden)
    tile(temp,2,0,T.Lava)
    tile(temp,3,0,T.Lock)
    tile(temp,[3,4,5],3,T.NoPushRock)
    tile(temp,[4,5],4,T.Rock)
    tile(temp,5,0,T.Wall)
    tile(temp,6,0,Trap(Dir.Down,100))
    portals(temp,[1,0],[temp[0].length-1,temp.length-2],1)
    portals(temp,[1,1],[1,2],3)
    addKeys([0,8])    
    setHelpInfo('This is just a floor for testing each tile and such')
    return temp;
}

/*
function twelveOld(){
    var temp=setFloorAs(T.Lava,11,11)
    SaE(temp,[0,0],[10,10])
    portals(temp,[0,1],[0,3],2)//leads to 3||4
    portals(temp,[1,0],[10,0],1)//Dead End
    portals(temp,[0,5],[3,3],3)
    tile(temp,[4,3,0,1,2,6,6,10],[3,4,4,7,7,5,6,9])
    tile(temp,9,[3,4,5])
    portals(temp,[5,3],[3,0],4)
    //These lead to the death portal on the other side
    tile(temp,[1,3,4,5,2,3,5,7,10],[4,5,1,9,6,7,5,6,4],Portal('A',1))
    tile(temp,[4,5,6],0)
    portals(temp,[6,1],[8,10],5)
    tile(temp,[8,7,6],9)
    portals(temp,[6,10],[0,10],6)
    tile(temp,0,[9,8,7])
    portals(temp,[2,8],[6,4],7)
    portals(temp,[6,7],[9,2],8)
    portals(temp,[8,5],[10,8],9)
    setHelpInfo("Good Luck")
    return temp
}*/