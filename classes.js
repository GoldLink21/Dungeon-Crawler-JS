function nextId(type='generic'){
    if(nextId["ID"+type]===undefined)
        nextId["ID"+type]=(function*(){var id=0;while(true)yield id++;})()
    return nextId["ID"+type].next().value
}
class Entity{
    constructor(x,y,width,height,color,{id=nextId("entity"),isCircle=false}={}){
        this.color=color
        this.width=width
        this.height=height
        this.x=(x*Tn.SIZE+Tn.SIZE/2-width/2)
        this.y=(y*Tn.SIZE+Tn.SIZE/2-height/2)
        this.active=true
        this.toRemove=false
        this.id=id
        this.isCircle=isCircle
        this.hasShadow=true
    }
    withId(val){
        this.id=val
        return this
    }
    withImg(img){
        this.img=img
        return this
    }
    setPosition(x,y){
        this.x=(x*Tn.SIZE+Tn.SIZE/2-width/2)
        this.y=(y*Tn.SIZE+Tn.SIZE/2-height/2)
        return this
    }
    draw(t){
        if(this.active){
            ctx.fillStyle=this.color
            if(this.hasShadow)
                shadow(2)

            if(this.img){
                ctx.drawImage(images.get(this.img),this.x,this.y,this.width,this.height)
            }else if(!this.isCircle){
                ctx.fillRect(this.x,this.y,this.width,this.height)
                shadow()
                ctx.strokeRect(this.x,this.y,this.width,this.height)
            }else{
                ctx.beginPath()
                ctx.ellipse((this.x+this.width/2),(this.y+this.height/2),(this.width/2),(this.height/2),0,0,Math.PI*2)
                ctx.fill()
                shadow()
                ctx.stroke()
                ctx.closePath()
            }
        }
    }
    setShadow(bool){
        this.hasShadow=bool
        return this
    }
    move(){}
    getCorners(){
        return getRounded(this)
    }
    isCollide(other){
        return isCollide(this,other)
    }
}

var entities=[]

//#region Small-Classes
class Counter{
    /**
     * A class for counting times a thing happens and running a function after that
     * @param {number} max The max number of times the counter can count till it does onComplete
     * @param {function} onComplete The function to run once the counter is complete
     */
    constructor(max,onComplete=()=>{}){
        if(max<=0)
            throw new RangeError('Max count must be positive and greater than 0')
        this._max=max
        this._cur=0
        this.onComplete=onComplete
    }
    count(n=1){
        this.cur+=n
        return this
    }
    reset(){
        this.cur=0;
        return this
    }
    toString(){
        return this.cur+'/'+this.max
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
        this.cur=this.cur
    }
    get cur(){return this._cur}
    get max(){return this._max}
}

/**Handles all the timing system. While it says milliseconds, it's actually in deciseconds to save on lag and precision */
var Clock1

class Clock{
    constructor(max,onComplete=()=>{}){
        this.milliseconds=0
        this.isPaused=false
        if(max){
            this.max=max
            this.onComplete=onComplete
        }
        this.start()
    }
    start(){
        if(!this.interval){
            this.isPaused=false
            var self=this
            this.interval=setInterval(()=>{
                self.milliseconds++;
                if(self.milliseconds>=self.max){
                    self.onComplete()
                    self.pause()
                }
            },10)
        }
    }
    pause(){
        clearInterval(this.interval);
        this.isPaused=true
        delete this.interval;
    }
    resume(){
        if(this.isPaused)this.start();
    }
    toString(){
        return Clock.parse(this.milliseconds)
    }
    static parse(milli){
        var sec=parseInt((milli/100)),
            min=parseInt(sec/60),
            mil=milli%100
        if(mil.toString().length===1)
            mil='0'+mil
        return min+':'+sec%60+'.'+mil
    }
    static unParse(str){
        var split=str.split(':'),
            t=split[1].split('.')
        return(parseInt(split[0]*6000)+parseInt(t[0]*100)+parseInt(t[1]))
    }
}

Clock1=new Clock()
//#endregion

class TrapObj{
    constructor(x,y,dir,delay,speed,startVal=0){
        this.x=x
        this.y=y
        this.dir=dir
        this.delay=delay
        this.speed=speed
        var t=this
        this.counter=new Counter(this.delay,function(){
            Dart(t.x,t.y,t.dir,t.speed)
        })
        this.counter.cur=startVal
    }
    fire(){
        this.counter.count()
    }
}

var _pickupOnRemoveAll=[]

