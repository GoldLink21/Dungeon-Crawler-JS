mainFrame.children[2].click();

var player = new Player();
debug.info = false;
loadMap(-1);
camera.zoom = 1.2
debug.nextFloor = true;
doDebug = true;
debug.clickTele = false;

var ps = new ParticleSystem(0,0,10,10).addParticleType(()=>new Particle(0,0,10,10,'white',10).setChange({x:1}))

function logFlip(){
    console.log(`Vert: ${activeMap.verticalFlip}, Horiz: ${activeMap.horizFlip}`);
}

/*fetch("./classes/tiles.json").then(dat=>{
    dat.json().then(data=>console.log(data))
})*/

/**
 * @todo Ice does werid things with diagnal movement
 * @todo Active items
 * @todo Rotations are broken for traps
 * @todo Enemies
 * @todo Particles are all sorts of messed up with new engine
 */