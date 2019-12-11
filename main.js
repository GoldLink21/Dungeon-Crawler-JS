/*
 * Special thanks to Sarah and Noble for making the awesome portal
 * graphics and probably other awesome graphics in the
 * future
 * 
 * Also thanks to all the friends of mine who helped
 * without even knowing it by play testing all my levels
 */

/**
 * Uses x.y.z where z is small changes or bugfixes, y is new levels or big 
 * changes, and x will likely only mark the official release when it hits 1
 */
const version='0.3.0'

/**Tells whether to use the set debug settings */
var doDebug=false

var lastClickedPoint=v(0,0),
    clickEvent=new CustomEvent('clickOnTile')

const lsKey={
    achievements:'ach',
    lowTime:'lowTime',
    loops:'gameLoops',
    version:'version'
}

if(localStorage[lsKey.version]!==version){
    if(localStorage[lsKey.version]===undefined)
        localStorage[lsKey.version]='0.0.1'
    var points=localStorage[lsKey.version].split('.'),
        cur=version.split('.')
    //Clear time if has a different update with bigger fixes or new levels
    if(points[0]!==cur[0]||points[1]!==cur[1])
        localStorage[lsKey.lowTime]='9999:99.99'
    localStorage[lsKey.version]=version
}

/**Enum for difficulty */
const Difficulty={Easy:'easy',Normal:'normal',Hard:'hard'}

/**@type {CanvasRenderingContext2D} */
var ctx

/**Holds the location to spawn for a single floor */
var spawnPoint=false
/**Only used in hard difficulty. Tells what floor to respawn at. */
var goldSpawnFloor=false


/**
 * If just x and y are passed in, then returns board[y][x] which is (x,y)
 * If type is passed in, sets board[y][x] (x,y) to the type passed in
 */
function b(x,y,type){
    if(x>=board[0].length||x<0||y>=board.length||y<0)
        return
    //This is used as a setter if type is passed in
    if(type){
        if(typeof type ==='function')
            type=type()
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
            traps.push(new TrapObj(x,y,type.dir,type.delay,type.speed,type.startVal))
        }
        //Assigns the properies of the type to a new object so they don't all reference the same object
        board[y][x]=type;
    }else
        return board[y][x];
}

function trapAt(x,y){
    var t=traps.find(t=>t.x===x&&t.y===y)
    if(t===undefined)
        return false
    return t
}

var board=setFloorAs(Tn.Start,1,1)
    /**Holds all the HTML elements */
var HTML={}
    /**@type {{x:number,y:number,width:number,height:number,dir:string,color:string,speed:number}[]} */
var darts=[]
    /**@type {TrapObj[]}*/
var traps=[]
    /**@type {Pickup[]}*/
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
    loops:localStorage[lsKey.loops]||0,
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
    lowTime:localStorage[lsKey.lowTime]||'9999:99.99'
}  


