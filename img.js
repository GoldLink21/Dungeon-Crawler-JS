var images=[]
function preloadImages(){
    Array.from(arguments).forEach(img=>{
        var newImg=new Image()
        newImg.src='gfx/'+img
        images[img]=newImg
    })
}
preloadImages(
    'armor.png','bars.png','key.png','lock.png',
    'portalA.png','portalB.png','portalC.png','rock.png'
)
function getImg(str){
    if(images[str]!==undefined)
        return images[str]
    else throw new ReferenceError(`Image of gfx/${str} not preloaded`)
}