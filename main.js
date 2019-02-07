/*
 * Special thanks to Sarah and Noble for making the awesome portal
 * graphics and probably other awesome graphics in the
 * future
 * 
 * Also thanks to all the friends of mine who helped
 * without even knowing it by play testing all my levels
 */
const version='0.1.0'

/**Tells whether to use the set debug settings */
var doDebug=false

/**Enum for directions */
const Dir={Up:'up',Down:'down',Left:'left',Right:'right'}

if(localStorage['version']!==version){
    localStorage['version']=version
    localStorage['lowTime']='9999:99.99'
}

/**Enum for difficulty */
const Difficulty={Easy:'easy',Normal:'normal',Hard:'hard'}

/**Enum for menu */
const Menu={
    title:'title',
    inGame:'inGame',
    pause:'pause',
}

var menu=Menu.title
/**@type {CanvasRenderingContext2D} */
var ctx

/**Holds the location to spawn for a single floor */
var spawnPoint=false
/**Only used in hard difficulty. Tells what floor to respawn at. */
var goldSpawnFloor=false

function Tile(name,color,hasImage,otherProps){
    this.name=name;this.color=color;this.hasImage=hasImage
    this.size=35;this.width=this.size;this.height=this.size
    this.is=function(...others){
        for(let i=0;i<others.length;i++){
            if(typeof others[i]==='string'&&others[i]===this.name)
                return true
            if(this.name===others[i].name)
                return true
        }
        return false
    }
    Object.assign(this,otherProps)
}
function subTile(tile,subName,otherProps){
    return Object.assign(tile,{subName:subName},otherProps)
}

var Tn={
    //These are all tiles with distinct properties
    Wall(color='rgb(78,78,78)',hasImage){return new Tile('wall',color,hasImage)},
    Path(color='rgb(165,165,165)',hasImage){return new Tile('path',color,hasImage)},
    Lava(color='maroon',hasImage){return new Tile('lava',color,hasImage)},
    Lock(color='rgb(165,165,165)',hasImage='lock.png'){return new Tile('lock',color,hasImage)},
    Start(color='white',hasImage){return new Tile('start',color,hasImage)},
    End(color='gold',hasImage){return new Tile('end',color,hasImage)},
    Rock(color='rgb(165,165,165)',hasImage='rock.png'){return new Tile('rock',color,hasImage)},
    NoRock(color='rgb(135,135,135)',hasImage){return new Tile('noRock',color,hasImage)},
    Trap(dir=Dir.Up,delay=30,speed,color='peru',hasImage='trap.png'){return new Tile('trap',color,hasImage,{speed:speed,dir:dir,delay:delay})},
    Portal(type,id,color='rgb(165,165,165)',hasImage='portal'+type+'.png'){return new Tile('portal',color,hasImage,{id:id,type:type})},
    OneWayPortal(x,y,color='rgb(165,165,165)',hasImage='portalC.png'){return subTile(Tn.Portal('C',-1,color,hasImage),'oneWayPortal',{x:x,y:y})},//new Tile('portal',color,hasImage,{type:'C',x:x,y:y})},
    //These are predefined subtypes of other type of tiles which do nothing different
    Bars(){return subTile(Tn.Wall(undefined,'bars.png'),'bars')},
    Hidden(){return subTile(Tn.Path('rgb(65,65,65)'),'hidden')},
    FakeLava(){return subTile(Tn.Path('#600000'),'fakeLava')}
}
//Makes lowercase properties of everything for the is function
for(var type in Tn){
    var name=Tn[type]().name
    if(!Tn[name])
        Object.defineProperty(Tn,name,{value:name})
}

Object.defineProperty(Tn,'SIZE',{value:35,})

/**
 * If just x and y are passed in, then returns board[y][x] which is (x,y)
 * If type is passed in, sets board[y][x] (x,y) to the type passed in
 */
function b(x,y,type){
    //This is used as a setter if type is passed in
    if(type){
        //Dynamically removes traps if replaced
        if(board[y][x].is(Tn.trap)){
            for(let i=0;i<traps.length;i++){
                if(traps[i].x===x&&traps[i].y===y){
                    traps.splice(i,1)
                    break;
                }
            }
        }
        //Allows traps to be added dynamically
        if(type.is(Tn.trap)){
            traps.push(trapObject(x,y,type.dir,type.delay,type.speed))
        }
        //Assigns the properies of the type to a new object so they don't all reference the same object
        board[y][x]=type;
    }else
        return board[y][x];
}