/**This holds all variables for debug testing */
var debug={
    /**Invincible */
    inv:false,
    /**Determines if a sidebar with extra info can be activated */
    showInfo:false,
    /**Tells if to change the first floor to the value of debug.firstFloor */
    changeFirstFloor:false,
    /**The floor to change the first floor to */
    firstFloor:26,
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
/**@type {string[]} */
var achievements=localStorage[lsKey.achievements]||[]
if(typeof achievements==='string')
    achievements=achievements.split(',')

function giveAch(name,onAchieve=()=>{tell("You got the achievement "+name+"!")},
        showMulti=false,onMulti=()=>{tell("You got the achievement "+name+'... again')}){

    if(achievements.includes(name)){
        if(showMulti){
            onMulti()
            return true
        }else
            return false
    }
    achievements.push(name)
    localStorage[lsKey.achievements]=achievements
    onAchieve()
    return true
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
function chance(n,d){return(d)?Math.floor(Math.random()*d)<n:chance(1,n)}

function boardPostIntro(){

}

/**Creates all the HTML elements */
function boardInit(){
    /**Helper for making a new div and appending it to parent */
    function addElement(id,parent){
        var ele=document.createElement('div');
        ele.id=id;
        if(parent)
            parent.appendChild(ele);
        HTML[id]=ele;
        return ele
    }

    addElement('board',document.body)
    addElement('midbar',HTML.board)
    
    addElement('allInfo',HTML.midbar)

    addElement('info',HTML.allInfo)
    addElement('time',HTML.allInfo)
    addElement('help',HTML.allInfo);

    addElement('holder',HTML.board)


    

    let canvas=document.createElement('canvas')
    canvas.id='canvas'
    HTML.holder.appendChild(canvas)
    HTML.canvas=canvas
    ctx=canvas.getContext('2d')
    
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    

    var tell=addElement('tell',HTML.holder)
    tell.innerHTML="This is the tell<br>"
    var tellBtn=document.createElement('button')
    tellBtn.innerHTML='Okay'
    tell.appendChild(tellBtn)
    tell.style.display='none'
    tell.style.marginTop=HTML.canvas.style.marginTop

    //////////////////////////////////////////
    addElement('mm',document.body)
    makeMainMenuHome()
    /////////////////////////////////////////

    addElement('debug',HTML.board)

    addElement('mapMaker',HTML.board)

    //Adds an event for if you have click teleporting active
    canvas.addEventListener('click',(event)=>{
        let rect=canvas.getBoundingClientRect()
        let rp=roundPoint((event.x-rect.left)/scale,(event.y-rect.top)/scale)
        lastClickedPoint=rp
        document.dispatchEvent(clickEvent)
        if(debug.clickTele){
            player.setPosition(rp.x,rp.y)
        }
    })
}


function makeMainMenuHome(){
    let mm=HTML.mm
    mm.innerHTML="<h1>Dungeon Crawler</h1>"
    
    function addBtn(str,onclick){
        var btn=document.createElement('button')
        btn.innerHTML=str
        btn.onclick=onclick

        return btn
    }
    function addBr(n=1){
        for(let i=0;i<n;i++){
            let br=document.createElement('br')
            mm.appendChild(br)
        }
    }

    var startBtn=addBtn('Start Game',startGame)

    let easyb=addBtn("Easy",()=>{
        game.difficulty.toEasy()
        easyb.classList.add('selectedEasy')
        normalb.classList.remove('selectedNormal')
        hardb.classList.remove('selectedHard')

        diffDesc.innerHTML="This is the easiest difficulty. On death, you just respawn at the start"
    })

    let normalb=addBtn("Normal",()=>{
        game.difficulty.toNormal()

        easyb.classList.remove('selectedEasy')
        normalb.classList.add('selectedNormal')
        hardb.classList.remove('selectedHard')

        diffDesc.innerHTML='With this difficulty, the whole level resets upon death'
    })

    let hardb=addBtn("Hard",()=>{
        game.difficulty.toHard()

        easyb.classList.remove('selectedEasy')
        normalb.classList.remove('selectedNormal')
        hardb.classList.add('selectedHard')

        diffDesc.innerHTML="You'd have to be crazy to try this one. You restart the game upon death!"
    })

    var h2=document.createElement('h2')
    h2.innerHTML="Difficulty"

    var diffDesc=document.createElement('div')
    diffDesc.innerHTML='hello there'
    diffDesc.classList.add('diffDesc')

    addBr()
    mm.appendChild(startBtn)

    addBr(3)

    mm.appendChild(h2)
    mm.appendChild(easyb)
    mm.appendChild(normalb)
    mm.appendChild(hardb)
    addBr()
    mm.appendChild(diffDesc)

    easyb.click()
}

function makeMainMenuHelp(){

}

/**
 * @returns true if a collides with b
 * @param {Object} a is the player usually
 * @param {Object} b Object 2
 */
function isCollide(a,b){return!(((a.y+a.height)<(b.y))||
    (a.y>(b.y+b.height))||((a.x+a.width)<b.x)||(a.x>(b.x+b.width)));}

    /**@type {Player[]} */
    var _players=[]



var player=new Player()
//var p2=new Player()

var onEndOnce=false
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
        if(!onEndOnce){
            var wasInv=debug.inv
            if(!wasInv)
                debug.inv=true
            onEndOnce=true
            spawnPoint=false
            setTimeout(()=>{
                onEndOnce=false;
                nextFloor()
                if(!wasInv)
                    debug.inv=false
            },500)
        }
        return true
        //nextFloor();
    }else if(cur.is(Tn.wall,Tn.trap))
        return false
    //Keys and locks
    else if(cur.is(Tn.lock)){
        if(this.keys>0){
            this.keys--;
            b(x,y,b(x,y).tileUnder)
            //Returns false so the player has a small pause when unlocking a lock

            checkLocksOnFloor7()

            return false;
        }else return false
    //Lava
    }else if(cur.is(Tn.lava)){
        if(!this.onLava){
            this.kill(Tn.lava)
            if(debug.inv)
                return true
            return (this.onLava=true);
        }
    //Rocks
    }else if(cur.is(Tn.rock)){
        var xCheck=x,yCheck=y;
        switch(this.dir){
            case Dir.Up:yCheck--;break;
            case Dir.Down:yCheck++;break;
            case Dir.Left:xCheck--;break;
            case Dir.Right:xCheck++;break;
        }
        if(checkRockTile(xCheck,yCheck)){
            var next=b(xCheck,yCheck)
            if(next.is(Tn.lava)){
                b(xCheck,yCheck,b(x,y).tileUnder)
                b(x,y,b(x,y).tileUnder)
            }else if(next.is(Tn.rockSwitch)){
                next.onActivate()
                b(xCheck,yCheck,next.tileUnder)
                b(x,y,cur.tileUnder)
            }else{
                var t=cur.tileUnder
                var t2=b(xCheck,yCheck)
                b(xCheck,yCheck,Tn.Rock(b(xCheck,yCheck),b(x,y).hasImage))
                b(x,y,t)
                b(xCheck,yCheck).tileUnder=t2
            }
            return false;
        }
    //Portals
    }else if(cur.is(Tn.portal)){
        if(!this.portal.hasTele||cur.id!==this.portal.id||cur.type!==this.portal.type){
            if(cur.type==='C'){
                this.portal.type='C'
                this.portal.id=-1;
                this.setPosition(cur.x,cur.y)
            }
            this.portal.id=cur.id
            
            this.portal.hasTele=true;
            var point=getOtherPortal(cur)
            if(point){
                this.portal.type=b(point[0],point[1]).type
                this.setPosition(point[0],point[1])
                return false
            }
            return true
        }
        return true;
    }else if(cur.is(Tn.ice)){
        this.canMove.locked=this.dir
        return true
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

function uniqArr(a){
    var seen = {};
    return a.filter(function(item) {
        var k = JSON.stringify(item);
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    })
}

/**
 * @returns an array of the rounded points of each corner of the object 
 * @requires obj to have width and height property
 */
function getRounded(obj){
    var x=obj.x,y=obj.y,width=obj.width,height=obj.height;
    return uniqArr([roundPoint(x,y),roundPoint(x+width,y),roundPoint(x+width,y+height),roundPoint(x,y+height)])
}

/**@returns the tile coord of the point */
function roundPoint(x,y){return v(Math.floor(x/Tn.SIZE),Math.floor(y/Tn.SIZE));}
/**@returns the exact coord of the map point from the center of the tile */
function unroundPoint(x,y,obj){
    return v(x*Tn.SIZE+Tn.SIZE/2-((obj)?obj.width/2:0),y*Tn.SIZE+Tn.SIZE/2-((obj)?obj.height/2:0))
}

function checkLocksOnFloor7(){
    if(curFloor===9&&getAllTileOfType(Tn.lock).length===0){
        giveAch('floor7locks',()=>{tell("You got all the locks!! Have an achievement")},true,
                ()=>{tell("Why would you put yourself through this again? Just why?")})
        player.canMove.down=false
        player.canMove.left=false
        player.canMove.up=false
        player.canMove.right=false
    }
    
}

var startTime=Date.now(),
    curTime=Date.now(),
    timeDuration=0

/**Updates the info on the info HTML */
function updateInfo(){
    var ele = document.getElementById('info');
    var totalKeys='';
    _players.forEach(p=>totalKeys+=p.keys.toString().fontcolor(p.colors.default)+' , ')
    totalKeys=totalKeys.substr(0,totalKeys.length-3)
    var str=`Keys: `+`(${totalKeys})`.fontcolor('goldenrod')+`,  Deaths: `+`${game.deaths}`.fontcolor('red')
    
    if(game.loops>0)
        str+=`,  Game Loops: ${game.loops}`;

    if(achievements.length>0){
        str+=','+` Hidden Achievements: ${achievements.length}`.fontcolor('blue')
    }

    if(ele.innerHTML!==str)
        ele.innerHTML=str;


    //Holds the counting feature
    str='Time: '+Clock1.toString()+'&emsp;&emsp;Fastest Time: '+game.lowTime
    
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
    ()=>{return `Player Coords: ${player.x} ${player.y}`},
    ()=>{return `Player dir: ${player.dir}`},
    ()=>{return `CurTile: ${b(roundPoint(player.x,player.y).x,roundPoint(player.x,player.y).y).name}`},
    ()=>{return `player.portal.hasTele: ${player.portal.hasTele}`},
    ()=>`CurFloor Deaths: ${game.curFloorDeaths}`,
    ()=>`Player Armor: ${player.armor}`,
    ()=>"Locked dir: "+player.canMove.locked
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
function pKey(x,y,id=nextId("pickup")){
    return new Pickup(x,y,{width:15,height:20,color:'goldenrod',type:'key',onGrab:(p)=>
        {p.keys++},onRemove:()=>{_players.forEach(p=>p.keys=0)},img:'key.png',id:id})
}

/**
 * Adds multiple keys at once 
 * @argument {[number,number][]} pts 
 */
function addKeys(...pts){pts.forEach(key=>{pKey(key[0],key[1])})}

/**Kind of a constructor, but done without the new keyword */
function Dart(x,y,dir,speed=4){
    darts.push({
        width:10,height:10,dir:dir,
        x:x*Tn.SIZE+(1/2)*Tn.SIZE-5,y:(y*Tn.SIZE+(1/2)*Tn.SIZE-5),
        speed:speed,toRemove:false,hasTele:false,color:'green',
        checkCollide(){
            if(this.toRemove)   
                return false
            var p=getRounded(this)
            this.hasTele=false;
            if(_players.some(p=>isCollide(p,this))){
                this.getCollidingPlayer().kill('dart')
                return !(this.toRemove=true)
            }
            /*
            if(isCollide(player,this)){
                player.kill('dart')
                return !(this.toRemove=true)
            }*/
            for(var i=0;i<p.length;i++){
                if(!this.checkTile(p[i].x,p[i].y))
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
            if(b(x,y).is(Tn.path,Tn.start,Tn.end,Tn.lava,Tn.trap,Tn.noRock,Tn.ice))
                return true;
            //Any that can't be shot through will return false here unless specified before
        },
        getCollidingPlayer(){
            return _players.find(p=>isCollide(p,this))
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
                traps.push(new TrapObj(j,i,x.dir,x.delay,x.speed,x.startVal))
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
function getAllPointsOfTilesType(...types){
    var ret=[]
    var dx=0
    var dy=0
    board.forEach(x=>{
        dx=0
        x.forEach(y=>{
            if(y.is(...types))
                ret.push(v(dx,dy))

            dx++
        })
        dy++
    })
    return ret
}

function checkRockTile(x,y){
    //Make sure it's in bounds
    if(x<0||y<0||x>board[0].length-1||y>board.length-1)
        return false;
    //Pushable on paths and lava only
    if(b(x,y).is(Tn.path,Tn.lava,Tn.rockSwitch,Tn.ice))
        return true;
}

document.addEventListener('keydown',(event)=>{
    eventHelper(event,true)
    if(event.key===' '){
        onSpaceDown()
    }
    
});

document.addEventListener('keyup',event=>{
    if(event.key===' '){
        onSpaceUp()
    }
    
})

function onSpaceDown(){
    _players.forEach(p=>{
        if(p.activeItem&&(p.activeItem.logic.canUse||(p.activeItem.canToggle&&p.activeItem.toggleLetGo))){
            p.activeItem.use()
        }
    })
}

function onSpaceUp(){
    _players.forEach(p=>{
        if(p.activeItem&&p.activeItem.active&&(p.activeItem.infiniteActiveTime&&!p.activeItem.canToggle)){
            p.activeItem.active=false
        }else if(p.activeItem&&p.activeItem.canToggle){
            p.activeItem.toggleLetGo=true
        }
    })
}

function onEnterPressed(){
    if(game.onEnd){
        loadFloor(0)
        game.onEnd=false;
        //player.hidden=false
        _players.forEach(p=>p.hidden=false)
        game.loops++;
        localStorage[lsKey.loops]=game.loops
        game.deaths=0;
    }
}

document.addEventListener('keyup',(event)=>{
    eventHelper(event,false);
    //Reload the current floor
    if(event.key==='r'){
        if(curFloor===-2)
            player.resetPosition()
        
        loadFloor(curFloor);
    //Go up a floor
    }if(event.key==='/'&&debug.nextFloor){
        spawnPoint=false
        nextFloor()
    //Go back a floor
    }if(event.key==='.'&&debug.nextFloor){
        spawnPoint=false
        loadFloor((curFloor-1>=0)?curFloor-1:curFloor)
    }if(event.key==="Enter"){
        onEnterPressed()
    }if(event.key==='l'&&debug.doQuickLoad){
        loadFloor(debug.quickLoad)
    }if(event.key==='c'&&debug.canShowCoords){
        debug.showCoords^=true;
    }if(event.key==='i'&&doDebug){
        debug.showInfo^=true
    }if(event.key===' '&&HTML.tell.style.display==='block'){
        HTML.tell.lastElementChild.click()
    }
    
})

/**Helper function for adding movement event listeners to remove repetition */
function eventHelper(event,bool){
    if(['ArrowUp','w','W'].includes(event.key)){
        _players.forEach(p=>p.canMove.up=bool)
        //player.canMove.up=bool
    }else if(['ArrowDown','s','S'].includes(event.key)){
        _players.forEach(p=>p.canMove.down=bool)
        //player.canMove.down=bool
    }else if(['ArrowRight','d','D'].includes(event.key)){
        _players.forEach(p=>p.canMove.right=bool)
        //player.canMove.right=bool
    }else if(['ArrowLeft','a','A'].includes(event.key)){
        _players.forEach(p=>p.canMove.left=bool)
        //player.canMove.left=bool
    }
}

function shadow(x=0,y=x){
    //ctx.shadowOffsetX=x*scale
    //ctx.shadowOffsetY=y*scale
}

var drawAfterConst=[]

/*
drawAfterConst.push(function drawKeys(){
    var im=images.get('key.png'),
        c=HTML.canvas,
        wMax=c.width-15
    var dx=16,
        shift=3
    while(player.keys*dx+shift>wMax){
        dx--
    }
    while(false){

    }
    for(let i=0;i<player.keys;i++){
        shadow(1)
        ctx.drawImage(im,shift+i*dx,c.height-23,15,20)
        shadow()
    }
})

*/
var move=false
function setMovement(bool){
    if(bool){
        if(!move){
            move=setInterval(()=>{
                _players.forEach(p=>p.move())
                Player.moveEverythingElse()
            },60)
            Clock1.resume()
        }
    }else{
        clearInterval(move)
        move=false
        Clock1.pause()
    }
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
    debug.copyClickPoints=false
}

function reset(isHard=false){
    if(isHard){
        localStorage[lsKey.loops]=0
        localStorage[lsKey.lowTime]='9999:99.99'
        localStorage[lsKey.achievements]=''
        achievements=[]

        game.loops=0
        game.lowTime='9999:99.99'
        loadFloor(0)
    }else
        loadFloor(0)
}

function tell(str='NoMesages',btnStr='Okay',onclickExtra=()=>{}){
    setTimeout(()=>{
        setTimeout(()=>setMovement(false),5)

        /**@type {HTMLDivElement} */
        var t=HTML.tell
        
        t.innerHTML=str
        t.appendChild(document.createElement('br'))
        var btn=document.createElement('button')
        btn.innerHTML=btnStr
        btn.addEventListener('click',()=>{
            t.style.display='none'
            setMovement(true)
            onclickExtra()
        })
        t.appendChild(btn)

        t.style.display='block'
    },100)
    
}

function dialogue(...strs){
    var funcs=[]
    for(let i=0;i<strs.length;i++)
        funcs.push(()=>{tell(strs[i],(i===strs.length-1)?undefined:'Next',funcs[i+1])})   
    tell(strs[0],'Next',funcs[1])
}

function flipDir(dir){
    switch(dir){
        case Dir.Right:return Dir.Left
        case Dir.Left:return Dir.Right
        case Dir.Up:return Dir.Down
        case Dir.Down:return Dir.Up
    }
}

function intRange(start,end){    
    return Math.floor(Math.random()*(Math.abs(end-start)))+Math.min(start,end)
}