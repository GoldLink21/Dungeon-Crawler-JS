const maps = {
    [-1]:()=>new TMap(8,8)
        .withFlip(false,false)
        .fill(T.Path).start(0,0).end(7,7)
        .set(2,1,T.Path)
        .set(3,1,T.Lock)
        .set(2,[4,5,6],T.Ice)
        .addEnt(()=>new CKey(1,0))
        .set(7,[1,2,3,4,5],new Tile(0,0,Tnames.Breakable))
        .set(5,5,T.Trap(Cardinals.Down))
        .set(1,2,T.Rock)
        .addEnt(()=>new CCheckpoint(2,0))
        .addEnt(()=>AShield.collectible(0,1)),
    0:()=>new TMap(7,9).fill(T.Grass)
        .anyFlip()
        .start(1,1).end(3,8)
        .set(0,[0,1,2,3],T.Wall())
        .set([1,2,3,4],0,T.Wall())
        .set(4,[1,2,3],T.Wall())
        .set([1,2],3,T.Wall())
        .set(3,[1,2,3],T.Path())
        .set([1,2,2],[2,2,1],T.Path()),
    1:()=>new TMap(10,5).fill(T.Grass)
        .set(0,2,T.Start()).set(8,2,T.End())
        .set([6,7,8],1,T.Wall)
        .set([6,7,8],3,T.Wall)
        .set(7,2,T.Lock().setTileUnder(T.Grass()))
        .set(9,2,T.Wall)
        .addEnt(()=>new Toggle(9,1,10,10,'lightgray','dimgray')
            .setOnActivate(()=>{player.keys++;b(7,2).handleStep()})),
    2:()=>new TMap(9,9).fill(T.Wall)
        .anyFlip()
        .set(1,7,T.Start).set(7,1,T.End)
        .set([0,2,4],[6,4,2],T.Trap(Cardinals.Right))
        .set([2,4,4,6],[5,5,3,3],T.Lava)
        .set([1,2,3],6,T.Path)
        .set(3,[4,5],T.Path)
        .set([3,4,5],4,T.Path)
        .set(5,[2,3,4],T.Path)
        .set([5,6,7],2,T.Path),
    3:()=>new TMap(9,9).fill(T.Wall)
        .anyFlip()
        .set(1,1,T.Start).set(7,1,T.End)
        .set([1,2,3,5,6,7],7,T.Path)
        .set(4,2,T.Path)
        .set(1,[2,3,4,5,6],T.Path)
        .set(7,[2,3,4,5,6],T.Path)
        .set(3,[2,3,4,5,6],T.Path)
        .set(5,[2,3,4,5,6],T.Path)
        .set([4,2,6,4,4],[7,6,6,1,6],T.Lava)
        .set(8,6,T.Trap(Cardinals.Left,110))
        .set(0,6,T.Trap(Cardinals.Right,110))
        .set(4,0,T.Trap(Cardinals.Down,90)),
    4:()=>new TMap(9,9).fill(T.Wall)
        .anyFlip()
        .set([2,3,5],1,T.Path)
        .set(1,1,T.Start)
        .set(7,1,T.End)
        .set(6,1,T.Lock)
        .set([4,3,5],[1,3,3],T.Lava)
        .set([3,4,5],2,T.Path)
        .set(4,[3,4,5,6,7],T.Path)
        .set(3,[4,6],T.Trap(Cardinals.Right,120))
        .set(5,[4,6],T.Trap(Cardinals.Left,120))
        .set([2,6],2,T.Trap(Cardinals.Up,120))
        .set([2,6],0,T.Trap(Cardinals.Down,120))
        .addEnt(()=>new CKey(4,7)),
    5:()=>new TMap(9,9).fill(T.Wall)
        .anyFlip()
        .start(4,4).end(8,4)
        .set(4,[1,2,3,5,6,7],T.Path)
        .set([1,2,3,5,6,7],4,T.Path)
        .set([5,6,7],4,T.Lock)
        .set(5,[2,6],T.Lava)
        .set(6,[2,6],T.Trap(Cardinals.Left,100))
        .set(2,3,T.Trap(Cardinals.Down,100))
        .set(2,5,T.Trap(Cardinals.Up,100))
        .addEnt(()=>new CKey(4,1))
        .addEnt(()=>new CKey(4,7))
        .addEnt(()=>new CKey(1,4)),
    6:()=>new TMap(9,9).fill(T.Lava)
        .anyFlip()
        .run(map=>{
            for(let i = 1; i < 9 ; i+=2)
                map.set(i,[1,2,3,4,5,6,7],T.Path)
            if(Rnd.chance()){
                map.start(1,1).end(7,7)
                    .set([3,5,7],1,T.Path)
                    .set([2,4,6],1,T.Lock)
                    .addEnt(()=>new CKey(1,7))
                    .addEnt(()=>new CKey(3,7))
                    .addEnt(()=>new CKey(5,7))
            } else {
                map.start(1,7).end(7,1)
                    .set([3,5,7],7,T.Path)
                    .set([2,4,6],7,T.Lock)
                    .addEnt(()=>new CKey(1,1))
                    .addEnt(()=>new CKey(3,1))
                    .addEnt(()=>new CKey(5,1))
            }
            if(Rnd.chance()){
                map.set(0,[2,4,6],T.Trap(Cardinals.Right,100))
            } else {
                map.set(8,[2,4,6],T.Trap(Cardinals.Left,100))
            }
        }),
    7:()=>new TMap(9,9).fill(T.Wall)
        .start(0,1).end(8,6)
        .set(1,[1,2,3,4,5,6],T.Path)
        .set([2,3,4],6,T.Path)
        .set(4,[2,3,4,5,6],T.Path)
        .set([5,6,7],2,T.Path)
        .set(7,[3,4,5,6],T.Path)
        .set([4,7,1],[1,7,7],T.Lava)
        .set([2,5,3,8,2],[4,5,3,4,2],T.Path)
        .set(4,0,T.Trap(Cardinals.Down,135))
        .set([1,7],8,T.Trap(Cardinals.Up,135)),
    8:()=>new TMap(12,7).fill(T.Wall)
        .start(0,1).end(11,4)
        .set(0,[2,3,4],T.Path)
        .run(map=>{
            for(let i = 0; i<map.width-1;i++)
                map.set(i,0,T.Breakable().setProperties({hp:7})).set(i,4,T.Path)
        })
        .set(11,[0,1,2,3],()=>T.Breakable().setProperties({hp:6}))
        .set(0,0,T.Breakable)
        .set([1,3,5,7,9],3,T.Trap(Cardinals.Down,180))
        .set([2,4,6,8,10],5,T.Trap(Cardinals.Up,90)),
    9:()=>new TMap(9,9).fill(T.Lock)
        .start(7,7).end(1,1)
        .set(0,[0,1,7,8],T.Wall)
        .set(8,[0,1,7,8],T.Wall)
        .set([1,1,7,7],[0,8,0,8],T.Wall)
        .set(8,[2,3,4,5,6],T.Trap(Cardinals.Left,120))
        .set(0,[2,3,4,5,6],T.Trap(Cardinals.Right,120))
        .set([2,3,4,5,6],0,T.Trap(Cardinals.Down,120))
        .set([2,3,4,5,6],8,T.Trap(Cardinals.Up,120))
        .run(map=>{
            for(let i = 1; i < 8; i++){
                for(let j = 1; j < 8; j++){
                    if(i!=1 || j != 1){
                        map.addEnt(()=>new CKey(i,j));
                    }
                }
            }
        }),
    10:()=>new TMap(9,9).fill(T.Wall)
        .set([1,4,4],[3,6,2],T.Rock)
        .set(5,6,T.NoRock)
        .set(1,[2,4,5,6,7],T.Path)
        .set([2,3,4,5],7,T.Path)
        .set(3,[1,2,3,4,5,6],T.Path)
        .set(3,0,T.Trap(Cardinals.Down,90))
        .set([5,6,7],2,T.Path)
        .set([1,7],[6,2],T.Lava)
        .set(7,[3,4,5,6],T.Path)
        .start(1,1).end(7,7),
    11:()=>new TMap(9,9).fill(T.Wall)
        .run(map=>{
            for(let i = 1; i < 8 ; i+=2)
                map.set(i,[2,3,4,5,6],T.Path)
        })
        .start(7,7).end(1,1)
        .portals(7,1,3,7)
        .portals(3,1,5,7)
        .portals(5,1,1,7)
        .set([2,4,6],4,T.Lava)
        .set(0,4,T.Trap(Cardinals.Right,100))
        .set(8,4,T.Trap(Cardinals.Left,100)),
    12:()=>new TMap(15,3).fill(T.Path)
        .start(0,0).end(14,1)
        .set([2,4,6,8,10,12,14],[0,1,0,1,0,1,0],T.Lava)
        .set(0,1,T.Wall)
        .set([0,1,2,4,5,6,8,9,10,12,13,14],2,T.Wall)
        .set([3,7,11],2,T.Trap(Cardinals.Up,100)),
    13:()=>new TMap(7,10).fill(T.Path)
        .border(T.NoRock)
        .start(0,0).end(6,9)
        .set(6,[6,7,8],T.Lava)
        .set(5,[7,8,9],T.Wall)
        .set([1,3,5],[5,8,1],T.Rock)
        .set(5,0,T.Trap(Cardinals.Down,100))
        .set(0,5,T.Trap(Cardinals.Right,100))
        .set(3,9,T.Trap(Cardinals.Up,100))
        .set(4,[7,8],T.NoRock),
    14:()=>new TMap(11,11).fill(T.Wall)
        .zoom(1.2)
        .set([0,3,0,8,9,3,6,10],[3,3,10,10,2,0,4,8],T.Path)
        .set([4,3,0,1,2,6,6,10],[3,4,4,7,7,5,6,9],T.Path)
        .set([4,5,6],0,T.Path)
        .set(9,[0,3,4,5],T.Path)
        .set([8,7,6],9,T.Path)
        .set(0,[9,8,7],T.Path)
        .start(0,0).end(10,10)
        .portals(1,0,10,0)
        .set(8,0,T.Lava)
        .run(map=>{
            //These are all in [y,x] pairs for some stupid reason. 
            //This is what you get for stealing old code
            var mustStart=[1,0],
                mustEnd=[10,8],
                startLoc=[[5,0],[3,5],[1,6],[10,6],[8,2],[7,6],[5,8]],
                endLoc=[[0,3],[3,3],[3,0],[8,10],[0,10],[6,4],[9,2]]
            shuffleSimilar(startLoc,endLoc)
            startLoc.unshift(mustStart)
            endLoc.push(mustEnd)
            for(let i = 0; i < startLoc.length; i++){
                map.set(startLoc[i][1],startLoc[i][0],T.PortalC(endLoc[i][0],endLoc[i][1]))
            }
        })
        .set([1,2,3,3,4,5,7,5,10],[4,6,7,5,1,5,6,9,4],T.PortalA(0,10,0).setPortalSettings(0,'C',10,0)),
    15:()=>new TMap(5,10).fill(T.Wall).start(0,1).end(4,0)
        .set([2,0],[8,2],T.Path)
        .set(4,[1,2],T.Path)
        .set(1,[2,3,4,5,6,7,8],T.Path)
        .set(3,[2,3,4,5,6,7,8],T.Path)
        .set(1,9,T.Trap(Cardinals.Up,100))
        .set(3,1,T.Trap(Cardinals.Down,100))
        .addEnt(()=>AShield.collectible(1,3)),
    16:()=>new TMap(11,11).fill(T.Wall)
        .start(5,5).end(9,5)
        .set([1,2,3,4,7,8],5,T.Path)
        .set([1,2,3,6,7,8,9],1,T.Path)
        .set(5,[1,2,3,4,6,7,8,9],T.Path)
        .set([1,2,3,4,6,7,8,9],9,T.Path)
        .set([6,4,4,5,4],[5,1,5,6,9],T.Bars)
        .run(map=>{
            for(let i=2;i<11;i+=4)
                map.set([2,3,4,6,7,8],i,T.Trap(Cardinals.Up,95-(5*i)))
        })
        .addEnt(()=>new TTile(9,1,5,6))
        .addEnt(()=>new TTile(9,9,4,1))
        .addEnt(()=>new TTile(1,1,4,9))
        .addEnt(()=>new TTile(1,9,4,5))
        .addEnt(()=>new TTile(1,5,6,5)),
    17:()=>new TMap(13,13).fill(T.Path)
        .border(T.Wall)
        .run(t=>{
            for(let i=1;i<12;i++)
                t.set([i,12-i],[i,i],T.Lava)
        })
        .start(6,6).end(6,1)
        .set([4,5,6,7,8],3,T.Bars)
        .set([5,6,7],4,T.Bars).set(6,5,T.Bars)
        .set(1,[5,7],T.Wall)
        .set([9,10],6,T.Wall)
        .set([12,12],[5,7],T.Trap(Cardinals.Left,80))
        .addEnt(()=>new TDart(6,9,[4,8],9,[Cardinals.Right,Cardinals.Left],3))
        .addEnt(()=>new TDart(6,10,[4,8],10,[Cardinals.Right,Cardinals.Left],4))
        .addEnt(()=>new TDart(6,8,[5,7],8,[Cardinals.Right,Cardinals.Left],2))
        .addEnt(()=>new TDart(6,7,[5,7],7,[Cardinals.Right,Cardinals.Left],2))
        .addEnt(()=>new TTile(11,6,6,5))
        //Left Toggles 
        .run(map=>{
            var ys = [2,10,6];
            //I'm lazy so I reused the shuffle similar from earlier with a junk array
            shuffleSimilar(ys,[0,0,0]);
            var funcs = [
                ()=>{
                    b(4,3,T.Trap(Cardinals.Right,100))
                    b(8,3,T.Trap(Cardinals.Left,100))
                    b(5,3,T.Path);b(7,3,T.Path)
                },
                ()=>{
                    b(3,2,T.Trap(Cardinals.Right,100));
                    b(9,2,T.Trap(Cardinals.Left,100))
                },
                ()=>{b(6,3,T.Path)}
            ]
            for(let i = 0 ; i < ys.length; i++){
                map.addEnt(()=>new Toggle(1,ys[i],10,10,'purple',(i==2)?'green':'red').setOnActivate(funcs[i]))
            }
        })
        //Bottom toggles
        .run(map=>{
            //1 or -1
            let choice = (Rnd.chance())?1:-1;
            map.addEnt(()=>{
                let t = new TTile(6+choice,11,6,4)
                t.color = 'purple'
                t.inactiveColor = 'purple';
                t.activeColor = 'green';
                return t;
            })
                .addEnt(()=>new Toggle(6-choice,11,10,10,'purple','red').setOnActivate(()=>{
                    b(5,4,T.Trap(Cardinals.Right,100));
                    b(7,4,T.Trap(Cardinals.Left,100))
                }))
        }),
    18:()=>new TMap(9,5).fill(T.NoRock)
        .border(T.Wall)
        //.addEnt() * 4 for enemies
        .start(0,2).end(8,2)
        .set(4,2,T.Lava)
        .set([6,2],2,T.Path),
    19:()=>new TMap(9,5).fill(T.Rock)
        .start(0,0).end(8,4)
        .set([2,2,3,4,3,1,2,4,5,4,6,4,5],[0,1,0,1,3,2,4,3,3,4,4,0,0],T.Path)
        .set(7,4,T.Lava),
    20:()=>new TMap(6,8).fill(T.Bars)
        .start(0,0)
        .run(t=>{
            for(let i=1;i<8;i+=2){
                t.set([0,1,2,3,4,5],i,T.Path)
                t.set([1,2,3,4],i-1,T.Trap(Cardinals.Down,25+43*i))
            }
        })
        .set([5,0,5],[2,4,6],T.Path)
        .end(0,7)
        .addEnt(()=>new CCheckpoint(0,5))
        
        
}


var checkPoint = null;

function loadMap(which){
    if(which in maps){
        //Remove all non-players
        entities.filter(e=>e.constructor.name != "Player").forEach(d=>d.remove());
        //A reload changes where you spawn if there is a checkpoint
        let reloaded = (curMap == which);
        curMap = which;
        player.reset()
        if(activeMap != undefined)
            activeMap.remove();
        activeMap = maps[which]();
        //logFlip();
        activeMap.track();
        if(checkPoint && reloaded) {
            activeMap.set(activeMap.startX,activeMap.startY,T.Path);
            activeMap.start(checkPoint.x,checkPoint.y)
        } else {
            checkPoint = null;
        }
        player.at(activeMap.startX,activeMap.startY);
        goingToNextFloor = false;
        GameKit.delay(()=>GameKit.renderSlowCanvas(),3)
        //GameKit.renderSlowCanvas()
        return true;
    }
    //alert("No map")
    return false;
}

function nextMap(){
    if(loadMap(curMap + 1)){
        //Loaded properly
    } else {
        alert("No more map!")
    }
}

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