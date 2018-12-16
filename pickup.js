/*
 * Special thanks to Sarah for making the awesome portal
 * graphics and probably other awesome graphics in the
 * future
 * 
 * Also thanks to all the friends of mine who helped
 * without even knowing it by play testing all my levels
 */

/**Enum for directions */
const dir={Up:'up',Down:'down',Left:'left',Right:'right'}
/**Holds presets for all types of tiles*/
var T={
    SIZE:35,
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
    Portal:{name:'portal',type:undefined,id:undefined,hasImage:'portalA.png',color:'rgb(165,165,165)'}
}
/**
 * If just x and y are passed in, then returns board[y][x] which is (x,y)
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
 * @param {'b(x,y)'} byx The function b(x,y)
 * @argument args in as many types of tiles, i.e. T.Start, T.End etc. after b(x,y)
 * @example boardIs(b(x,y),T.End,T.Start) //returns true if board[y][x] (x,y) is any of the types passed in
 */
function boardIs(byx,args){
    var b=arguments[0]
    var arr=Array.from(arguments)
    arr.splice(0,1)
    for(let i=0;i<arr.length;i++)
        if(b.name===arr[i].name)
            return true;
    return false;
}

var curFloor=0,
    board=setFloorAs(T.Start,1,1)
    /**Holds all the HTML elements */
var HTML={}
    /**Holds the darts that fly across the screen */
var darts=[]
    /**Holds the traps that fire the darts */
var traps=[]
    /**Holds all the pickups on the map */
var pickups=[]

const testFloorNum=9001

/**This holds general data about the game */
var game={
    /**Tells if you have beaten the game */
    onEnd:false,
    /**Tells if the player can move */
    canMove:true,
    /**Holds total deaths */
    deaths:0,
    loops:0,
}  
    /**Tells whether to use the set debug settings */
var doDebug=true

/**This holds all variables for debug testing */
var debug={
    /**Invincible */
    inv:false,
    /**Determines if a sidebar with extra info can be activated */
    showInfo:true,
    /**Tells if to change the first floor to the value of debug.firstFloor */
    changeFirstFloor:false,
    /**The floor to change the first floor to */
    firstFloor:12,
    /**Infinite Keys */
    infKeys:false,
    /**Tells if you can hit / to load the next floor */
    nextFloor:true,
    /**Sets the floor to load when clicking p */
    quickLoad:testFloorNum,
    /**Determines if you can quick load a floor */
    doQuickLoad:true,
    /**If you can see the ids for portals */
    showPortalId:false,
    /**If the coordinates of each tile shows up */
    showCoords:true,
    /**Determines if clicking c shows the coords */
    canShowCoords:true,
}

class Counter{
    /**
     * A class for counting times a thing happens and running a function after that
     * @param {number} max The max number of times the counter can count till it does onComplete
     * @param {function} onComplete The function to run once the counter is complete
     */
    constructor(max,onComplete){
        if(max<=0)
            throw new RangeError('Max count must be positive and greater than 0')
        this._max=max
        this._cur=0
        this.onComplete=onComplete
    }
    count(){
        this._cur++;
        if(this._cur>=this._max){
            this.onComplete()
            this._cur=0
        }
    }
    reset(){
        this._cur=0;
    }
    set cur(val){
        this._cur=val
        while(this._cur>=this._max){
            this._cur-=this._max
            this.onComplete()
        }
    }
    set max(val){
        if(val<=0)
            throw new RangeError('Max count must be poitive and greater than 0')
        this._max=val
        while(this._cur>=this._max){
            this._cur-=this._max
            this.onComplete()
        }
    }
    get cur(){return this._cur}
    get max(){return this._max}
}