function trapObject(x,y,dir,delay,speed){
    return {
        x:x,
        y:y,
        dir:dir,
        delay:delay,
        count:0,
        speed:speed,
        fire(){
            if(this.count>=this.delay){
                this.count=0;
                Dart(this.x,this.y,this.dir,this.speed);
            }
            else this.count++;
        }
    }
}

var curFloor=0,
    board=setFloorAs(Tn.Start(),1,1)
    /**Holds all the HTML elements */
var HTML={}
    /**Holds the darts that fly across the screen */
var darts=[]
    /**Holds the traps that fire the darts */
var traps=[]
    /**Holds all the pickups on the map */
var pickups=[]

/**This holds general data about the game */
var game={
    /**Tells if you have beaten the game */
    onEnd:false,
    /**Tells if the player can move */
    canMove:true,
    /**Holds total deaths */
    deaths:0,
    curFloorDeaths:0,
    loops:localStorage['gameLoops']||0,
    /**Determines many things, like respawn behavior and such */
    difficulty:{
        cur:Difficulty.Easy,
        toEasy(){game.difficulty.cur=Difficulty.Easy},
        toNormal(){game.difficulty.cur=Difficulty.Normal},
        toHard(){game.difficulty.cur=Difficulty.Hard},
        isEasy(){return game.difficulty.cur===Difficulty.Easy},
        isNormal(){return game.difficulty.cur===Difficulty.Normal},
        isHard(){return game.difficulty.cur===Difficulty.Hard}
    },
    lowTime:localStorage['lowTime']||'9999:99.99'
}  


/**This holds all variables for debug testing */
var debug={
    /**Invincible */
    inv:false,
    /**Determines if a sidebar with extra info can be activated */
    showInfo:true,
    /**Tells if to change the first floor to the value of debug.firstFloor */
    changeFirstFloor:true,
    /**The floor to change the first floor to */
    firstFloor:16,
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
    /**Can click on a tile to teleport to it */
    clickTele:true,
}

/**Randomizes one array and shuffles the other in the same order */
function shuffleSimilar(arr1,arr2){
    var i,temp,temp2,j,len=arr1.length;
	for (i=0;i<len;i++){
		j = ~~(Math.random()*len);
        temp=arr1[i];
        temp2=arr2[i]
        arr1[i]=arr1[j];
        arr2[i]=arr2[j]
        arr1[j]=temp;
        arr2[j]=temp2
	}
	return arr1;
}

/**Randomizes an array */
function shuffleArr(arr){
    var i,temp,j,len=arr.length;
	for (i=0;i<len;i++){
		j = ~~(Math.random()*len);
        temp=arr[i];
        arr[i]=arr[j];
        arr[j]=temp;
	}
	return arr;
}

/**
 * @returns true only with an n/d chance, else false
 * @param {number} n The numerator of the fractional chance
 * @param {number} d The denominator of the fractional chance
 */
function chance(n,d){return (d)?Math.floor(Math.random()*d)<n:chance(1,n)}

/**
 * Prints out an array into the console based on the backwards array I made. 
 * Only prints len letters of each part
 */
function printArr(arr,len=5){
    var str='\n',
        colors=[]
    arr.forEach(y=>{
        y.forEach(x=>{
            var toAdd=''
            if(x.name.length>=len) toAdd=x.name.substring(0,len)+'  ';
            else toAdd=x.name+'.'.repeat(len-x.name.length)+'  ' 
            str+='%c'+toAdd
            colors.push('color:'+x.color)
        })
        str+='\n'
    })
    console.log(str,...colors);   
}

/**Fancily prints the board in the console */
function printBoard(){
    var str='\n',
        colors=[]

    function sp(txt){
        var ele=document.createElement('div')
        ele.innerHTML=txt
        return ele.innerHTML
    }
    
    board.forEach(y=>{
        y.forEach(x=>{
            var toAdd='',overrideColor=false
            if(x.is(Tn.start)){
                toAdd=sp('&#9654;')+sp('&#9664;')
                overrideColor='black'
            }else if(x.is(Tn.trap)){
                toAdd=(x.dir===Dir.Up)?'/\\':(x.dir===Dir.Down)?'\\/':(x.dir===Dir.Right)?'->':'<-'
            }else{
                toAdd=sp('&#9608;')+sp('&#9608;')
            }
            str+='%c'+toAdd
            colors.push(`color:${(overrideColor)?overrideColor:x.color}`)
        })
        str+='\n'
    })
    console.log(str,...colors);   
}

