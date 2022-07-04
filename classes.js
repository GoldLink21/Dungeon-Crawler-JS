/**Holds the info for a single level of the game */
class TMap {
    /**@type {Tile[][]} */
    #tiles;
    #active;
    /**@type {(function():Ent)[]} */
    #ents;
    constructor(width, height){
        this.width = width;
        this.height = height;

        this.verticalFlip = false;
        this.horizFlip = false;

        this.#active = false;

        this.offsetX = -((width-1)*Tile.size)/2;
        this.offsetY = -((height-1)*Tile.size)/2;

        this.startX = 0;
        this.startY = 0;

        this.#ents = [];
        this.#tiles = Array(width)
        for(let i = 0; i < this.#tiles.length; i++){
            this.#tiles[i] = Array(height).fill(null);
        }
        this.portalID = 0;
    }
    zoom(val){
        camera.zoom = val;
        return this;
    }
    #realPos(x,y){
        var nx = x;
        var ny = y;
        
        if(this.verticalFlip){
            ny = this.height - y - 1;
        } 
        if(this.horizFlip){
            nx = this.width - x - 1;
        }
        return {x:nx,y:ny}
    }
    #realRot(ang){
        let a =  new Angle(ang.deg)
        //console.log("-Before",a.deg)
        if(this.verticalFlip && (a.deg == Cardinals.Down.deg || a.deg == Cardinals.Up.deg)){
            //console.log("Flipping vert")
            a.deg += 180;
        }
        if(this.horizFlip && (a.deg == Cardinals.Left.deg || a.deg == Cardinals.Right.deg)){
            //console.log("Flipping Horiz")
            a.deg -= 180;
        }
        //console.log("-After",a.deg);
        return a.round();
    }
    anyFlip(){
        
        if(!debug.noFlip){
            return this.withFlip(Rnd.chance(),Rnd.chance())
        }
        return this;
    }
    /**@param {Angle} rot */
    withFlip(vert = false, horiz=false){
        this.verticalFlip = vert;
        this.horizFlip = horiz;
        return this;
    }
    /**@param {Tile} tile */
    fill(tile){
        for(let i = 0; i <this.#tiles.length;i++){
            for(let j = 0; j < this.#tiles[i].length;j++){
               this.set(i,j,tile)
            }
        }
        return this;
    }
    /**@param {function():Ent} e */
    addEnt(e){
        this.#ents.push(e)
        return this;
    }
    /**Runs a function on the map 
     * @param {function(TMap):void} func 
     */
    run(func) {
        func(this);
        return this;
    }
    /**Says this is the active map and add all tiles to the entities list */
    track() {
        //Make var for fully formed 
        this.forEach(t=>t.track())
        //this.#tiles.forEach(row=>row.forEach(t=>t.track()));
        this.#ents.forEach(e=>{
            let ne = e();
            //Get the position correct for the ent
            let oldPos = ne.getTilePosition();
            let newPos = this.#realPos(oldPos.x,oldPos.y);
            ne.at(newPos.x,newPos.y);
        })
        this.#active = true;
        return this;
    }
    clone() {
        var copy = new TMap(this.width,this.height)
        for(let i = 0; i <this.#tiles.length; i++){
            for(let j = 0; j < this.#tiles.length; j++){
                copy.set(i,j,this.#tiles[i][j])
            }
        }
        return copy;
    }
    /**
     * @param {number|number[]} x
     * @param {number|number[]} y
     * @param {Tile|function():Tile} val 
     */
    set(x,y,val){
        GameKit.forceRenderSlowCanvas = true;
        if(Array.isArray(x)){
            if(Array.isArray(y)){
                //Pairs of (x,y)
                for(let i=0;i<x.length;i++){
                    this.set(x[i],y[i],val);
                }
            } else {
                //One y for many x
                for(let i=0;i<x.length;i++){
                    this.set(x[i],y,val);
                }
            }
            return this;
        } else if(Array.isArray(y)){
            //One x for many y
            for(let i=0;i<y.length;i++){
                this.set(x,y[i],val);
            }
            return this;
        }
        //Needs all params
        if(!(x || y || val)){
            return this;
        }

        //Gets the tile if it is a function
        if(typeof val == 'function'){
            val = val()
        }
        
        //Handle rotation of map
        var nPos = this.#realPos(x,y);
        var ax = nPos.x, ay = nPos.y;
        
        //Remove if there is something there
        if(this.#tiles[ax][ay])
            this.#tiles[ax][ay].toRemove = true;

        this.#tiles[ax][ay] = val.clone().at(ax,ay).offset(this.offsetX,this.offsetY);
        if(this.#tiles[ax][ay].is(Tnames.Trap)){
            this.#tiles[ax][ay].properties.trap.dir = this.#realRot(val.properties.trap.dir);
        }

        if(this.#tiles[ax][ay].name == Tnames.Start){
            this.startX = ax;
            this.startY = ay;
        }
        if(this.#active){
            this.#tiles[ax][ay].track();
        }
        return this;
    }
    start(x,y){
        return this.set(x,y,T.Start);
    }
    end(x,y){
        return this.set(x,y,T.End)
    }
    /**Adds a one way portal */
    portal(x,y,tx,ty){
        return this.set(x,y,T.PortalC(tx,ty))
    }
    /**Adds two portals linked together */
    portals(x1,y1,x2,y2){
               this.set(x1,y1,T.PortalA(this.portalID,  x2,y2));
        return this.set(x2,y2,T.PortalB(this.portalID++,x1,y1));

    }
    /**Removes every tile in the map */
    remove(){
        this.forEach(t=>t.toRemove=true);
        this.#active = false;
    }
    get(x,y) {
        return this.#tiles[x][y];
    }
    /**@param {function(Tile):void} func */
    forEach(func){
        this.#tiles.forEach(row=>{
            row.forEach(tile=>{
                func(tile)
            })
        })
    }
    border(type){
        for(let i = 0; i < this.width; i++){
            this.set(i,[0,this.height-1],type);
        }
        for(let i = 1; i < this.height - 1; i++){
            this.set([0,this.width-1],i,type);
        }
        return this;
    }
}


