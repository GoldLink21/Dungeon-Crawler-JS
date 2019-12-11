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
    entities=[]
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
            _players.forEach(p=>p.setPosition(spawnPoint.x,spawnPoint.y))
            //player.setPosition(spawnPoint.x,spawnPoint.y)
        }else{
            _players.forEach(p=>p.resetPosition())
            //player.resetPosition()
        }
        _players.forEach(p=>{
            p.hidden=false
            //Remove their active items
            if(p.activeItem){
                if(p.activeItem.active)
                    p.activeItem.onStopUse(p.activeItem)
                p.activeItem=undefined
            }
        })
        //player.hidden=false;
        trapInit()
        if(!game.doCountTimer)
            game.doCountTimer=true
        if(floor===0){
            Clock1.milliseconds=0
            Clock1.resume()
            spawnPoint=false
            goldSpawnFloor=false
        }
        window.onresize()
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
        //player.hidden=true;
        _players.forEach(p=>{
            p.hidden=true
            p.setPosition(0,0)
        })
        //player.setPosition(0,0)
        board=setFloorAs(Tn.Path);
        game.onEnd=true;
        setHelpInfo("Press Enter to begin anew");

        tellL("You made it to the end! Or at least, as far as you can right now.<br>"+
            'For each time you beat the game, you unlock different shortcuts to cut down you fastest time.<br>'+
            "Thank you so much for playing through all of my game, and I hope you enjoyed your way through it<br>"+
            "Press enter to start your next run through the game")
        game.doCountTimer=false
        if(Clock1.milliseconds<Clock.unParse(game.lowTime)){
            game.lowTime=Clock1.toString()
            localStorage[lsKey.lowTime]=game.lowTime
        }
        Clock1.pause()
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

