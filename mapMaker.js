var makerKit,
    copiedTile,
    clickType,
    isEditing=false

function query(question,...possibleValues){
    var str=window.prompt(question)
    if(possibleValues.includes(str))
        return str
    return query(question,...possibleValues)
}

function mapMakerInit(nStr){
    player.setPosition(-1,-1)
    curFloor=-2
    debug.showCoords=true
    const hasOptions=['Portal','OneWayPortal','Trap','Rock','Lock']

    //Rock and Lock need tileUnder
    isEditing=true
    traps=[]
    darts=[]
    entities=[]
    var ele=HTML.mapMaker

    var options=document.createElement('div')
    options.style.border='2px solid black'
    options.id='mmOptions'
    ele.after(options)
    
    ele.innerHTML=''
    var str
    if(nStr===undefined)
        str=window.prompt("Give a width and height between 3 and 12.\nFormat: 3x12 or 5x5")
    else
        str=nStr

    var btns={}

    var arr=str.split('x')
    arr.map(Number)
    if(arr.length===2&&!isNaN(arr[0])&&!isNaN(arr[1])&&arr[0]>=3&&arr[0]<=12&&arr[1]>=3&&arr[1]<=12){//////////////////
        _players.forEach(p=>{p.hidden=true;p.setCanMove(false)})
        makerKit=mapKit().set(Tn.Path,Number(arr[0]),Number(arr[1]))
        board=makerKit.arr
        document.addEventListener('clickOnTile',()=>{
            if(copiedTile!==undefined){
                if(clickType==='tile'){
                    if(copiedTile==='Start'||tCopy(copiedTile).is(Tn.start)){
                        if(getAllTileOfType('start').length>0){
                            var p=getAllPointsOfTilesType('start')[0]
                            makerKit.tile(p.x,p.y,Tn.Path)
                        }
                    }
                    makerKit.tile(lastClickedPoint.x,lastClickedPoint.y,tCopy(copiedTile))
                }else if(clickType==='entity'){
                    var nc=copiedTile,
                        p=lastClickedPoint
                    makerKit.addEnt(()=>nc(p.x,p.y))
                    //copiedTile(lastClickedPoint.x,lastClickedPoint.y)
                }
            }
        })
        
        function aBT(str){
            var e=document.createElement('button')
            e.innerHTML=str
            e.addEventListener('click',()=>{
                if(isEditing){
                    clickType="tile"
                    //Add options here
                    if(!hasOptions.includes(str)){
                        if(str==='Path'||str==='Grass'){
                            copiedTile=Tn[str]
                        }else
                            copiedTile=Tn[str]
                    }else{
                        if(str==='Portal'){
                            copiedTile=Tn.Portal(query("A or B",...['A','B']),query("Id?\n(0-10)\nId's of portals must match for portal to work",...aR(0,10).map(String)))
                        }else if(str==='OneWayPortal'){
                            copiedTile=Tn.OneWayPortal(
                                query('Desired x?',...aR(0,board[0].length-1).map(String)),
                                query('Desired y?',...aR(0,board.length-1).map(String)))
                        }else if(str==='Trap'){
                            copiedTile=Tn.Trap(
                                query("Which Direction?\n(up,down,left,right)",'up','down','left','right'),
                                query('What delay?\n(20-60)',...aR(20,60).map(String)))
                        }else if(["Lock",'Rock'].includes(str)){
                            var all=[]
                            for(let va in Tn){
                                if(!["Lock","Rock"].includes(va))
                                    all.push(va)
                            }
                            function getTileUnder(){
                                var val=window.prompt("Which Tile under?\n("+all.join(', ')+')')
                                if(!all.includes(val))
                                    return getTileUnder()
                                if(val==='Trap'){
                                    return Tn.Trap(
                                        query("Which Direction?\n(up,down,left,right)",'up','down','left','right'),
                                        query('What delay?\n(20-60)',...aR(20,60).map(String)))
                                }else if(val==='Portal'){
                                    return Tn.Portal(query("A or B",'A','B'),query("Id?\n(0-10)\nId's of portals must match for portal to work",...aR(0,10).map(String)))
                                }else if(val==='OneWayPortal')
                                    return Tn.OneWayPortal(
                                        query('Desired x?',...aR(0,board[0].length-1).map(String)),
                                        query('Desired y?',...aR(0,board.length-1).map(String)))
                                return Tn[val]()
                            }
                            copiedTile=Tn[str](getTileUnder())
                        }
                    }
                }
            })
            btns[str]=e
            return e
        }

        function aBE(constructor){
            var btn=document.createElement('button')
            btn.innerHTML=constructor.name
            btn.addEventListener('click',()=>{
                clickType='entity'
                copiedTile=constructor
            })
            return btn
        }
        
        for(ti in Tn){
            if(!["RockRandom","RockSwitch"].includes(ti)){
                ele.appendChild(aBT(ti))
            }
        }

        var picks=[pKey,pArmor,pLava,pShield,pSpeedUp]
        picks.forEach(p=>ele.appendChild(aBE(p)))

    }else{
        alert('Improper format')
        mapMakerInit()
    }
}

function mapMakerCheck(){
    return (getAllTileOfType('start').length===1&&getAllTileOfType('end').length>=1)
}

function tryPlayCustomMap(){
    if(mapMakerCheck()){
        isEditing=false
        _players[0].hidden=false
        _players[0].setCanMove(true)
        _players[0].resetPosition()
        copiedTile=undefined
        makerKit.array
        return true
    }else{
        tell("Map must have one start tile and at least one end tile")
        return false
    }
}

/*
Pickups:
    key:pKey x y id
    lava:pLava x y id
    shield:pShield x y id
    armor:pArmor x y id
    clone:pClone x y id nx ny
    checkPoint:pCheckPointPostLoad x y id addOldCheckPoint onGrab
    speedUp:pSpeedUp x y
Switches:
    generic:new Switch 
Enemy:new Enemy(path:new Path( loop? v()[]  ))
*/