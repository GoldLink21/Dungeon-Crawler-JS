/**
 * Special thanks to Sarah for making the awesome portal
 * graphics and probably other awesome graphics in the
 * future
 * 
 * Also thanks to all the friends of mine who helped
 * without even knowing it by play testing all my levels
 */


const dir={Up:'up',Down:'down',Left:'left',Right:'right'}
var T={
    SIZE:35,
    SizeInit:35,
    Wall:{name:'wall',/**@default 'rgb(78,78,78)'*/color:'rgb(78,78,78)'},
    Path:{name:'path',color:'rgb(165,165,165)'},
    Lava:{name:'lava',color:'maroon'},
    Lock:{name:'lock',color:'rgb(165,165,165)',hasImage:'lock.png'},
    Start:{name:'start',color:'white'},
    End:{name:'end',color:'gold'},
    Hidden:{name:'hidden',color:'rgb(65, 65, 65)'},
    Rock:{name:'rock',color:'rgb(165,165,165)',hasImage:'rock.png'},
    //This is for a tile you can walk on, but can't push a rock on
    NoPushRock:{name:'noRock',color:'rgb(135,135,135)'},
    //Don't use T.Trap or T.Portal because they will all sync up to the same thing as they will just become
    //References to the same object. Use the Trap function or portals function
    Trap:{name:'trap',dir:undefined,delay:undefined,color:'peru'},
    Portal:{name:'portal',type:undefined,id:undefined,hasImage:'portal.png'}
}
/**
 * @description If just x and y are passed in, then returns board[y][x] which is (x,y)
 * If type is passed in, sets board[y][x] (x,y) to the type passed in
 */
function b(x,y,type){
    if(type)
        board[y][x]=type;
    else 
        return board[y][x];
}

/**
 * @description Checks if board[y][x]||b(x,y) is any other arguments
 * @param {'b(x,y)'} bxy 
 * @argument pass in as many types of tiles, i.e. T.Start, T.End etc.
 * @example boardIs(b(x,y),T.End,T.Start) //returns true if board[y][x] (x,y) is any of the types passed in
 */
function boardIs(bxy){
    var b=arguments[0]
    var arr=Array.from(arguments)
    arr.splice(0,1)
    for(let i=0;i<arr.length;i++)
        if(b.name===arr[i].name)
            return true;
    return false;
}

/**@description This is used for making a new trap instead of T.Trap */
function Trap(dir,delay){return{name:'trap',dir: dir,delay:delay,color:'peru'}}

/**
 * @description This is used instead of T.Portal to make a new portal.
 * Just use the function for adding two portals at once, i.e. portals
 */
function Portal(type,id){
    return{name:'portal',type:type,id:id,color:'rgb(165,165,165)',hasImage:'portal'+type+'.png'}
}

var curFloor=0,board=setFloorAs(T.Start,1,1),HTML={},keys=[],darts=[],traps=[],
        noFlipFloors=[8,9,9001],flips={vert:false,horiz:false}

/**@description This tracks between things that should only be loaded once when loading a floor */
var actualLoad=false;

/**@description This holds general data about the game */
var game={
    onEnd:false,
    canMove:true,
    deaths:0,
    loops:0,
}

var doDebug=false;

/**@description This holds all variables for debug testing */
var debug={
    /**@description Invincible */
    inv:false,
    showInfo:false,
    noFlip:true,
    /**@description Tells if to change the first floor to the value of debug.firstFloor */
    changeFirstFloor:false,
    firstFloor:10,
    infKeys:false,
    /**@description Tells if you can hit / to load the next floor */
    nextFloor:true,
    /**@description Sets the floor to load when clicking p */
    quickLoad:9001,
    doQuickLoad:true,
    showPortalId:false,
    showCoords:false,
}

/**
 * @description Loads a specific floor
 * @param {number} floor The floor to load 
 */
function loadFloor(floor){
    removeKeys();
    removeDarts();
    curFloor=floor;
    player.hasTele=false;
    flips.vert=chance(1,2);
    flips.horiz=chance(1,2);
    if(debug.noFlip){flips.vert=false;flips.horiz=false;}
    actualLoad=false;
    //First checks if the floor exists, then will load everything properly
    if(getFloor(floor)){
        actualLoad=true;
        board=tryFlip(getFloor(floor));
        player.resetPosition()
        player.hidden=false;
        actualLoad=false;
    }else
        return true;
    updateInfo()
    trapInit()
}

