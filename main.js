const dir={Up:'up',Down:'down',Left:'left',Right:'right'}
var T={
    SIZE:35,
    SizeInit:35,
    Wall:{name:'wall',color:'rgb(78,78,78)',toString(){return this.name}},
    Path:{name:'path',color:'rgb(165,165,165)',toString(){return this.name}},
    Lava:{name:'lava',color:'maroon',toString(){return this.name}},
    Lock:{name:'lock',color:'rgb(165,165,165)',hasImage:'lock.png',toString(){return this.name}},
    Start:{name:'start',color:'white',toString(){return this.name}},
    End:{name:'end',color:'gold',toString(){return this.name}},
    Hidden:{name:'hidden',color:'rgb(65, 65, 65)',toString(){return this.name}},
    Rock:{name:'rock',color:'rgb(165,165,165)',hasImage:'rock.png',toString(){return this.name}},
    Trap:{name:'trap',dir:undefined,delay:undefined,color:'peru',toString(){return this.name+' '+this.dir+' '+this.delay}},
    Portal:{name:'portal',type:undefined,id:undefined,hasImage:'portal.png',toString(){return this.name+this.type+' '+this.id}}
}
/**@returns board[y][x] which is (x,y) */
function b(x,y){return board[y][x];}

function Trap(dir,delay){return{name:'trap',dir: dir,delay:delay,color:'peru',toString(){return this.name+' '+this.dir+' '+this.delay}}}
function Portal(type,id){return{name:'portal',type:type,id:id,color:'rgb(165,165,165)',hasImage:'portal'+type+'.png',toString(){return this.name+this.type+' '+this.id}}}

var curFloor=0,board=setFloorAs(T.Wall),offset={x:0,y:0},HTML={},keys=[],darts=[],traps=[],
        noFlipFloors=[8,9],flips={vert:false,horiz:false},actualLoad=false;
var game={
    onEnd:false,
    canMove:true,
    deaths:0,
    loops:0,
},debug={
    inv:false,
    showInfo:true,
    noFlip:true,
    changeFirstFloor:false,
    firstFloor:10,
    infKeys:false,
    nextFloor:true,
    quickLoad:9
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
    if(getFloor(floor)){
        actualLoad=true;
        board=tryFlip(getFloor(floor));
        player.resetPosition()
        actualLoad=false;
    }else
        return true;
    updateInfo()
    trapInit()
}

function getFloor(n){
    if(debug.changeFirstFloor&&actualLoad){
        debug.changeFirstFloor=false;
        return getFloor(debug.firstFloor)
    }
    switch(n){
        case 0:return floorTen()
        case 1:return floorOne()
        case 2:return floorTwo()
        case 3:return floorThree()
        case 4:return floorFour()
        case 5:return floorFive()
        case 6:return floorSix()
        case 7:return floorSeven()
        case 8:return floorEight()
        case 9:return floorNine()
        default:return false;
    }
}

/**@description Loads the next floor */
function nextFloor(){
    if(loadFloor(++curFloor)){
        player.hidden=true;
        board=setFloorAs(T.Path);
        game.onEnd=true;
        setHelpInfo("Press Enter to begin anew");
    }
}
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
function copyArr(arr){
    var nArr=new Array(arr.length);
    var i=0;
    arr.forEach(ele=>{nArr[i++]=ele;})
    return nArr;
}