let goingToNextFloor = false;

let t = new Tile(1,1,Tnames.Path);

/**The currently active map */
var activeMap = new TMap(15,15).fill(t).track()

/**Generalized Ent class for this game */
class Ent extends RectEnt {
    constructor(x,y,width,height,color,doNotAdd = false){
        super(x,y,width,height,color,'black',doNotAdd);
        this.drawLayer = drawLayers.Ent;

        this.slowRender = false;
        let self = this;
        this.localRect = {
            set left(val){self.x = val + self.width/2},
            get left(){return self.x-self.width/2},
    
            set right(val){self.x = val - self.width/2},
            get right(){return self.x+self.width/2},
    
            set top(val){self.y = val + self.height/2},
            get top(){return self.y+self.height/2},
    
            set bottom(val){self.y = val - self.height/2},
            get bottom(){return self.y-self.height/2}
        }
        /**@type {Cardinals} The last moved direction for active items */
        this.lastDirection = new Angle(Cardinals.Up.deg);
        /**@type {ActiveItem} */
        this.activeItem = undefined;
        
    }
    
    /**Used for setting tile position */
    at(x,y){
        this.x = (Tile.size * x) + activeMap.offsetX;
        this.y = (Tile.size * y) + activeMap.offsetY;
        return this;
    }
    getTilePosition(){
        return pos(Math.floor((this.x-activeMap.offsetX)/Tile.size),Math.floor((this.y-activeMap.offsetY)/Tile.size))
    }
    /**Gets all entities that are within a short range of this entity */
    getCloseEnts(){
        return entities.filter(e=>{
            return (e != this) && (Math.abs(e.x - this.x) < (e.width-this.width + 5)) && (Math.abs(e.y - this.y) < (e.height-this.height/2))
        })
    }
    getCloseTiles(){
        return this.getCloseEnts().filter(e=>e.constructor.name == "Tile");
    }
    /**Ensures the entity is within the bounds of the active map. Snaps inside if not */
    snapIntoMap(){
        let checkLeft = activeMap.offsetX - Tile.size2 + this.width/2
        let checkRight = -activeMap.offsetX + Tile.size2 - this.width/2;
        let checkUp = activeMap.offsetY - Tile.size2 + this.height/2;
        let checkDown = -activeMap.offsetY + Tile.size2 - this.height/2
        if(this.x < checkLeft){
            this.x = checkLeft;
        }
        if(this.x > checkRight){
            this.x = checkRight;
        }
        if(this.y < checkUp){
            this.y = checkUp;
        }
        if(this.y > checkDown){
            this.y = checkDown;
        }
    }
    isOutsideMap(){
        return ((this.x < (activeMap.offsetX - Tile.size2 + this.width/2))   || 
                (this.x > (-activeMap.offsetX + Tile.size2 - this.width/2))  ||
                (this.y < (activeMap.offsetY - Tile.size2 + this.height/2))  ||
                (this.y > (-activeMap.offsetY + Tile.size2 - this.height/2)));
    }
}

