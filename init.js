GameKit.makeCanvas();
//Pull things out of GameKit for ease of use
const {UI, Rnd, RectEnt, camera, Particle, ParticleSystem, Angle, pos, Counter, ID, mouse, entities, clamp} = GameKit;

let C = GameKit.Controls;
GameKit.options.imageDirectory = "gfx/";
GameKit.options.defaultImageFileType = ".png"
GameKit.options.renderIndependent = false;

GameKit.loadImages("armor","bars","dart","end","key","lock","portalA","portalB","rock","rock1","target","trap");

camera.zoom = 1.5;
var curMap = -1;

var doDebug = true;

const debug = {
    inv:(!doDebug)? false : false,
    clickTele:(!doDebug)? false : true,
    nextFloor:(!doDebug)? false : true,
    showCoords:(!doDebug)? false : true,
    get info(){
        return !debugFrame.options.hidden
    },
    set info(bool){
        if(debugFrame != undefined){
            if(bool)
                debugFrame.show()
            else
                debugFrame.hide();
        }
    },
    noFlip:(!doDebug)? false : true
}



function ease(cb, cond,rate = 30){
    let interval = setInterval(()=>{
        cb();
        if(cond()){
            clearInterval(interval)
        }
    },rate)
}

function setupControls(){
    GameKit.Controls.trackKeys('wasd',"space",'arrows',"r","i","c",".","/");
    var waitFor = {I:false,C:false,".":false,",":false,R:false}
    
    var waitForUnclick = false;

    GameKit.onTickFunctions.push(()=>{  
        if(doDebug){
            if(C.pressed['i']){
                if(!waitFor.I){
                    waitFor.I = true;
                    debug.info = !debug.info;
                }
            } else if(waitFor.I){
                waitFor.I = false;
            }
            if(C.pressed['c']){
                if(!waitFor.C){
                    GameKit.forceRenderSlowCanvas = true;
                    waitFor.C = true;
                    debug.showCoords = !debug.showCoords;
                }
            } else if(waitFor.C){
                waitFor.C = false;
            }
            if(C.pressed["/"]){
                if(!waitFor['/']){
                    waitFor["/"] = true;
                    nextMap();
                    
                }
            } else if(waitFor['/']){
                waitFor['/'] = false;
            }
            if(C.pressed["."]){
                if(!waitFor['.']){
                    waitFor["."] = true;
                    loadMap(curMap - 1);
                }
            } else if(waitFor['.']){
                waitFor['.'] = false;
            }
        }
        if(C.pressed["r"]){
            if(!waitFor['r']){
                waitFor["r"] = true;
                loadMap(curMap);
            }
        } else if(waitFor['r']){
            waitFor['r'] = false;
        }

        if(debug.clickTele){
            if(mouse.down){
                if(!waitForUnclick){
                    waitForUnclick = true;
                    player.position = GameKit.vec2().from(mouse).scale(1/camera.zoom);
                }
            //Click Event
            } else if(waitForUnclick){
                waitForUnclick = false;
            }
        }
    });
}
setupControls();

/**@type {UI.UIComponent} */
var debugFrame;

/**@enum @readonly */
const Difficulties = { Easy:"easy", Normal:'normal', Hard:"hard" }
const game = {
    difficulty:Difficulties.Easy,
    curDeaths:0, // For current run
    totalDeaths:0, // Includes previous runs
    loops:0,
    menuActive:true // Used to tell if the player should not be allowed to move
}