function keyPositionShift(startLoop,xy,startPos,endPos,constant,helpInfoChange,helpInfoMax){
    var d
    if(startPos<endPos){
        d=(game.loops-startLoop+1)+startPos
        if(d<startPos){
            d=startPos
        }else if(d>endPos){
            d=endPos
            if(helpInfoMax)
                setHelpInfo(helpInfoMax)
        }else
            if(helpInfoChange)
                setHelpInfo(helpInfoChange)
    }else{
        d=-(game.loops-startLoop+1)+startPos
        if(d<endPos){
            d=endPos
            if(helpInfoMax)
                setHelpInfo(helpInfoMax)
        }else if(d>startPos)
            d=startPos
        else
            if(helpInfoChange)
                setHelpInfo(helpInfoChange)
    }
    if(xy==='x'){
        pKey(d,constant)
    }else if(xy==='y'){
        pKey(constant,d)
    }
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
    arr.forEach(row=>{
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
function tile(arr=[[]],x=[],y=[],type=Tn.Path){
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

/**@param {string} str */
function disectRGB(str){
    return str.split('(')[1].split(')')[0].split(',')
}

function isBetween(val,min,max){
    return val<=max&&val>=min
}

function getLastFloor(){
    var max=0
    Object.keys(floorFunc).forEach(key=>{
        key=Number(key)
		if(key>max&&key!==testFloorNum&&key!==9002){
            max=key
        }
    })
    return max
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

function tellL(str,btnStr){
    if(Number(game.loops)==0)
        tell(str,btnStr)
}

/**
 * Adds two way portals at p1 and p2 with the id passed in
 * @param {object[][]} arr The array to add to
 * @param {number[]} p1 [x,y] of the first portal, i.e Portal A 
 * @param {number[]} p2 [x,y] of the second portal, i.e Portal B
 * @param {number} id The id of the portals to link them together 
 */
function portals(arr,p1,p2,id=nextId("portal")){
    arr[p1[1]][p1[0]]=Tn.Portal('A',id);
    arr[p2[1]][p2[0]]=Tn.Portal('B',id);
}


//#endregion

//#region floors
/**Put all functions for the floors in here with their index */
var floorFunc={
    //#region f0-9
    0:function(){
        return mapKit().set(Tn.Grass)
            .SaE([1,1],[4,8])
            .tile(0,[0,1,2,3],Tn.Wall)
            .tile([1,2,3,4],0,Tn.Wall)
            .tile(4,[1,2,3],Tn.Wall)
            .tile([1,2],3,Tn.Wall)
            .tile([2,3,1,2,3,3],[1,1,2,2,2,3])
            .run(t=>{
                tellL("You awaken suddenly, ready to venture out into the world. Use WASD or arrow keys to move.")
            })
            .addEnt(()=>pInv(3,4,()=>tellL("Head towards the gold square to progress to the next screen")))
            .array
    },
    1:function(){
        return mapKit().set(Tn.Grass,11,5)
            .tile(0,2,Tn.Start(colors.grass))
            //.tile(9,2,Tn.End().withColor('black'))
            .tile([7,8,9,10,9,8,7],[1,1,1,2,3,3,3],Tn.Wall)
            .tile(8,2,Tn.Lock(Tn.Grass))
            .addEnt(()=>{
                var ent=pInv(7,2,()=>{tellL("It appears to be locked. Maybe find a way to unlock it?")})
                ent.id='locked';
                return ent
            })
            .addEnt(()=>new Switch(9,2,{onActivate:()=>setTimeout(nextFloor,100),inactiveColor:'black',activeColor:'black'}))
            .addEnt(()=>new Switch(10,1,{onActivate:()=>{
                board[2][8]=b(8,2).tileUnder
                if(Pickup.getById('locked')){
                    Pickup.getById('locked').toRemove=true;
                }
                tellL("You hear a loud shifting sound as something moves nearby")
            }}))
            .run(t=>tellL("You see a chasm ahead. You feel tempted to go towards it"))
            .array
    },
    2:function(){
        return mapKit().set(Tn.Wall)
            .tile([1,2,3],6)
            .tile(3,[4,5])
            .tile([3,4,5],4)
            .tile(5,[2,3,4])
            .tile([5,6,7],2)
            .tile(1,5,Tn.Wall)
            .tile([2,4,4,6],[5,5,3,3],Tn.Lava)
            .tile([0,2,4],[6,4,2],Tn.Trap(Dir.Right,55,undefined,45))
            .SaE([1,7],[7,1])
            .run(t=>{
                var lx=0,ly=0
                for(let i=game.loops-19;i>0;i--){
                    if(!t.arr[ly][lx].is(Tn.start,Tn.end))
                        t.arr[ly][lx]=Tn.Path()
                    if(++lx>=t.arr[0].length){
                        lx=0
                        ly++
                    }
                    if(ly>=t.arr.length)
                        break
                }
            })
            .if(Number(game.loops)==0,()=>{
                tellL('You fall into a dungeon below. Maybe you should avoid the lava and the dart traps ahead of you')
            })
            .setHelpInfo()
            .array
    },
    3:function(){
        return mapKit().set(Tn.Wall)
            .run(t=>{
                for(let i=1;i<8;i++)
                    t.tile([1,3,5,7],i)
            })
            .tile(aR(2,6),7)
            .tile(4,2)
            .tile([3,5],1,Tn.Wall)
            .tile([4,2,6,4,4],[7,6,6,1,6],Tn.Lava)
            .tile(8,6,Tn.Trap(Dir.Left,40))
            .tile(0,6,Tn.Trap(Dir.Right,40))
            .tile(4,0,Tn.Trap(Dir.Down,40))
            .SaE([1,1],[7,1])
            .setHelpInfo('Darts can fly over lava, which can lead to increased difficulty sometimes')
            .if(game.loops>=5,t=>t.tile(2,2).setHelpInfo("Here, take a bit of a shorter way"))
            .if(game.loops>=10,t=>t.tile(6,2).setHelpInfo('Wanna get there even faster?'))
            .array
    },
    4:function(){
        return mapKit().set(Tn.Wall)
            .tile([2,3,5,6],1)
            .tile([3,4,5],2)
            .tile(4,aR(3,7))
            .tile(6,1,Tn.Lock)
            .tile([3,4,5],[3,1,3],Tn.Lava)
            .tile(3,[4,6],Tn.Trap(Dir.Right,25))
            .tile(5,[4,6],Tn.Trap(Dir.Left,25))
            .tile([2,6],0,Tn.Trap(Dir.Down,25))
            .tile([2,6],2,Tn.Trap(Dir.Up,25))
            .addEnt(()=>keyPositionShift(5,'y',7,2,4))
            .setHelpInfo("Grab the key to open the locked tile")
            .tellL("You begin to wonder when all of this got here when you see a shiny key around the corner")
            .SaE([1,1],[7,1])
            .array
    },
    5:function(){
        return mapKit().set(Tn.Wall)
            .tile(4,aR(1,7))
            .tile([1,2,3,5,6,7],4)
            .tile([5,6,7],4,Tn.Lock)
            .tile(5,[2,6],Tn.Lava)
            .tile(6,[2,6],Tn.Trap(Dir.Left,45))
            .tile(2,3,Tn.Trap(Dir.Down,45))
            .tile(2,5,Tn.Trap(Dir.Up,45))
            .SaE([4,4],[8,4])
            .addEnt(()=>keyPositionShift(5,'y',1,3,4),()=>keyPositionShift(5,'y',7,5,4),()=>keyPositionShift(5,'x',1,3,4))
            .setHelpInfo()
            .array
    },
    6:function(){
        return mapKit().set(Tn.Path)
            .border(Tn.Lava)
            .tellL("You begin to realize just how dangerous this journey is getting")
            .run(t=>{
                for(let i=2;i<=6;i+=2)
                    t.tile(i,aR(1,7),Tn.Lava)
            })
            .run(t=>{
                if(chance(1,2)){
                    t.tile([2,4,6],1,Tn.Lock)
                    for(let i=1;i<=5;i+=2)
                        t.addEnt(()=>keyPositionShift(5,'y',7,2,i,'Sliding Up','As close as possible'))
                    t.SaE([1,1],[7,7])
                }else{
                    t.tile([2,4,6],7,Tn.Lock)
                    for(let i=1;i<=5;i+=2)
                        t.addEnt(()=>keyPositionShift(5,'y',1,6,i,'Sliding Down','As close as possible'))
                    t.SaE([1,7],[7,1])
                }
                if(chance(1,2))
                    t.tile(8,[2,4,6],Tn.Trap(Dir.Left,40))
                else
                    t.tile(0,[2,4,6],Tn.Trap(Dir.Right,40))
            }).array
    },
    7:function(){
        return mapKit().set(Tn.Wall)
            .tile(1,aR(1,6))
            .tile([2,3,4],6)
            .tile(4,aR(2,6))
            .tile([5,6,7],2)
            .tile(7,[3,4,5,6])
            .tile([4,7,1],[1,7,7],Tn.Lava)
            .tile([2,5,3,8,2],[4,5,3,4,2])
            .tile([1,7],[8,8],Tn.Trap(Dir.Up,57))
            .tile(4,0,Tn.Trap(Dir.Down,57))
            .SaE([0,1],[8,6])
            .setHelpInfo()
            .if(game.loops>=5,t=>{
                t.addEnt(()=>pShield(1,1))
                    .setHelpInfo('Here, have a shield for this run')
            })
            .array
    },
    8:function(){
        return mapKit().set(Tn.Wall,12,7)
            .tile(0,[2,3,4])
            .run(t=>{
                for(let i=0;i<t.arr[0].length;i++){
                    t.tile(i,0,Tn.Hidden)
                    t.tile(i,4)
                }
            })
            .tile(11,[1,2,3],Tn.Hidden)
            .tile([1,3,5,7,9],3,Tn.Trap(Dir.Down,80))
            .tile([2,4,6,8,10],5,Tn.Trap(Dir.Up,40))
            .SaE([0,1],[11,4])
            .if(game.loops>=5,
                t=>t.setHelpInfo("Theres actually a secret, easier path in this level that's hidden"),
                ()=>tellL("The darts are pretty small. Maybe you can use that to your advantage"))
            .addEnt(()=>pAch(11,0,"hidden6",()=>{tell("You found the hidden path!")}))
            .array
    },
    9:function(){
        return mapKit().set(Tn.Lock)
            .border(Tn.Wall)
            .if(game.loops>=5,t=>{
                _players.forEach(p=>p.keys=Math.ceil(47/_players.length))
                _pickupOnRemoveAll.push({type:'key',func:()=>{Player.removeKeys()}})
                t.setHelpInfo('As a thanks for playing so much, have the random keys every time!')
            },t=>{
                for(let i=1;i<8;i++)
                    for(let j=1;j<8;j++)
                        t.addEnt(()=>pKey(i,j))
            })
            .tile(0,aR(2,6),Tn.Trap(Dir.Right,35))
            .tile(8,aR(2,6),Tn.Trap(Dir.Left,35))
            .tile(aR(2,6),0,Tn.Trap(Dir.Down,35))
            .tile(aR(2,6),8,Tn.Trap(Dir.Up,35))
            .SaE([7,7],[1,1])
            .run(t=>tellL("You can also hit r to restart the current floor"))
            .array
    },
    10:function(){
        return mapKit().set(Tn.Wall)
            .tile([1,4,4],[3,6,2],Tn.Rock)
            .tile(5,6,Tn.NoRock)
            .tile(1,[2,4,5,6,7])
            .tile([2,3,4,5],7)
            .tile(3,aR(1,6))
            .tile(3,0,Tn.Trap(Dir.Down,55))
            .tile([5,6,7],2)
            .tile([1,7],[6,2],Tn.Lava)
            .tile(7,[3,4,5,6])
            .SaE([1,1],[7,7])
            .if(game.loops>=5,t=>{
                t.setHelpInfo("Here have a shortcut")
                    .tile(2,2)
            })
            .tellL('As you enter the new floor, you see a giant boulder in front of you.<br>'+
            "You think to yourself that you're glad you only skipped leg day and not arm day")
            .array
    },
    11:function(){
        return mapKit().set(Tn.Path)
            .border(Tn.Wall)
            .portals([5,1],[1,7])
            .portals([3,1],[5,7])
            .portals([7,1],[3,7])
            .run(t=>{
                for(let i=2;i<7;i+=2)
                    t.tile(i,aR(1,7),Tn.Wall)
            })
            .tile(0,4,Tn.Trap(Dir.Right,35))
            .tile(8,4,Tn.Trap(Dir.Left,35))
            .tile([2,4,6],4,Tn.Lava)
            .SaE([7,7],[1,1])
            .if(game.loops>=5,t=>{
                t.arr[7][1].id=t.arr[1][7].id
                t.setHelpInfo("Here, let's get you past these slow portals")
            },()=>{
                tellL('You feel a sense of familiarity with the blue and orange vortexes ahead of you.<br>'+
                "Perhaps you've seen something like them before elsewhere?")
            }).array
    },
    //#endregion
    //#region  f10-19
    12:function(){
        var len=(game.loops<5)?15:(game.loops>13)?6:15-(game.loops-4)
        return mapKit().set(Tn.Path,len,3)
            .run(t=>{
                var p=0;
                for(let i=1;i<t.arr[0].length-1;i+=2)
                    t.tile(i+1,(p++%2),Tn.Lava)
                for(let i=0;i<t.arr[0].length;i++){
                    if(i%4===2)
                        t.tile(i+1,2,Tn.Trap(Dir.Up,55))
                    else
                        t.tile(i+1,2,Tn.Wall)
                }
            })
            .tile(0,[2,1,0],Tn.Wall)
            .if(game.loops>=5,
                t=>t.setHelpInfo("This level actually gets smaller the more you finish the game"),
                t=>t.setHelpInfo())
            .SaE([0,0],[len-1,1])
            .array
    },
    13:function(){
        return mapKit().set(Tn.Path,7,10)
            .border(Tn.NoRock)
            .SaE([0,0],[6,9])
            .tile(5,[9,8,7],Tn.Wall)
            .tile(4,[8,7],Tn.NoRock)
            .tile(5,0,Tn.Trap(Dir.Down,55))
            .tile(3,9,Tn.Trap(Dir.Up,55))
            .tile(0,5,Tn.Trap(Dir.Right,55))
            .tile(6,[6,7,8],Tn.Path())
            .run(t=>{
                if(game.loops>=15){
                    t.setHelpInfo('I always thought this was an annoying level')
                }else if(game.loops>=10){
                    t.tile([3],[8],Tn.Rock)
                    t.tile(6,[8],Tn.Lava)
                    t.setHelpInfo("Two down, one to go. Killed two stones with one bird")
                }else if(game.loops>=5){
                    t.tile([3,5],[8,1],Tn.Rock)
                    t.tile(6,[8,7],Tn.Lava)
                    t.setHelpInfo("Groundbreaking discovery: One less rock")
                }else{
                    t.tile([3,5,1],[8,1,5],Tn.Rock)
                    t.tile(6,[8,7,6],Tn.Lava)
                    t.setHelpInfo("I think this level rocks")
                }
            })
            .array        
    },
    14:function(){
        return mapKit().set(Tn.Wall,11,11)
            .tile([0,3,0,8,9,3,6,10],[3,3,10,10,2,0,4,8])
            .tile([4,3,0,1,2,6,6,10],[3,4,4,7,7,5,6,9])
            .tile([4,5,6],0)
            .tile(9,[0,3,4,5])
            .tile([8,7,6],9)
            .tile(0,[9,8,7])
            .SaE([0,0],[10,10])
            .portals([1,0],[10,0],1)
            .run(t=>{
                var xs=[1,3,4,5,2,3,5,7,10],ys=[4,5,1,9,6,7,5,6,4]
                for(let i=0;i<xs.length;i++)
                    t.tile(xs[i],ys[i],Tn.Portal('A',1,undefined,['portalA.png','portalB.png']))
            })
            .tile([8],[0],Tn.Lava)
            .setHelpInfo("Good Luck")
            .run(t=>{
                var mustStart=[1,0],
                    mustEnd=[10,8],
                    startLoc=[[5,0],[3,5],[1,6],[10,6],[8,2],[7,6],[5,8]],
                    endLoc=[[0,3],[3,3],[3,0],[8,10],[0,10],[6,4],[9,2]],
                    rnd=[]
                shuffleSimilar(startLoc,endLoc)
                for(let i=0;i<=game.loops-10&&startLoc.length>0;i++){
                    rnd.push(startLoc.pop())
                    endLoc.pop()
                }
                startLoc.unshift(mustStart)
                endLoc.push(mustEnd)
                var i=0;
                startLoc.forEach(loc=>{
                    var el=endLoc[i++]
                    t.arr[loc[0]][loc[1]]=Tn.OneWayPortal(el[0],el[1],undefined,['portalA.png','portalB.png'])
                })
                rnd.forEach(loc=>{
                    t.arr[loc[0]][loc[1]]=Tn.Path(undefined,['portalA.png','portalB.png'])
                })
            })
            .array
    },
    15:function(){
        return mapKit().set(Tn.Wall,5,10)
            .SaE([0,1],[4,0])
            .tile([2,0],[8,2])
            .tile(4,[1,2])
            .tile(1,aR(2,8))
            .tile(3,aR(2,8))
            .tile(1,9,Tn.Trap(Dir.UP,35))
            .tile(3,1,Tn.Trap(Dir.Down,35))
            .addEnt(()=>pShield(0,2))
            .setHelpInfo()
            .run(t=>{

            
                if(game.loops>=5){
                    if(game.loops>10){
                        t.tile(2,aR(2,7))
                    }else
                        t.tile(2,aR(7,1-(game.loops-11)))
                    setHelpInfo("Patience may be a virtue, but you gotta make record time!")
                }else 
                    tellL("Take your shield in hand and use it with space to block those pesky darts")
            })
            .array
        return temp
    },
    16:function(){
        return mapKit().set(Tn.Wall,11,11)
            .tile([1,2,3,4,7,8],5)
            .tile(5,[1,2,3,4,6,7,8,9])
            .tile([1,2,3,6,7,8,9],1)
            .tile([1,2,3,4,6,7,8,9],9)
            .tile([6,4,4,5,4],[5,1,5,6,9],Tn.Bars)
            .run(t=>{
                for(let i=2;i<t.arr.length;i+=4)
                    t.tile([2,3,4,6,7,8],i,Tn.Trap(Dir.Up,28-i))
            })
            .if(game.loops>=25,t=>{
                t.tile(6,5)
            },t=>{
                t.addEnt(()=>{
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
                                                    //Shorter
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
                })
            })
            .SaE([5,5],[9,5])
            .run(t=>tellL('The blue circle is a switch that you can activate. Who knows what it could do'))
            .array
    },
    17:()=>{
        return mapKit().set(Tn.Path,13,13)
            .border(Tn.Wall)
            .run(t=>{
                for(let i=1;i<12;i++)
                    t.tile([i,12-i],[i,i],Tn.Lava)
            })
            .SaE([6,6],[6,1])
            .tile(aR(4,8),3,Tn.Bars)
            .tile([5,6,7],4,Tn.Bars)
            .tile(6,5,Tn.Bars)
            .tile(1,[5,7],Tn.Wall)
            .run(t=>{
                var coords=[[1,2],[1,10],[1,6]]
                var funcGood=(x,y)=>{t.addEnt(()=>new Switch(x,y,{onActivate:()=>{b(6,3,Tn.Path())}}))},
                    funcBad1=(x,y)=>{t.addEnt(()=>sTrapTile(x,y,5,4,Dir.Right,40),
                        ()=>sTrapTile(x,y,7,4,Dir.Left,40))},
                    funcBad2=(x,y)=>{t.addEnt(()=>sTrapTile(x,y,4,3,Dir.Right,40),
                        ()=>sTrapTile(x,y,8,3,Dir.Left,40),
                        ()=>new Switch(x,y,{onActivate:()=>{b(5,3,Tn.Path()),b(7,3,Tn.Path())}}))}

                function left(n){
                    funcGood(coords[n][0],coords[n][1])
                    if(++n===3)
                        n=0
                    funcBad1(coords[n][0],coords[n][1])  
                    if(++n===3)
                        n=0
                    funcBad2(coords[n][0],coords[n][1])
                }
                var rnd=Math.random()
                if(rnd<0.333) left(0)
                else if(rnd<0.666) left(1)
                else left(2)
            })
            .run(t=>{
                var dx=[0,0,1,2]
                for(let i=7;i<=10;i++)
                    t.addEnt(()=>sDart(6,i,4-dx[i-7],i,Dir.Right,5+dx[i-7]),
                        ()=>sDart(6,i,dx[i-7]+8,i,Dir.Left,5+dx[i-7]))
                var gx,bx
                if(chance(2)) gx=(bx=5)+2
                else gx=(bx=7)-2
                t.addEnt(()=>new Switch(gx,11,{onActivate:()=>{
                        b(6,4,Tn.Path())
                    }}),
                    ()=>sTrapTile(bx,11,3,2,Dir.Right,30),
                    ()=>sTrapTile(bx,11,9,2,Dir.Left,30))
            })
            .tile([9,10],6,Tn.Wall)
            .tile([12,12],[5,7],Tn.Trap(Dir.Left,30))
            .tile([10,11],3,Tn.Wall)
            .tile([10,11],9,Tn.Wall)
            .addEnt(()=>new Switch(11,6,{onActivate:()=>{b(6,5,Tn.Path())}}))
            .setHelpInfo()
            .tellL("Looking south and west, you get a sense that only one of those switches will open the path north")
            .if(game.loops>=14,t=>{t.tile(9,3,Tn.FakeLava())})
            .array
    },
    18:()=>{
        return mapKit().set(Tn.NoRock,9,5)
            .border(Tn.Wall)
            .if(game.loops>13,
                t=>t.tile(4,2,Tn.FakeLava),
                t=>t.tile(4,2,Tn.Lava))
            .run(t=>{
                var paths=[
                    new Path(false,v(7,1),v(5,3),v(3,1),v(1,3),v(3,1),v(5,3),v(7,1)),
                    new Path(false,v(1,3),v(3,1),v(5,3),v(7,1),v(5,3),v(3,1),v(1,3)),
                    new Path(false,v(1,1),v(3,3),v(5,1),v(7,3),v(5,1),v(3,3),v(1,1)),
                    new Path(false,v(7,3),v(5,1),v(3,3),v(1,1),v(3,3),v(5,1),v(7,3))
                ]
                paths.forEach(path=>t.addEnt(()=>new Enemy(path,{moveStyle:Path.styles.vertHoriz})))
            })
            .SaE([0,2],[8,2])
            .tile([6,2],2)
            .run(t=>tellL('These are enemies. Each one Has it\'s own agenda to kill you. Or just get where it wants to go'))
            .array
    },
    19:()=>{
        return mapKit().set(Tn.RockRandom,9,5)
            .SaE([0,0],[8,4])
            .tile([2,2,3,4,3,1,2,4,5,4,6,4,5],[0,1,0,1,3,2,4,3,3,4,4,0,0])
            .tile(7,4,Tn.Lava())
            .if(game.loops>17,t=>t.tile(4,2))
            .setHelpInfo()
            .array
    },
    20:()=>{
        return mapKit().set(Tn.Bars,6,11)
            .SaE([0,0],[5,10])
            .run(t=>{
                for(let i=1;i<10;i+=2){
                    t.tile(aR(0,5),i,Tn.Path)
                    t.tile(aR(1,4),i-1,Tn.Trap(Dir.Down,25+10*i))
                }
            })
            .addEnt(t=>{pCheckPointPreLoad(5,5,t.arr)})
            .tile([5,0,5,0],[2,4,6,8])
            .setHelpInfo("Something seems unique here... Maybe that white square?")
            .array
    },
    21:()=>{
        return mapKit().set(Tn.Path,9,8)
            .SaE([1,1],[7,1])
            .border(Tn.Lava)
            .tile(4,aR(1,5),Tn.Lava)
            .run(t=>{
                for(let i=1;i<8;i++){
                    for(let j=1;j<6;j++){
                        if(i!==4&&j!==3)
                            t.addEnt(()=>{pLava(i,j,undefined,t.arr)})
                    }
                }
            })
            .addEnt(()=>pCheckPointPostLoad(4,6))
            .run(t=>{
                for(let i=3;i<=6;i+=3){
                    t.addEnt(()=>new Enemy(new Path(true,v(3,i),v(1,i))))
                    t.addEnt(()=>new Enemy(new Path(true,v(7,i),v(5,i))))
                }
            }).tile(0,4,Tn.Trap(Dir.Right,40))
            .tile(8,4,Tn.Trap(Dir.Left,40))
            .setHelpInfo("Lets ramp things up a bit")
            .array
    },
    //#endregion
    //#region f20-29
    22:()=>{
        return mapKit().set(()=>Tn.Path(colors.grass),13,9)
            .SaE([3,3],[9,5])
            .border(Tn.Bars)
            .tile(2,[2,3,4],Tn.Wall)
            .tile(4,[2,3,4],Tn.Wall)
            .tile(3,4,Tn.Wall)
            .run(()=>{
                if(game.loops<1)
                    dialogue('As you step out into the open air, you begin to compose youself.',
                        "You wonder for a minute how you were able to finally escape, only to notice a guard patrolling nearby.")
            })
            .addEnt(()=>pGoldCheckPoint(6,4),
                ()=>pInv(6,4,()=>tell("This is a golden checkpoint. These only appear on hard difficulty.<br>"+
                                        "When you die, you respawn on this floor instead of the beginning"))
            )
            .tile(9,4,Tn.Wall())
            .tile(8,[4,5,6],Tn.Wall())
            .tile(10,[4,5,6],Tn.Wall())
            .addEnt(()=>new Enemy(new Path(true,v(8,7),v(10,7))))
            .array
    },
    23:()=>{
        return mapKit().set(Tn.Ice,7,12)
            .border(Tn.Wall)
            .SaE([1,1],[5,10])
            .tile([2,5,5,2,4,3],[5,9,3,10,6,8],Tn.Wall)
            .tile([5,1,3],[6,5,2],Tn.Lava)
            .tile(1,4,Tn.Trap(Dir.Right))
            .tile(4,6,Tn.Trap(Dir.Down))
            .tellL("You feel a chill down your spine as you see all the ice covering the ground")
            .array
    },
    24:()=>{
        return mapKit().set(Tn.Path,7,7)
            .SaE([0,5],[6,1])
            .tile(3,aR(0,6),Tn.Lava)
            .tile([0,1,2],4,Tn.Wall)
            .tile([4,5,6],2,Tn.Wall)
            .tile([4,5,6],6,Tn.Wall)
            .tile([0,0],[0,1],Tn.Wall)
            .tile(6,4,Tn.Trap(Dir.Left))
            .addEnt(()=>new Enemy(new Path(false,v(1,0),v(2,0),v(2,3),v(1,3)),{speed:6  }))
            .addEnt(()=>pHook(2,6),
                ()=>pInv(2,6,()=>tellL("You look down at the hook near your feet.<br>"+
                    " Maybe you could latch onto that target in the distance with space?"))
            )
            .tile(5,0,Tn.Lava)
            .tile(0,2,Tn.Trap(Dir.Right))

            .tile([6,0,6],[5,3,0],Tn.Target)
            .array
    },
    25:()=>{
        return mapKit().set(Tn.Path,3,9)
            .SaE([1,0],[1,8])
            .addEnt(()=>sArmorMax(0,1,2,1,1))
            .tile(0,[3,5],Tn.Trap(Dir.Right))
            .tile(2,[4,6],Tn.Trap(Dir.Left))
            .tile(1,[3,4,5,6],Tn.Ice)
            .tellL("That timing looks near impossible!<br>"+
                "Maybe you could find something to protect yourself with?")
            .array
    },
    26:()=>{
        return mapKit().set(Tn.Path,8,6)
            .SaE([7,5],[1,0])
            .tile(aR(1,7),2,Tn.Lava)
            .tile(aR(1,7),3,Tn.Lava)
            .tile(0,[2,3],Tn.Lock)
            .tile(1,[2,3],Tn.Lock)
            .tile([2,4,6],0,Tn.Trap(Dir.Down,35))
            .tile([3,5,7],0)
            .addEnt(()=>pKey(2,1),()=>pKey(4,1),()=>pKey(6,1),()=>pKey(7,0))
            .tile(7,1,Tn.Trap(Dir.Left,30,7))
            .run(t=>{
                setTimeout(()=>{
                    pLava(0,2)
                    pLava(0,3)
                    pLava(1,2)
                    pLava(1,3)
                },10)
            })
            .addEnt(()=>new Enemy(new Path(false,v(0,0),v(2,1))))
            .addEnt(()=>pKeyMagnet(0,5),()=>pInv(0,5,()=>{tellL("This seems like some sort of magnet?<br>"+
                "Maybe it could bring those keys closer with space")}))
            .array
    },
    30:()=>{
        return mapKit().set(Tn.Path,12,12)
            .SaE([0,0],[11,11])
            .tile(0,aR(1,11),Tn.Ice)
            .tile(aR(1,10),11,Tn.Ice)
            .tile([0,0,0,5,9],[1,5,10,11,11],Tn.Lock(Tn.Ice))
            .tile(1,aR(1,10),Tn.Wall)
            .tile([3,5,7,9,3,6,7,9,11,6],[0,1,0,1,4,5,5,4,3,7],Tn.Lava)
            .tile(11,0,Tn.OneWayPortal(1,0))
            .addEnt(()=>pKey(11,1),()=>pKey(9,3),()=>pKey(5,7),()=>pKey(10,9),()=>pKey(11,8))
            .addEnt(()=>new Enemy(new Path(false,v(2,3),v(5,5),v(4,4),v(2,3))))
            .addEnt(()=>new Enemy(new Path(false,v(10,5),v(11,5),v(11,4))).speed=6)
            .addEnt(()=>sTrapTile(6,4,7,6,Dir.Up,30))
            .addEnt(()=>sTrapTile(7,4,8,3,Dir.Down,30))
            .addEnt(()=>sTrapTile(8,5,9,6,Dir.Up,30))
            .addEnt(()=>sArmorMax(0,6,0,7,1))
            .tile([2,7],7,Tn.Trap(Dir.Down,30))
            .tile(4,8,Tn.Trap(Dir.Left,22))
            .tile([6,7,8],[9,8,9],Tn.RockRandom)
            .tile([3,5,7],2,Tn.Wall)
            .tile([11,6,7,5,3,11,10],[2,3,3,8,9,9,8],Tn.Wall)
            .tile(aR(1,11),10,Tn.Wall)
            .tile(aR(1,11),6,Tn.Wall)
            .tile([1,1,4,8],[4,9,10,10])
            .tile([2,4,6,8,10],2,Tn.Trap(Dir.Up,35))
            .tile(9,2,Tn.OneWayPortal(1,4))
            .tile(5,3,Tn.Trap(Dir.Down,30))
            .setHelpInfo("You'd have to be quite noble to pass this level")
            .array
    }
    
    //#endregion
}

function randomFloor(){
    var w=intRange(4,20),
        h=intRange(4,20)
    var keys=[]
    var _rndTest={
        path:{tile:Tn.Path,weight:19},
        wall:{tile:Tn.Wall,weight:5},
        lava:{tile:Tn.Lava,weight:4},
        rock:{tile:()=>Tn.RockRandom(rndArrEle(rndArrFull)),weight:4},
        ice:{tile:Tn.Ice,weight:7},
        lock:{tile:()=>{keys.push(()=>pKey(intRange(0,w),intRange(0,h)));return Tn.Lock(rndArrEle(rndArrFull))},weight:2},
        trap:{tile:()=>{return Tn.Trap(Dir.Random,intRange(35,60),intRange(2,5),intRange(0,35))},weight:6},
        oneWay:{tile:()=>Tn.OneWayPortal(intRange(0,w-1),intRange(0,h-1)),weight:3}
    }
    var rndArrFull=[]
    for(let val in _rndTest){
        var r=_rndTest[val]
        for(let i=0;i<r.weight;i++)
            rndArrFull.push(r.tile)
    }
    return mapKit().set(()=>rndArrEle(rndArrFull)(),w,h).SaE([0,0],[w-1,h-1])
            .tile([0,1,w-2,w-1],[1,0,h-1,h-2],Tn.Path).run(t=>keys.forEach(k=>t.addEnt(k))).array
}

floorFunc[9002]=randomFloor
floorFunc[testFloorNum]=floorTest

/**Debug testing map */
function floorTest(){
    /**Still Programmed the old way. So bad */
    var temp=setFloorAs(Tn.Path,11,11);
    SaE(temp,[0,0],[temp[0].length-1,temp.length-1])
    tile(temp,1,0,Tn.Hidden)
    tile(temp,2,[0,1],Tn.Lava)
    tile(temp,3,0,Tn.Lock)
    tile(temp,[3,4,5],3,Tn.NoRock)
    tile(temp,[4,5],4,Tn.RockRandom)
    tile(temp,5,0,Tn.Wall)
    tile(temp,6,0,Tn.Trap(Dir.Down,100))
    tile(temp,7,0,Tn.Bars())
    tile(temp,8,0,Tn.NoRock())
    tile(temp,[0,1,1,6],[9,9,10,5],Tn.Ice)
    tile(temp,0,10,Tn.Wall)
    tile(temp,6,3,Tn.Target)

    sArmorMax(1,7,2,7,10)
    pSpeedUp(0,6)
    sDart(7,5,7,3,Dir.Down)
    sToggleTile(6,1,6,0,{canToggle:true,oldType:temp[0][6]})
    portals(temp,[1,0],[temp[0].length-1,temp.length-2],1)
    portals(temp,[1,1],[1,2],3)
    addKeys([0,8])    
    pCheckPointPreLoad(2,4,temp)
    pHook(9,7)
    pClone(7,6,undefined,8,7)

    pKeyMagnet(7,7)

    pActiveItem(6,7,void 0,void 0,void 0,void 0,aShrink)
    pActiveItem(5,7,void 0,void 0,void 0,void 0,aTowerShield)
    pActiveItem(4,7,void 0,void 0,void 0,void 0,aBouncyShield)
    pActiveItem(3,7,void 0,void 0,void 0,void 0,aClone)
    tile(temp,10,[0,1,2,3],Tn.Grass)
    tile(temp,9,[0,1,2,3],Tn.Grass)


    pShield(8,7)
    setHelpInfo('This is just a floor for testing each tile and such')
    return temp;
}

//#endregion