class Pickup extends Entity{
    /**
     * Objects that appear on the map above a tile and are collected upon player collision. Any functions defined 
     * for preset types of pickups should be prefixed with a p and have the first three parameters x, y, and id
     * @param {string} type The name of the type of object
     * @param {Function} onGrab The function to run when the obj is grabbed. Usually ()=>{counter++}
     * @param {Function} onRemove The function to run when the object gets removed. Usually ()=>{counter=0}
     * @param {string} img The route to the img name for the pickup if available
     * @param {boolean} hidden Tells Whether to make the pickup hidden or not
     * @param {number} id The id for selecting a single pickup 
     * @example function pArmor(x,y,id)//This is the general structure for making a new pickup of any new class. They should not need more input than this
     */
    constructor(x,y,
            {width=10,height=10,color='white',type=nextId("pickupType"),id=nextId("pickup"),onGrab=(p)=>{},
            onRemove=()=>{},isCircle=false,img,addToArr=true,hidden=false,isActive=true}={})
    {
        super(x,y,width,height,color,{id:id,isCircle:isCircle})
        this.onGrab=onGrab
        /**Unique type for specific types of pickups. Used for telling which removal functions to run */
        this.type=type
        /**Unique id for each new Pickup, generated automatically. Can also be set beforehand */
        this.hidden=hidden
        this.isActive=isActive
        Pickup._addRemoveFunc(type,onRemove)
        //Only set this.img if there is an img
        if(img)
            this.img=img
        this.toRemove=false
        if(addToArr)
            pickups.push(this)

        this.self=this
    }
    withId(val){
        this.id=val
        return this
    }
    isPlayerCollide(){
        if(!this.isActive)
            return false
        return _players.some(p=>isCollide(this,p));
    }
    getCollidingPlayer(){
        return _players.find(p=>isCollide(p,this))
    }
    setActive(bool){
        this.isActive=bool
        this.hidden=!bool
    }
    checkPlayerCollide(){
        if(this.isPlayerCollide()){
            this.toRemove=true;
            this.onGrab(this.getCollidingPlayer());
        }
    }
    setPosition(x,y){
        this.x=(x*Tn.SIZE+Tn.SIZE/2-this.width/2)
        this.y=(y*Tn.SIZE+Tn.SIZE/2-this.height/2)
    }
    draw(){
        if(!this.otherDrawFunc)
            super.draw()
        else
            this.otherDrawFunc(this)
    }
    /**@param {function(Pickup)} func */
    setDrawFunc(func){
        this.otherDrawFunc=func
        return this
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
        _pickupOnRemoveAll=[]
    }
    static _addRemoveFunc(type,func){
        var obj={type:type,func:func},
            toAdd=true

        if(_pickupOnRemoveAll.filter(r=>{return r.type===obj.type}).length>0){
            toAdd=false
        }
        if(toAdd)
            _pickupOnRemoveAll.push(obj)
    }
    static getById(id){
        return pickups.find(x=>x.id==id)
    }
}

class Switch extends Pickup{
    /**
     * Class for pickups that you can't actually pick up, but instead can be activated and deactivated to do stuff.
     * They stay on the map after interactions which allows changing the map while playing. Prefix functions
     * defining switch types with an s
     * @param {number} x Map x
     * @param {number} y Map y
     * @param {Function} onActivate Function used on activation
     * @param {boolean} canDecativeate Tells if you can deactivate the switch for a different action
     * @param {Function} onDeactivate Function used on deactivation if canDeactivate
     * @param {string} inactiveColor The color before activation
     * @param {string} activeColor The color after being activated
     */
    constructor(x,y,
            {onActivate=()=>{},canDeactivate=false,onDeactivate,inactiveColor='blue',
            activeColor='darkblue',addToArr=true,isActive=true,id=nextId("pickup"),type='switch'}={})
    {
        super(x,y,{width:Tn.SIZE/2,height:Tn.SIZE/2,color:inactiveColor,type:type,onGrab:onActivate,onRemove:()=>{},isCircle:true,addToArr:addToArr,id:id,isActive:isActive})
        this.hasActivated=false
        this.hasShadow=false
        this.canDeactivate=canDeactivate
        this.onDeactivate=onDeactivate
        this.inactiveColor=inactiveColor
        this.activeColor=activeColor
        this.hasUntouchedPlayer=true
    }
    /**Overrides checkPlayerCollision to allow non-removal and step on-step off detection */
    checkPlayerCollide(){
        var pc=this.isPlayerCollide()
        //If collided, hasn't activated and you've stoped touching player
        if(pc&&!this.hasActivated&&this.hasUntouchedPlayer){
            this.color=this.activeColor
            this.hasActivated=true
            this.onGrab(this.getCollidingPlayer())
            this.hasUntouchedPlayer=false
        //If collided and activated and able to deactivate and you've stopped touching the player
        }if(pc&&this.hasActivated&&this.canDeactivate&&this.hasUntouchedPlayer){
            this.hasActivated=false
            //If it can deactivate but onDeactivate isn't defined, then uses onGrab instead
            if(this.onDeactivate)
                this.onDeactivate()
            else 
                this.onGrab(this.getCollidingPlayer())
            this.color=this.inactiveColor
            this.hasUntouchedPlayer=false
        //If not collided and you haven't stopped touching player
        }if(!pc&&!this.hasUntouchedPlayer)
            this.hasUntouchedPlayer=true
    }
}

//#region Predefined-objects


/**Allows the player to block one hit. Ineffective with lava */
function pArmor(x,y,id){
    return new Pickup(x,y,
        {width:23,height:23,color:'lightgrey',type:'armor',onGrab:(p)=>{p.armor++},
            onRemove:()=>{_players.forEach(p=>p.armor=0)},img:'armor.png',id:id})
}

function pCheckPointPostLoad(x,y,id=nextId("pickup"),addOldCheckPoint=true,onGrab=()=>{}){
    if(!b(x,y).is(Tn.start)){
        var t=new Pickup(x,y,{color:'white',type:'checkPoint',id:id,onGrab:()=>{
            for(var i=0;i<board.length;i++)
                for(var j=0;j<board[i].length;j++)
                    if(b(j,i).is(Tn.start)){
                        b(j,i,Tn.Path())
                        if(addOldCheckPoint)
                            pCheckPointPostLoad(j,i)
                        break; 
                    }

            var rp=roundPoint(t.x,t.y)
            b(rp.x,rp.y,Tn.Start())
            spawnPoint={x:rp.x,y:rp.y}
            onGrab()
        }})
        return t
    }else{
        console.warn('Start tile already there')
    }
}

function pInv(x,y,onGrabFunc){
    return new Pickup(x,y,{width:Tn.SIZE,height:Tn.SIZE,color:'rgba(0,0,0,0)',onGrab:onGrabFunc}).setShadow(false)
}

function pAch(x,y,name,onGrab,showMulti=false,onMulti){
    if(!achievements.includes(name)||showMulti)
        return new Pickup(x,y,{width:Tn.SIZE,height:Tn.SIZE,color:'rgba(0,0,0,0)',onGrab:()=>{giveAch(name,onGrab,showMulti,onMulti)}})
    return false
}