/**A class for entities that are able to teleport on portals */
class TeleportableEnt extends Ent{
    constructor(x,y,width,height,color,borderColor,doNotAdd){
        super(x,y,width,height,color,borderColor,doNotAdd);
        this.portal = {
            id:null,
            hasTele:false,
            type:null
        }
    }
    /**
     * Checks the teleportation status of a tile and teleports
     * you if it is a portal
     * @param {Tile} tile 
     */
    checkTele(tile){
        if(tile.is(Tnames.Portal)){
            this.portal.type = tile.properties.portal.type;
            this.portal.id = tile.properties.portal.id;
            this.at(x,y);
        }
    }
}

class Player extends TeleportableEnt {
    static states = {
        normal:'normal',
        moveLocked:'moveLocked',
        hurt:'hurt'
    }
    constructor(){
        super(0,0,17,17,'steelblue',undefined,false);
        this.drawLayer = drawLayers.Player;
        this.at(0,0)

        this.speed = 2;
        this.defaultSpeed = this.speed;;
        
        this.diagSpeed = this.speed / Math.SQRT2;
        this.defaultDiagSpeed = this.diagSpeed;

        /**@type {{x:number,y:number}}  */
        this.lockedDir = undefined;
        
        this.keys = 0;

        this.inv = false;

        this.state = Player.states.normal;
    }
    kill(source){
        if(!debug.inv)
            this.at(activeMap.startX,activeMap.startY);
    }
    reset(){
        this.keys = 0;
        this.color = 'steelblue';
        this.resetSpeed();
        this.activeItem = undefined;
    }
    setColor(){

    }
    move(){
        //Handle input controls
        let dx = 0, dy = 0;
        if(C.pressed['w'] || C.pressed["up"]){
            dy += -1;
        }
        if(C.pressed["a"] || C.pressed['left']){
            dx += -1;
        }
        if(C.pressed["d"] || C.pressed['right']){
            dx += 1
        }
        if(C.pressed['s'] || C.pressed["down"]){
            dy += 1;
        }
        if(dx != 0 && dy != 0){
            dx *= this.diagSpeed;
            dy *= this.diagSpeed;
        } else {
            dx *= this.speed;
            dy *= this.speed;
        }
        //@TODO
        if(this.activeItem){
            //console.log(this.activeItem)
            if(C.pressed["space"] && !this.activeItem.isActive()){
                this.activeItem.activate();
            } else if(!C.pressed["space"] && this.activeItem.isActive()) {
                this.activeItem.deactivate();
            }
        }
        if(this.activeItem && this.activeItem.isActive()){
            dx = 0;
            dy = 0;
        }
        
        ////////////////////////
        let col1 = this.getCloseTiles()
        if(this.portal.id != undefined && !col1.some(t=>t.is(Tnames.Portal))){
            this.portal.id = undefined;
        }
        //Used for stopping slipping
        let ox = this.x;
        let oy = this.y;
        //Does it twice because it is far simpler to do

        if(this.lockedDir != undefined){
            dx = this.lockedDir.x;
            dy = this.lockedDir.y;
        }

        this.x += dx;
        this.handleTiles(/*this.getCloseTiles()*/col1, dx, 0);

        this.y += dy;
        this.handleTiles(/*col1*/this.getCloseTiles(), 0, dy);
        
        /*if(dx !== 0 || dy !== 0){
            this.lastDirection = GameKit.vec2(dx,dy).toAngle(); 
        }*/
        //Gives vertical priority
        if(dy !== 0){
            if(dy < 0){
                this.lastDirection.rad = Cardinals.Up.rad
            } else {
                this.lastDirection.rad = Cardinals.Down.rad
            }
        } else if(dx !== 0){
            if(dx < 0){
                this.lastDirection.rad = Cardinals.Left.rad
            } else {
                this.lastDirection.rad = Cardinals.Right.rad
            }
        }
        //Nothing changes if no movement

        //this.handleEnts(this.getCloseEnts().filter(e=>e != player && e.constructor.name != 'Tile'))
        ///////////////////////////
        //Bind to inside the map
        this.snapIntoMap()

        //If you haven't moved after trying to move, then you are no longer sliding
        if(this.lockedDir != undefined && this.x == ox && this.y == oy) {
            this.lockedDir = undefined;
        }

        this.setColor()
    }
    /**@param {Tile[]} tiles */
    handleTiles(tiles, dx, dy){
        var col = tiles.filter(t=>this.collides(t));
        var hasSlippery = false;
        for(let i = 0; i<col.length;i++) {
            if(!col[i].canWalk()){
                //Collision Checking
                //Above you
                if(dy != 0){
                    //Above
                    if(col[i].y > this.y){
                        this.y = col[i].y-Tile.size2-this.height/2 - 1
                    } else {
                        this.y = col[i].y+Tile.size2+this.height/2 + 1 
                    }
                }
                if(dx != 0){
                    //Tile is right
                    if(col[i].x > this.x){
                        this.x = col[i].x - Tile.size2 - this.height/2 - 1
                    } else {
                        this.x = col[i].x + Tile.size2 + this.height/2 + 1
                    }
                }
            }
            if(col[i].isSlippery()){
                hasSlippery = true;
            }
            //Done this way to handle the case of dying while against a wall
            if(col[i].handleStep(dx,dy))
                break;
            
        }
        if(hasSlippery){
            if(this.lockedDir != undefined){
                if(dx === 0){
                    this.lockedDir.y = dy;
                } else if(dy === 0) {
                    this.lockedDir.x = dx;
                } else {

                    console.log("Added property")
                }
            } else {
                this.lockedDir = pos(dx,dy);
                console.log("Setting initial")
            }
            //console.log(this.lockedDir);
        } else if(this.lockedDir != undefined){
            this.lockedDir = undefined;
            console.log("Reset Slippery")
        }
    }
    setSpeed(val){
        this.speed = val;
        this.diagSpeed = val/Math.SQRT2;
        return this;
    }
    resetSpeed(){
        this.speed = this.defaultSpeed;
        this.diagSpeed = this.defaultDiagSpeed;
        return this;
    }
    remove(){
        console.warn("Why remove player?")
    }
}