function flipVert(arr){
    var temp=copyArr(arr);
    temp.reverse();

    temp.forEach(y=>{
        y.forEach(x=>{
            if(x.name===T.Trap.name){
                if(x.dir===dir.Up)
                    x.dir=dir.Down
                else if(x.dir===dir.Down)
                    x.dir=dir.Up   
            }
        })
    })
    return temp;
}
function flipHor(arr){
    var temp=copyArr(arr);
    temp.forEach(ele=>{ele.reverse()})
    temp.forEach(y=>{
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
    return temp;
}
function tryFlip(arr){
    var temp=copyArr(arr)
    noFlipFloors.forEach(floor=>{
        if(curFloor===floor){
            flips.horiz=false;
            flips.vert=false;
        }
    })
    if(flips.vert)temp=flipVert(temp);
    if(flips.horiz)temp=flipHor(temp);
    return temp;
}

/**
 * @description Changes the x and y's of arr to be the type
 * @param {string[]} arr The array to edit
 * @param {number|number[]} x The value(s) of x that you want the tiles to be
 * @param {number|number[]} y The value(s) of y that you want the tiles to be
 * @param {string} type The string of the type from the var T. Defaults to T.Path
 */
function tile(arr,x,y,type){
    //If no type is passed in, defaults to T.Path
    if(!type) type=T.Path;
    if(Array.isArray(x)){
  	    if(Array.isArray(y))
    	    for(let i=0;i<x.length;i++)
      	        arr[y[i]][x[i]]=type;
        else
    	    for(let i=0;i<x.length;i++)
      	        arr[y][x[i]]=type;
    }else if(Array.isArray(y))
  	    for(let i=0;i<y.length;i++)
    	    arr[y[i]][x]=type;
    else
  	    arr[y][x]=type;
}
/**
 * @param {string[][]} arr The array to edit
 * @param {number[]} start X and Y of Start
 * @param {number[]} end X and Y of End  
 */
function SaE(arr,start,end){arr[start[1]][start[0]]=T.Start;arr[end[1]][end[0]]=T.End;}

function portals(arr,p1,p2,num){arr[p1[1]][p1[0]]=Portal('A',num);arr[p2[1]][p2[0]]=Portal('B',num);}

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
function floorFour(){
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
function floorFive(){
    let temp=border(T.Path,T.Lava);
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
    return temp;
}
function floorSix(){
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
    return temp;
}
function floorSeven(){
    let temp=border(T.Lock,T.Wall);
    if(actualLoad){
        //The chance here determines if the player will start with all needed
        //Keys or need to collect as they go, in favor of the former
        if(chance(1,7))
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
    tile(temp,1,[2,4,5,6,7])
    tile(temp,[2,3,4,5],7)
    tile(temp,3,[1,2,3,4,5,6])
    tile(temp,3,0,Trap(dir.Down,55))
    tile(temp,[5,6,7],2)
    tile(temp,[1,7],[6,2],T.Lava)
    tile(temp,7,[3,4,5,6])
    tile(temp,5,6)
    SaE(temp,[1,1],[7,7])
    setHelpInfo('Walk into the rock to push it to the next tile. It can fill in lava pits so you can walk over them')
    return temp;
}
function floorNine(){
    let temp=border(T.Path,T.Wall)
    portals(temp,[1,7],[3,1],1);
    portals(temp,[5,1],[3,7],2)
    portals(temp,[5,7],[7,1],3)
    for(let i=2;i<7;i+=2)
        tile(temp,i,[1,2,3,4,5,6,7],T.Wall)
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
    return temp;
}



function floorTest(){
    var temp=setFloorAs(T.Path,18,3);
    var p=0;
    for(let i=1;i<temp[0].length;i+=2){
        tile(temp,i,(p%2),T.Lava)
        p++
    }
    SaE(temp,[0,0],[temp[0].length-1,2])

    /*
    tile(temp,1,0,T.Hidden)
    tile(temp,2,0,T.Lava)
    tile(temp,3,0,T.Lock)
    tile(temp,4,4,T.Rock)
    tile(temp,5,0,T.Wall)
    tile(temp,6,0,Trap(dir.Down,100))
    portals(temp,[6,4],[7,2],1)
    addKeys([0,8])
    SaE(temp,[0,0],[7,7]);*/
    
    setHelpInfo('This is just a floor for testing each tile and such')
    return temp;
}

/**@returns true only with an n/d chance, else false*/
function chance(n,d){return Math.floor(Math.random()*d)<n;}

function cTest(r,n,d){
    var out={true:0,false:0}
    for(let i=0;i<r;i++){out[chance(n,d)]++}
    console.log(out);
}

/**@description Sets the text of the help info to str. If -1 is passed in, will hide the element */
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
 * @returns {string[][]}A new array with the center as the base and the border as borderType
 * @param {string} base The center area of the new array
 * @param {string} borderType The type for the border of the new array
 */
function border(base,borderType){
    //Fix
    var temp=setFloorAs(base);
    for(var i=0;i<9;i++){
        tile(temp,[0,8],i,borderType)
        tile(temp,i,[0,8],borderType)
    }
    return temp;
}
/**
 * @returns {string[][]} A new array of the value type
 * @param {string} type The value of all items in the new array
 */
function setFloorAs(type,width,height){
    if(!width)width=9;
    if(!height)height=9;

    let temp=[];
    for(let i=0;i<height;i++){
        temp[i]=[];
        for(let j=0;j<width;j++)
            temp[i][j]=type
            //tile(temp,j,i,type)
    }
    return temp;
}

/**
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
 * @param {Object} a player
 * @param {Object} b Object 2
 */
function isCollide(a,b){return!(((a.y+a.height)<(b.y))||(a.y>(b.y+b.height))||((a.x+a.width)<b.x)||(a.x>(b.x+b.width)));}

var player={
    x:0,y:0,animCount:0,animMax:3,dir:dir.Up,hasTele:false,hidden:false,
    speed:5,keys:0,width:16,height:16,alt:false,redCount:0,redCountMax:5,isRed:false,
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
        if(dx!==0||dy!==0)player.animCount++;
        if(player.animCount>player.animMax){
            player.animCount=0;
            player.alt=!player.alt;
        }
        
        if(player.isRed){
            if(player.redCount>=player.redCountMax){
                player.redCount=0;
                player.isRed=false;
            }else
                player.redCount++
        }

        player.x+=dx*player.speed;
        player.y+=dy*player.speed;
        
        if(!player.checkCollisions()){
            player.x-=dx*player.speed;
            player.y-=dy*player.speed;
        }
        checkOnPortal();
        checkKeyCollide();
        updateInfo()
        if(debug.infKeys)
            player.keys=5;
    },setPosition(x,y){
        if(x>=0&&x<board.length)
            player.x=x*T.SIZE+(1/2)*T.SIZE-(player.width/2);
        if(y>=0&&y<board[0].length)
            player.y=y*T.SIZE+(1/2)*T.SIZE-(player.height/2);
    },resetPosition(){
        for(var i=0;i<board.length;i++)
            for(var j=0;j<board[i].length;j++)
                if(b(j,i)===T.Start){
                    player.setPosition(j,i);
                    return; 
                }
    },
    /**
    * @description Checks all corners of the player for movement
    * @returns true if the movement was successful and false if it was not
    */
    checkCollisions(){
        var pPoints=getRounded(player);
        var ret=true
        for(var i=0;i<pPoints.length;i++){
            var y=pPoints[i][1],x=pPoints[i][0];
            if(!checkTile(x,y))ret=false;
        }
        return ret;
   }
};

/**
 * @returns true if the player can move there and false if they cannot
 * @param {number} y The rounded y position of the player
 * @param {number} x The rounded x position of the player
 */
function checkTile(x,y){
    
    if(x<0||y<0||x>board[0].length-1||y>board.length-1)
        return false;
    if(b(x,y)===T.Path||b(x,y)===T.Start||b(x,y)===T.Hidden)
        return true;

    else if(b(x,y)===T.End)
        nextFloor();
    else if(b(x,y)===T.Lock){
        if(player.keys>0){
            player.keys--;
            board[y][x]=T.Path;
            return true;
        }
    }else if(b(x,y)===T.Lava){
        if(!debug.inv)player.resetPosition()
        player.isRed=true;
        game.deaths++;
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
                board[yCheck][xCheck]=T.Path;
                board[y][x]=T.Path;
            }else{
                board[yCheck][xCheck]=T.Rock;
                board[y][x]=T.Path;
            }
        }
    }else if(b(x,y).name===T.Portal.name){
        if(!player.hasTele){
            player.hasTele=true;
            var poin=getOtherPortal(b(x,y))
            player.setPosition(poin[0],poin[1])
        }
        return true;
    }
    
}

function getOtherPortal(obj){
    for(let i=0;i<board.length;i++){
        for(let j=0;j<board[0].length;j++){
            var temp=b(j,i);
            if(temp.name===T.Portal.name&&temp.type!==obj.type&&temp.id===obj.id){
                return [j,i]
            }
        }
    }
}

function checkOnPortal(){
    var p=getRounded(player);
    for(let i=0;i<p.length;i++){
        var x=p[i][0],y=p[i][1];
        if(b(x,y).name===T.Portal.name){
            return;
        }
    }
    player.hasTele=false;
}

/**@returns an array of the rounded points of each corner of the object */
function getRounded(obj){
    var x=obj.x,y=obj.y,width=obj.width,height=obj.height;
    return[roundPoint(x,y),roundPoint(x+width,y),roundPoint(x+width,y+height),roundPoint(x,y+height)]
}

/**@description @returns the tile coord of the point */
function roundPoint(x,y){return[Math.floor(x/T.SIZE),Math.floor(y/T.SIZE)];}

function updateInfo(){
    var ele = document.getElementById('info');
    var str="Floor: "+curFloor+",  Keys: "+player.keys+",  Deaths: "+game.deaths;
    if(game.loops>0)
        str+=',  Game Loops: '+game.loops;
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
    debugSub("CurTile: "+b(roundPoint(player.x,player.y)[0],roundPoint(player.x,player.y)[1]))
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
 * @description Adds a key at tile x and y
 * @param {number} x @param {number} y 
 */
function Key(x,y){
    if(actualLoad){
        if(flips.horiz)x=board[0].length-1-x;
        if(flips.vert)y=board.length-1-y;
        keys.push({width:12,height:12,x:x*T.SIZE+T.SIZE/3,y:y*T.SIZE+T.SIZE/3});
    }
}

/**@description Removes all keys from the board, array, and player*/
function removeKeys(){
    keys=[];player.keys=0;
}

/**@description Adds multiple keys at once @argument Points [x1,y1],[x2,y2],... */
function addKeys(){Array.from(arguments).forEach(key=>{Key(key[0],key[1])})}

/**@description Kind of a constructor, but done without the new keyword */
function Dart(x,y,direction){
    var d={
        width:10,height:10,direction:direction,
        x:x*T.SIZE+(1/2)*T.SIZE-5,y:(y*T.SIZE+(1/2)*T.SIZE-5),
        speed:4,index:darts.length,toRemove:false,
        checkCollide(){
            var p=getRounded(this)
            for(var i=0;i<p.length;i++){
                var x=p[i][0];
                var y=p[i][1];
                if(isCollide(player,this)){
                    this.toRemove=true;
                    player.isRed=true
                    game.deaths++;
                    if(!debug.inv){
                        player.resetPosition()
                        return true;
                    }
                }
                if(!this.checkTile(x,y)){
                    this.toRemove=true;
                    return false;
                }
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
            if(x<0||y<0||x>board[0].length-1||y>board.length-1||b(x,y)===T.Lock||b(x,y)===T.Wall)
                return false;
            if(b(x,y)===T.Path||b(x,y)===T.Start||b(x,y)===T.End||b(x,y)===T.Lava||b(x,y).name===T.Trap.name)
                return true;
        }
    }
    darts.push(d);
}

/**@description Flags all darts to be removed */
function removeDarts(){
    darts.forEach(d=>{d.toRemove=true})
    traps=[];
}

/**@description Moves all darts and removes any that need to be*/
function moveDarts(){
    for(let i=0;i<darts.length;i++){
        darts[i].move();
        if(darts[i].toRemove){
            darts.splice(i--,1);
        }
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
                    x:j,
                    y:i,
                    dir:x.dir,
                    delay:x.delay,
                    count:0,
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
    if(x<0||y<0||x>board[0].length-1||y>board.length-1)
        return false;
    if(b(x,y)===T.Path||b(x,y)===T.Lava)
        return true;
}

document.addEventListener('keydown',(event)=>{;eventHelper(event,true)});
document.addEventListener('keyup',(event)=>{
    eventHelper(event,false);
    /*player.canMove.up=false;
    player.canMove.left=false
    player.canMove.right=false
    player.canMove.down=false*/
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
        }
    if(event.key==='p')
        loadFloor(debug.quickLoad)
})

/**@description Helper function for adding movement event listeners to remove repetition */
function eventHelper(event,bool){
    switch(event.key){
        case'ArrowUp':case'w':if(bool)player.dir=dir.Up;player.canMove.up=bool;break;
        case'ArrowDown':case's':if(bool)player.dir=dir.Down;player.canMove.down=bool;break;
        case'ArrowRight':case'd':if(bool)player.dir=dir.Right;player.canMove.right=bool;break;
        case'ArrowLeft':case'a':if(bool)player.dir=dir.Left;player.canMove.left=bool;break;
    }
}

function drawAll(){
    var c = /**@type {HTMLCanvasElement} */ (document.getElementById("canvas"));

    var arr=c.outerHTML.split(' ')
    arr[2]='height="'+board.length*T.SIZE+'"'
    arr[3]='width="'+board[0].length*T.SIZE+'"></canvas>'
    if(c.outerHTML!==arr.join(' '))c.outerHTML=arr.join(' ')

    var ctx = c.getContext('2d')
    ctx.clearRect(0,0,c.width,c.height)

    ctx.shadowColor='black'
    function shadow(x,y,func){
        ctx.shadowOffsetX=x;
        ctx.shadowOffsetY=y;
        func();
        ctx.shadowOffsetX=0;
        ctx.shadowOffsetY=0;
    }

    

    function rect(x,y,width,height,color){
        ctx.fillStyle=color;
        ctx.fillRect(x,y,width,height)
        ctx.strokeRect(x,y,width,height)
    }
    function circle(x,y,rad){
        ctx.beginPath();
        ctx.fillStyle='green'
        ctx.arc(x,y,rad,0,2*Math.PI)
        ctx.fill()
        ctx.stroke()
        ctx.closePath()
    }
    var bi=0,bj=0;
    board.forEach(y=>{
        bj=0;
        y.forEach(x=>{
            ctx.fillStyle=x.color;
            rect(bj*T.SIZE,bi*T.SIZE,T.SIZE,T.SIZE)
            if(x.hasImage){
                var img=document.createElement('img')
                img.src=x.hasImage;
                ctx.drawImage(img,bj*T.SIZE+1,bi*T.SIZE+1,T.SIZE,T.SIZE)
            }   
            bj++
        }) 
        bi++
    })

    darts.forEach(dart=>{
        circle(dart.x+dart.width/2,dart.y+dart.width/2,dart.width/2)
    })

    keys.forEach(key=>{
        rect(key.x,key.y,key.width,key.height,'goldenrod')
    })

    if(player.redCount>0)
        ctx.fillStyle='red'
    else
        ctx.fillStyle='blue';
    if(!player.hidden)
        rect(player.x,player.y,player.width,player.height)  
    ctx.stroke();
    circle(0,0,0)
}


boardInit();
var playerMove=setInterval(player.move,60);
var dartMove=setInterval(moveDarts,60);
var shootDart=setInterval(addDarts,60)
var draw=setInterval(drawAll,1)