function pCheckPointPreLoad(x,y,temp,id=nextId("pickup"),addOldCheckPoint=true,onGrab=()=>{}){
    if(!temp[y][x].is(Tn.start)){
        var t=new Pickup(x,y,{color:'white',type:'checkPoint',id:id,onGrab:()=>{
            for(var i=0;i<board.length;i++)
                for(var j=0;j<board[i].length;j++)
                    if(b(j,i).is(Tn.start)){
                        b(j,i,Tn.Path())
                        if(addOldCheckPoint)
                            pCheckPointPostLoad(j,i)
                        break; 
                    }

            var rp=roundPoint(t.x,t.y)
            b(rp.x,rp.y,Tn.Start())
            spawnPoint=rp
            onGrab()
        }})
        return t
    }else{
        console.warn('Start tile already there')
    }
}

/**Allows players on hard difficulty to respawn on the floor that this was grabbed on */
function pGoldCheckPoint(x,y,id=nextId("pickup")){
    if(game.difficulty.isHard()&&curFloor!==goldSpawnFloor){
        var t=new Pickup(x,y,{color:'gold',type:'goldCheckPoint',id:id,onGrab:()=>{
            goldSpawnFloor=curFloor
        }})
        .setDrawFunc(t=>{
            ctx.shadowBlur=10
            ctx.shadowColor='white'
            g.rect(t.x,t.y,t.width,t.height,t.color)
            shadow(0,0)
            ctx.shadowColor='black'
            ctx.shadowBlur=0
        })
        return t;
    }
}

function pLava(x,y,id=nextId("pickup"),brd=board){
    if(!brd[y][x].is(Tn.start,Tn.end)){
        var p=new Pickup(x,y,{color:'maroon',type:'miniLava',id:id,onGrab:(pl)=>{
            if(!debug.inv){
                pl.kill(Tn.lava);
                var rp=roundPoint(p.x,p.y)
                if(game.difficulty.isEasy())
                    pLava(rp.x,rp.y,p.id)
            }
            
        }})
        return p
    }
    return false
}

function pSpeedUp(x,y,id){
    return new Pickup(x,y,{id:id,type:'speedUp',onGrab:(p)=>{
        p.speed+=2
    },onRemove:()=>{
        _players.forEach(p=>p.speed=p.defaultSpeed)
    },img:'speedUp.png',width:18,height:18})
}

/**
 * Sets a switch that toggles a tile between a path and whatever it was before. Don't use on traps
 * @param {Function} onActivate Ran when activated
 * @param {boolean} canToggle If you can deactivate
 * @param {Function} onDeactivate Ran on deactivation. Runs on top of switching the tile back
 * @param {any} oldType The type to set the tile to when deactivated. Add by hand if switch is placed on level load. 
 *                      Does not matter if !canToggle
 */
function sToggleTile(sx,sy,ox,oy,{onActivate=()=>{},canToggle=false,onDeactivate=()=>{},oldType=b(ox,oy),newType=Tn.Path()}={}){
    return new Switch(sx,sy,{
        onActivate:()=>{
            b(ox,oy,newType)
            onActivate()
        },
        canDeactivate:canToggle,
        onDeactivate:()=>{
            b(ox,oy,oldType)
            onDeactivate()
        }
    })
}

/**Summons a dart at (dx,dy) going dir */
function sDart(sx,sy,dx,dy,dir,speed){
    return new Switch(sx,sy,{activeColor:'peru',inactiveColor:'peru',onActivate:()=>{Dart(dx,dy,dir,speed)},canDeactivate:true})
}

/**
 * Spawns a certain pickup at (px,py) if there isn't already one there
 * @param {Function} construct The function or constructor to run when making the new Pickup
 * @param {any} nId The id to make the pickup so only one may spawn
 */
function sPickupSpawn(sx,sy,px,py,construct,nId=nextId("pickup")){
    return new Switch(sx,sy,{canDeactivate:true,onActivate:(p,id=nId)=>{
        if(!Pickup.getById(id))
            new construct(px,py,id)
    }})
}

/**Spawns armor at (px,py) only if the player has less armor than n */
function sArmorMax(sx,sy,px,py,n,nId=nextId("pickup")){
    return new Switch(sx,sy,{canDeactivate:true,onActivate:(p)=>{
        if(p.armor<n&&!Pickup.getById(nId))
            pArmor(px,py,nId)
    }})
}

function sTrapTile(sx,sy,tx,ty,dir,delay,speed){
    return new Switch(sx,sy,{onActivate:()=>{
        b(tx,ty,Tn.Trap(dir,delay,speed))
    }})
}

//#endregion

//#region Enemy

/**Mostly used for positions in Enemy Movement. Short for vector */
function v(x=0,y=0){return {
    x:x,
    y:y,
    [Symbol.toPrimitive](){
        return "("+this.x+','+this.y+')'
    },
    add(other){
        return v(this.x+other.x,this.y+other.y)
    },
    sub(other){
        return this.add(other.flip())
    },
    flip(){
        return v(-this.x,-this.y)
    }
}}

class Path{
    constructor(doesLoop,...points){
        this.doesLoop=doesLoop
        this.cur=0
        this.dir=Path.dirs.fwd
        this.points=points
    }
    next(){
        if(!this.doesLoop){
            this.cur++
            if(this.cur===this.points.length)
                this.cur=0
            return this.points[this.cur]
        }else{
            if(this.dir===Path.dirs.fwd){
                if(this.cur===this.points.length-1){
                    this.dir=Path.dirs.bkwd
                    this.cur--
                }else this.cur++
            }else if(this.dir===Path.dirs.bkwd){
                if(this.cur===0){
                    this.dir=Path.dirs.fwd
                    this.cur++
                }else this.cur--
            }
            return this.points[this.cur]
        }
    }
    add(...vects){
        vects.forEach(vect=>this.points.push(vect))
    }
    /**Tells if moving foward through the points or backwards */
    static get dirs(){return {fwd:'fwd',bkwd:'bkwd'}}
    /**Tells if to go up/down then left/right or the other way around */
    static get styles(){return {vertHoriz:'vertHoriz',horizVert:'horizVert'}}
}

