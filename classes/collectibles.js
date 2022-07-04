class Collectible extends Ent {
    constructor(x,y,width,height,color){
        super(x * Tile.size, y * Tile.size,width,height,color);
        this.at(x,y);
        this.defaultY = this.y;
        this.defaultX = this.x;
        /**Number of life, ranged 0-313 */
        this.bobbleTick = 0;
        this.hasBob = true;
        this.tileX = x;
        this.tileY = y;
    }
    onCollect(){}
    noBob(){this.hasBob = false;return this;}
    at(x,y){
        super.at(x,y);
        this.tileX = x;
        this.tileY = y;
        this.defaultY = this.y;
        this.defaultX = this.x;
        return this;
    }
    onTick(){
        //Only do it every 7 ticks for performance
        if(this.hasBob && (GameKit.ticks % 7 == 0)){
            this.bobbleTick = (this.bobbleTick + 1) % 314;
            this.y = Math.sin(this.bobbleTick) + this.defaultY;
        }
        if(this.collides(player)){
            this.onCollect();
            this.remove();
        }
    }
}

class Toggle extends Ent {
    #hasPlayerSteppedOff;
    constructor(x,y,width,height,inactiveColor,activeColor){
        super(x * Tile.size, y * Tile.size,width,height,inactiveColor);
        this.activeColor = activeColor;
        this.inactiveColor = inactiveColor;
        this.at(x,y);
        /**Ranged 0-99 */
        this.ticks = 0;
        this.active = false;
        this.#hasPlayerSteppedOff = true;
        this.canToggle = false
        this.tileX = x;
        this.tileY = y;
    }
    setOnActivate(func){
        this.onActivate = func;
        return this;
    }
    /**Done once when activated */
    onActivate(){}
    /**Done per-tick if active */
    whileActive(){}
    /**Done onces when deactivated */
    onDeactivate(){}
    /**Done per-tick if inactive */
    whileInactive(){}
    at(x,y){
        super.at(x,y);
        this.tileX = x;
        this.tileY = y;
        return this;
    }
    doToggle(){
        this.canToggle = true;
        return this;
    }
    onTick(){
        this.ticks = (this.ticks + 1) % 100;
        let colPlayer = this.collides(player);
        if(colPlayer){
            if(this.#hasPlayerSteppedOff){
                this.#hasPlayerSteppedOff = false;
                //These are the activate once types
                if(this.active && this.canToggle){
                    this.onDeactivate()
                    this.active = false;
                    this.color = this.inactiveColor;
                } else if(!this.active) {
                    this.onActivate()
                    this.active = true;
                    this.color = this.activeColor;
                }
            }
        } else if(!this.#hasPlayerSteppedOff) {
            this.#hasPlayerSteppedOff = true;
        }
        if(this.active){
            this.whileActive()
        } else {
            this.whileInactive()
        }
    }
}

class CKey extends Collectible {
    constructor(x,y){
        super(x,y, 14,20,'gold');
        this.setImage("key");
        this.options.hasBorder = false;
        this.options.imageBorder = false;
        this.defaultWidth = this.width;
        this.defaultHeight = this.height;
    }
    onTick(){
        super.onTick();
        /*
        let mod = 30
        this.width = this.defaultWidth * (mod - (GameKit.ticks % (mod * 2) ))/mod;
        //console.log(this.width);
        */
    }
    onCollect(){
        player.keys++;
        new Particle( this.x + this.width/4, this.y + this.height/4, this.width, this.height, this.color, 30)
            .shrink()
            .setChange({deg:30})
            .setImage("key").borderless();
    }
}

/**A collectible that sets the checkpoint */
class CCheckpoint extends Collectible {
    constructor(x,y){
        super(x,y,7,7,'white');
    }
    onCollect(){
        if(activeMap.startX !== this.tileX || activeMap.startY !== this.tileY){
            let oStart = b(activeMap.startX,activeMap.startY)
            let d = 50;
            new Particle(oStart.x + Tile.size/4,oStart.y + Tile.size/4,Tile.size,Tile.size,'white',d).shrink();
            new Particle(this.x + Tile.size/4, this.y + Tile.size/4,Tile.size,Tile.size,'white',d).grow().drawLayer = drawLayers.Tile;
            GameKit.delay(()=>{
                activeMap.start(this.tileX,this.tileY);
            },d);
            activeMap.set(activeMap.startX,activeMap.startY,T.Path)
            checkPoint = pos(this.tileX,this.tileY);
        }
    }
    onTick(){
        super.onTick()
        this.rotation.deg++;
    }
}

/**A toggle that changes a tile on the map */
class TTile extends Toggle {
    constructor(x,y, ox, oy, tile = T.Path, canToggle = false){
        super(x,y,10,10,'#00d2e6','#007e8a');
        this.tile = tile;
        this.canToggle = canToggle;
        this.ox = ox;
        this.oy = oy;
    }
    onActivate(){
        var old = b(this.ox,this.oy);
        b(this.ox,this.oy,this.tile);
        this.tile = old;
    }
    onDeactivate(){
        this.onActivate()
    }
}

class TDart extends Toggle{
    constructor(x,y,xs,ys,dirs,speeds = [10]){
        super(x,y,12,12,'peru','peru');
        
        this.canToggle = true;
        //Make all arrays
        if(typeof xs == 'number')
            xs = [xs]
        if(typeof ys == 'number')
            ys = [ys]
        if(!Array.isArray(dirs))
            dirs = [dirs]
        if(typeof speeds == "number")
            speeds = [speeds]
        this.xs = xs;
        this.ys = ys;
        this.dirs = dirs;
        this.tileX = x;
        this.tileY = y;
        this.speeds = speeds;
        this.darts = Math.max(xs.length,ys.length,dirs.length,speeds.length)
        this.properties = {
            trap:{
                dir:dirs[0],
                dartSpeed:speeds[0]
            }
        }
        
    }
    onActivate(){
        for(let i = 0; i < this.darts;i++){
            this.properties.trap.dartSpeed = this.speeds[i % this.speeds.length];
            this.properties.trap.dir = this.dirs[i % this.dirs.length];
            this.tileX = this.xs[i % this.xs.length];
            this.tileY = this.ys[i % this.ys.length];
            new Dart(this)
        }
    }
    onDeactivate(){
        this.onActivate()
    }
}