/**@returns the function of the floor to load, unless it doesn't exist, where it returns false */
function getFloor(n){
    //This is the loading of the first floor with debug options
    if(debug.changeFirstFloor&&actualLoad){
        debug.changeFirstFloor=false;
        return getFloor(debug.firstFloor)
    }
    switch(n){
        case 0:return floorZero()
        case 1:return floorOne()
        case 2:return floorTwo()
        case 3:return floorThree()
        case 4:return floorFour()
        case 5:return floorFive()
        case 6:return floorSix()
        case 7:return floorSeven()
        case 8:return floorEight()
        case 9:return floorNine()
        case 10:return floorTen()
        case 11:return floorEleven()
        case 12:return floorTwelve()

        case 9001:return floorTest();
        default:return false;
    }
}

/**@description Loads the next floor */
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

function flipVert(arr){
    arr.reverse()
    arr.forEach(y=>{
        y.forEach(x=>{
            if(x.name===T.Trap.name){
                if(x.dir===dir.Up)
                    x.dir=dir.Down
                else if(x.dir===dir.Down)
                    x.dir=dir.Up  
            } 
        })
    })
}

function flipHor(arr){
    arr.forEach(ele=>{ele.reverse()})
    arr.forEach(y=>{
        y.forEach(x=>{
            if(x.name===T.Trap.name){
                if(x.dir===dir.Right){
                    x.dir=dir.Left
                }else if(x.dir===dir.Left){
                    x.dir=dir.Right;
                }
            }
        })
    })
}

/**@description Tries to flip the array passed in by checking flips var */
function tryFlip(arr){
    //Checks if specifically shouldn't flip the floor
    if(noFlipFloors.includes(curFloor)){
        flips.horiz=false;
        flips.vert=false;
    }
    if(flips.vert)flipVert(arr);
    if(flips.horiz)flipHor(arr)
    return arr
}

/**
 * @description Changes the x and y's of arr to be the type
 * @param {object[][]} arr The array to edit
 * @param {number|number[]} x The value(s) of x that you want the tiles to be
 * @param {number|number[]} y The value(s) of y that you want the tiles to be
 * @param {object} type The type from the var T. Defaults to T.Path
 * @example tile(temp,0,[1,2,3],T.Wall) //sets (0,1) (0,2) (0,3) to T.Wall
 * @example tile(temp,[1,2],[3,4],T.Lava) // sets (1,3) && (2,4) to T.Lava
 */