class Enemy extends Entity{
    constructor(path,{moveStyle=Path.styles.vertHoriz,speed=5,width=15,height=15,color='crimson',flipMoveStyle=true}={}){
        super(path.points[0].x,path.points[0].y,width,height,color)
        this.path=path
        this.curGoal=this.path.points[0]
        
        this.speed=speed
        this.isMoving=false
        if(flipMoveStyle){
            if(moveStyle===Path.styles.horizVert)
                this.moveStyle=Path.styles.vertHoriz
            else if(moveStyle===Path.styles.vertHoriz)
                this.moveStyle=Path.styles.horizVert
        }else
            this.moveStyle=moveStyle
        this.flipMoveStyle=flipMoveStyle
        this.dx=0
        this.dy=0
        entities.push(this)
    }
    setPosition(x,y){
        this.x=(x*Tn.SIZE+Tn.SIZE/2-this.width/2)
        this.y=(y*Tn.SIZE+Tn.SIZE/2-this.height/2)
    }
    move(){
        this.glideTo(this.curGoal.x,this.curGoal.y)
        if(!this.isMoving){
            if((this.path.cur===this.path.points.length-1||this.path.cur===0)&&this.flipMoveStyle){
                if(this.moveStyle===Path.styles.horizVert)
                    this.moveStyle=Path.styles.vertHoriz
                else if(this.moveStyle===Path.styles.vertHoriz)
                    this.moveStyle=Path.styles.horizVert
            }
            this.curGoal=this.path.next()
        }
    }
    withStyle(style){
        this.moveStyle=style
        return this
    }
    glideTo(x,y){
        var urp=unroundPoint(x,y,this)
        var t=this
        function m2(xy){
            t.isMoving=true
            if(t[xy]<urp[xy]){
                t[xy]+=t.speed
                if(t[xy]>urp[xy])
                    t[xy]=urp[xy]
            }else{
                t[xy]-=t.speed
                if(t[xy]<urp[xy])
                    t[xy]=urp[xy]
            }            
        }
        if(this.moveStyle===Path.styles.horizVert){
            if(this.x!==urp.x)
                m2('x')
            else if(this.y!==urp.y)
                m2('y')
            else
                this.isMoving=false
        }else if(this.moveStyle===Path.styles.vertHoriz){
            if(this.y!==urp.y)
                m2('y')
            else if(this.x!==urp.x)
                m2('x')
            else
                this.isMoving=false
        }
    }
    isPlayerCollide(){
        return _players.some(p=>isCollide(p,this))
    }
    getCollidingPlayer(){
        return _players.find(p=>isCollide(p,this))
    }
    withColor(color){
        this.color=color
        return this
    }
    static checkAllCollide(){
        entities.forEach(enemy=>{
            if(enemy.constructor.name==='Enemy'&&enemy.isPlayerCollide())
                enemy.getCollidingPlayer().kill('enemy')
        })
    }
}

function pClone(x,y,id,nx,ny){
    return new Pickup(x,y,{id:id,color:'steelblue',onGrab:(p)=>{
        var p=new Player(_players.length)
        p.setPosition(nx,ny)
        p.respawnPoint=v(nx,ny)
    },onRemove:()=>{
        _players.length=1
    }})
}

//#endregion


