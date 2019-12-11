var scale=1;
/*
drawAfterConst.push(function drawKeys(){
    var im=images.get('key.png'),
        c=HTML.canvas,
        wMax=c.width-15
    var dx=16*scale,
        shift=3
    while(player.keys*dx+shift>wMax){
        dx--
    }

    for(let i=0;i<player.keys;i++){
        shadow(1)
        ctx.drawImage(im,(shift+i*dx),(c.height-23*scale),15*scale,20*scale)
        shadow()
    }
})
*/

var images={
    preload(...imgs){
        imgs.forEach(img=>{
            var i=new Image()
            i.src='gfx/'+img
            this[img]=i
        })
    },
    get(str){
        if(this[str])
            return this[str]
        else{
            try{
                images.preload(str)
                return images.get(str)
            }catch(e){
                throw new ReferenceError(`Image of gfx/${str} not preloaded`)
            }
        } 
    }
}

images.preload('armor.png','bars.png','key.png','lock.png','portalA.png','portalB.png',
    'rock.png','rock1.png','dart.png','speedUp.png','target.png')

window.onresize=function(){
    var c=/**@type {HTMLCanvasElement}*/(document.getElementById("canvas"));

    var maxWidth = (window.innerWidth-HTML.debug.offsetWidth)*0.9
    var maxHeight = (window.innerHeight-HTML.midbar.offsetTop-HTML.midbar.offsetHeight)*0.9

    if(debug.showInfo){
        maxWidth/=0.9
        maxWidth-HTML.debug.offsetWidth
        maxWidth*=0.9
    }
    //If tall than wider or equal
    if(board.length>=board[0].length){
        if(maxWidth>=maxHeight){
            scale = maxHeight/(board.length*Tn.SIZE)
        }else{
            scale=maxWidth/(board[0].length*Tn.SIZE)
        }
    }else{
        scale=maxWidth/(board[0].length*Tn.SIZE)
        if(board.length*Tn.SIZE*scale>maxHeight){
            scale = maxHeight/(board.length*Tn.SIZE)
        }
    }

    let possibleH=Math.min(maxHeight,board.length*Tn.SIZE*scale),
        possibleW=Math.min(maxWidth,board[0].length*Tn.SIZE*scale) 

    if(c.height!==possibleH){
        c.height=possibleH
    }if(c.width!==possibleW){
        c.width=possibleW
    }

    
}

