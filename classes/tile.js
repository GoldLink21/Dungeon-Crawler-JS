/**
 * @typedef TileProp 
 * @type {object}
 * @property {string|function():string} color
 * @property {boolean} [pushable]
 * @property {string[]} [pushableWhiteList]
 * @property {boolean} [walkable]
 * @property {boolean} [hasStepTrigger]
 * @property {boolean} [blocksDarts]
 * @property {boolean} [grappleable]
 * @property {string} [tileUnder]
 * @property {string[]} [images]
 * @property {boolean} [slippery]
 * @property {{dir:Angle,delay:number,dartSpeed:number,startAt:number}} [trap]
 * @property {boolean} [drawUnderImage]
 * @property {{id:number,x:number,y:number,type:string}} [portal]
 * @property {number} [hp] Tells if the tile is breakable and how long until it 
 * @property {number} [maxHp] Tells the largest possible hp
 * @property {string[]} [hpColors] The colors that cycle based on hp percentage
*/


/**@enum @readonly This gets passed in */
const Tnames = {
    Path:"path", Grass:"grass", Hidden:'hidden', FakeLava:"fakeLava",
    Wall:'wall', Bars:'bars',
    NoRock:"noRock",
    Rock:'rock',
    Trap:'trap',
    Target:"target",
    Start:'start',
    End:'end',
    Lava:"lava",
    Ice:'ice',
    Portal:'portal',
    Lock:'lock',
    Breakable:'breakable'
}

function pathColor(){
    return `rgb(${Rnd.intRange(160,170)},${Rnd.intRange(160,170)},${Rnd.intRange(160,170)})`;
}

/**@type {Object.<string,TileProp>} */
const TileProps = {
    "path":{color:pathColor},
    'grass':{color:()=>`rgb(0,${Rnd.intRange(130,180)},0)`},
    'wall':{
        color:'rgb(78,78,78)',
        walkable:false,
        blocksDarts:true,
    },
    'bars':{
        color:pathColor,walkable:false,blocksDarts:true,images:['bars']
    },
    'trap':{
        color:'peru',
        walkable:false,
        blocksDarts:false,
        trap:{
            dir:Cardinals.Up,dartSpeed:40,delay:28,startAt:14
        },
        images:['trap'],
        drawUnderImage:true
    },
    'noRock':{color:'rgb(135,135,135)'},
    "rock":{
        color:'brown',
        images:['rock','rock1'],
        pushable:true,
        pushableWhiteList:[Tnames.Path,Tnames.Ice,Tnames.Grass],
        tileUnder:Tnames.Path,
        walkable:false,
        blocksDarts:true,
        hasStepTrigger:true
    },
    'hidden':{color:'rgb(65,65,65)'},
    'target':{
        color:'rgb(191,54,12)',
        grappleable:true,
        images:["target"],
        walkable:false
    },
    "lava":{color:'maroon',hasStepTrigger:true,},
    "fakeLava":{color:"#600000"},
    "ice":{color:"rgb(0,135,253)",slippery:true},
    "start":{color:'white'},
    'end':{color:'gold',hasStepTrigger:true,images:['end']},
    'portal':{color:pathColor,images:['portalA'],portal:{},hasStepTrigger:true},
    "lock":{color:pathColor,images:['lock'],hasStepTrigger:true,tileUnder:Tnames.Path,walkable:false,blocksDarts:true},
    'breakable':{color:'rgb(78,78,78)',walkable:false,hasStepTrigger:true,tileUnder:Tnames.Path, hp:24, hpColors:[
        "rgb(138,138,138)",
        "rgb(130,130,130)",
        "rgb(122,122,122)",
        "rgb(114,114,114)",
        "rgb(106,106,106)",
        "rgb(98,98,98)",
        "rgb(90,90,90)",
        "rgb(82,82,82)",
        "rgb(78,78,78)",
        "rgb(78,78,78)",
        "rgb(78,78,78)",
        "rgb(78,78,78)",
    ]}
}