class Player extends Entity{
    constructor(id=0,addToArr=true){
        super(0,0,16,16,'steelblue',{id:id})
        if(addToArr)
            _players.push(this)
        this.dir=Dir.Up
        this.hidden=false
        this.keys=0
        this.lastDeathSource='none'
        this.speed=5
        this.defaultSpeed=5
        this.armor=0
        this.respawnPoint=undefined
        this.isUsingHook=false
        /**@type {ActiveItem} */
        this.activeItem=null;
        /**Tracks the portal info for teleporting */
        this.portal={
            hasTele:false,
            id:-2,
            type:''
        }
        /**Tracks time for player being red from hurting */
        this.hurt={
            isHurt:false,
            counter:new Counter(5,()=>{
                this.hurt.isHurt=false
            })
        }
        this.colors={
            /**Standard color of the player */
            default:(this.id===0)?'steelblue':(this.id===1)?'green':(this.id===2)?'red':'purple',
            /**If the player is hurt */
            hurt:'red',
            /**When the player has armor */
            armor:'grey',
            /**When the player is invincible */
            inv:'goldenrod'
        }
        this.canMove={
            up:false,down:false,left:false,right:false,locked:false
        }
    }
    static moveEverythingElse(){
        if(Menu.isGame())
            updateInfo()
        Pickup.checkAllCollide()

        //Moves all the entities towards their next point
        for(let i=0;i<entities.length;i++){
            entities[i].move()
            if(entities[i].toRemove){
                entities.splice(i--,1)
            }
        }

        for(let i=0;i<_players.length;i++){
            if(_players[i].toRemove){
                _players.splice(i--,1)
            }
        }

        Enemy.checkAllCollide()

        addAndMoveDarts()
    }
    setCanMove(bool){
        this.canMove.locked=(bool===true)?false:'noMove'
    }
    move(){

        if(this.activeItem)
            this.activeItem.move()

        var dx=0,dy=0;
        //This is the actual movement calculation
        if(game.canMove&&(!this.activeItem||!this.activeItem.active||this.activeItem.canUseWhileMoving)){
            if(this.canMove.up) dy-=1;
            if(this.canMove.down) dy+=1;
            if(this.canMove.left) dx-=1;
            if(this.canMove.right) dx+=1;
        }
        //Ice movement locking
        switch(this.canMove.locked){
            case false:break;
            case Dir.Up:dy=-1;dx=0;break;
            case Dir.Down: dy=1;dx=0;break;
            case Dir.Right: dy=0;dx=1;break;
            case Dir.Left: dy=0;dx=-1;break;
            case "noMove":return;
        }

        ///These are all counters for every tick
        //Counts when the player is hurt to tell when to be red
        if(this.hurt.isHurt)
            this.hurt.counter.count()

        //Only moving a single direction and you're not blocking
        if(dx!==0||dy!==0){
            if(dx!==0){
                switch(dx){
                    case 1:this.dir=Dir.Right;break;
                    case -1:this.dir=Dir.Left;break;
                }
                this.x+=dx*this.speed;
            }if(dy!==0){
                switch(dy){
                    case 1:this.dir=Dir.Down;break;
                    case -1:this.dir=Dir.Up;break;
                }
                this.y+=dy*this.speed;
            }
        }
        //Determines if the player can move, and if so then does
        if(!this.checkCollisions()){
            this.x-=dx*this.speed;
            this.y-=dy*this.speed;
        }
        //Runs some checks for stuff
        this.checkOnPortal();
        
        //Pick the color only if you can see the player
        if(!this.hidden)
            this.setColor()

        
        
        if(debug.infKeys)
            this.keys=5;
    }
    setPosition(x,y){
        if(x<0||x>=board[0].length||y<0||y>=board.length)
            return false
        if(x>=0&&x<board[0].length)
            this.x=x*Tn.SIZE+(1/2)*Tn.SIZE-(this.width/2);
        if(y>=0&&y<board.length)
            this.y=y*Tn.SIZE+(1/2)*Tn.SIZE-(this.height/2);
    }

    resetPosition(){
        if(this.respawnPoint!==undefined){
            this.setPosition(this.respawnPoint.x,this.respawnPoint.y)
            return
        }
        for(var i=0;i<board.length;i++)
            for(var j=0;j<board[i].length;j++)
                if(b(j,i).is(Tn.start)){
                    this.setPosition(j,i);
                    return true; 
                }
    }
    /**
    * Checks all corners of the player for movement
    * @returns true if the movement was successful and false if it was not
    */
    checkCollisions(){
        var pPoints=this.getCorners();
        this.onLava=false
        var onIce=false
        //Ice check
        if(this.canMove.locked!==false){
            for(var i=0;i<pPoints.length;i++){
                var y=pPoints[i].y,x=pPoints[i].x;
                if(b(x,y)!==undefined&&b(x,y).is(Tn.ice)){
                    onIce=true
                }
            }
        }
        if(!onIce){
            this.canMove.locked=false
        }
        for(var i=0;i<pPoints.length;i++){
            var y=pPoints[i].y,x=pPoints[i].x;
            if(!this.checkTile(x,y)){
                this.canMove.locked=false
                return false
            }
        }
        return true
    }
    checkOnPortal(){
        var p=this.getCorners();
        for(let i=0;i<p.length;i++){
            var x=p[i].x,y=p[i].y;
            if(b(x,y).is(Tn.portal))
                return;
        }
        this.portal.hasTele=false;
    }
    /**Sets the player's color based on certain situations */
    setColor(){
        //Follows priority of inv, hurt, armor, gay, then normal
        if(debug.inv){
            if(this.color!==this.colors.inv)
                this.color=this.colors.inv
        }else if(this.hurt.isHurt){
            if(this.color!==this.colors.hurt)
                this.color=this.colors.hurt
        }else if(this.armor>0){
            if(this.color!==this.colors.armor)
                this.color=this.colors.armor
        }else if(this.gay){
            var ctx=HTML.canvas.getContext('2d')
            var grad=ctx.createLinearGradient(player.x,player.y,player.x+player.width,player.y)
            var col=['red','orange','yellow','green','blue','violet']
            var inc=1/(col.length-1)
            for(let i=0;i<=1;i+=inc){
                i=Math.round(i*10)/10
                grad.addColorStop(i,col[i*5])
            }
            this.color=grad
        }else{
            if(this.color!==this.colors.default)
                this.color=this.colors.default
        }
    }
    /**This is when the player dies, obviously*/
    kill(source){
        this.hurt.isHurt=true
        //Not invincible and don't have armor
        if(!debug.inv&&this.armor<=0){
            //Different by difficulty
            switch(game.difficulty.cur){
                case Difficulty.Easy:
                    this.resetPosition()
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
            this.lastDeathSource=source
            if(this.activeItem)
                this.activeItem.active=false
        }if(this.armor>0&&!debug.inv){
            if(source===Tn.lava){
                this.armor=0
                this.kill(source)
            }else
                this.armor--
        }
    }
    checkTile(x,y){
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
                //Delay before going to next floor
                setTimeout(()=>{
                    onEndOnce=false;
                    nextFloor()
                    if(!wasInv)
                        debug.inv=false
                },500)
            }
            return true
        }else if(cur.is(Tn.wall,Tn.trap))
            return false
        //Keys and locks
        else if(cur.is(Tn.lock)){
            if(this.keys>0){
                this.keys--;
                b(x,y,b(x,y).tileUnder)
                
                checkLocksOnFloor7()
            }
            //Returns false so the player has a small pause when unlocking a lock
            return false
        //Lava
        }else if(cur.is(Tn.lava)){
            //If you're not on lava already and not using the hook or the hook has no end
            if(!this.onLava&&(!this.isUsingHook||(this.activeItem&&!this.activeItem.end))){
                this.kill(Tn.lava)
                if(debug.inv)
                    return true
                return (this.onLava=true);
            }else if(this.isUsingHook) return true
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
    }
    static removeKeys(){
        _players.forEach(p=>p.keys=0)
    }
    setActiveItem(i){
        if(this.activeItem&&this.activeItem.active){
            this.activeItem.active=false;
            this.activeItem.onStopUse(this.activeItem)
            this.activeItem=i
        }else{
            this.activeItem=i
        }
    }
}


