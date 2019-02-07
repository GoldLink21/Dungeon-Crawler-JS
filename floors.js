/*
This is all the floors in game and some of the functions related to making floors
*/

//#region helper-functions
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
    enemies=[]
    var isSameFloor=false
    if(curFloor!==floor){
        curFloor=floor;
    }else{
        isSameFloor=true
    }
    //First checks if the floor exists, then will load everything properly
    if(isFloor(floor)){
        _portalId=0;
        board=getFloor(floor);
        //If you're on the same floor and you've left a spawnPoint, go right there instead. This is
        //mostly for medium difficulty
        if((isSameFloor||floor===spawnPoint.floor)&&spawnPoint){
            player.setPosition(spawnPoint.x,spawnPoint.y)
        }else{
            player.resetPosition()
        }
        player.hidden=false;
        trapInit()
        if(!game.doCountTimer)
            game.doCountTimer=true
        if(floor===0){
            Clock.milliseconds=0
            Clock.resume()
            spawnPoint=false
            goldSpawnFloor=false
        }
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
        board=setFloorAs(Tn.Path);
        game.onEnd=true;
        setHelpInfo("Press Enter to begin anew");
        game.doCountTimer=false
        if(Clock.milliseconds<Clock.unParse(game.lowTime)){
            game.lowTime=Clock.toString()
            localStorage['lowTime']=game.lowTime
        }
        Clock.pause()

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
                tile(arr,j,i,type)
}

/**Takes the array and adds a border around the whole thing, extending it 
 * @param {object[][]} arr*/
function addBorder(arr,type){
    var nArr=new Array(arr[0].length+2).fill(type)
    board.forEach(row=>{
        row.push(type)
        row.unshift(type)
    })
    arr.unshift(nArr)
    arr.push(nArr)
}

/**
 * Sets the text of the help info to str. If -1 is passed in, will hide the element 
 * @param {string|false} str The string to make the help info, or hides it if false or nothing is passed in
 */
function setHelpInfo(str){
    var ele=HTML.help
    if(!str)
        ele.hidden=true;
    else{
        ele.textContent=str
        ele.hidden=false;
    }
}

/**Takes either a function or a premade tile */
function tCopy(type){
    if(typeof type==='function')
        return Object.create(type())
    else 
        return Object.create(type)
}

/**
 * Changes the x and y's of arr to be the type
 * @param {object[][]} arr The array to edit
 * @param {number|number[]} x The value(s) of x that you want the tiles to be
 * @param {number|number[]} y The value(s) of y that you want the tiles to be
 * @param {object} type The type from the var Tn. Defaults to Tn.Path
 * @example tile(temp,0,[1,2,3],Tn.Wall) //sets (0,1) (0,2) (0,3) to Tn.Wall
 * @example tile(temp,[1,2],[3,4],Tn.Lava) // sets (1,3) && (2,4) to Tn.Lava
 */
function tile(arr=[[]],x=[],y=[],type=Tn.Path()){
    if(Array.isArray(x)){
  	    if(Array.isArray(y))
            for(let i=0;i<x.length;i++)
                //Goes through using each x and y as a pair, meaning they are all points
      	        arr[y[i]][x[i]]=tCopy(type);
        else
            for(let i=0;i<x.length;i++)
                //Means that y is constant so all x's are at that y 
      	        arr[y][x[i]]=tCopy(type);
    }else if(Array.isArray(y))
        for(let i=0;i<y.length;i++)
            //Means the x is constant and so all y's go at that x
    	    arr[y[i]][x]=tCopy(type);
    else
        //Two constants passed in so it's just one point
  	    arr[y][x]=tCopy(type);
}

/**
 * Short for Start and End. Sets the start and end points of an array in a single function
 * @param {object[][]} arr The array to edit
 * @param {number[]} start X and Y of Start
 * @param {number[]} end X and Y of End  
 */
function SaE(arr,start,end){
    tile(arr,start[0],start[1],Tn.Start())
    tile(arr,end[0],end[1],Tn.End())
}