var particles = {
    lock:(tile)=>{
        let w = 22;
        let h = 14;
        //Outer lock
        new Particle(tile.x+(w/4),tile.y+(h/2),w,h,'gold',18).setChange({y:2,deg:15}).drawLayer = 10
        //Inner Lock
        new Particle(tile.x+1,tile.y+4,4,4,'black',18).setChange({y:2,deg:15}).drawLayer = 11;
        //Chains
        return new ParticleSystem(tile.x,tile.y,3,0.6).removeWhenDone()
            .addParticleType(
                ()=>new Particle(0,0,4,6,'gray',30)
                    .setChange({forward:14}).startRotation(45,45)
            )
            .setParticlesPerSpawn(4)
            .setPattern({deg:90,colors:['rgb(60,60,60)','gray','lightgray','gray']}).start()

    },
    /**
     * 
     * @param {Tile} tileOld 
     * @param {Tile} tileNew 
     */
    rock:(tileOld,tileNew,image)=>{
        let life = 12;
        console.log(tileOld.imageName);
        new Particle(tileOld.x + Tile.size/4,tileOld.y+Tile.size/4,Tile.size,Tile.size,'red',life)
            .setImage(image)
            .borderless()
            .setChange({x:(tileNew.x - tileOld.x)*Tile.size/3/life, y:(tileNew.y-tileOld.y)*Tile.size/3/life})
    },
    lavaSink(tile){
        new Particle(tile.x + Tile.size/4,tile.y+Tile.size/4,Tile.size,Tile.size,'maroon',20)
            .shrink()
    }
}

class Tile extends RectEnt {
    static size = 45;
    /**Quick half size value */
    static size2 = Tile.size/2;
    /**@type {Tile} */
    #tileUnder;
    /**@param {string} name */
    constructor(x, y, name, tileUnder = null){
        super(x * Tile.size, y * Tile.size,Tile.size, Tile.size, "peru", undefined, true);
        this.name = name;
        if(name == Tnames.Trap) {
            this.options.drawStyle = RectEnt.drawStyles.DRAW_ROTATED
        } else { 
            this.options.drawStyle = RectEnt.drawStyles.DRAW_STATIC;
        }
        this.tileX = x;
        this.tileY = y;
        /**@type {Tile} */
        this.#tileUnder = tileUnder;
        //this.options.setColorToTileUnder = false;
        this.hasPlayerSteppedOn = false;
        this.drawLayer = drawLayers.Tile;
        this.stepTriggerFunction = ()=>{}
        this.trapCounter = 0;
        let self = this;
        /**@type {TileProp} */
        this.properties = {
            pushable:false, //
            pushableWhiteList:[], //
            walkable:true, //
            hasStepTrigger:false, //
            blocksDarts:false, //
            tileUnder:null, //
            slippery:false, //
            //Use getter and setter to allow setting the actual color value easily
            get color(){return self.color;}, //
            set color(val){
                if(typeof val === 'function')
                    self.color = val();
                else 
                    self.color = val
            },
            grappleable:false, //
            /**@type {string[]} */
            images:[], //
            /**@type {{dir:Angle,delay:number,dartSpeed:number}} */
            trap:null, //
            drawUnderImage:true, //
            /**@type {{id:number,x:number,y:number,type:string}} */
            portal:null,
            /**@type {number} */
            hp:undefined,
            /**@type {string[]} */
            hpColors:[],
            maxHp:undefined
        }
        this.slowRender = true;

        if(this.name in TileProps){
            this.setProperties(TileProps[this.name]);
        }
    }
    offset(x,y){
        this.offsetX = x;
        this.offsetY = y;
        this.at(this.tileX,this.tileY)
        return this;
    }
    /**@param {TileProp} obj */
    setProperties(obj){
        for(let prop in obj){
            if(prop == 'color') {
                this.properties.color = obj[prop];
                continue;
            }
            if(prop == 'images'){
                this.setImage(Rnd.arrayElement(obj[prop]))
                continue;
            }
            if(prop == 'tileUnder'){
                this.setTileUnder(new Tile(this.tileX,this.tileY,obj[prop]));
                continue;
            }
            if(prop == 'drawUnderImage'){
                this.options.drawBoxUnderImage = true;
                continue;
            }
            if(prop == 'trap'){
                this.setTrapSettings(obj[prop].dir,obj[prop].delay,obj[prop].dartSpeed,obj[prop].startAt);
                continue;
            }
            if(prop == 'hp'){
                this.properties.hp = obj[prop];
                this.properties.maxHp = obj[prop];
                continue;
            }
            if(prop == 'maxHp'){
                this.properties.maxHp = obj[prop];
                continue;
            }
            if(prop in this.properties) {
                if(typeof this.properties[prop] != typeof obj[prop])
                    console.warn(`Expected type of ${typeof this.properties[prop]} for option ${prop}, but got ${typeof obj[prop]} instead`);
                else 
                    this.properties[prop] = obj[prop];
            }
        }
        return this;
    }
    