class ActiveItem{
    constructor(parent,width,height,color,shift=11,useTime,delayTime,canUseWhileMoving=false,infiniteActiveTime=false){
        this.ent=new Entity(parent.x,parent.y,width,height,color)
        this.logic={
             /**Counts the duration of the blocking */
            activeCounter:new Counter(useTime,()=>{
                if(!this.canToggle)
                    this.active=false
                else
                    this.toggleCanStop=true
            }),
            /**Counts how long the delay lasts */
            delayCounter:new Counter(delayTime,()=>{
                this.logic.canUse=true
            }),
            /**Direction of the active item */
            dir:Dir.Up,
            /**This is if you can block, usually after the delay*/
            canUse:true,
        }
        /**@type {Player} */
        this.parent=parent

        this.initW=width;
        this.initH=height
        /**This is the space between where the item is and the player */
        this.shift=shift
        this.canUseWhileMoving=canUseWhileMoving
        this.infiniteActiveTime=infiniteActiveTime

        this.active=false 

        this.canPivot=false
        this.formerParentSpeed=this.parent.speed;
        this.canToggle=false;
        this.toggleLetGo=false
        this.toggleCanStop=false
    }
    use(){
        //This part is setting the width and height based on direction
        if(!this.active&&(!this.canToggle||this.logic.canUse)){
            this.centerOnParent()
            this.onFirstUse(this)
            this.active=true
            this.logic.canUse=false
            if(this.canPivot){
                this.formerParentSpeed=this.parent.speed;
                this.parent.speed=0
            }
            this.toggleLetGo=false
            this.toggleCanStop=false
        }else if(this.canToggle&&this.toggleCanStop){
            this.active=false
        }
    }
    /**@param {ActiveItem} t */
    onFirstUse(t){}
    /**@param {ActiveItem} t */
    onStopUse(t){}
    centerOnParent(){
        switch(this.parent.dir){
            case Dir.Up:
            case Dir.Down:
                this.ent.width=this.initH;
                this.ent.height=this.initW;
                break;
            case Dir.Left:
            case Dir.Right:
                this.ent.width=this.initW;
                this.ent.height=this.initH
        }
        this.ent.x=this.parent.x+this.parent.width/2-this.ent.width/2
        this.ent.y=this.parent.y+this.parent.height/2-this.ent.height/2
        switch(this.parent.dir){
            case Dir.Up:
                this.ent.y-=this.shift
                break;
            case Dir.Down:
                this.ent.y+=this.shift
                break;
            case Dir.Left:
                this.ent.x-=this.shift
                break;
            case Dir.Right:
                this.ent.x+=this.shift
                break;
        }
    }
    draw(){
        if(this.active){
            this.ent.draw(this.ent,this)
        }
    }
    toCircle(){
        this.ent.isCircle=true;
        return this
    }
    move(){            
        
        if(this.active){
            
            this.ent.move(this)
            
            if(!this.infiniteActiveTime||this.canToggle)
                this.logic.activeCounter.count()

            if(this.canPivot||this.canUseWhileMoving)
                this.centerOnParent()

            this.whileActive(this)
        }
        //You're not blocking but you still can't block, i.e. cooldown
        else if(!this.logic.canUse){
            if(this.logic.delayCounter.cur===0){
                this.onStopUse(this)
                if(this.canPivot){
                    this.parent.speed=this.formerParentSpeed
                }
            }
            this.logic.delayCounter.count()
        }
        return this
    }
    /**@param {function(ActiveItem)} func */
    setMoveFunc(func){
        this.ent.move=func
        return this
    }
    /**@param {function(Entity,ActiveItem)} func Overwrites the drawing function of the entity */
    setDrawFunc(func){
        this.ent.draw=func
        return this
    }
    /**@param {function(ActiveItem)} func */
    setOnFirstUse(func){
        this.onFirstUse=func
        return this
    }
    whileActive(){}
    /**@param {function(ActiveItem)} func */
    setActiveEffects(func){
        this.whileActive=func
        return this
    }
    /**@param {function(ActiveItem)} func */
    setOnStopUse(func){
        this.onStopUse=func
        return this
    }
    setPivot(bool=true){
        this.canPivot=bool
        if(bool&&!this.canUseWhileMoving)
            this.canUseWhileMoving=true
        return this
    }
    setToggle(){
        this.canToggle=true
        this.infiniteActiveTime=true
        //this.logic.activeCounter.max=1
        return this
    }
}

function aTowerShield(parent){
    var speedDec=2
    parent.setActiveItem(new ActiveItem(parent,9,27,'silver',14,1,20,true,true)
        .setOnFirstUse(t=>{
            t.moveDir=t.parent.dir
            t.parent.speed-=speedDec
        })
        .setActiveEffects(t=>{
            function lockDir(dir){
                if(t.moveDir!==dir)
                    t.parent.canMove[dir]=false
            }
            lockDir(Dir.Up)
            lockDir(Dir.Down)
            lockDir(Dir.Right)
            lockDir(Dir.Left)
            parent.dir=t.moveDir

            darts.forEach(d=>{
                if(isCollide(t.ent,d)){
                    d.toRemove=true
                }
            })
        })
        .setOnStopUse(t=>t.parent.speed+=speedDec)
    )
}

