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

var _pickupOnRemoveAll=[],
    _genericPickupType=0,
    _genericPickupId=0;
/**Gets a new type name for any generic pickups made without a type */
function _nextPickupType(){
    _genericPickupType++
    return _genericPickupType
}
function _nextPickupId(){
    _genericPickupId++
    return _genericPickupId
}

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
     * @param {boolean} hidden Tells Whether to make the pickup hidden or not
     * @param {number} id The id for selecting a single pickup 
     * @example function pArmor(x,y,id)//This is the general structure for making a new pickup of any new class. They should not need more input than this
     */
    constructor(x,y,{width=10,height=10,color='white',type=_nextPickupType(),id=_nextPickupId(),onGrab=()=>{},onRemove=()=>{},isCircle=false,img,addToArr=true,hidden=false,isActive=true}={}){
        this.x=(x*T.SIZE+T.SIZE/2-width/2)
        this.y=(y*T.SIZE+T.SIZE/2-height/2)
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
            (this.y>(player.y+player.height))||((this.x+this.width)<player.x)||(this.x>(player.x+player.width)));
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
                ctx.drawImage(getImg(this.img),this.x,this.y,this.width,this.height)
                ctx.shadowOffsetX=3
                ctx.shadowOffsetY=3
            }else{
                if(this.isCircle){
                    //ctx.save()
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
                    //ctx.restore()
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
    /*
    flipLocation({vert=false,horiz=false}={}){
        if(!vert&&!horiz)
            return
        //bw-trap.x-1
        if(horiz)
            this.x=board.length-this.x-1
        if(vert)
            this.y=board[0].length-this.y-1
    }
    static flipAll({vert=false,horiz=false}={}){
        if(!vert&&!horiz)
            return
        var arg=arguments
        pickups.forEach(pickup=>{
            pickup.flipLocation(arg)
        })
    }*/
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
        for(let i=0;i<_pickupOnRemoveAll.length;i++){
            var other=_pickupOnRemoveAll[i]
            if(other.type===obj.type){
                toAdd=false
                break
            }
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
     * They stay on the map after interactions which allows changing the map while playing
     * @param {number} x Map x
     * @param {number} y Map y
     * @param {Function} onActivate Function used on activation
     * @param {boolean} canDecativeate Tells if you can deactivate the switch for a different action
     * @param {Function} onDeactivate Function used on deactivation if canDeactivate
     * @param {string} inactiveColor The color before activation
     * @param {string} activeColor The color after being activated
     */
    constructor(x,y,{onActivate=()=>{},canDeactivate=false,onDeactivate,inactiveColor='blue',activeColor='darkblue',addToArr=true,isActive=true,id=_nextPickupId()}={}){
        super(x,y,{width:T.SIZE/2,height:T.SIZE/2,color:inactiveColor,type:'switch',onGrab:onActivate,onRemove:()=>{},isCircle:true,addToArr:addToArr,id:id,isActive:isActive})
        this.hasActivated=false
        this.canDeactivate=canDeactivate
        this.onDeactivate=onDeactivate
        this.inactiveColor=inactiveColor
        this.activeColor=activeColor
        this.hasUntouchedPlayer=true
    }
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

/**Gives the player a shield */
function pShield(x,y,id){
    return new Pickup(x,y,
        {width:25,height:8,color:'saddleBrown',type:'shield',onGrab:()=>{player.hasShield=true},
            onRemove:()=>{player.hasShield=false},isCircle:true,id:id})
}
/**Allows the player to block one hit. Ineffective with lava */
function pArmor(x,y,id){
    return new Pickup(x,y,
        {width:25,height:25,color:'lightgrey',type:'armor',onGrab:()=>{player.armor++},
            onRemove:()=>{player.armor=0},img:'armor.png',id:id})
}

/**
 * Sets a switch that toggles a tile between a path and whatever it was before. Don't use on traps
 * @param {number} sx The x of the switch
 * @param {number} sy The y of the switch
 * @param {number} ox The x to toggle
 * @param {number} oy The y to toggle
 * @param {Function} onActivate Ran when activated
 * @param {boolean} canToggle If you can deactivate
 * @param {Function} onDeactivate Ran on deactivation
 * @param {any} oldType The type to set the tile to when deactivated. Add by hand if switch is placed on level load. 
 *                      Does not matter if !canToggle
 */
function sToggleTile(sx,sy,ox,oy,onActivate=()=>{},canToggle=false,onDeactivate=()=>{},oldType=b(ox,oy)){
    return new Switch(sx,sy,{onActivate:()=>{b(ox,oy,T.Path);onActivate()},canDeactivate:canToggle,onDeactivate:()=>{b(ox,oy,oldType);onDeactivate()}})
}

/**Summons a dart at (dx,dy) going dir */
function sDart(sx,sy,dx,dy,dir,speed){
    return new Switch(sx,sy,{activeColor:'peru',inactiveColor:'peru',onActivate:()=>{Dart(dx,dy,dir,speed)},canDeactivate:true})
}

/**
 * Spawns a certain pickup at (px,py) if there isn't already one there
 * @param {number} sx The x of the switch 
 * @param {number} sy The y of the switch
 * @param {number} px The x of the pickup when spawned
 * @param {number} py The y of the pickup when spawned
 * @param {Function} construct The function or constructor to run when making the new Pickup
 * @param {any} nId The id to make the pickup so only one may spawn
 */
function sPickupSpawn(sx,sy,px,py,construct,nId=_nextPickupId()){
    return new Switch(sx,sy,{canDeactivate:true,onActivate:(id=nId)=>{
        if(!Pickup.getById(id))
            new construct(px,py,id)
    }})
}

/**Spawns armor at (px,py) only if the player has less armor than n */
function sArmorMax(sx,sy,px,py,n,nId=_nextPickupId()){
    return new Switch(sx,sy,{canDeactivate:true,onActivate:()=>{
        if(player.armor<n&&!Pickup.getById(nId))
            pArmor(px,py,nId)
    }})
}

function sTrapTile(sx,sy,tx,ty,dir,delay,speed){
    return new Switch(sx,sy,{onActivate:()=>{
        b(tx,ty,Trap(dir,delay))
        traps.push({
            x:tx,y:ty,dir:dir,
            delay:delay,count:0,speed:speed,
            fire(){
                if(this.count>=this.delay){
                    this.count=0;
                    Dart(this.x,this.y,this.dir,this.speed);
                }
                else this.count++;
            }
        })
    }})
}