function makeMainMenu(){
    var easyButton = new UI.Button(10,10,30,20,'#19e693')
        .setTextFunction(()=>"Easy").setAnchor(UI.anchorPositions.BOTTOM_LEFT)
        .setClickColor("#0d7e50").setHoverColor("#12ab6d")
        .setHoverFunction(()=>info.setTextFunction(()=>"This is the best way to play"))
        .setClickFunction(()=>{
            mainFrame.hide();
            game.difficulty = Difficulties.Easy;
            game.menuActive = false;
        })

    var normalButton = new UI.Button(0,10,30,20,'yellow', 'black','black',"#baa21f","#dbc02a")
        .setTextFunction(()=>"Normal").setAnchor(UI.anchorPositions.BOTTOM)
        .setHoverFunction(()=>info.setTextFunction(()=>"This is a bit of a challenge"))
        .setClickFunction(()=>{
            mainFrame.hide();
            game.difficulty = Difficulties.Normal;
            game.menuActive = false;
        })

    var hardButton = new UI.Button(10,10,30,20,'#ff0100','black','black',"#b00000","#d00000")
        .setTextFunction(()=>"Hard")
        .setAnchor(UI.anchorPositions.BOTTOM_RIGHT)
        .setClickFunction(()=>{
            mainFrame.hide();
            game.difficulty = Difficulties.Hard;
            game.menuActive = false;
        })
        .setHoverFunction(()=>{info.setTextFunction(()=>"I don't recommend this")});
    
    var info = new UI.Text(0,0,80,20,'royalblue')
        .borderless().setTextFunction(()=>"Select your difficulty!")

    var header = new UI.Text(0,0,100,20,'darkblue','black','black')
        .setTextFunction(()=>"Dungeon Crawler!").setAnchor(GameKit.UI.anchorPositions.TOP)

    var mainFrame = new UI.Component(0,0,70,70,'royalblue')
        .addChildren(header, info, easyButton, normalButton, hardButton)

    var debugUI = new UI.Component(0,0,22,100,'lightgray')
        .setAnchor(UI.anchorPositions.RIGHT)
    
    debugFrame = debugUI;

    let numDebug = 10;
    for(let i = 0; i < numDebug; i++){
        let s = debugUI.getTotalSize();

        debugUI.addChildren(
            new UI.Text(0,(s.height/numDebug)*i,85,(debugUI.height/numDebug),'lightgray')
                .borderless().setAnchor(UI.anchorPositions.TOP)
                .setTextFunction(()=>i)
        )
    }
    if(!doDebug){
        debugUI.hide();
    }
    UI.addComponents(debugUI);

    var levelUI = new UI.Text(-GameKit.canvas.width*0.85/2,-GameKit.canvas.height*0.85/2,10,10,'blue','black','black')
    levelUI.setTextFunction(()=>(curMap !== undefined)?curMap:"");
    UI.addComponents(levelUI);
    return mainFrame;
}
let currentDebugStringIndex = 0;
function setDebugString(func){
    debugFrame.children[currentDebugStringIndex++].setTextFunction(func);
}

var mainFrame = makeMainMenu();
UI.addComponents(mainFrame);

setDebugString(()=>mouse);

GameKit.mouse.setDrawFunction((x,y,ctx)=>{
    ctx.fillStyle = (GameKit.mouse.down) ? "darkred" : 'peru';
    ctx.fillRect(x - 3,y - 3,6,6)
    ctx.strokeRect(x-3,y-3,6,6);
});

/**
 * @enum {new Angle()} 
 * @readonly 
 */
const Cardinals = {
    Up:new Angle(270),
    Down:new Angle(90),
    Left:new Angle(180),
    Right:new Angle(0)
}

/**@enum @readonly */
const drawLayers = {
    Tile:-1,
    Ent:0,
    Player:1
}

/*
GameKit.onTickFunctions.push(()=>{
    let c = GameKit.ctx2;
    GameKit.entities.filter(e=>e.constructor.name == "Tile" && e.is(Tnames.Portal)).forEach(e=>{
        let other = b(e.properties.portal.x,e.properties.portal.y)
        
        c.beginPath();
        if(e.properties.portal.type != "C")
            c.strokeStyle = ["red","orange",'yellow','green','blue','indigo','violet'][e.properties.portal.id];
        else
            c.strokeStyle =  ["red","orange",'yellow','green','blue','indigo','violet'][e.properties.portal.id % 7]
        c.moveTo(e.x,e.y);
        c.lineTo(other.x,other.y);
        c.stroke();
    })    
})*/