function aShield(parent){
    parent.setActiveItem(new ActiveItem(parent,7,25,'saddlebrown',13,1,1,true,true).toCircle()
        .setActiveEffects(t=>{
            darts.forEach(d=>{
                if(isCollide(t.ent,d))
                    d.toRemove=true
            })
        })
        .setPivot()
    )
}
function aBouncyShield(parent){
    parent.setActiveItem(new ActiveItem(parent,8,27,'red',13,9,1,false,true).toCircle()
        .setActiveEffects(t=>{
            darts.forEach(d=>{
                if(isCollide(t.ent,d)){
                    d.dir=flipDir(d.dir)
                }
            })
        })
        .setDrawFunc(t=>{
            ctx.fillStyle=t.color
            ctx.beginPath()
            ctx.ellipse((t.x+t.width/2),(t.y+t.height/2),(t.width/2),(t.height/2),0,0,Math.PI*2)
            shadow(2)
            ctx.fill()
            shadow()
            ctx.stroke()
            ctx.closePath()

            ctx.fillStyle='silver'
            ctx.beginPath()
            ctx.ellipse((t.x+t.width/2),(t.y+t.height/2),(t.width/3),(t.height/3),0,0,Math.PI*2)
            ctx.fill()
            ctx.stroke()
            ctx.closePath()
        })
        .setPivot()
        //.setToggle()
    )
}
function aKeyMagnet(parent){
    parent.setActiveItem(new ActiveItem(parent,10,8,'red',undefined,1,1,false,true)
        .setActiveEffects(t=>{
            var rateOfMove=5;
            var col={x:0,y:0,width:0,height:0};
            function box(x,y,w,h){return {x:x,y:y,width:w,height:h}}
            switch(parent.dir){
                case Dir.Up:
                    col=box(t.ent.x,0,t.ent.width,t.ent.y)
                    break;
                case Dir.Down:
                    col=box(t.ent.x,t.ent.y,t.ent.width,board.length*Tn.SIZE-t.ent.y)
                    break;
                case Dir.Left:
                    col=box(0,t.ent.y,t.ent.x,t.ent.height)
                    break;
                case Dir.Right:
                    col=box(t.ent.x,t.ent.y,board[0].length*Tn.SIZE-t.ent.x,t.ent.height)
                    break;
            }
            //console.log(col)
            //drawAfterConst.push(()=>g.rect(col.x,col.y,col.width,col.height,'purple'))
            pickups.forEach(p=>{
                if(p.type==='key'){
                    if(isCollide(col,p)){
                        switch(parent.dir){
                            case Dir.Up:p.y+=rateOfMove;break;
                            case Dir.Down:p.y-=rateOfMove;break;
                            case Dir.Right:p.x-=rateOfMove;break;
                            case Dir.Left:p.x+=rateOfMove;break;
                        }
                    }
                }
            })
            
            //  drawAfterConst.push(()=>g.rect(col.x,col.y,col.width,col.height,'purple'))
        })
        .setDrawFunc((e,t)=>{
            var r1,r1,c1,c2,pDir=t.parent.dir
            switch(pDir){
                case Dir.Up:case Dir.Down:
                    r1={x:e.x,y:e.y,w:e.width,h:e.height/2}
                    r2={x:e.x,y:e.y+e.height/2,w:e.width,h:e.height/2};break;
                default:
                    r1={x:e.x,y:e.y,w:e.width/2,h:e.height}
                    r2={x:e.x+e.width/2,y:e.y,w:e.width/2,h:e.height};break;
            }
            switch(pDir){
                case Dir.Up:case Dir.Left:c1='red';c2='white';break;
                default:c1='white';c2='red';break;
            }
            ctx.fillStyle=c1
            shadow(2)
            ctx.fillRect(r1.x,r1.y,r1.w,r1.h)
            ctx.fillStyle=c2
            ctx.fillRect(r2.x,r2.y,r2.w,r2.h)
            shadow()
            ctx.strokeRect(e.x,e.y,e.width,e.height)
        })
    )
}

function pKeyMagnet(x,y){
    return pActiveItem(x,y,8,10,'red','keyMagnet',aKeyMagnet)
        .setDrawFunc(t=>{
            ctx.fillStyle='red'
            ctx.fillRect(t.x,t.y,t.width,(t.height/2))
            ctx.fillStyle='white'
            ctx.fillRect(t.x,(t.y+t.height/2),t.width,t.height/2)
            shadow()
            ctx.strokeRect(t.x,t.y,t.width,t.height)
        })
}