function tile(arr,x,y,type){
    //If no type is passed in, defaults to T.Path
    if(!type) type=T.Path;

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
 * @description Short for Start and End. Sets the start and end points of an array in a single function
 * @param {object[][]} arr The array to edit
 * @param {number[]} start X and Y of Start
 * @param {number[]} end X and Y of End  
 */
function SaE(arr,start,end){
    arr[start[1]][start[0]]=T.Start;
    arr[end[1]][end[0]]=T.End;
}

/**
 * @param {object[][]} arr The array to add to
 * @param {number[]} p1 [x,y] of the first portal, i.e Portal A 
 * @param {number[]} p2 [x,y] of the second portal, i.e Portal B
 * @param {number} id The id of the portals to link them together 
 */
function portals(arr,p1,p2,id){
    arr[p1[1]][p1[0]]=Portal('A',id);
    arr[p2[1]][p2[0]]=Portal('B',id);
}

/**
 * @description Sets the text of the help info to str. If -1 is passed in, will hide the element 
 * @param {string|-1} str The string to make the help info, or hides it if -1 is passed in
 */
function setHelpInfo(str){
    var ele=document.getElementById('help')
    if(str===-1)
        ele.hidden=true;
    else{
        ele.textContent=str
        ele.hidden=false;
    }
}

/**
 * @param {object[][]} arr The array to add the border to
 * @param {object} type The type to set the border of the array to
 */
function border(arr,type){
    var i=0,j=0;
    arr.forEach(y=>{
        j=0
        y.forEach(x=>{
            if(j===0||j===arr[0].length-1||i===0||i===arr.length-1)
                arr[i][j]=type
            j++
        })
        i++
    })
}

/**
 * @returns {object[][]} A new array of the value type
 * @param {string} type The value of all items in the new array
 * @param {number} width The width to make the array
 * @param {number} height The height to make the array
 */
function setFloorAs(type,width,height){
    if(!width)width=9;
    if(!height)height=9;

    let temp=[];
    for(let i=0;i<height;i++){
        temp[i]=[];
        for(let j=0;j<width;j++)
            tile(temp,j,i,type)
    }
    return temp;
}

/*
 * This begins the large sections of the level data
 */

//tiles are temp[y][x] (x,y) from top left starting at 0
function floorZero(){
    let temp=setFloorAs(T.Wall);
    tile(temp,[1,2,3],6);
    tile(temp,3,[4,5])
    tile(temp,[3,4,5],4);
    tile(temp,5,[2,3,4]);
    tile(temp,[5,6,7],2);
    tile(temp,1,5,T.Wall);
    tile(temp,[2,4,4,6],[5,5,3,3],T.Lava);
    tile(temp,[0,2,4],[6,4,2],Trap(dir.Right,55));
    SaE(temp,[1,7],[7,1]);
    setHelpInfo('Use arrow keys or wasd to move. Avoid the lava tiles and the darts. The goal is to get to the gold tile.');
    return temp;
}
function floorOne(){ 
    let temp=setFloorAs(T.Wall);
    for(let i=1;i<8;i++)
        tile(temp,[1,3,5,7],i)
    tile(temp,[2,3,4,5,6],7);
    tile(temp,4,2);
    tile(temp,[3,5],1,T.Wall)
    tile(temp,[4,2,6,4,4],[7,6,6,1,6],T.Lava);
    tile(temp,[8],[6],Trap(dir.Left,40));
    tile(temp,0,6,Trap(dir.Right,40));
    tile(temp,4,0,Trap(dir.Down,40));
    SaE(temp,[1,1],[7,1])
    setHelpInfo('Darts can fly over lava, which can lead to increased difficulty sometimes')
    return temp;
}
function floorTwo(){
    let temp=setFloorAs(T.Wall);
    tile(temp,[2,3,5,6],1);
    tile(temp,[3,4,5],2);
    tile(temp,4,[3,4,5,6,7]);
    tile(temp,6,1,T.Lock)
    tile(temp,[3,4,5],[3,1,3],T.Lava);
    tile(temp,3,[4,6],Trap(dir.Right,25))
    tile(temp,5,[4,6],Trap(dir.Left,25))
    tile(temp,[2,6],0,Trap(dir.Down,25))
    tile(temp,[2,6],2,Trap(dir.Up,25))
    addKeys([4,7]);
    SaE(temp,[1,1],[7,1]);
    setHelpInfo("Grab the key to open the blue locked tile")
    return temp;
}
function floorThree(){
    let temp=setFloorAs(T.Wall);
    tile(temp,4,[1,2,3,4,5,6,7]);
    tile(temp,[1,2,3,5,6,7],4);
    tile(temp,[5,6,7],4,T.Lock);
    addKeys([4,1],[4,7],[1,4]);
    tile(temp,[5,5],[2,6],T.Lava);
    tile(temp,[6,6],[2,6],Trap(dir.Left,45))
    tile(temp,2,3,Trap(dir.Down,45))
    tile(temp,2,5,Trap(dir.Up,45));
    SaE(temp,[4,4],[8,4])
    setHelpInfo(-1)
    return temp;
}
function floorFour(){
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
        tile(temp,8,[2,4,6],Trap(dir.Left,40))
    else
        tile(temp,0,[2,4,6],Trap(dir.Right,40))
    setHelpInfo(-1)
    return temp;
}
function floorFive(){
    var temp=setFloorAs(T.Wall,12,7);
    tile(temp,0,[2,3,4])
    for(let i=0;i<temp[0].length;i++){
        tile(temp,i,0,T.Hidden)
        tile(temp,i,4)
    }
    tile(temp,11,[1,2,3],T.Hidden);
    tile(temp,[1,3,5,7,9],3,Trap(dir.Down,60))
    tile(temp,[2,4,6,8,10],5,Trap(dir.Up,30));
    SaE(temp,[0,1],[11,4]);
    setHelpInfo("The darts are pretty small. Maybe you can use that to your advantage")
    return temp;
}

function floorSix(){
    var temp=setFloorAs(T.Wall);
    tile(temp,1,[1,2,3,4,5,6]);
    tile(temp,[2,3,4],6);
    tile(temp,4,[2,3,4,5,6])
    tile(temp,[5,6,7],2)
    tile(temp,7,[3,4,5,6])
    tile(temp,[4,7,1],[1,7,7],T.Lava)
    tile(temp,[2,5,3,8,2],[4,5,3,4,2])
    tile(temp,[1,7],[8,8],Trap(dir.Up,57));
    tile(temp,4,0,Trap(dir.Down,57))
    SaE(temp,[0,1],[8,6]);
    setHelpInfo(-1);
    return temp;
}
function floorSeven(){
    let temp=setFloorAs(T.Lock)
    border(temp,T.Wall);
    if(actualLoad){
        //The chance here determines if the player will start with all needed
        //Keys or need to collect as they go, in favor of the former
        if(chance(1,9))
            player.keys=47;
        else
            for(let i=1;i<8;i++)for(let j=1;j<8;j++)addKeys([i,j])
    }
    tile(temp,0,[2,3,4,5,6],Trap(dir.Right,35));
    tile(temp,8,[2,3,4,5,6],Trap(dir.Left,35));
    tile(temp,[2,3,4,5,6],0,Trap(dir.Down,35));
    tile(temp,[2,3,4,5,6],8,Trap(dir.Up,35));
    SaE(temp,[7,7],[1,1])
    setHelpInfo("You can also hit r to restart the current floor")
    return temp;
}
function floorEight(){
    let temp=setFloorAs(T.Wall)
    tile(temp,[1,4,4],[3,6,2],T.Rock)
    tile(temp,5,6,T.NoPushRock)
    tile(temp,1,[2,4,5,6,7])
    tile(temp,[2,3,4,5],7)
    tile(temp,3,[1,2,3,4,5,6])
    tile(temp,3,0,Trap(dir.Down,55))
    tile(temp,[5,6,7],2)
    tile(temp,[1,7],[6,2],T.Lava)
    tile(temp,7,[3,4,5,6])
    SaE(temp,[1,1],[7,7])
    setHelpInfo('Walk into the rock to push it to the next tile. It can fill in lava pits so you can '+
    "walk over them. You can't push the rock on the slightly darker tile, but you can walk there")
    return temp;
}
function floorNine(){
    let temp=setFloorAs(T.Path)
    border(temp,T.Wall)
    portals(temp,[5,1],[1,7],1);
    portals(temp,[3,1],[5,7],2)
    portals(temp,[7,1],[3,7],3)
    
    for(let i=2;i<7;i+=2)
        tile(temp,i,[1,2,3,4,5,6,7],T.Wall)
    tile(temp,0,4,Trap(dir.Right,35))
    tile(temp,8,4,Trap(dir.Left,35))
    tile(temp,[2,4,6],4,T.Lava)
    SaE(temp,[7,7],[1,1])
    setHelpInfo('I wonder what those new tiles are?')
    return temp;
}
function floorTen(){
    var temp=setFloorAs(T.Path,18,3);
    var p=0;
    for(let i=1;i<temp[0].length;i+=2)
        tile(temp,i,(p++%2),T.Lava)
    for(let i=0;i<temp[0].length;i++){
        if(i%4===2)
            tile(temp,i,2,Trap(dir.Up,55))
        else
            tile(temp,i,2,T.Wall)
    }
    SaE(temp,[0,0],[temp[0].length-1,1])
    setHelpInfo(-1)
    return temp;
}
function floorEleven(){
    var temp=setFloorAs(T.Path,7,10)
    border(temp,T.NoPushRock)
    tile(temp,6,[8,7,6],T.Lava)
    tile(temp,5,[9,8,7],T.Wall)
    tile(temp,4,[8,7],T.NoPushRock)
    tile(temp,5,0,Trap(dir.Down,55))
    tile(temp,3,9,Trap(dir.Up,55))
    tile(temp,0,5,Trap(dir.Right,55))
    tile(temp,[3,5,1],[8,1,5],T.Rock)
    SaE(temp,[0,0],[6,9])
    setHelpInfo("I think this level rocks")
    return temp;
}
function floorTwelve(){
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
    portals(temp,[6,7],[8,3],8)
    portals(temp,[8,5],[10,8],9)
    setHelpInfo("Good Luck")
    return temp
}

function floor(){
    var temp = setFloorAs(T.Lava,13,13)
    temp[12][12]=T.End
    //SaE(temp,[0,0],[])
    return temp
}

function floorTest(){
    var temp=setFloorAs(T.Path,11,11);
    SaE(temp,[0,0],[temp[0].length-1,temp.length-1])

    tile(temp,1,0,T.Hidden)
    tile(temp,2,0,T.Lava)
    tile(temp,3,0,T.Lock)
    tile(temp,[3,4,5],3,T.NoPushRock)
    tile(temp,[4,5],4,T.Rock)
    tile(temp,5,0,T.Wall)
    tile(temp,6,0,Trap(dir.Down,100))
    portals(temp,[1,0],[temp[0].length-1,temp.length-2],1)
    addKeys([0,8])    
    setHelpInfo('This is just a floor for testing each tile and such')
    return temp;
}

/**
 * @returns true only with an n/d chance, else false
 * @param {number} n The numerator of the fractional chance
 * @param {number} d The denominator of the fractional chance
 */
function chance(n,d){return Math.floor(Math.random()*d)<n;}

/**@description Just a test function to make sure the chance function works */
function cTest(r,n,d){
    var out={true:0,false:0}
    for(let i=0;i<r;i++){out[chance(n,d)]++}
    console.log(out);
}

/**
 * @description Prints out an array into the console based on the backwards array I made. 
 * Only prints the first four chars of each part
 */
function printArr(arr){
    var str=''
    arr.forEach(y=>{
        y.forEach(x=>{
            if(x.name.length>=4) str+=x.name.substring(0,4)+'  ';
            else str+=x.name+'.  '   
        })
        str+='\n'
    })
    console.log(str);
}

/**@description Allows function to copy an array instead of editing the original. Just so I don't have to keep writing this */
function copyArr(arr){
    var nArr=new Array(arr.length);
    var i=0;
    arr.forEach(ele=>{nArr[i++]=ele;})
    return nArr;
}

/**
 * @description A helper function for adding elements to the DOM
 * @param {string} id The id of the new element to add
 * @param {HTMLElement} parent The parent to append the new child to
 */
function addElement(id,parent){
    var ele=document.createElement('div');
    ele.id=id;
    parent.appendChild(ele);
    HTML[id]=ele;
}

/**@description Creates all the HTML elements */
function boardInit(){
    addElement('board',document.body)
    addElement('midbar',HTML.board)

    var titleEle=document.createElement('h1');
    titleEle.innerHTML="Dungeon Crawler"
    HTML.midbar.appendChild(titleEle)
    
    addElement('info',HTML.midbar)
    addElement('help',HTML.midbar);

    var canvas=document.createElement('canvas')
    canvas.id='canvas'
    HTML.board.appendChild(canvas)
    canvas.outerHTML="<canvas id='canvas' height='315px' width='315px'></canvas>"
    HTML.canvas=canvas
    
    if(debug.showInfo)
        addElement('debug',HTML.board)

    updateInfo()
    loadFloor(0);
}

/**
 * @returns true if a collides with b
 * @param {Object} a is the player usually
 * @param {Object} b Object 2
 */
function isCollide(a,b){return!(((a.y+a.height)<(b.y))||
    (a.y>(b.y+b.height))||((a.x+a.width)<b.x)||(a.x>(b.x+b.width)));}

var player={
    x:0,y:0,dir:dir.Up,hasTele:false,hidden:false,onLava:false,
    speed:5,keys:0,width:16,height:16,
    hurt:{
        isHurt:false,
        hurtCount:0,
        hurtCountMax:5
    },
    canMove:{
        up:false,down:false,left:false,right:false
    },
    move(){
        var dx=0,dy=0;
        if(game.canMove){
            if(player.canMove.up) dy-=1;
            if(player.canMove.down) dy+=1;
            if(player.canMove.left) dx-=1;
            if(player.canMove.right) dx+=1;
        }
        
        if(player.hurt.isHurt){
            if(player.hurt.hurtCount>=player.hurt.hurtCountMax){
                player.hurt.hurtCount=0;
                player.hurt.isHurt=false;
            }else
                player.hurt.hurtCount++
        }
        if(dx===0^dy===0){
            if(dx!==0){
                switch(dx){
                    case 1:player.dir=dir.Right;break;
                    case -1:player.dir=dir.Left;break;
                }
                player.x+=dx*player.speed;
            }else{
                switch(dy){
                    case 1:player.dir=dir.Down;break;
                    case -1:player.dir=dir.Up;break;
                }
                player.y+=dy*player.speed;
            }
            
            
        }
        if(!player.checkCollisions()){
            player.x-=dx*player.speed;
            player.y-=dy*player.speed;
        }
        checkOnPortal();
        checkKeyCollide();
        updateInfo()
        if(debug.infKeys)
            player.keys=5;
    },
    /**@description Sets the players position on the map tiles */
    setPosition(x,y){
        if(x>=0&&x<board[0].length)
            player.x=x*T.SIZE+(1/2)*T.SIZE-(player.width/2);
        if(y>=0&&y<board.length)
            player.y=y*T.SIZE+(1/2)*T.SIZE-(player.height/2);
    },
    /**@description Puts the player onto the first start tile of the map */
    resetPosition(){
        for(var i=0;i<board.length;i++)
            for(var j=0;j<board[i].length;j++)
                if(b(j,i)===T.Start){
                    player.setPosition(j,i);
                    return true; 
                }
    },
    /**
    * @description Checks all corners of the player for movement
    * @returns true if the movement was successful and false if it was not
    */
    checkCollisions(){
        var pPoints=getRounded(player);
        var ret=true
        player.onLava=false
        for(var i=0;i<pPoints.length;i++){
            var y=pPoints[i][1],x=pPoints[i][0];
            if(!checkTile(x,y))ret=false;
        }
        return ret;
   }
};

/**
 * @returns true if the player can move there and false if they cannot. Also does all functions of
 * events when the player walks on specific tiles
 * @param {number} y The rounded y position of the player
 * @param {number} x The rounded x position of the player
 */
function checkTile(x,y){
    //First make sure it's in bounds so no errors are thrown
    if(x<0||y<0||x>board[0].length-1||y>board.length-1)
        return false;
    //These are the tiles that you can walk on with nothing happening
    if(boardIs(b(x,y),T.Path,T.Start,T.Hidden,T.NoPushRock))
        return true;
    else if(b(x,y)===T.End)
        nextFloor();
    else if(b(x,y)===T.Lock){
        if(player.keys>0){
            player.keys--;
            b(x,y,T.Path)
            return true;
        }
    }else if(b(x,y)===T.Lava){
        if(!player.onLava){
            if(!debug.inv)player.resetPosition()
            player.hurt.isHurt=true;
            game.deaths++;
            player.onLava=true;
        }
    }else if(b(x,y)===T.Rock){
        var xCheck=x,yCheck=y;
        switch(player.dir){
            case dir.Up:yCheck--;break;
            case dir.Down:yCheck++;break;
            case dir.Left:xCheck--;break;
            case dir.Right:xCheck++;break;
        }
        if(checkRockTile(xCheck,yCheck)){
            if(b(xCheck,yCheck)===T.Lava){
                b(xCheck,yCheck,T.Path)
                b(x,y,T.Path)
            }else{
                b(xCheck,yCheck,T.Rock)
                b(x,y,T.Path)
            }
        }
    }else if(b(x,y).name===T.Portal.name){
        if(!player.hasTele){
            player.hasTele=true;
            var point=getOtherPortal(b(x,y))
            player.setPosition(point[0],point[1])
        }
        return true;
    }
    //Anything that doesn't return true by here basically returns false so you can't move there
}

/**@description Get's the coord of the other portal for the same type */
function getOtherPortal(obj){
    for(let i=0;i<board.length;i++){
        for(let j=0;j<board[0].length;j++){
            var temp=b(j,i);
            //If it's a portal too, isn't the same type, but has the same id, then return (x,y) as an array
            if(temp.name===T.Portal.name&&temp.type!==obj.type&&temp.id===obj.id)
                return [j,i]
        }
    }
}
/**@description Sets player.hasTele to false if not on a portal and haven't teleported yet*/
function checkOnPortal(){
    var p=getRounded(player);
    for(let i=0;i<p.length;i++){
        var x=p[i][0],y=p[i][1];
        if(b(x,y).name===T.Portal.name)
            return;
    }
    player.hasTele=false;
}

/**
 * @returns an array of the rounded points of each corner of the object 
 * @requires obj to have width and height property
 */
function getRounded(obj){
    var x=obj.x,y=obj.y,width=obj.width,height=obj.height;
    return[roundPoint(x,y),roundPoint(x+width,y),roundPoint(x+width,y+height),roundPoint(x,y+height)]
}

/**@returns the tile coord of the point */
function roundPoint(x,y){return[Math.floor(x/T.SIZE),Math.floor(y/T.SIZE)];}

/**@description Updates the info on the info HTML */
function updateInfo(){
    var ele = document.getElementById('info');
    var str="Floor: "+curFloor+",  Keys: "+player.keys+",  Deaths: "+game.deaths;
    if(game.loops>0)
        str+=',  Game Loops: '+game.loops;
    //Only do it if there's something new to change
    if(ele.innerHTML!==str)
        ele.innerHTML=str;
    if(debug.showInfo)
        updateDebugInfo()
}

function updateDebugInfo(){
    var str='Floor: '+curFloor;

    function debugSub(txt){str+='<br>'+txt}

    debugSub("Player Coords: ("+player.x+","+player.y+")")
    debugSub("Player dir: "+player.dir)
    debugSub("Flips{ Vert: "+flips.vert+', Horiz: '+flips.horiz+'}')
    debugSub("CurTile: "+b(roundPoint(player.x,player.y)[0],roundPoint(player.x,player.y)[1]).name)
    debugSub('player.hasTele: '+player.hasTele)
    debugSub("Can't flip curFloor: "+noFlipFloors.includes(curFloor))
    if(HTML.debug.innerHTML!==str)
        HTML.debug.innerHTML=str
}
/**@returns true if player collides with a key*/
function checkKeyCollide(){
    var i=0;
    while(i<keys.length){
        if(isCollide(player,keys[i])){
            player.keys++;
            keys.splice(i,1);
            return true;
        }
        else i++
    }return false;
}
/**
 * @description Adds a key at tile x and y for the floor. Do not use the new keyword
 * @param {number} x The x coord of the key
 * @param {number} y The y coord of the key
 */
function Key(x,y){
    if(actualLoad){
        //If the floor can flip
        if(!noFlipFloors.includes(curFloor)){
            //Changes coords based on if the map flips
            if(flips.horiz)x=board[0].length-1-x;
            if(flips.vert)y=board.length-1-y;
        }
        keys.push({width:12,height:12,x:(x*T.SIZE+T.SIZE/3),y:(y*T.SIZE+T.SIZE/3)});
    }
}

/**@description Removes all keys from the board, array, and player*/
function removeKeys(){keys=[];player.keys=0;}

/**
 * @description Adds multiple keys at once 
 * @argument Points [x1,y1],[x2,y2],... 
 */
function addKeys(){Array.from(arguments).forEach(key=>{Key(key[0],key[1])})}

/**@description Kind of a constructor, but done without the new keyword */
function Dart(x,y,direction){
    darts.push({
        width:10,height:10,direction:direction,
        x:x*T.SIZE+(1/2)*T.SIZE-5,y:(y*T.SIZE+(1/2)*T.SIZE-5),
        speed:4,toRemove:false,
        checkCollide(){
            var p=getRounded(this)
            for(var i=0;i<p.length;i++){
                if(isCollide(player,this)){
                    this.toRemove=true;
                    player.hurt.isHurt=true
                    game.deaths++;
                    if(!debug.inv)
                        return player.resetPosition()
                }
                if(!this.checkTile(p[i][0],p[i][1]))
                    return !(this.toRemove=true);
            }
            return true;
        },move(){
            switch(this.direction){
                case(dir.Up):this.y-=this.speed;break;
                case(dir.Down):this.y+=this.speed;break;
                case(dir.Left):this.x-=this.speed;break;
                case(dir.Right):this.x+=this.speed;break;
            }
            this.checkCollide();
        },checkTile(x,y){
            //Make sure it is on the board
            if(x<0||y<0||x>board[0].length-1||y>board.length-1)
                return false;
            //Tiles that can be shot through. Come here for new tiles
            if(boardIs(b(x,y),T.Path,T.Start,T.End,T.Lava,T.Trap,T.NoPushRock))
                return true;
            //Any that can't be shot through will return false here unless specified before
        }
    })
}

/**@description Flags all darts to be removed */
function removeDarts(){darts.forEach(d=>{d.toRemove=true});traps=[];}

/**@description Moves all darts and removes any that need to be*/
function moveDarts(){
    for(let i=0;i<darts.length;i++){
        darts[i].move();
        if(darts[i].toRemove) darts.splice(i--,1);
    }
}

/**@description Increments all traps delay to set when to fire */
function addDarts(){traps.forEach(trap=>{trap.fire()})}

function trapInit(){
    var i=0,j=0;
    board.forEach(y=>{
        j=0;
        y.forEach(x=>{
            if(x.name===T.Trap.name){
                traps.push({
                    x:j,y:i,dir:x.dir,
                    delay:x.delay,count:0,
					fire(){
                        if(this.count>=this.delay){
                            this.count=0;
                            Dart(this.x,this.y,this.dir);
                        }
                        else this.count++;
					}
				})
            }
            j++
        })
        i++
    })
}

function checkRockTile(x,y){
    //Make sure it's in bounds
    if(x<0||y<0||x>board[0].length-1||y>board.length-1)
        return false;
    if(boardIs(b(x,y),T.Path,T.Lava))
        return true;
}

document.addEventListener('keydown',(event)=>{eventHelper(event,true)});
document.addEventListener('keyup',(event)=>{
    eventHelper(event,false);
    if(event.key==='r')
        loadFloor(curFloor);
    if(event.key==='/'&&debug.nextFloor)
        nextFloor()
    if(event.key==="Enter")
        if(game.onEnd){
            loadFloor(0)
            game.onEnd=false;
            player.hidden=false
            game.loops++;
            game.deaths=0;
        }
    if(event.key==='p'&&debug.doQuickLoad)
        loadFloor(debug.quickLoad)
})

/**@description Helper function for adding movement event listeners to remove repetition */
function eventHelper(event,bool){
    switch(event.key){
        case'ArrowUp':case'w':player.canMove.up=bool;break;
        case'ArrowDown':case's':player.canMove.down=bool;break;
        case'ArrowRight':case'd':player.canMove.right=bool;break;
        case'ArrowLeft':case'a':player.canMove.left=bool;break;
    }
}

function drawAll(){
    var c=/**@type {HTMLCanvasElement}*/(document.getElementById("canvas"));
    if(c.height!==board.length*T.SIZE)
        c.height=board.length*T.SIZE
    if(c.width!==board[0].length*T.SIZE)
        c.width=board[0].length*T.SIZE
    
    var ctx = c.getContext('2d')
    ctx.clearRect(0,0,c.width,c.height)

    ctx.shadowColor='black'    

    function rect(x,y,width,height,color){
        ctx.fillStyle=color;
        ctx.fillRect(x,y,width,height)
        ctx.strokeRect(x,y,width,height)
    }
    function circle(x,y,rad,color){
        ctx.beginPath();
        if(color)
            ctx.fillStyle=color
        ctx.arc(x,y,rad,0,2*Math.PI)
        ctx.fill()
        ctx.stroke()
        ctx.closePath()
    }
    var by=0,bx=0;
    board.forEach(y=>{
        bx=0;
        y.forEach(x=>{
            ctx.fillStyle=x.color;
            rect(bx*T.SIZE,by*T.SIZE,T.SIZE,T.SIZE)
            if(x.hasImage){
                var img=document.createElement('img')
                img.src=x.hasImage;
                ctx.drawImage(img,bx*T.SIZE,by*T.SIZE,T.SIZE-1,T.SIZE-1)
                ctx.strokeRect(bx*T.Size,by*T.SIZE,T.SIZE,T.SIZE)
            }   
            if(x.name===T.Portal.name&&debug.showPortalId){
                if(x.type==='A')
                    ctx.strokeStyle='blue'
                else
                    ctx.strokeStyle='brown'
                ctx.strokeText(x.id,(bx+1)*T.SIZE-12,(by+1)*T.SIZE-3)
                ctx.strokeStyle='black'
            }if(debug.showCoords){
                ctx.strokeStyle='rgba(10,10,10,0.5)'
                ctx.strokeText("("+bx+','+by+')',bx*T.SIZE+2,by*T.SIZE+10)
                ctx.strokeStyle='black'
            }
            bx++
        }) 
        by++
    })

    darts.forEach(dart=>{
        circle(dart.x+dart.width/2,dart.y+dart.width/2,dart.width/2,'green')
    })

    keys.forEach(key=>{
        rect(key.x,key.y,key.width,key.height,'goldenrod')
    })

    if(player.hurt.hurtCount>0)
        ctx.fillStyle='red'
    else
        ctx.fillStyle='blue';
    if(!player.hidden)
        rect(player.x,player.y,player.width,player.height)
        //circle(player.x+player.width/2,player.y+player.height/2,player.width/2)
    ctx.stroke();
    circle(0,0,0)
}

if(!doDebug){
    debug.doQuickLoad=false
    debug.infKeys=false
    debug.inv=false
    debug.nextFloor=false
    debug.showCoords=false
    debug.showInfo=false
    debug.showPortalId=false
    debug.changeFirstFloor=false
    debug.noFlip=true
}

boardInit();
var playerMove=setInterval(player.move,60);
var dartMove=setInterval(moveDarts,60);
var shootDart=setInterval(addDarts,60)
var draw=setInterval(drawAll,10)
