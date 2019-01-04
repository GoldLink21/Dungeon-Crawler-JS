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
    _genericPickupType=0;
/**Gets a new type name for any generic pickups made without a type */
function _nextPickupType(){
    _genericPickupType++
    return _genericPickupType.toString(16)
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
     */
    constructor(x,y,{width=10,height=10,color='white',type=_nextPickupType(),onGrab=()=>{},onRemove=()=>{},isCircle=false,img,addToArr=true,hidden=false}={}){
        this.x=(x*T.SIZE+T.SIZE/2-width/2)
        this.y=(y*T.SIZE+T.SIZE/2-height/2)
        this.width=width
        this.height=height
        this.color=color
        this.onGrab=onGrab
        this.type=type
        this.isCircle=isCircle
        this.hidden=hidden
        Pickup._addRemoveFunc(type,onRemove)
        //Only set this.img if there is an img
        if(img)
            this.img=img
        this.toRemove=false
        if(addToArr)
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
        if(!this.hidden){
            if(this.img){
                
                //var newImg=document.createElement('img')
                //newImg.src='gfx/'+this.img
                ctx.shadowOffsetX=3
                ctx.shadowOffsetY=3
                ctx.drawImage(getImg(this.img),this.x,this.y,this.width,this.height)
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
    constructor(x,y,{onActivate=()=>{},canDeactivate=false,onDeactivate=()=>{},inactiveColor='blue',activeColor='darkblue',addToArr=true}={}){
        super(x,y,{width:T.SIZE/2,height:T.SIZE/2,color:inactiveColor,type:'switch',onGrab:onActivate,onRemove:()=>{},isCircle:true,addToArr:addToArr})
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
            this.onDeactivate()
            this.color=this.inactiveColor
            this.hasUntouchedPlayer=false
        //If not collided and you haven't stopped touching player
        }if(!pc&&!this.hasUntouchedPlayer)
            this.hasUntouchedPlayer=true
    }
}

class Tile{
    constructor(name,color,canWalkOn=false,img){
        this.width=T.SIZE
        this.height=T.SIZE
        this.color=color
        this.name=name
        this.canWalkOn=canWalkOn
        if(img)
            this.img=img
    }
    /**@param {CanvasRenderingContext2D} ctx*/
    draw(ctx,x,y){
        ctx.shadowOffsetX=3
        ctx.shadowOffsetY=3

        ctx.fillStyle=this.color
        ctx.fillRect(x*T.SIZE,y*T.SIZE,this.width,this.height)
        if(this.img){
            var img=document.createElement('img')
            img.src='gfx/'+this.img
            ctx.drawImage(getImg(img),x*T.SIZE,y*T.SIZE,this.width,this.height)
        }
        ctx.shadowOffsetX=0
        ctx.shadowOffsetY=0
        ctx.strokeRect(x*T.SIZE,y*T.SIZE,this.width,this.height)
    }
    is(){
        for(let i=0;i<arguments.length;i++){
            //console.log(arguments[i],typeof arguments[i], arguments[i].name,arguments[i].name===this.name)
            if(typeof arguments[i]==='string'){
                if(this.name===arguments[i])
                    return true
            }else{
                if(this.name===arguments[i].name)
                    return true
            }
        }
        return false
    }
}
class Traps extends Tile{
    constructor(dir,delay){
        super('trap','peru',false)
        this.dir=dir
        this.cur=0
        this.max=delay
    }
    tick(x,y){
        this.cur++
        if(this.cur>=this.max){
            console.log(x,y)
            this.cur=0
            Dart(x,y,this.dir)
        }
    }
}

class Portals extends Tile{
    constructor(type,id,x,y){
        super('portal',tPath().color,true,'portal'+type.toUpperCase()+'.png')
        this.type=type
        if(type==='c'||type==='C'){
            this.x=x
            this.y=y
        }else
            this.id=id
    }
    isA(){return this.type.toLowerCase()==='a'}
    isB(){return this.type.toLowerCase()==='b'}
    isC(){return this.type.toLowerCase()==='c'}
}

function tWall(){return new Tile('wall','rgb(78,78,78)',false)}
function tPath(){return new Tile('path','rgb(165,165,165)',true)}
function tLava(){return new Tile('lava','maroon',true)}
function tLock(){return new Tile('lock',tPath().color,false,'lock.png')}
function tStart(){return new Tile('start','white',true)}
function tEnd(){return new Tile('end','gold',true)}
function tHidden(){return new Tile('hidden','rgb(65, 65, 65)',true)}
function tRock(){return new Tile('rock',tPath().color,false,'rock.png')}
function tNoRock(){return new Tile('noRock','rgb(135,135,135)',true)}
function tTrap(x,y,dir,delay){return new Traps(x,y,dir,delay)}
function tPortal(type,id,x,y){return new Portals(type,id,x,y)}
function tBars(){return new Tile('bars',tPath().color,false,'bars.png')}