var _pickupOnRemoveAll=[]
class Pickup{
    /**
     * @param {number} x Map based x coord
     * @param {number} y Map based y coord
     * @param {number} height Height of the object
     * @param {number} width Width of the object
     * @param {string} color Color to draw the object as
     * @param {string} type The name of the type of object
     * @param {Function} onGrab The function to run when the obj is grabbed. Usually ()=>{counter++}
     * @param {Function} onRemove The function to run when the object gets removed. Usually ()=>{counter=0}
     * @param {string} img The route to the img name for the pickup if available
     */
    constructor(x,y,width=10,height=10,color='white',type='undefined',onGrab=()=>{},onRemove=()=>{},isCircle=false,img){
        this.x=(x*T.SIZE+T.SIZE/2-width/2)
        this.y=(y*T.SIZE+T.SIZE/2-height/2)
        this.width=width
        this.height=height
        this.color=color
        this.onGrab=onGrab
        this.type=type

        this.isCircle=isCircle

        Pickup._addRemoveFunc(type,onRemove)
        if(img)
            this.img=img
        this.toRemove=false
        pickups.push(this)
    }
    isPlayerCollide(){
        return!(((this.y+this.height)<(player.y))||
            (this.y>(player.y+player.height))||((this.x+this.width)<player.x)||(this.x>(player.x+player.width)));
    }
    checkPlayerCollide(){
        if(this.isPlayerCollide()){
            this.toRemove=true;
            this.onGrab();
        }
    }
    /**@param {CanvasRenderingContext2D}ctx*/
    draw(ctx){
        if(this.img){
            var newImg=document.createElement('img')
            newImg.src='gfx/'+this.img
            ctx.drawImage(newImg,this.x,this.y,this.width,this.height)
        }else{
            if(this.isCircle){
                ctx.beginPath();
                ctx.fillStyle=this.color
                ctx.ellipse(this.x+this.width/2,this.y+this.height/2,this.width/2,this.height/2,0,0,Math.PI*2)
                ctx.fill()
                ctx.stroke()
                ctx.closePath()
            }else{
                ctx.fillStyle=this.color
                ctx.fillRect(this.x,this.y,this.width,this.height)
                ctx.strokeRect(this.x,this.y,this.width,this.height)
            }
        }
    }
    static checkAllCollide(){
        for(let i=0;i<pickups.length;i++){
            pickups[i].checkPlayerCollide()
            if(pickups[i].toRemove)
                pickups.splice(i--,1)
        }
    }
    static removeAll(){
        pickups=[]
        _pickupOnRemoveAll.forEach(func=>func.func())
    }
    static _addRemoveFunc(type,func){
        var obj={type:type,func:func},
            toAdd=true
        for(let i=0;i<_pickupOnRemoveAll.length;i++){
            var other=_pickupOnRemoveAll[i]
            if(other.type===obj.type){
                toAdd=false
                break
            }
        }
        if(toAdd){
            _pickupOnRemoveAll.push(obj)
        }
    }
}

function ShieldPickup(x,y){
    return new Pickup(x,y,25,8,'saddleBrown','test',function(){player.hasShield=true},function(){player.hasShield=false},true)
}

/**Randomizes one array and shuffles the other in the same order */
function shuffleSimilar(arr1,arr2){
    var i, temp, temp2, j, len = arr1.length;
	for (i = 0; i < len; i++) {
		j = ~~(Math.random() * len);
        temp = arr1[i];
        temp2 = arr2[i]
        arr1[i] = arr1[j];
        arr2[i] = arr2[j]
        arr1[j] = temp;
        arr2[j] = temp2
	}
	return arr1;
}

/**
 * @returns true only with an n/d chance, else false
 * @param {number} n The numerator of the fractional chance
 * @param {number} d The denominator of the fractional chance
 */
function chance(n,d){return Math.floor(Math.random()*d)<n;}

/**Just a test function to make sure the chance function works */
function cTest(r,n,d){
    var out={true:0,false:0}
    for(let i=0;i<r;i++){out[chance(n,d)]++}
    console.log(out);
}

