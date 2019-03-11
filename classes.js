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

var images={
    preload(...imgs){
        imgs.forEach(img=>{
            var i=new Image()
            i.src='gfx/'+img
            this[img]=i
        })
    },
    get(str){
        if(this[str])
            return this[str]
        else{
            try{
                images.preload(str)
                return images.get(str)
            }catch(e){
                throw new ReferenceError(`Image of gfx/${str} not preloaded`)
            }
        } 
    }
}
//images.preload('armor.png','bars.png','key.png','lock.png','portalA.png','portalB.png','rock.png','rock1.png','dart.png','speedUp.png')

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

var _pickupOnRemoveAll=[],
    _genericPickupType=0,
    _genericId=0;
/**Gets a new type name for any generic pickups made without a type */
function _nextPickupType(){
    return ++_genericPickupType
}
/**Gets a unique id for every new pickup unless specified */
function _nextId(){
    return ++_genericId
}

class Pickup{
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
            {width=10,height=10,color='white',type=_nextPickupType(),id=_nextId(),onGrab=()=>{},
            onRemove=()=>{},isCircle=false,img,addToArr=true,hidden=false,isActive=true}={})
    {
        this.x=(x*Tn.SIZE+Tn.SIZE/2-width/2)
        this.y=(y*Tn.SIZE+Tn.SIZE/2-height/2)
        this.width=width
        this.height=height
        this.color=color
        this.onGrab=onGrab
        /**Unique type for specific types of pickups. Used for telling which removal functions to run */
        this.type=type
        /**Unique id for each new Pickup, generated automatically. Can also be set beforehand */
        this.id=id
        this.isCircle=isCircle
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
    isPlayerCollide(){
        if(!this.isActive)
            return false
        return!(((this.y+this.height)<(player.y))||
            (this.y>(player.y+player.height))||
            ((this.x+this.width)<player.x)||
            (this.x>(player.x+player.width)));
    }
    setActive(bool){
        this.isActive=bool
        this.hidden=!bool
    }
    checkPlayerCollide(){
        if(this.isPlayerCollide()){
            this.toRemove=true;
            this.onGrab();
        }
    }
    /**@param {CanvasRenderingContext2D}ctx*/
    draw(ctx){
        if(!this.hidden){
            if(this.img){
                ctx.shadowOffsetX=3
                ctx.shadowOffsetY=3
                ctx.drawImage(images.get(this.img),this.x,this.y,this.width,this.height)
                ctx.shadowOffsetX=3
                ctx.shadowOffsetY=3
            }else{
                if(this.isCircle){
                    ctx.beginPath();
                    ctx.fillStyle=this.color
                    ctx.ellipse(this.x+this.width/2,this.y+this.height/2,this.width/2,this.height/2,0,0,Math.PI*2)
                    ctx.shadowOffsetX=3
                    ctx.shadowOffsetY=3
                    ctx.fill()
                    ctx.shadowOffsetX=0
                    ctx.shadowOffsetY=0
                    ctx.stroke()
                    ctx.closePath()
                }else{
                    ctx.fillStyle=this.color
                    ctx.shadowOffsetX=3
                    ctx.shadowOffsetY=3
                    ctx.fillRect(this.x,this.y,this.width,this.height)
                    ctx.shadowOffsetX=0
                    ctx.shadowOffsetY=0
                    ctx.strokeRect(this.x,this.y,this.width,this.height)
                }
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
            activeColor='darkblue',addToArr=true,isActive=true,id=_nextId(),type='switch'}={})
    {
        super(x,y,{width:Tn.SIZE/2,height:Tn.SIZE/2,color:inactiveColor,type:type,onGrab:onActivate,onRemove:()=>{},isCircle:true,addToArr:addToArr,id:id,isActive:isActive})
        this.hasActivated=false
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
            this.onGrab()
            this.hasUntouchedPlayer=false
        //If collided and activated and able to deactivate and you've stopped touching the player
        }if(pc&&this.hasActivated&&this.canDeactivate&&this.hasUntouchedPlayer){
            this.hasActivated=false
            //If it can deactivate but onDeactivate isn't defined, then uses onGrab instead
            if(this.onDeactivate)
                this.onDeactivate()
            else 
                this.onGrab()
            this.color=this.inactiveColor
            this.hasUntouchedPlayer=false
        //If not collided and you haven't stopped touching player
        }if(!pc&&!this.hasUntouchedPlayer)
            this.hasUntouchedPlayer=true
    }
}

//#region Predefined-objects

/**Gives the player a shield */
function pShield(x,y,id){
    return new Pickup(x,y,
        {width:25,height:8,color:'saddleBrown',type:'shield',onGrab:()=>{player.hasShield=true},
            onRemove:()=>{player.hasShield=false},isCircle:true,id:id})
}
/**Allows the player to block one hit. Ineffective with lava */
function pArmor(x,y,id){
    return new Pickup(x,y,
        {width:23,height:23,color:'lightgrey',type:'armor',onGrab:()=>{player.armor++},
            onRemove:()=>{player.armor=0},img:'armor.png',id:id})
}