    /**@param {function(Player):void} */
    setStepTriggerFunction(func){
        this.stepTriggerFunction = func;
        return this;
    }
    setTrapSettings(dir = Cardinals.Up, delay = 100, dartSpeed = 2, startAt = delay/2){
        let self = this;
        this.rotation.rad = dir.rad;
        this.properties.trap = {
            dartSpeed:dartSpeed,
            delay:delay,
            set dir(val){
                self.rotation.rad = val.rad;
            },
            get dir(){
                return self.rotation;
            },
            startAt:startAt
        };
        this.trapCounter = startAt;
        return this;
    }
    setPortalSettings(id,type,x,y){
        this.properties.portal = {
            id:id,
            type:type,
            x:x,
            y:y
        }
        this.setImage(`portal${(type=='C')?(Rnd.chance())?'A':'B':type}`)
        return this;
    }
    draw(){
        if(this.#tileUnder){
            if(this.#tileUnder.x != this.x || this.#tileUnder.y != this.y){
                this.#tileUnder.x = this.x;
                this.#tileUnder.y = this.y;
            }
            this.#tileUnder.draw();
        }
        if(this.#tileUnder && this.options.setColorToTileUnder && this.color != this.#tileUnder.color)
            this.color = this.#tileUnder.color;
        super.draw()
        let c = GameKit.ctx2;
        if(debug.showCoords){
            
            c.textAlign = "left";
            
            c.fillStyle = 'silver'
            c.strokeStyle = 'black';
            let t = `(${this.tileX},${this.tileY})`
            c.lineWidth = 2
            c.font = '12px arial';
            c.strokeText(t,this.x-this.width/2 ,this.y-this.height/4)
            c.fillText(t,this.x-this.width/2, this.y-this.height/4);
            c.lineWidth = 1;
            if(this.is(Tnames.Portal)){
                /*
                GameKit.ctx.fillStyle = 'green';
                t = `(${this.properties.portal.x},${this.properties.portal.y})`
                GameKit.ctx.strokeText(t,this.x-this.width/2,this.y+this.height/4)
                GameKit.ctx.fillText(t,this.x-this.width/2,this.y+this.height/4);
                */
                //Draw lines connecting the portals
                
            }
        }
    }
    move(){
        if(this.properties.trap){
            this.trapCounter+=GameKit.deltaTime * 10;
            if((this.trapCounter) >= this.properties.trap.delay){
                this.trapCounter = 0;
                new Dart(this);
            }
        }
    }
    hasTileUnder(){
        return this.#tileUnder != null;
    }
    setTileUnder(tile){
        this.#tileUnder = tile;
        this.#tileUnder.at(this.tileX,this.tileY).offset(this.offsetX,this.offsetY);
        return this;
    }
    getTileUnder(){
        return this.#tileUnder;
    }
    /**
     * @returns {Tile} 
     * This kind of setting will work for now. It won't do good with traps thought so
     * @todo prime this for traps, cause that will be a problem later
     */
    clone(){
        var ret = new Tile(this.tileX,this.tileY,this.name).offset(this.offsetX,this.offsetY);
        if(this.#tileUnder){
            ret.setTileUnder(this.#tileUnder.clone());
        }
        //Manual copy of tile
        if(this.properties.trap){
            ret.setProperties({trap:this.properties.trap})
        }
        if(this.properties.portal){
            ret.setPortalSettings(
                this.properties.portal.id,
                this.properties.portal.type,
                this.properties.portal.x,
                this.properties.portal.y,
            )
        }
        for(let prop in this.properties){
            if(prop != 'trap' || prop != 'portal'){
                if(this.properties[prop] != ret.properties[prop]){
                    ret.properties[prop] = this.properties[prop];
                }
            }
        }

        return ret;
    }
    /**Sets the tile to a tile based grid position */
    at(x,y){
        this.x = (x * Tile.size) + this.offsetX;
        this.y = (y * Tile.size) + this.offsetY;
        this.tileX = x;
        this.tileY = y;
        if(this.#tileUnder){
            this.#tileUnder.at(x,y).offset(this.offsetX,this.offsetY);
        }
        return this;
    }
    is(...types){
        return types.some(t=>this.name === t);
    }
    toString(){
        return `${this.name}[${this.tileX},${this.tileY}]`
    }
    canWalk(){return this.properties.walkable}
    isTrap(){return this.properties.trap != null}
    isPushable(){return this.properties.pushable}
    isSlippery(){return this.properties.slippery}
    isGrappleable(){return this.properties.grappleable}
    /**@returns if it stops collision checks with other tiles upon walking on it */
    handleStep(dx,dy){
        if(this.properties.hasStepTrigger){
            if(this.name == Tnames.Lava){
                player.kill();
                return true;
            }
            if(this.is(Tnames.End)){
                player.color = 'gold'
                if(!goingToNextFloor){
                    goingToNextFloor = true;
                    GameKit.delay(()=>{
                        player.color = 'steelblue'
                        nextMap();
                    },30);
                }
                return false;
            }
            if(this.is(Tnames.Ice)){

                return false;
            }
            if(this.is(Tnames.Rock) || this.properties.pushable){
                this.handleRock(dx,dy)
                return false;
            }
            if(this.is(Tnames.Lock) && player.keys > 0){
                let c = this.getTileUnder().color;
                activeMap.set(this.tileX,this.tileY,this.getTileUnder());
                activeMap.get(this.tileX,this.tileY).color = c;
                player.keys--;
                player.setSpeed(0);
                GameKit.delay(()=>{
                    player.resetSpeed()
                },10)
                particles.lock(this)//.start()
                return false;
            }
            if(this.is(Tnames.Portal)){
                //Realistically I should add better checks for which type of portal you're on
                //for cases when you have two portals next to each other of the same type, but
                //I don't plan to do that anytime soon, soooo I'm just gonna be a bit lazy
                let prop = this.properties.portal;
                if(player.portal.id == undefined){
                    player.portal.id = prop.id;
                    player.portal.type = prop.type;
                    player.portal.hasTele = true;
                    player.at(prop.x,prop.y)
                    console.log(`PORTAL ${prop.x} ${prop.y}`)
                } else if(player.portal.hasTele){
                    if(prop.id != player.portal.id){
                        console.log("ID Tele")
                        player.portal.id = prop.id;
                        player.portal.type = prop.type;
                        player.portal.hasTele = true;
                        player.at(prop.x,prop.y)
                    }
                }

                return false;
            }
            if(this.is(Tnames.Breakable) || this.properties.hp){
                this.properties.hp--;
                if(this.properties.hp < 0){
                    b(this.tileX,this.tileY, this.getTileUnder());
                    return false;
                }
                let newCol = this.properties.hpColors[
                    Math.round(this.properties.hpColors.length * (this.properties.hp/this.properties.maxHp))
                ];
                if(newCol && newCol != this.color){
                    this.color = newCol;
                    GameKit.forceRenderSlowCanvas = true;
                }
                return false;
            }
            //Backup in case this is a specially defined tile
            this.stepTriggerFunction();
            
            return false;
        }
        return false;
    }

    handleRock(dx,dy){
        let nx = this.tileX + Math.sign(dx);
        let ny = this.tileY + Math.sign(dy);
        let other = b(nx,ny)
        //Make sure it is in bounds
        if(nx >= activeMap.width || nx < 0 || ny >= activeMap.height || ny < 0)
            return

        if((dy == 0 && dx != 0) || (dx == 0 && dy != 0)){
            //Only move cardinally
            let moveFunc;
            let imageName = this.imageName;
            if(this.properties.pushableWhiteList
                .some(name=>{
                    //console.log(other,name)
                    if(name) return other.is(name); 
                    return false
                })
            ){
                let tu = this.getTileUnder();
                let color1 = other.color;
                let color2 = tu.color;
                b(this.tileX,this.tileY, tu).color = color2;
                moveFunc = ()=>{
                    this.setTileUnder(other);
                    b(nx, ny, this).setImage(imageName);
                    b(nx,ny).getTileUnder().color = color1
                }
            } else if(other.is(Tnames.Lava)){
                b(this.tileX, this.tileY, this.getTileUnder())
                moveFunc = ()=>{
                    b(nx,ny,T.Path)
                }
                GameKit.delay(()=>{
                    particles.lavaSink(b(nx,ny));
                },10);
            } else return;
            player.setSpeed(0);
            particles.rock(this,b(nx,ny),imageName);
            GameKit.delay(()=>{
                player.resetSpeed();
                moveFunc();
            },10)
        }
    }
}


//Quick Check for inclusion early on
for(prop in Tnames){
    if(!(Tnames[prop] in TileProps) && prop != "Portal"){
        console.warn("TileProps does not have "+prop)
    }
}
for(prop in TileProps){
    if(!(Object.values(Tnames).includes(prop)) && !prop.includes("portal")){
        console.warn("Tnames does not have "+prop)
    }
}

/**
 * @typedef {object} Tileset
 * @property {function():Tile} Path
 * @property {function():Tile} Grass
 * @property {function():Tile} Wall
 * @property {function():Tile} Bars
 * @property {function():Tile} Lock
 * @property {function():Tile} NoRock
 * @property {function(Tile):Tile} Rock
 * @property {function():Tile} Hidden
 * @property {function(Angle,number,number):Tile} Trap
 * @property {function():Tile} Target
 * @property {function():Tile} Start
 * @property {function():Tile} End
 * @property {function():Tile} FakeLava
 * @property {function():Tile} Lava
 * @property {function():Tile} Ice
 * @property {function(id,number,number):Tile} PortalA
 * @property {function(id,number,number):Tile} PortalB
 * @property {function(number,number):Tile} PortalC
 * @property {function():Tile} Breakable
 */

/**@type {Tileset} */
const T = {
    Path:()=>new Tile(-1,-1,Tnames.Path),
    Grass:()=>new Tile(-1,-1,Tnames.Grass),
    Wall:()=>new Tile(-1,-1,Tnames.Wall),
    Bars:()=>new Tile(-1,-1,Tnames.Bars),
    Lock:()=>new Tile(-1,-1,Tnames.Lock),
    NoRock:()=>new Tile(-1,-1,Tnames.NoRock),
    Rock:(tileUnder = T.Path())=>new Tile(-1,-1,Tnames.Rock,tileUnder),
    Hidden:()=>new Tile(-1,-1,Tnames.Hidden),
    Trap:(dir,delay,speed)=>new Tile(-1,-1,Tnames.Trap).setTrapSettings(dir,delay,speed),
    Target:()=>new Tile(-1,-1,Tnames.Target),
    Start:()=>new Tile(-1,-1,Tnames.Start),
    End:()=>new Tile(-1,-1,Tnames.End),
    FakeLava:()=>new Tile(-1,-1,Tnames.FakeLava),
    Lava:()=>new Tile(-1,-1,Tnames.Lava),
    Ice:()=>new Tile(-1,-1,Tnames.Ice),
    PortalA:(id,x,y)=>
        new Tile(-1,-1,Tnames.Portal).setPortalSettings(id,"A",x,y),
    PortalB:(id,x,y)=>
        new Tile(-1,-1,Tnames.Portal).setPortalSettings(id,"B",x,y),    
    PortalC:(x,y)=>
        new Tile(-1,-1,Tnames.Portal).setPortalSettings(GameKit.ID("portalC"),"C",x,y),
    Breakable:()=>new Tile(-1,-1,Tnames.Breakable)
}