/**Allows function to copy an array instead of editing the original. Just so I don't have to keep writing this */
function copyArr(arr){
    return arr.slice();
}

/**Creates all the HTML elements */
function boardInit(){
    /**Helper for making a new div and appending it to parent */
    function addElement(id,parent){
        var ele=document.createElement('div');
        ele.id=id;
        parent.appendChild(ele);
        HTML[id]=ele;
        return ele
    }

    addElement('board',document.body)
    addElement('midbar',HTML.board)

    var titleEle=document.createElement('h1');
    titleEle.innerHTML="Dungeon Crawler"
    HTML.title=titleEle
    HTML.midbar.appendChild(titleEle)
    
    addElement('info',HTML.midbar)
    addElement('time',HTML.midbar)
    addElement('help',HTML.midbar);

    var canvas=document.createElement('canvas')
    canvas.id='canvas'
    HTML.board.appendChild(canvas)
    HTML.canvas=canvas
    ctx=canvas.getContext('2d')
    addElement('debug',HTML.board)

    //Adds an event for if you have click teleporting active
    canvas.addEventListener('click',(event)=>{
        if(debug.clickTele){
            var rp=roundPoint(event.x-canvas.offsetLeft,event.y-canvas.offsetTop)
            player.setPosition(rp[0],rp[1])
        }
    })

    updateInfo()
    loadFloor(curFloor-1);
    nextFloor()
}

/**
 * @returns true if a collides with b
 * @param {Object} a is the player usually
 * @param {Object} b Object 2
 */
function isCollide(a,b){return!(((a.y+a.height)<(b.y))||
    (a.y>(b.y+b.height))||((a.x+a.width)<b.x)||(a.x>(b.x+b.width)));}