class Dart extends TeleportableEnt {
    /**@param {{tileX:number,tileY:number,properties:{trap:{dir:Angle,dartSpeed:number}}}} parent */
    constructor(parent){
        super(0,0,12,12,'green');
        this.at(parent.tileX,parent.tileY);
        this.rotation.rad = parent.properties.trap.dir.rad;
        this.speed = parent.properties.trap.dartSpeed;
        //this.speed = 2;
        this.setImage("dart")
        this.options.drawStyle = Ent.drawStyles.DRAW_ROTATED;
        this.options.drawBoxUnderImage = false;
        this.options.hasBorder = false;
        this.options.imageBorder = false;
    }
    move(){
        this.moveForward(this.speed);
        if(this.collides(player)){
            player.kill()
            this.remove();
        } else if(this.isOutsideMap() || 
            this.getCloseEnts().filter(e=>e.constructor.name == "Tile" && e.properties.blocksDarts && this.collides(e)).length > 0)
        {
            this.remove();
        }
    }
}

function b(x,y,tile){
    if(tile != undefined)
        return activeMap.set(x,y,tile).get(x,y)
    return (x >= 0 && y >= 0 && x < activeMap.width && y < activeMap.height) ? activeMap.get(x,y) : undefined;
}

class Path{
    /**
     * @param {boolean} doesLoop if it returns to the start after getting to the end, or goes backwards
     * @param {{x:number,y:number}[]} points
    */
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
        this.points.push(...vects);
    }
    /**Tells if moving foward through the points or backwards */
    static get dirs(){return {fwd:'fwd',bkwd:'bkwd'}}
    /**Tells if to go up/down then left/right or the other way around */
    static get styles(){return {vertHoriz:'vertHoriz',horizVert:'horizVert'}}
}