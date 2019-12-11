var curFloor=0

/**Enum for directions */
const Dir={
    Up:'up',Down:'down',Left:'left',Right:'right',
    get Random(){
        return rndArrEle([Dir.Up,Dir.Down,Dir.Right,Dir.Left])
    }
}

/**Short for array range. Makes an array with numbers from start-end */
function aR(start,end){
    var index=0,arr=[];
    for(let i=start;(start<end)?(i<end+1):(i>end-1);(start<end)?(i++):(i--))
        arr[index++]=i
    return arr;
}

function Tile(name,color,hasImage,otherProps){
    this.name=name;
    //Allows many colors to be passed in to let randomization to happen
    Object.assign(this,otherProps)
    if(this.tileUnder){
        if(typeof this.tileUnder==='function')
            this.tileUnder=this.tileUnder()
        this.color=this.tileUnder.color
    }
    if(color!==undefined){
        if(Array.isArray(color))
            this.color=rndArrEle(color)
        else
            this.color=color
    }
    if(Array.isArray(hasImage))
        this.hasImage=rndArrEle(hasImage)
    else
        this.hasImage=hasImage
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
    this.subIs=function(...others){
        for(let i=0;i<others.length;i++){
            if(typeof others[i]==='string'){
                if(this.subName&&others[i]===this.subName)
                    return true
            }if(this.subName&&this.subName===others[i].subName){
                return true
            }
        }
        return false
    }
    this.withColor=function(...col){
        this.color=rndArrEle(col)
        return this;
    }
    this.withImg=function(...img){
        this.hasImage=rndArrEle(img)
        return this
    }
    
}
function subTile(tile,subName,otherProps){
    return Object.assign(tile,{subName:subName},otherProps)
}

function rndArrEle(arr){
    return arr[Math.floor(Math.random()*arr.length)]
}

function rndCol(rs=[0,255],gs=[0,255],bs=[0,255]){
    return `rgb(${(Array.isArray(rs))?rndArrEle(aR(rs[0],rs[1])):rs},`+
        `${(Array.isArray(gs))?rndArrEle(aR(gs[0],gs[1])):gs},${(Array.isArray(bs))?rndArrEle(aR(bs[0],bs[1])):bs})`
}

const colors={
    get wall(){return 'rgb(78,78,78)'},
    get path(){return rndCol([160,170],[160,170],[160,170])},
    get lava(){return 'maroon'},
    get start(){return 'white'},
    get end(){return 'gold'},
    get noRock(){return 'rgb(135,135,135)'},
    get trap(){return 'peru'},
    get hidden(){return 'rgb(65,65,65)'},
    get fakeLava(){return '#600000'},
    get grass(){return rndCol(0,[160,250],0)},
    get target(){return'rgb(191,54,12)'}
}

function ps(type){
    var p=_players[0].getCorners()
    b(p[0].x,p[0].y,type)
}

//Fancy Tile and subTile system which simplifies code a fair bit
var Tn={
    //These are all tiles with distinct properties
    Wall(color=colors.wall,hasImage)
        {return new Tile('wall',color,hasImage)},
    Path(color=colors.path,hasImage)
        {return new Tile('path',color,hasImage)},
    Lava(color=colors.lava,hasImage)
        {return new Tile('lava',color,hasImage)},
    Lock(tileUnder=Tn.Path(),hasImage='lock.png')
        {return new Tile('lock',tileUnder.color,hasImage,{tileUnder:tileUnder})},
    Start(color=colors.start,hasImage)
        {return new Tile('start',color,hasImage)},
    End(color=colors.end,hasImage='end.png')
        {return new Tile('end',color,hasImage)},
    Rock(tileUnder=Tn.Path(),hasImage='rock.png')
        {return new Tile('rock',tileUnder.color,hasImage,{tileUnder:tileUnder})},
    NoRock(color=colors.noRock,hasImage)
        {return new Tile('noRock',color,hasImage)},
    Trap(dir=Dir.Up,delay=30,speed,startVal=0,color=colors.trap,hasImage='trap.png')
        {return new Tile('trap',color,hasImage,{speed:speed,dir:dir,delay:delay,startVal:startVal})},
    Portal(type,id,color=colors.path,hasImage='portal'+type+'.png')//////////////////////////////////////
        {return new Tile('portal',color,hasImage,{id:id,type:type})},
    OneWayPortal(x,y,color=colors.path,hasImage=['portalA.png','portalB.png'])///////////////////////////
        {return subTile(Tn.Portal('C',-1,color,hasImage),'oneWayPortal',{x:x,y:y})},
    RockSwitch(onActivate=()=>{},tileUnder=Tn.Path(),color='purple',hasImage)///////////////////////////
        {return new Tile('rockSwitch',color,hasImage,{tileUnder:tileUnder,onActivate:onActivate})},
    Ice(color='rgb(0,135,253)',hasImage)
        {return new Tile('ice',color,hasImage)},
    Target(color=colors.target,hasImage='target.png')
        {return new Tile('target',color,hasImage)},
    //These are predefined subtypes of other type of tiles which do nothing different. They have no //#endregion
    //Params because they are the same as just passing in those params on other objects
    Bars(){return subTile(Tn.Wall(undefined,'bars.png'),'bars')},
    Hidden(){return subTile(Tn.Path(colors.hidden),'hidden')},
    FakeLava(){return subTile(Tn.Path(colors.fakeLava),'fakeLava')},
    RockRandom(tileUnder=Tn.Path()){return subTile(Tn.Rock(tileUnder,['rock.png','rock1.png']))},
    Grass(){return subTile(Tn.Path(colors.grass))}
}
//Makes lowercase properties of everything for the is function
for(var type in Tn){
    var name=Tn[type]().name
    if(!Tn[name])
        Object.defineProperty(Tn,name,{value:name})
}

Object.defineProperty(Tn,'SIZE',{value:35,})