function drawAllInGame(){
    var c=/**@type {HTMLCanvasElement}*/(document.getElementById("canvas"));
    
    //Clear the board first
    ctx.clearRect(0,0,c.width,c.height)

    ctx.shadowColor='black'  

    function imgRotated(img,x,y,width,height,deg){
        x*=scale
        y*=scale
        width*=scale
        height*=scale
        if(typeof deg==='string')
            deg=dirToDeg(deg)
        ctx.save()
        ctx.translate(x+width/2,y+height/2)
        ctx.rotate(Math.PI*deg/180)
        ctx.drawImage(img,-width/2,-height/2,width,height)
        ctx.restore()
    }
    //Draw all the tiles first
    var by=0,bx=0;
    board.forEach(y=>{
        bx=0;
        y.forEach(x=>{
            //Draw tiles first
            ctx.fillStyle=x.color;
            g.rect(bx*Tn.SIZE,by*Tn.SIZE,Tn.SIZE,Tn.SIZE)
            //Images go on top
            if(x.hasImage){
                shadow(2)
                //Any tile with a dir property can be drawn rotated
                if(x.dir){
                    imgRotated(images.get(x.hasImage),bx*Tn.SIZE,by*Tn.SIZE,Tn.SIZE-1,Tn.SIZE-1,dirToDeg(x.dir))
                }else{
                    ctx.drawImage(images.get(x.hasImage),bx*Tn.SIZE*scale,by*Tn.SIZE*scale,(Tn.SIZE-1)*scale,(Tn.SIZE-1)*scale)
                }
                shadow()
                ctx.strokeRect(bx*Tn.SIZE*scale,by*Tn.SIZE*scale,Tn.SIZE*scale,Tn.SIZE*scale)
            }   
            //Draw Portal ids
            if(x.is(Tn.portal)&&(debug.showPortalId||debug.showCoords)){
                if(x.type==='A')
                    ctx.fillStyle='blue'
                else if(x.type==='B')
                    ctx.fillStyle='brown'
                else if(x.type==='C')
                    ctx.fillStyle='forestgreen'
                ctx.fillText(x.id,((bx+1)*Tn.SIZE-12)*scale,((by+1)*Tn.SIZE-3)*scale)
                ctx.fillStyle='black'
            }
            //Draw coords on tiles
            if(debug.showCoords){
                ctx.fillStyle='rgba(10,10,10,0.5)'
                ctx.font=scale*10+'px Times New Roman'
                ctx.fillText("("+bx+','+by+')',(bx*Tn.SIZE+2)*scale,(by*Tn.SIZE+10)*scale)
                ctx.strokeStyle='black'
            }
            bx++
        }) 
        by++
    })
    pickups.forEach(pickup=>{
        ctx.fillStyle=pickup.color
        pickup.draw()
    })
    darts.forEach(dart=>{
        imgRotated(images.get('dart.png'),dart.x,dart.y,dart.width,dart.height,dirToDeg(dart.dir))
    })

    entities.forEach(ent=>ent.draw())

    _players.forEach(p=>{
        if(!p.hidden){
            p.draw()
            if(p.activeItem)
                p.activeItem.draw()               
        }
    })

    ctx.font=scale*15+'px Times New Roman'
    if(doDebug)
        g.outlinedText(curFloor+" - Debuging",3,15,'green')
    else if(curFloor>1)
        g.outlinedText(curFloor-1,3,15,'gold')
    else
        g.outlinedText('G'+(curFloor+1),3,15,'gold')

    ctx.stroke();
    ctx.closePath()
    
    drawAfterConst.forEach(func=>func())
}
/**Bypasses needing to multiply by scale */
var g={
    outlinedText(str,x,y,innerColor='white',lineWidth=5){
        ctx.fillStyle=innerColor
        ctx.lineWidth=lineWidth
        ctx.strokeText(str,x*scale,y*scale)
        ctx.fillText(str,x*scale,y*scale)
        ctx.lineWidth=1
    },
    rect(x,y,width,height,color){
        ctx.fillStyle=color;
        ctx.fillRect(x*scale,y*scale,width*scale,height*scale)
        ctx.strokeRect(x*scale,y*scale,width*scale,height*scale)
    },
    oval(x,y,width,height,color){
        ctx.fillStyle=color
        ctx.beginPath()
        ctx.ellipse((x+width/2)*scale,(y+height/2)*scale,(width/2)*scale,(height/2)*scale,0,0,Math.PI*2)
        ctx.fill()
        shadow()
        ctx.stroke()
        ctx.closePath()
    },
    ring(x,y,width,height,thickness,color){
        ctx.strokeStyle=color
        ctx.beginPath()
        shadow(1,1)
        ctx.ellipse((x+width/2)*scale,(y+height/2)*scale,(width/2)*scale,(height/2)*scale,0,0,Math.PI*2)
        ctx.lineWidth=thickness
        ctx.stroke()
        shadow()
        ctx.closePath()
        ctx.lineWidth=1
        ctx.strokeStyle='black'
    },
    img(src,x,y,w,h){
        if(typeof src==='string')
            src=images.get(src)

        ctx.drawImage(src,x*scale,y*scale,w*scale,h*scale)
    },
    imgRotated(src,deg,x,y,w,h){
        if(typeof deg==='string')
            deg=dirToDeg(deg)
        ctx.save()
        ctx.translate(x+width/2,y+height/2)
        ctx.rotate(Math.PI*deg/180)
        g.img(src,-w/2,-h/2,w,h)
        ctx.restore()
    }
}
function animate(){
    requestAnimationFrame(animate)
    if(Menu.isGame()){
        //ctx.shadowBlur=8
        drawAllInGame()
    }
    new Pickup(-1,-1,{isCircle:true,addToArr:false}).draw()
}
boardInit();
var move=false
setMovement(true)
animate()