function aHook(parent){
    parent.setActiveItem(new ActiveItem(parent,10,10,'blue',11,1,2,false,true)
        .setOnFirstUse(t=>{
            t.parts=[]
            t.end=false
            t.parent.isUsingHook=true

            t.freq=5

            var tileSelected=v(t.ent.x+t.ent.width/2,t.ent.y+t.ent.height/2)
            
            function moveOneTile(){
                caseDir(t.parent.dir,
                    ()=>tileSelected.y-=Tn.SIZE/t.freq,
                    ()=>tileSelected.y+=Tn.SIZE/t.freq,
                    ()=>tileSelected.x-=Tn.SIZE/t.freq,
                    ()=>tileSelected.x+=Tn.SIZE/t.freq
                )
            }
            var keepGoing=true
            while(keepGoing){
                moveOneTile()
                var rp=roundPoint(tileSelected.x,tileSelected.y)
                if(b(rp.x,rp.y)){
                    //If there's a tile there
                    if(b(rp.x,rp.y).is(Tn.path,Tn.lava,Tn.start,Tn.end,Tn.ice,Tn.noRock,Tn.portal)){
                        t.parts.push(v(tileSelected.x,tileSelected.y))
                    }else if(b(rp.x,rp.y).is(Tn.target)){
                        t.end=tileSelected
                        keepGoing=false
                    }else{
                        keepGoing=false
                    }

                }else{
                    keepGoing=false
                }
            }
            
        })
        .setDrawFunc((e,t)=>{
            g.rect(e.x,e.y,e.width,e.height,e.color)
            t.parts.forEach(p=>{
                g.ring(p.x-e.width/2,p.y-e.height/2,e.width,e.height,3,'silver')
            })
            if(t.end){
                g.rect(t.end.x-e.width/2,t.end.y-e.height/2,e.width,e.height,'gray')
            }
        })
        .setMoveFunc(t=>{
            var rate=5
            if(t.end&&t.parts.length>0){
                t.centerOnParent()
                caseDir(t.parent.dir,
                    ()=>{
                        t.parent.y-=rate
                        if(!t.parent.checkCollisions())
                            t.parent.y+=rate
                    },
                    ()=>{
                        t.parent.y+=rate
                        if(!t.parent.checkCollisions())
                            t.parent.y-=rate
                    },
                    ()=>{t.parent.x-=rate},
                    ()=>{t.parent.x+=rate}
                )
            }
            //Reset the rings and where they're at
            t.onFirstUse(t)
        })
        .setOnStopUse(t=>t.parent.isUsingHook=false)
    )
}

function aClone(parent){
    var c;
    parent.setActiveItem(new ActiveItem(parent,5,5,'blue',0,1,50,false,true)
        .setOnFirstUse(t=>{
            t.ent.hasShadow=false
            c=new Player(2)
            
            c.width-=5;
            c.height-=5;

            c.x=t.parent.x+c.width/4
            c.y=t.parent.y+c.height/4
        })
        .setOnStopUse(t=>{
            c.toRemove=true
            t.parent.keys+=c.keys
        })
    )
}

function aShrink(parent){
    var change=parent.width/2
    parent.setActiveItem(new ActiveItem(parent,parent.width,parent.height,parent.color,0,30,30,true,false)
        .setOnFirstUse(t=>{
            t.parent.width-=change
            t.parent.height-=change
            t.parent.x+=change/2
            t.parent.y+=change/2

            t.parent.speed-=2
        })
        .setOnStopUse(t=>{
            t.parent.width+=change
            t.parent.height+=change
            t.parent.x-=change/2
            t.parent.y-=change/2

            t.parent.speed+=2

            var corners=t.parent.getCorners()

            var pTypes={
                /**@type {v[]} */
                safe:[],
                /**@type {v[]} */
                unsafe:[]
            }
            corners.forEach(c=>{
                if(t.parent.checkTile(c.x,c.y))
                    pTypes.safe.push(c)
                else
                    pTypes.unsafe.push(c)
            })

            //No conflict
            if(pTypes.safe.length===corners.length)
                return;

            //On two tiles, one safe, one not 
            else if(pTypes.safe.length===1&&pTypes.unsafe.length===1){
                var nv = pTypes.safe[0].sub(pTypes.unsafe[0])
                t.parent.x+=nv.x*t.parent.speed;
                t.parent.y+=nv.y*t.parent.speed;
                return;
            }
            //On four tiles, two safe, two not
            else if(pTypes.safe.length===2&&pTypes.unsafe.length===2){
                let sV=pTypes.safe[0].sub(pTypes.safe[1])
                if(sV.x===0)
                    t.parent.x+=(pTypes.safe[0].x-pTypes.unsafe[0].x)*t.parent.speed
                else
                    t.parent.y+=(pTypes.safe[0].y-pTypes.unsafe[0].y)*t.parent.speed
            }
            //On four, one corner in wall
            else if(pTypes.safe.length===3&&pTypes.unsafe.length===1){
                var vDir=pTypes.safe.find(vs=>{
                    var vec=vs.sub(pTypes.unsafe[0])
                    return vec.x!==0&&vec.y!==0
                })
                var moveVec=vDir.sub(pTypes.unsafe[0])
                t.parent.x+=(moveVec.x)*t.parent.speed
                t.parent.y+=(moveVec.y)*t.parent.speed
            }
            //Only one good and three bad
            else if(pTypes.unsafe.length===3&&pTypes.safe.length===1){
                var vDir=pTypes.unsafe.find(vs=>{                    
                    var vec=vs.sub(pTypes.safe[0])
                    return !(vec.x===0||vec.y===0)
                })
                var moveVec=vDir.sub(pTypes.safe[0]).flip()
                t.parent.x+=(moveVec.x)*t.parent.speed
                t.parent.y+=(moveVec.y)*t.parent.speed
            }
        })
        .setDrawFunc(()=>{})
        .setToggle()
    )
}

//setTimeout(()=>aShrink(player),90)
//setInterval(()=>{if(!player.activeItem)aShrink(player)},100)
function caseDir(dir,up,down,left,right){
    switch(dir){
        case Dir.Up:up();break;
        case Dir.Down:down();break;
        case Dir.Left:left();break;
        case Dir.Right:right();break;
    }
}

function pShield(x,y,id){
    return new Pickup(x,y,
        {width:25,height:8,color:'saddleBrown',type:'shield',onGrab:(p)=>{aShield(p)},isCircle:true,id:id})
}

function pActiveItem(x,y,width=7,height=7,color='magenta',type='??',activeFunc=aShield,{id,img,onRemove,isCircle}={}){
    return new Pickup(x,y,
        {width:width,height:height,color:color,type:type,
            onGrab:(p)=>{activeFunc(p)},onRemove,isCircle:isCircle,id:id,img:img,id:id})
}

function pHook(x,y,id){
    return pActiveItem(x,y,10,10,'blue','hook',aHook,{id:id,isCircle:false})
}