function pCheckPointPostLoad(x,y,id=_nextId(),addOldCheckPoint=true,onGrab=()=>{}){
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
            b(rp[0],rp[1],Tn.Start())
            spawnPoint={x:rp[0],y:rp[1]}
            onGrab()
        }})
        return t
    }else{
        console.warn('Start tile already there')
    }
}

function pCheckPointPreLoad(x,y,temp,id=_nextId(),addOldCheckPoint=true,onGrab=()=>{}){
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
            b(rp[0],rp[1],Tn.Start())
            spawnPoint={x:rp[0],y:rp[1]}
            onGrab()
        }})
        return t
    }else{
        console.warn('Start tile already there')
    }
}

/**Allows players on hard difficulty to respawn on the floor that this was grabbed on */
function pGoldCheckPoint(x,y,id=_nextId()){
    if(game.difficulty.isHard()&&curFloor!==goldSpawnFloor){
        var t=new Pickup(x,y,{color:'gold',type:'goldCheckPoint',id:id,onGrab:()=>{
            goldSpawnFloor=curFloor
        }})
        return t;
    }
}

function pLava(x,y,id=_nextId()){
    var p=new Pickup(x,y,{color:'maroon',type:'miniLava',id:id,onGrab:()=>{
        player.kill(Tn.lava);
        var rp=roundPoint(p.x,p.y)
        pLava(rp[0],rp[1],p.id)
    }})
    return p
}

function pSpeedUp(x,y,id){
    return new Pickup(x,y,{id:id,type:'speedUp',onGrab:()=>{
        player.speed+=2
    },onRemove:()=>{
        player.speed=player.defaultSpeed
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
function sPickupSpawn(sx,sy,px,py,construct,nId=_nextId()){
    return new Switch(sx,sy,{canDeactivate:true,onActivate:(id=nId)=>{
        if(!Pickup.getById(id))
            new construct(px,py,id)
    }})
}

/**Spawns armor at (px,py) only if the player has less armor than n */
function sArmorMax(sx,sy,px,py,n,nId=_nextId()){
    return new Switch(sx,sy,{canDeactivate:true,onActivate:()=>{
        if(player.armor<n&&!Pickup.getById(nId))
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
function v(x,y){return {x:x,y:y}}

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

var enemies=[]

class Enemy{
    constructor(path,{moveStyle=Path.styles.vertHoriz,speed=5,width=15,height=15,color='crimson',flipMoveStyle=true}={}){
        this.path=path
        this.curGoal=this.path.points[0]
        
        this.speed=speed
        this.width=width
        this.height=height
        this.setPosition(this.path.points[0].x,this.path.points[0].y)
        this.color=color
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
        enemies.push(this)
    }
    setPosition(x,y){
        this.x=(x*Tn.SIZE+Tn.SIZE/2-this.width/2)
        this.y=(y*Tn.SIZE+Tn.SIZE/2-this.height/2)
    }
    moveToNextPoint(){
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
    glideTo(x,y){
        var urp=unroundPoint(x,y,this)
        var t=this
        function m(xyb){
            if(xyb==='x'){
                t.isMoving=true
                if(t.x<urp[0]){
                    t.x+=t.speed
                    if(t.x>urp[0])
                        t.x=urp[0]
                }else{
                    t.x-=t.speed
                    if(t.x<urp[0])
                        t.x=urp[0]
                }
            }else if(xyb==='y'){
                t.isMoving=true
                if(t.y<urp[1]){
                    t.y+=t.speed
                    if(t.y>urp[1])
                        t.y=urp[1]
                }else{
                    t.y-=t.speed
                    if(t.y<urp[1])
                        t.y=urp[1]
                }
            }
        }
        if(this.moveStyle===Path.styles.horizVert){
            if(this.x!==urp[0])
                m('x')
            else if(this.y!==urp[1])
                m('y')
            else
                this.isMoving=false
        }else if(this.moveStyle===Path.styles.vertHoriz){
            if(this.y!==urp[1])
                m('y')
            else if(this.x!==urp[0])
                m('x')
            else
                this.isMoving=false
        }
        this.draw()
    }
    draw(){
        ctx.fillStyle=this.color
        ctx.shadowOffsetX=2
        ctx.shadowOffsetY=2
        ctx.fillRect(this.x,this.y,this.width,this.height)
        ctx.shadowOffsetX=0
        ctx.shadowOffsetY=0
        ctx.strokeRect(this.x,this.y,this.width,this.height)
    }
    isPlayerCollide(){
        return!(((this.y+this.height)<(player.y))||
            (this.y>(player.y+player.height))||((this.x+this.width)<player.x)||(this.x>(player.x+player.width)));
    }
    static checkAllCollide(){
        enemies.forEach(enemy=>{
            if(enemy.isPlayerCollide())
                player.kill('enemy')
        })
    }
}

//#endregion