var player={
    x:0,y:0,dir:Dir.Up,
    /**The player does not show when this is true */
    hidden:false,onLava:false,keys:0,
    /**Determines if the player can use their shield */
    hasShield:false,
    /**Inside joke */
    gay:false,
    /**The speed at which the player moves any direction */
    speed:5,
    /**The initial speed of the player */
    defaultSpeed:5,
    width:16,height:16,color:'steelblue',
    /**To be implemented. Protects from a single death */
    armor:0,
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
        }),
    },
    /**Holds the colors for different states of the player */
    colors:{
        /**Standard color of the player */
        default:'steelblue',
        /**If the player is hurt */
        hurt:'red',
        /**When the player has armor */
        armor:'grey',
        /**When the player is invincible */
        inv:'goldenrod'
    },
    /**Holds the directions that the player is trying to move */
    canMove:{
        up:false,down:false,left:false,right:false
    },
    /**Holds all info on the state of the player's shield blocking */
    block:{
        /**Counts the duration of the blocking */
        counter:new Counter(9,()=>{
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
        dir:Dir.Up,
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
        /**Uses the shield */
        block(){
            //This part is setting the width and height based on direction
            switch(player.dir){
                case Dir.Up:case Dir.Down:this.width=this.h;this.height=this.w;break;
                case Dir.Left:case Dir.Right:this.width=this.w;this.height=this.h
            }
            this.x=player.x+player.width/2-this.width/2
            this.y=player.y+player.height/2-this.height/2
            switch(player.dir){
                case Dir.Up:
                    this.y-=this.shift
                    break;
                case Dir.Down:
                    this.y+=this.shift
                    break;
                case Dir.Left:
                    this.x-=this.shift
                    break;
                case Dir.Right:
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
        //You're not blocking but you still can't block, i.e. cooldown
        else if(!player.block.canBlock)
            player.block.delayCounter.count()

        //Only moving a single direction and you're not blocking
        if(dx===0^dy===0&&!player.block.isBlock){
            if(dx!==0){
                switch(dx){
                    case 1:player.dir=Dir.Right;break;
                    case -1:player.dir=Dir.Left;break;
                }
                player.x+=dx*player.speed;
            }else{
                switch(dy){
                    case 1:player.dir=Dir.Down;break;
                    case -1:player.dir=Dir.Up;break;
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

        //Moves all the enemies towards their next point
        enemies.forEach(enemy=>enemy.moveToNextPoint())
        Enemy.checkAllCollide()
        //Pick the color only if you can see the player
        if(!player.hidden)
            player.setColor()
        if(debug.infKeys)
            player.keys=5;

        addAndMoveDarts()
    },
    /**Sets the players position on the map tiles */
    setPosition(x,y){
        if(x>=0&&x<board[0].length)
            player.x=x*Tn.SIZE+(1/2)*Tn.SIZE-(player.width/2);
        if(y>=0&&y<board.length)
            player.y=y*Tn.SIZE+(1/2)*Tn.SIZE-(player.height/2);
    },
    /**Puts the player onto the first start tile of the map */
    resetPosition(){
        for(var i=0;i<board.length;i++)
            for(var j=0;j<board[i].length;j++)
                if(b(j,i).is(Tn.start)){
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
    /**Sets the player's color based on certain situations */
    setColor(){
        //Follows priority of inv, hurt, armor, gay, then normal
        if(debug.inv){
            if(player.color!==player.colors.inv)
                player.color=player.colors.inv
        }else if(player.hurt.isHurt){
            if(player.color!==player.colors.hurt)
                player.color=player.colors.hurt
        }else if(player.armor>0){
            if(player.color!==player.colors.armor)
                player.color=player.colors.armor
        }else if(player.gay){
            var ctx=HTML.canvas.getContext('2d')
            var grad=ctx.createLinearGradient(player.x,player.y,player.x+player.width,player.y)
            var col=['red','orange','yellow','green','blue','violet']
            var inc=1/(col.length-1)
            for(let i=0;i<=1;i+=inc){
                i=Math.round(i*10)/10
                grad.addColorStop(i,col[i*5])
            }
            player.color=grad
        }else{
            if(player.color!==player.colors.default)
                player.color=player.colors.default
        }
    },
    /**This is when the player dies, obviously*/
    kill(){
        player.hurt.isHurt=true
        //Not invincible and don't have armor
        if(!debug.inv&&player.armor<=0){
            //Different by difficulty
            switch(game.difficulty.cur){
                case Difficulty.Easy:
                    player.resetPosition()
                    game.curFloorDeaths++
                    break;
                case Difficulty.Normal:
                    loadFloor(curFloor)
                    game.curFloorDeaths++
                    break;
                case Difficulty.Hard:
                    loadFloor((goldSpawnFloor)?goldSpawnFloor:0)
                    break;
            }
            game.deaths++;
            player.shield.active=false
        }if(player.armor>0&&!debug.inv){
            player.armor--
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
    var cur=b(x,y)
    if(cur.is(Tn.path,Tn.start,Tn.noRock))
        return true;
    else if(cur.is(Tn.end)){
        spawnPoint=false
        nextFloor();
    }else if(cur.is(Tn.wall,Tn.trap))
        return false
    //Keys and locks
    else if(cur.is(Tn.lock)){
        if(player.keys>0){
            player.keys--;
            b(x,y,Tn.Path())
            //Returns false so the player has a small pause when unlocking a lock
            return false;
        }else return false
    //Lava
    }else if(cur.is(Tn.lava)){
        if(!player.onLava){
            player.kill()
            if(debug.inv)
                return true
            return (player.onLava=true);
        }
    //Rocks
    }else if(cur.is(Tn.rock)){
        var xCheck=x,yCheck=y;
        switch(player.dir){
            case Dir.Up:yCheck--;break;
            case Dir.Down:yCheck++;break;
            case Dir.Left:xCheck--;break;
            case Dir.Right:xCheck++;break;
        }
        if(checkRockTile(xCheck,yCheck)){
            if(b(xCheck,yCheck).is(Tn.lava)){
                b(xCheck,yCheck,Tn.Path())
                b(x,y,Tn.Path())
            }else{
                b(xCheck,yCheck,Tn.Rock())
                b(x,y,Tn.Path())
            }
            return false;
        }
    //Portals
    }else if(cur.is(Tn.portal)){
        if(!player.portal.hasTele||cur.id!==player.portal.id||cur.type!==player.portal.type){
            if(cur.type==='C'){
                player.portal.type='C'
                player.portal.id=-1;
                player.setPosition(cur.x,cur.y)
            }
            player.portal.id=cur.id
            
            player.portal.hasTele=true;
            var point=getOtherPortal(cur)
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
            if(temp.is(Tn.portal)&&temp.type!==obj.type&&temp.id===obj.id){
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
        if(b(x,y).is(Tn.portal))
            return;
    }
    player.portal.hasTele=false;
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
function roundPoint(x,y){return[Math.floor(x/Tn.SIZE),Math.floor(y/Tn.SIZE)];}
/**@returns the exact coord of the map point from the center of the tile */
function unroundPoint(x,y,obj){return[x*Tn.SIZE+Tn.SIZE/2-((obj)?obj.width/2:0),y*Tn.SIZE+Tn.SIZE/2-((obj)?obj.height/2:0)]}

var startTime=Date.now(),
    curTime=Date.now(),
    timeDuration=0

/**Updates the info on the info HTML */
function updateInfo(){
    var ele = document.getElementById('info');
    var str=`Floor: ${curFloor}, Keys: ${player.keys},  Deaths: ${game.deaths}`
    
    if(game.loops>0)
        str+=`,  Game Loops: ${game.loops}`;

    if(ele.innerHTML!==str)
        ele.innerHTML=str;


    //Holds the counting feature
    str='Time: '+Clock.toString()+'<br>Fastest Time: '+game.lowTime
    
    //Only do it if there's something new to change
    if(HTML.time.innerHTML!==str)
        HTML.time.innerHTML=str
    if(debug.showInfo)
        updateDebugInfo()
    else if(!debug.showInfo&&HTML.debug.style.display!=='none')
        HTML.debug.style.display='none'
}

/**Pass in a function that returns a string. Adds something to the side bar for debug */
function debugStr(func){
    _debugStrFunc.push(func)
}

var _debugStrFunc=[
    ()=>{return `Player Hurt: ${player.hurt.counter.toString()}  ${player.hurt.isHurt}`},
    ()=>{return `Player Coords: ${player.x} ${player.y}}`},
    ()=>{return `Player dir: ${player.dir}`},
    ()=>{return `CurTile: ${b(roundPoint(player.x,player.y)[0],roundPoint(player.x,player.y)[1]).name}`},
    ()=>{return `player.portal.hasTele: ${player.portal.hasTele}`},
    ()=>{return `Player block: ${player.block.isBlock}`},
    ()=>{return `Player canBlock: ${player.block.canBlock}`},
    ()=>{return `CurFloor Deaths: ${game.curFloorDeaths}`},
    ()=>{return `Player Armor: ${player.armor}`},
    ()=>{return `Perf. Test: ${perf0-perf1}`}
]
/**This new system for debug info allows active altering of the debug window */
function updateDebugInfo(){
    if(HTML.debug.style.display!=='block')
        HTML.debug.style.display='block'
    var str=''
    _debugStrFunc.forEach(func=>{str+='<br>'+func()})
    if(HTML.debug.innerHTML!==str)
        HTML.debug.innerHTML=str
}

/**
 * Adds a key at tile x and y for the floor. Do not use the new keyword
 * @param {number} x The x coord of the key
 * @param {number} y The y coord of the key
 */
function pKey(x,y,id=_nextId()){
    new Pickup(x,y,{width:15,height:20,color:'goldenrod',type:'key',onGrab:()=>{player.keys++},onRemove:()=>{player.keys=0},img:'key.png',id:id})
}

/**
 * Adds multiple keys at once 
 * @argument Points [x1,y1],[x2,y2],... 
 */
function addKeys(){Array.from(arguments).forEach(key=>{pKey(key[0],key[1])})}

/**Kind of a constructor, but done without the new keyword */
function Dart(x,y,dir,speed=4){
    darts.push({
        width:10,height:10,dir:dir,
        x:x*Tn.SIZE+(1/2)*Tn.SIZE-5,y:(y*Tn.SIZE+(1/2)*Tn.SIZE-5),
        speed:speed,toRemove:false,hasTele:false,color:'green',
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
            switch(this.dir){
                case(Dir.Up):this.y-=this.speed;break;
                case(Dir.Down):this.y+=this.speed;break;
                case(Dir.Left):this.x-=this.speed;break;
                case(Dir.Right):this.x+=this.speed;break;
            }
            this.checkCollide();
        },checkTile(x,y){
            //Make sure it is on the board
            if(x<0||y<0||x>board[0].length-1||y>board.length-1)
                return false;
            //Tiles that can be shot through. Come here for new tiles
            if(b(x,y).is(Tn.path,Tn.start,Tn.end,Tn.lava,Tn.trap,Tn.noRock))
                return true;
            //Any that can't be shot through will return false here unless specified before
        }
    })
    //Returns the dart that it added
    return darts[darts.length-1]
}

/**Flags all darts to be removed and stops all traps*/
function removeDarts(){darts.forEach(d=>{d.toRemove=true});traps=[];}

/**Increments all traps delay to set when to fire */
function addAndMoveDarts(){
    traps.forEach(trap=>{
        trap.fire()
        //trap.trap.tick(trap.x,trap.y)
    })
    for(let i=0;i<darts.length;i++){
        darts[i].move();
        if(darts[i].toRemove) darts.splice(i--,1);
    }
}

function trapInit(){
    var i=0,j=0;
    board.forEach(y=>{
        j=0;
        y.forEach(x=>{
            if(x.is(Tn.trap))
                traps.push(trapObject(j,i,x.dir,x.delay,x.speed))
            j++
        })
        i++
    })
}

function getAllTileOfType(...types){
    var ret=[]
    board.forEach(x=>{
        x.forEach(y=>{
            if(y.is(...types))
                ret.push(y)
        })
    })
    return ret
}

function checkRockTile(x,y){
    //Make sure it's in bounds
    if(x<0||y<0||x>board[0].length-1||y>board.length-1)
        return false;
    //Pushable on paths and lava only
    if(b(x,y).is(Tn.path,Tn.lava))
        return true;
}

document.addEventListener('keydown',(event)=>{
    eventHelper(event,true)
    if(event.key===' '&&player.block.canBlock&&player.hasShield){
        player.block.isBlock=true
        player.block.canBlock=false;
        player.shield.block()
    }
});
document.addEventListener('keyup',(event)=>{
    eventHelper(event,false);
    //Reload the current floor
    if(event.key==='r')
        loadFloor(curFloor);
    //Go up a floor
    if(event.key==='/'&&debug.nextFloor)
        nextFloor()
    //Go back a floor
    if(event.key==='.'&&debug.nextFloor)
        loadFloor((curFloor-1>=0)?curFloor-1:curFloor)
    if(event.key==="Enter"&&game.onEnd){
            loadFloor(0)
            game.onEnd=false;
            player.hidden=false
            game.loops++;
            localStorage['gameLoops']=game.loops|0
            game.deaths=0;
    }if(event.key==='l'&&debug.doQuickLoad)
        loadFloor(debug.quickLoad)
    if(event.key==='c'&&debug.canShowCoords)
        debug.showCoords^=true;
    if(event.key==='i'&&doDebug)
        debug.showInfo^=true

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
    if(c.height!==board.length*Tn.SIZE)
        c.height=board.length*Tn.SIZE
    if(c.width!==board[0].length*Tn.SIZE)
        c.width=board[0].length*Tn.SIZE
    
    //var ctx = c.getContext('2d')
    //Clear the board first
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
        ctx.shadowOffsetX=2
        ctx.shadowOffsetY=2
        ctx.fillRect(x,y,width,height)
        ctx.shadowOffsetX=0
        ctx.shadowOffsetY=0
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
        ctx.shadowOffsetX=2
        ctx.shadowOffsetY=2
        ctx.fill()
        ctx.shadowOffsetX=0
        ctx.shadowOffsetY=0
        ctx.stroke()
        ctx.closePath()
    }
    function imgRotated(img,x,y,width,height,deg){
        if(typeof deg==='string')
            deg=dirToDeg(deg)
        ctx.save()
        ctx.translate(x+width/2,y+height/2)
        ctx.rotate(Math.PI*deg/180)
        ctx.drawImage(img,-width/2,-height/2,width,height)
        ctx.restore()
    }
    //Draw all the tiles first
    var by=0,bx=0;
    board.forEach(y=>{
        bx=0;
        y.forEach(x=>{
            //Draw tiles first
            ctx.fillStyle=x.color;
            rect(bx*Tn.SIZE,by*Tn.SIZE,Tn.SIZE,Tn.SIZE)
            //Images go on top
            if(x.hasImage){
                ctx.shadowOffsetX=2
                ctx.shadowOffsetY=2
                //Any tile with a dir property can be drawn rotated
                if(x.dir)
                    imgRotated(images.get(x.hasImage),bx*Tn.SIZE,by*Tn.SIZE,Tn.SIZE-1,Tn.SIZE-1,dirToDeg(x.dir))
                else
                    ctx.drawImage(images.get(x.hasImage),bx*Tn.SIZE,by*Tn.SIZE,Tn.SIZE-1,Tn.SIZE-1)
                ctx.shadowOffsetX=0
                ctx.shadowOffsetY=0
                ctx.strokeRect(bx*Tn.SIZE,by*Tn.SIZE,Tn.SIZE,Tn.SIZE)
            }   
            //Draw Portal ids
            if(x.is(Tn.portal)&&(debug.showPortalId||debug.showCoords)){
                if(x.type==='A')
                    ctx.strokeStyle='blue'
                else if(x.type==='B')
                    ctx.strokeStyle='brown'
                else if(x.type==='C')
                    ctx.strokeStyle='forestgreen'
                ctx.strokeText(x.id,(bx+1)*Tn.SIZE-12,(by+1)*Tn.SIZE-3)
                ctx.strokeStyle='black'
            }
            //Draw coords on tiles
            if(debug.showCoords){
                ctx.strokeStyle='rgba(10,10,10,0.5)'
                ctx.strokeText("("+bx+','+by+')',bx*Tn.SIZE+2,by*Tn.SIZE+10)
                ctx.strokeStyle='black'
            }
            bx++
        }) 
        by++
    })
    ctx.shadowOffsetX=3
    ctx.shadowOffsetY=3
    pickups.forEach(pickup=>{
        ctx.fillStyle=pickup.color
        pickup.draw(ctx)
    })
    ctx.shadowOffsetX=0
    ctx.shadowOffsetY=0

    enemies.forEach(enemy=>enemy.draw())

    darts.forEach(dart=>{
        imgRotated(images.get('dart.png'),dart.x,dart.y,dart.width,dart.height,dirToDeg(dart.dir))
    })

    //Draw the shield
    if(player.shield.active){
        var s=player.shield
        ctx.beginPath()
        ctx.fillStyle=player.shield.color
        ctx.ellipse(s.x+s.width/2,s.y+s.height/2,s.width/2,s.height/2,0,0,Math.PI*2)
        ctx.shadowOffsetX=3
        ctx.shadowOffsetY=3
        ctx.fill()
        ctx.shadowOffsetX=0
        ctx.shadowOffsetY=0
        ctx.stroke()
        ctx.closePath()
    }
    if(!player.hidden){
        ctx.fillStyle=player.color
        rect(player)
    }
    //imgRotated(images.get('portalA.png'),1,0,70,70)
    ctx.stroke();
    ctx.closePath()
    circle(0,0,0)
}

function dirToDeg(dir){
    switch(dir){
        case Dir.Right:return 90;
        case Dir.Left:return -90;
        case Dir.Down:return 180;
        case Dir.Up:return 0;
    }
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
    debug.canShowCoords=false
    debug.clickTele=false
}

var move=false
function setMovement(bool){
    if(bool){
        if(!move)
            move=setInterval(player.move,60)
    }else{
        clearInterval(move)
        move=false
    }
}
function animate(){
    requestAnimationFrame(animate)
    drawAll()
}
boardInit();
var move=setInterval(()=>{player.move()},60);
animate()
drawAll()

function reset(isHard=false){
    if(isHard){
        localStorage['gameLoops']=0
        localStorage['lowTime']='9999:99.99'
        game.loops=0
        game.lowTime='9999:99.99'
        loadFloor(0)
    }else
        loadFloor(0)
}
var perf1=0,perf0=0
//Pausing
window.addEventListener('blur',(event)=>{
    setMovement(false)
    Clock.pause()
})
//Unpausing
window.addEventListener('focus',(event)=>{
    setMovement(true)
    Clock.resume()
})