/**
 * Prints out an array into the console based on the backwards array I made. 
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

/**Allows function to copy an array instead of editing the original. Just so I don't have to keep writing this */
function copyArr(arr){
    var nArr=new Array(arr.length);
    var i=0;
    arr.forEach(ele=>{nArr[i++]=ele;})
    return nArr;
}

/**
 * A helper function for adding elements to the DOM
 * @param {string} id The id of the new element to add
 * @param {HTMLElement} parent The parent to append the new child to
 */
function addElement(id,parent){
    var ele=document.createElement('div');
    ele.id=id;
    parent.appendChild(ele);
    HTML[id]=ele;
    return ele
}


/**
 * @param {HTMLElement} ele 
 * @param {string[]} prop 
 */
function setStyles(ele,prop){
    var sty=ele.style
    prop.forEach(name=>{
        sty[name.name]=name.prop
    })
}

/**Creates all the HTML elements */
function boardInit(){
    addElement('board',document.body)
    addElement('midbar',HTML.board)

    var titleEle=document.createElement('h1');
    titleEle.innerHTML="Dungeon Crawler"
    HTML.title=titleEle
    HTML.midbar.appendChild(titleEle)
    
    addElement('info',HTML.midbar)
    addElement('help',HTML.midbar);

    var canvas=document.createElement('canvas')
    canvas.id='canvas'
    HTML.board.appendChild(canvas)
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
    x:0,y:0,dir:dir.Up,
    /**The player does not show when this is true */
    hidden:false,onLava:false,keys:0,
    /**Determines if the player can use their shield */
    hasShield:false,
    /**Inside joke */
    gay:false,
    /**The speed at which the player moves any direction */
    speed:5,
    width:16,height:16,color:'steelblue',
    /**All the info pertaining to the portal teleportation */
    portal:{
        hasTele:false,id:-1,type:''
    },
    /**Used for telling when to make the player red after being killed */
    hurt:{
        isHurt:false,
        /**counts the duration of being hurt */
        counter:new Counter(5,()=>{
            player.hurt.isHurt=false;
        })
    },
    /**Holds the directions that the player is trying to move */
    canMove:{
        up:false,down:false,left:false,right:false
    },
    /**Holds all info on the state of the player's shield blocking */
    block:{
        /**Counts the duration of the blocking */
        counter:new Counter(8,()=>{
            player.block.isBlock=false
            player.shield.active=false
        }),
        /**Counts how long the delay lasts */
        delayCounter:new Counter(9,()=>{
            player.block.canBlock=true
        }),
        /**This is if you are currently attacking */
        isBlock:false,
        /**Direction of the shield */
        dir:dir.Up,
        /**This is if you can block, usually after the delay*/
        canBlock:true,
    },
    shield:{
        x:0,y:0,color:'saddlebrown',
        //Width and height change based on direction
        width:6,height:25,
        //w and h are width and height initial values
        w:6,h:25,
        /**This is the space between where the shield is and the player */
        shift:11,
        /** This is if the shield is being used*/
        active:false,
        /**Tells if you can use the shield based off delay*/
        canSwing:true,
        /**Uses the shield */
        block(){
            //This part is setting the width and height based on direction
            switch(player.dir){
                case dir.Up:case dir.Down:this.width=this.h;this.height=this.w;break;
                case dir.Left:case dir.Right:this.width=this.w;this.height=this.h
            }
            this.x=player.x+player.width/2-this.width/2
            this.y=player.y+player.height/2-this.height/2
            switch(player.dir){
                case dir.Up:
                    this.y-=this.shift
                    break;
                case dir.Down:
                    this.y+=this.shift
                    break;
                case dir.Left:
                    this.x-=this.shift
                    break;
                case dir.Right:
                    this.x+=this.shift
                    break;
            }
            this.active=true
        }
    },
    /**Moves the player every tick and runs counters */
    move(){
        var dx=0,dy=0;
        //This is the actual movement calculation
        if(game.canMove&&!player.block.isBlock){
            if(player.canMove.up) dy-=1;
            if(player.canMove.down) dy+=1;
            if(player.canMove.left) dx-=1;
            if(player.canMove.right) dx+=1;
        }
        ///These are all counters for every tick
        //Counts when the player is hurt to tell when to be red
        if(player.hurt.isHurt)
            player.hurt.counter.count()
        

        //This is to check if you've blocked
        if(player.block.isBlock)
            player.block.counter.count()
        else if(!player.block.canBlock)
            player.block.delayCounter.count()

        if(dx===0^dy===0&&!player.block.isBlock){
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
        //Determines if the player can move, and if so then does
        if(!player.checkCollisions()){
            player.x-=dx*player.speed;
            player.y-=dy*player.speed;
        }
        //Runs some checks for stuff
        checkOnPortal();
        updateInfo()
        Pickup.checkAllCollide()
        if(debug.infKeys)
            player.keys=5;
    },
    /**Sets the players position on the map tiles */
    setPosition(x,y){
        if(x>=0&&x<board[0].length)
            player.x=x*T.SIZE+(1/2)*T.SIZE-(player.width/2);
        if(y>=0&&y<board.length)
            player.y=y*T.SIZE+(1/2)*T.SIZE-(player.height/2);
    },
    /**Puts the player onto the first start tile of the map */
    resetPosition(){
        for(var i=0;i<board.length;i++)
            for(var j=0;j<board[i].length;j++)
                if(b(j,i)===T.Start){
                    player.setPosition(j,i);
                    return true; 
                }
    },
    /**
    * Checks all corners of the player for movement
    * @returns true if the movement was successful and false if it was not
    */
    checkCollisions(){
        var pPoints=getRounded(player);
        player.onLava=false
        for(var i=0;i<pPoints.length;i++){
            var y=pPoints[i][1],x=pPoints[i][0];
            if(!checkTile(x,y))return false
        }
        return true
    },
    /**This is when the player dies, obviously*/
    kill(){
        player.hurt.isHurt=true
        if(!debug.inv){
            player.resetPosition()
            game.deaths++;
            player.shield.active=false
        }
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
    else if(boardIs(b(x,y),T.Wall,T.Trap))
        return false
    //Keys and locks
    else if(b(x,y)===T.Lock){
        if(player.keys>0){
            player.keys--;
            b(x,y,T.Path)
            return true;
        }else return false
    //Lava
    }else if(b(x,y)===T.Lava){
        if(!player.onLava){
            player.kill()
            return (player.onLava=true);
        }
    //Rocks
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
            return false;
        }
    //Portals
    }else if(b(x,y).name===T.Portal.name){
        if(!player.portal.hasTele||b(x,y).id!==player.portal.id||b(x,y).type!==player.portal.type){
            if(b(x,y).type==='C'){
                player.portal.type='C'
                player.portal.id=-1;
                player.setPosition(b(x,y).x,b(x,y).y)
            }
            player.portal.id=b(x,y).id
            
            player.portal.hasTele=true;
            var point=getOtherPortal(b(x,y))
            if(point){
                player.portal.type=b(point[0],point[1]).type
                player.setPosition(point[0],point[1])
                return false
            }
            return true
        }
        return true;
    }
    //Anything that doesn't return true by here returns undefined, which counts as false in an if so you can't move there
}



/**Get's the coord of the other portal for the same type */
function getOtherPortal(obj){
    for(let i=0;i<board.length;i++){
        for(let j=0;j<board[0].length;j++){
            var temp=b(j,i);
            //If it's a portal too, isn't the same type, but has the same id, then return (x,y) as an array
            if(temp.name===T.Portal.name&&temp.type!==obj.type&&temp.id===obj.id){
                return [j,i]
            }
        }
    }
}
/**Sets player.portal.hasTele to false if not on a portal and haven't teleported yet*/
function checkOnPortal(){
    var p=getRounded(player);
    for(let i=0;i<p.length;i++){
        var x=p[i][0],y=p[i][1];
        if(b(x,y).name===T.Portal.name)
            return;
    }
    player.portal.hasTele=false;
}

/**
 * @returns {number[]}an array of the values (start,end]
 * @param {number} start The start number of the array
 * @param {number} end The end number of the array, non-inclusive
 */
function rndNoRepeat(start,end){
    var range=(end-start),nums=new Array(range),i=0,temp;
    while(i<range){
        do temp=Math.floor(Math.random()*(range))+start
        while(nums.includes(temp));
        nums[i++]=temp;
    }
    return nums;
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

/**Updates the info on the info HTML */
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
    var str=''

    function debugSub(txt){str+='<br>'+txt}
    debugSub('Player Hurt: '+player.hurt.counter.cur+'/'+player.hurt.counter.max+'  '+player.hurt.isHurt)
    debugSub("Player Coords: ("+player.x+","+player.y+")")
    debugSub("Player dir: "+player.dir)
    debugSub("CurTile: "+b(roundPoint(player.x,player.y)[0],roundPoint(player.x,player.y)[1]).name)
    debugSub('player.portal.hasTele: '+player.portal.hasTele)
    debugSub('Player block: '+player.block.isBlock)
    debugSub('Player canBlock: '+player.block.canBlock)
    if(HTML.debug.innerHTML!==str)
        HTML.debug.innerHTML=str
}

/**
 * Adds a key at tile x and y for the floor. Do not use the new keyword
 * @param {number} x The x coord of the key
 * @param {number} y The y coord of the key
 */
function Key(x,y){
    new Pickup(x,y,15,20,'goldenrod','key',()=>{player.keys++},()=>{player.keys=0},false,'key.png')
}

/**
 * Adds multiple keys at once 
 * @argument Points [x1,y1],[x2,y2],... 
 */
function addKeys(){Array.from(arguments).forEach(key=>{Key(key[0],key[1])})}

/**Kind of a constructor, but done without the new keyword */
function Dart(x,y,direction){
    darts.push({
        width:10,height:10,direction:direction,
        x:x*T.SIZE+(1/2)*T.SIZE-5,y:(y*T.SIZE+(1/2)*T.SIZE-5),
        speed:4,toRemove:false,hasTele:false,color:'green',
        checkCollide(){
            var p=getRounded(this)
            this.hasTele=false;
            for(var i=0;i<p.length;i++){
                if(isCollide(player.shield,this)&&player.shield.active){
                    return !(this.toRemove=true)
                }
                if(isCollide(player,this)){
                    player.kill()
                    return!(this.toRemove=true)
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

/**Flags all darts to be removed */
function removeDarts(){darts.forEach(d=>{d.toRemove=true});traps=[];}

/**Moves all darts and removes any that need to be*/
function moveDarts(){
    for(let i=0;i<darts.length;i++){
        darts[i].move();
        if(darts[i].toRemove) darts.splice(i--,1);
    }
}

/**Increments all traps delay to set when to fire */
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

document.addEventListener('keydown',(event)=>{
    eventHelper(event,true)
    if(event.key===' '&&player.block.canBlock&&player.shield.canSwing&&player.hasShield){
        player.block.isBlock=true
        player.block.canBlock=false;
        player.shield.block()
    }
});
document.addEventListener('keyup',(event)=>{
    eventHelper(event,false);
    if(event.key==='r')
        loadFloor(curFloor);
    if(event.key==='/'&&debug.nextFloor)
        nextFloor()
    if(event.key==='.'&&debug.nextFloor)
        loadFloor((curFloor-1>=0)?curFloor-1:curFloor)
    if(event.key==="Enter")
        if(game.onEnd){
            loadFloor(0)
            game.onEnd=false;
            player.hidden=false
            game.loops++;
            game.deaths=0;
            player.shield.canSwing=true;
        }
    if(event.key==='l'&&debug.doQuickLoad)
        loadFloor(debug.quickLoad)
    if(event.key==='c'&&debug.canShowCoords)
        debug.showCoords^=true;
})

/**Helper function for adding movement event listeners to remove repetition */
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
    /**
     * @param {any} x The x to draw or the object to draw
     * @param {number|boolean} y The y to draw or if the color of the object shouldn't be used
     */
    function rect(x,y,width,height,color){
        if(typeof x==='object'){
            y=x.y
            width=x.width
            height=x.height
            x=x.x
        }
        if(color)
            ctx.fillStyle=color;
        ctx.fillRect(x,y,width,height)
        ctx.strokeRect(x,y,width,height)
    }
    function circle(x,y,rad,color){
        if(typeof x === 'object'){
            y=x.y+x.height/2
            rad=x.width/2
            x=x.x+x.width/2
        }
        ctx.beginPath();
        if(color)
            ctx.fillStyle=color
        ctx.arc(x,y,rad,0,2*Math.PI)
        ctx.fill()
        ctx.stroke()
        ctx.closePath()
    }
    //Draw all the tiles first
    var by=0,bx=0;
    board.forEach(y=>{
        bx=0;
        y.forEach(x=>{
            //Draw tiles first
            ctx.fillStyle=x.color;
            rect(bx*T.SIZE,by*T.SIZE,T.SIZE,T.SIZE)
            //Images go on top
            if(x.hasImage){
                var img=document.createElement('img')
                img.src='gfx/'+x.hasImage;
                ctx.drawImage(img,bx*T.SIZE,by*T.SIZE,T.SIZE-1,T.SIZE-1)
                ctx.strokeRect(bx*T.Size,by*T.SIZE,T.SIZE,T.SIZE)
            }   
            //Draw Portal ids
            if(x.name===T.Portal.name&&(debug.showPortalId||debug.showCoords)){
                if(x.type==='A')
                    ctx.strokeStyle='blue'
                else
                    ctx.strokeStyle='brown'
                ctx.strokeText(x.id,(bx+1)*T.SIZE-12,(by+1)*T.SIZE-3)
                ctx.strokeStyle='black'
            }
            //Draw coords on tiles
            if(debug.showCoords){
                ctx.strokeStyle='rgba(10,10,10,0.5)'
                ctx.strokeText("("+bx+','+by+')',bx*T.SIZE+2,by*T.SIZE+10)
                ctx.strokeStyle='black'
            }
            bx++
        }) 
        by++
    })

    darts.forEach(dart=>{
        ctx.fillStyle=dart.color
        circle(dart)
    })
    pickups.forEach(pickup=>{
        ctx.fillStyle=pickup.color
        pickup.draw(ctx)
    })
    //Draw the shield
    if(player.shield.active){
        var s=player.shield
        ctx.beginPath()
        ctx.fillStyle=player.shield.color
        ctx.ellipse(s.x+s.width/2,s.y+s.height/2,s.width/2,s.height/2,0,0,Math.PI*2)
        ctx.fill()
        ctx.stroke()
        ctx.closePath()
    }

    //Player color
    if(player.hurt.hurtCount>0||player.hurt.isHurt){
        ctx.fillStyle='red'
    }else if(player.gay){
        var grad=ctx.createLinearGradient(player.x,player.y,player.x+player.width,player.y)
        var col=['red','orange','yellow','green','blue','violet']
        var inc=1/(col.length-1)
        for(let i=0;i<=1;i+=inc){
            i=Math.round(i*10)/10
            grad.addColorStop(i,col[i*5])
        }
        ctx.fillStyle=grad;
    }else
        ctx.fillStyle=player.color
    
    if(!player.hidden)
        rect(player,true)
    
    if(player.hurt.isHurt)
        

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
}

boardInit();
var playerMove=setInterval(player.move,60);
var dartMove=setInterval(moveDarts,60);
var shootDart=setInterval(addDarts,60)
var draw=setInterval(drawAll,10)