/**Shortened for using two funcions that are needed for every floor. Short for floorSetup */
function fSetup(arr,start,end,helpInfo){
    SaE(arr,start,end)
    setHelpInfo(helpInfo)
}

/**Always increment after pairing multiple portals */
var _portalId=0
function _nextPortalId(){
    return ++_portalId
}

/**
 * Adds two way portals at p1 and p2 with the id passed in
 * @param {object[][]} arr The array to add to
 * @param {number[]} p1 [x,y] of the first portal, i.e Portal A 
 * @param {number[]} p2 [x,y] of the second portal, i.e Portal B
 * @param {number} id The id of the portals to link them together 
 */
function portals(arr,p1,p2,id=_nextPortalId()){
    arr[p1[1]][p1[0]]=Tn.Portal('A',id);
    arr[p2[1]][p2[0]]=Tn.Portal('B',id);
}

/**Short for array range. Makes an array with numbers from start-end */
function aR(start,end){
    var index=0,arr=[];
    for(let i=start;(start<end)?(i<end+1):(i>end-1);(start<end)?(i++):(i--))
        arr[index++]=i
    return arr;
}
//#endregion

//#region floors
/**Put all functions for the floors in here with their index */
var floorFunc={
    //#region f0-9
    0:function(){
        let temp=setFloorAs(Tn.Wall);
        tile(temp,[1,2,3],6);
        tile(temp,3,[4,5])
        tile(temp,[3,4,5],4);
        tile(temp,5,[2,3,4]);
        tile(temp,[5,6,7],2);
        tile(temp,1,5,Tn.Wall);
        tile(temp,[2,4,4,6],[5,5,3,3],Tn.Lava);
        tile(temp,[0,2,4],[6,4,2],Tn.Trap(Dir.Right,55));
        SaE(temp,[1,7],[7,1]);
        setHelpInfo('Use arrow keys or wasd to move. Avoid the lava tiles and the darts. The goal is to get to the gold tile.');
        return temp;
    },
    1:function(){
        let temp=setFloorAs(Tn.Wall);
        for(let i=1;i<8;i++)
            tile(temp,[1,3,5,7],i)
        tile(temp,aR(2,6),7);
        tile(temp,4,2);
        tile(temp,[3,5],1,Tn.Wall)
        tile(temp,[4,2,6,4,4],[7,6,6,1,6],Tn.Lava);
        tile(temp,[8],[6],Tn.Trap(Dir.Left,40));
        tile(temp,0,6,Tn.Trap(Dir.Right,40));
        tile(temp,4,0,Tn.Trap(Dir.Down,40));
        SaE(temp,[1,1],[7,1])
        setHelpInfo('Darts can fly over lava, which can lead to increased difficulty sometimes')
        if(game.loops>=5){
            tile(temp,2,2)
            setHelpInfo('Here, take a bit of a shorter way')
        }
        if(game.loops>=10){
            tile(temp,6,2)
            setHelpInfo('Wanna get there even faster?')
        }
        return temp;
    },
    2:function(){
        let temp=setFloorAs(Tn.Wall);
        tile(temp,[2,3,5,6],1);
        tile(temp,[3,4,5],2);
        tile(temp,4,[3,4,5,6,7]);
        tile(temp,6,1,Tn.Lock)
        tile(temp,[3,4,5],[3,1,3],Tn.Lava);
        tile(temp,3,[4,6],Tn.Trap(Dir.Right,25))
        tile(temp,5,[4,6],Tn.Trap(Dir.Left,25))
        tile(temp,[2,6],0,Tn.Trap(Dir.Down,25))
        tile(temp,[2,6],2,Tn.Trap(Dir.Up,25))

        if(game.loops>=5){
            addKeys([4,2]);
            setHelpInfo("Let's move that key a little closer")
        }else{
            addKeys([4,7]);
            setHelpInfo("Grab the key to open the locked tile")
        }
        
        SaE(temp,[1,1],[7,1]);
        
        return temp;
    },
    3:function(){
        let temp=setFloorAs(Tn.Wall);
        tile(temp,4,[1,2,3,4,5,6,7]);
        tile(temp,[1,2,3,5,6,7],4);
        tile(temp,[5,6,7],4,Tn.Lock);
        
        tile(temp,[5,5],[2,6],Tn.Lava);
        tile(temp,[6,6],[2,6],Tn.Trap(Dir.Left,45))
        tile(temp,2,3,Tn.Trap(Dir.Down,45))
        tile(temp,2,5,Tn.Trap(Dir.Up,45));
        SaE(temp,[4,4],[8,4])
        if(game.loops>=5){
            addKeys([4,3],[3,4],[4,5])
            setHelpInfo("And these one's too")
        }else{
            addKeys([4,1],[4,7],[1,4]);
            setHelpInfo()
        }
        return temp;
    },
    4:function(){
        let temp=setFloorAs(Tn.Path)
        border(temp,Tn.Lava);
        tile(temp,2,aR(1,7),Tn.Lava)
        tile(temp,4,aR(1,7),Tn.Lava)
        tile(temp,6,aR(1,7),Tn.Lava)
        //I use the chance function to add some variation in the level design
        if(chance(1,2)){
            tile(temp,[2,4,6],1,Tn.Lock)
            addKeys([1,7],[3,7],[5,7])
            SaE(temp,[1,1],[7,7])
        }else{
            tile(temp,[2,4,6],7,Tn.Lock)
            addKeys([1,1],[3,1],[5,1])
            SaE(temp,[1,7],[7,1])
        }
        if(chance(1,2))
            tile(temp,8,[2,4,6],Tn.Trap(Dir.Left,40))
        else
            tile(temp,0,[2,4,6],Tn.Trap(Dir.Right,40))
        setHelpInfo()
        return temp;
    },
    5:function(){
        var temp=setFloorAs(Tn.Wall);
        tile(temp,1,aR(1,6));
        tile(temp,[2,3,4],6);
        tile(temp,4,aR(2,6))
        tile(temp,[5,6,7],2)
        tile(temp,7,[3,4,5,6])
        tile(temp,[4,7,1],[1,7,7],Tn.Lava)
        tile(temp,[2,5,3,8,2],[4,5,3,4,2])
        tile(temp,[1,7],[8,8],Tn.Trap(Dir.Up,57));
        tile(temp,4,0,Tn.Trap(Dir.Down,57))
        SaE(temp,[0,1],[8,6]);
        if(game.loops>=5){
            pShield(1,1)
            setHelpInfo('Here, have a shield for this run')
        }else
            setHelpInfo();
        return temp;
    },
    6:function(){
        var temp=setFloorAs(Tn.Wall,12,7);
        tile(temp,0,[2,3,4])
        for(let i=0;i<temp[0].length;i++){
            tile(temp,i,0,Tn.Hidden)
            tile(temp,i,4)
        }
        tile(temp,11,[1,2,3],Tn.Hidden);
        tile(temp,[1,3,5,7,9],3,Tn.Trap(Dir.Down,80))
        tile(temp,[2,4,6,8,10],5,Tn.Trap(Dir.Up,40));
        SaE(temp,[0,1],[11,4]);
        if(game.loops>=5)
            setHelpInfo("Theres actually a secret, easier path in this level that's hidden")
        else
            setHelpInfo("The darts are pretty small. Maybe you can use that to your advantage")
        return temp;
    },
    7:function(){
        let temp=setFloorAs(Tn.Lock)
        border(temp,Tn.Wall);
        //The chance here determines if the player will start with all needed
        //Keys or need to collect as they go, in favor of the former
        //If you've done 5 or more loops, you get the keys every time
        if(chance(1,15)||game.loops>=5)
            player.keys=47;
        else
            for(let i=1;i<8;i++)for(let j=1;j<8;j++)addKeys([i,j])
    
        tile(temp,0,aR(2,6),Tn.Trap(Dir.Right,35));
        tile(temp,8,aR(2,6),Tn.Trap(Dir.Left,35));
        tile(temp,aR(2,6),0,Tn.Trap(Dir.Down,35));
        tile(temp,aR(2,6),8,Tn.Trap(Dir.Up,35));
        SaE(temp,[7,7],[1,1])
        setHelpInfo("You can also hit r to restart the current floor")
        if(game.loops>=5)
            setHelpInfo('As a thanks for playing so much, have the random keys every time!')
        return temp;
    },
    8:function(){
        let temp=setFloorAs(Tn.Wall)
        tile(temp,[1,4,4],[3,6,2],Tn.Rock)
        tile(temp,5,6,Tn.NoRock)
        tile(temp,1,[2,4,5,6,7])
        tile(temp,[2,3,4,5],7)
        tile(temp,3,aR(1,6))
        tile(temp,3,0,Tn.Trap(Dir.Down,55))
        tile(temp,[5,6,7],2)
        tile(temp,[1,7],[6,2],Tn.Lava)
        tile(temp,7,[3,4,5,6])
        SaE(temp,[1,1],[7,7])
        if(game.loops>=5){
            setHelpInfo("Here, have a shortcut")
            tile(temp,2,2,Tn.Path)
        }else{
            setHelpInfo('Walk into the rock to push it to the next tile. It can fill in lava pits so you can '+
            "walk over them. You can't push the rock on the slightly darker tile, but you can walk there")
        }
        return temp;
    },
    9:function(){
        let temp=setFloorAs(Tn.Path)
        border(temp,Tn.Wall)
    
        portals(temp,[5,1],[1,7]);
        portals(temp,[3,1],[5,7])
        portals(temp,[7,1],[3,7])
    
        for(let i=2;i<7;i+=2)
            tile(temp,i,aR(1,7),Tn.Wall)
        tile(temp,0,4,Tn.Trap(Dir.Right,35))
        tile(temp,8,4,Tn.Trap(Dir.Left,35))
        tile(temp,[2,4,6],4,Tn.Lava)
        SaE(temp,[7,7],[1,1])
        if(game.loops>=5){
            temp[7][1].id=3
            setHelpInfo("Here, let's get you past these slow portals")
        }else
            setHelpInfo('I wonder what those new tiles are?')
        return temp;
    },
    //#endregion
    //#region  f10-19
    10:function(){
        var temp=setFloorAs(Tn.Path,15,3);
    
        //Makes the map smaller if you finish the game more times
        if(game.loops>=5){
            var sub=game.loops-4
            if(sub>10)
                sub=10
            temp=setFloorAs(Tn.Path,15-sub,3)
        }
    
        var p=0;
        for(let i=1;i<temp[0].length;i+=2)
            tile(temp,i+1,(p++%2),Tn.Lava)
        for(let i=0;i<temp[0].length;i++){
            if(i%4===2)
                tile(temp,i+1,2,Tn.Trap(Dir.Up,55))
            else
                tile(temp,i+1,2,Tn.Wall)
        }
        tile(temp,0,[2,1,0],Tn.Wall)
        SaE(temp,[1,0],[temp[0].length-1,1])
        if(game.loops>=5)
            setHelpInfo("This level actually gets smaller the more you finish the game")
        else
            setHelpInfo()
        return temp;
    },
    11:function(){
        var temp=setFloorAs(Tn.Path,7,10)
        border(temp,Tn.NoRock)
        tile(temp,6,[8,7,6],Tn.Lava)
        tile(temp,5,[9,8,7],Tn.Wall)
        tile(temp,4,[8,7],Tn.NoRock)
        tile(temp,5,0,Tn.Trap(Dir.Down,55))
        tile(temp,3,9,Tn.Trap(Dir.Up,55))
        tile(temp,0,5,Tn.Trap(Dir.Right,55))
        tile(temp,[3,5,1],[8,1,5],Tn.Rock)
        SaE(temp,[0,0],[6,9])
        setHelpInfo("I think this level rocks")
        return temp;
    },
    12:function(){
        var temp=setFloorAs(Tn.Wall,11,11)
        //General structure
        tile(temp,[0,3,0,8,9,3,6,10],[3,3,10,10,2,0,4,8])
        tile(temp,[4,3,0,1,2,6,6,10],[3,4,4,7,7,5,6,9])
        tile(temp,[4,5,6],0)
        tile(temp,9,[0,3,4,5])
        tile(temp,[8,7,6],9)
        tile(temp,0,[9,8,7])
        SaE(temp,[0,0],[10,10])
        portals(temp,[1,0],[10,0],1)//Dead End
        tile(temp,[1,3,4,5,2,3,5,7,10],[4,5,1,9,6,7,5,6,4],Tn.Portal('A',1))
        tile(temp,[8],[0],Tn.Lava)
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
            temp[loc[0]][loc[1]]=Tn.OneWayPortal(el[0],el[1])
        })
        return temp
    },
    13:function(){
        var temp=setFloorAs(Tn.Wall,5,10)
        SaE(temp,[0,0],[4,0])
        tile(temp,2,8)
        tile(temp,0,[1,2])
        tile(temp,4,[1,2])
        tile(temp,1,aR(2,8))
        tile(temp,3,aR(2,8))
    
        tile(temp,1,9,Tn.Trap(Dir.UP,35))
        tile(temp,3,1,Tn.Trap(Dir.Down,35))
    
        pShield(0,2)
        if(game.loops>=5){
            tile(temp,2,2)
            setHelpInfo("Patience may be a virtue, but you gotta make record time!")
        }else 
            setHelpInfo("Take your shield in hand and use it with space to block those pesky darts")
        return temp
    },
    14:function(){
        let temp=setFloorAs(Tn.Wall,11,11);
        tile(temp,[1,2,3,4,7,8],5);
        tile(temp,5,[1,2,3,4,6,7,8,9])
        tile(temp,[1,2,3,6,7,8,9],1)
        tile(temp,[1,2,3,4,6,7,8,9],9)
        tile(temp,[6,4,4,5,4],[5,1,5,6,9],Tn.Bars);
        for(let i=2;i<temp.length;i+=4)
            tile(temp,[2,3,4,6,7,8],i,Tn.Trap(Dir.Up,28-i))
        if(game.loops>=25){
            //Fastest
            tile(temp,6,5)
        }else{
            //Normal
            new Switch(9,1,{onActivate:()=>{
                if(game.loops>=20){
                    //Faster
                    b(6,5,Tn.Path())
                }else{
                    //Normal
                    b(5,6,Tn.Path())
                    new Switch(9,9,{onActivate:()=>{
                        if(game.loops>=15){
                            //Shorter
                            b(6,5,Tn.Path())
                        }else{
                            //Normal route
                            b(4,1,Tn.Path())
                            new Switch(1,1,{onActivate:()=>{
                                if(game.loops>=10){
                                    //Slightly Shorter
                                    b(6,5,Tn.Path())
                                }else{
                                    //Standard Route
                                    b(4,5,Tn.Path())
                                    new Switch(1,5,{onActivate:()=>{
                                        if(game.loops>=5){
                                            //Faster
                                            b(6,5,Tn.Path())
                                        }else{
                                            //Longest
                                            b(4,9,Tn.Path())
                                            sToggleTile(1,9,6,5)
                                        }
                                    }})
                                }
                            }})
                        }
                    }})
                }
            }})
        }
        SaE(temp,[5,5],[9,5])
        setHelpInfo('The blue circle is a switch that you can activate. Who knows what it could do')
        return temp;
    },
    //15:f15
    15:()=>{
        var temp=setFloorAs(Tn.Path,13,13)
        
        border(temp,Tn.Wall)
        for(let i=1;i<12;i++){
            tile(temp,[i,12-i],[i,i],Tn.Lava)
        }
        //Setup barriers to the top
        tile(temp,aR(4,8),3,Tn.Bars)
        tile(temp,[5,6,7],4,Tn.Bars)
        tile(temp,6,5,Tn.Bars)

        //Left
        tile(temp,1,[5,7],Tn.Wall)
        var coords=[[1,2],[1,10],[1,6]]
        var funcGood=(x,y)=>{new Switch(x,y,{onActivate:()=>{b(6,3,Tn.Path())}})},
            funcBad1=(x,y)=>{sTrapTile(x,y,5,4,Dir.Right,40);sTrapTile(x,y,7,4,Dir.Left,40)},
            funcBad2=(x,y)=>{sTrapTile(x,y,4,3,Dir.Right,40);sTrapTile(x,y,8,3,Dir.Left,40);new Switch(x,y,{onActivate:()=>{b(5,3,Tn.Path()),b(7,3,Tn.Path())}})}

        function left(n){
            funcGood(coords[n][0],coords[n][1])
            if(++n===3)n=0
            funcBad1(coords[n][0],coords[n][1])  
            if(++n===3)n=0
            funcBad2(coords[n][0],coords[n][1])
        }

        var rnd=Math.random()
        if(rnd<0.333)
            left(0)
        else if(rnd<0.666)
            left(1)
        else
            left(2)
        
        //Down
        var c=0
        for(let i=7;i<=10;i++){
            sDart(6,i,4-c,i,Dir.Right,5+c)
            sDart(6,i,8+c,i,Dir.Left,5+c)
            if(i!==7)
                c++
        }
        var gx,bx
        if(chance(2)){
            gx=(bx=5)+2
        }else
            gx=(bx=7)-2

        new Switch(gx,11,{onActivate:()=>{
            b(6,4,Tn.Path())
        }})
        sTrapTile(bx,11,3,2,Dir.Right,30)
        sTrapTile(bx,11,9,2,Dir.Left,30)
        //Right
        tile(temp,[9,10],6,Tn.Wall)
        tile(temp,[12,12],[5,7],Tn.Trap(Dir.Left,30))
        tile(temp,[10,11],3,Tn.Wall)
        tile(temp,[10,11],9,Tn.Wall)
        new Switch(11,6,{onActivate:()=>{b(6,5,Tn.Path())}})
        setHelpInfo(false)
        SaE(temp,[6,6],[6,1])
        return temp
    },
    16:()=>{
        var temp=setFloorAs(Tn.NoRock,9,5)
        border(temp,Tn.Wall)
        var paths=[
            new Path(false,v(7,1),v(5,3),v(3,1),v(1,3),v(3,1),v(5,3),v(7,1)),
            new Path(false,v(1,3),v(3,1),v(5,3),v(7,1),v(5,3),v(3,1),v(1,3)),
            new Path(false,v(1,1),v(3,3),v(5,1),v(7,3),v(5,1),v(3,3),v(1,1)),
            new Path(false,v(7,3),v(5,1),v(3,3),v(1,1),v(3,3),v(5,1),v(7,3))
        ]
        paths.forEach(path=>new Enemy(path,{moveStyle:Path.styles.vertHoriz}))
        tile(temp,4,2,Tn.Lava())
        tile(temp,[6,2],2,Tn.Path())
        SaE(temp,[0,2],[8,2])
        setHelpInfo('These are enemies. Each one Has it\'s own agenda to kill you. Or just get where it wants to go')
        return temp
    },
    //#endregion
}
floorFunc[testFloorNum]=floorTest

/**Debug testing map */
function floorTest(){
    var temp=setFloorAs(Tn.Path(),11,11);
    SaE(temp,[0,0],[temp[0].length-1,temp.length-1])
    tile(temp,1,0,Tn.Hidden())
    tile(temp,2,0,Tn.Lava())
    tile(temp,3,0,Tn.Lock())
    tile(temp,[3,4,5],3,Tn.NoRock())
    tile(temp,[4,5],4,Tn.Rock())
    tile(temp,5,0,Tn.Wall())
    tile(temp,6,0,Tn.Trap(Dir.Down,100))
    tile(temp,7,0,Tn.Bars())
    tile(temp,8,0,Tn.NoRock())
    sArmorMax(1,7,2,7,10)
    sToggleTile(8,3,7,0,{canToggle:true,oldType:temp[0][7]})
    portals(temp,[1,0],[temp[0].length-1,temp.length-2],1)
    portals(temp,[1,1],[1,2],3)
    addKeys([0,8])    
    setHelpInfo('This is just a floor for testing each tile and such')
    return temp;
}

//#endregion