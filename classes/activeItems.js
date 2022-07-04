class ActiveItem extends Ent {
    /**@param {Ent} parent */
    constructor(parent, width, height, color){
        super(parent.x,parent.y,width,height,color);
        this.parent = parent;
        this.offset = height/2 + 4;
        this.deactivate();
        this.defaultWidth = width;
        this.defaultHeight = height;
        /**Tells if the item should stop movement */
        this.stopsMovement = false;
    }
    activate(){
        this.show();
        this.activeCollision = true;
    }
    deactivate(){
        this.hide();
        this.activeCollision = false;
    }
    isActive(){
        return this.activeCollision;
    }
    move(){
        if(this.isActive()){
            this.x = this.parent.x;
            this.y = this.parent.y;
            let dir = this.parent.lastDirection.deg

            switch (dir) {
                case 180: case 0:
                    this.width = this.defaultHeight;
                    this.height = this.defaultWidth;
                    break;
                case 90: case 270:
                    this.width = this.defaultWidth;
                    this.height = this.defaultHeight;
                    break;
            }

            this.moveInDirection((this.parent.width/2 + this.offset),dir);            
            this.activeAction();
        }
    }
    activeAction(){
        
    }
}

/**Used for collectibles that give active items */
class CActive extends Collectible{
    constructor(x,y,w,h,c,clazz){
        super(x,y,w,h,c);
        this.clazz = clazz;
    }
    onCollect(){
        player.activeItem = new this.clazz(player);
    }
}

class AShield extends ActiveItem{
    static collectible(x,y){
        return new CActive(x,y,8,20,'brown',this)  ;
    }
    constructor(p){
        super(p,25,8,'brown');
    }
    activeAction(){
        GameKit.entities.filter(e=>e.constructor.name == "Dart")
            .forEach(d=>{
                if(this.collides(d)){
                    d.toRemove = true;
                }
            })
    }
}