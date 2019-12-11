function mapKit(){
    return {
        arr:[[]],
        /**@type {(function(this):Entity)[]} */
        ents:[],
        onLoad:[
            (t)=>{
                t.ents.forEach(e=>e(t))
            }
        ],
        _hasSetHelp:false,
        get(x,y){
            if(x<0||y<0||x>=this.arr[0].length||y>=this.arr.length)
                return false
            return this.arr[y][x]
        },
        set(type=Tn.Path,width=9,height=9){
            this.arr=[];
            for(let i=0;i<height;i++){
                this.arr[i]=[];
                for(let j=0;j<width;j++)
                    this.tile(j,i,tCopy(type))
            }
            this.isSet=true
            return this
        },
        clone(floor,loops){
            /*
            if(typeof floor==='number'){
                var tL
                if(loops!==undefined){
                    tL=game.loops
                    game.loops=loops
                }
                var k=kits[floor]
                this.arr=k.arr
                this.ents=k.ents
                game.loops=tL
            }else{
                this.arr=floor
            }*/
            //Must be fixed later
            return this
        },
        tile(x=[],y=[],type=Tn.Path){
            if(Array.isArray(x)){
                if(Array.isArray(y))
                    for(let i=0;i<x.length;i++)
                        //Goes through using each x and y as a pair, meaning they are all points
                        this.arr[y[i]][x[i]]=tCopy(type);
                else
                    for(let i=0;i<x.length;i++)
                        //Means that y is constant so all x's are at that y 
                        this.arr[y][x[i]]=tCopy(type);
            }else if(Array.isArray(y))
                for(let i=0;i<y.length;i++)
                    //Means the x is constant and so all y's go at that x
                    this.arr[y[i]][x]=tCopy(type);
            else
                //Two constants passed in so it's just one point
                this.arr[y][x]=tCopy(type);
            return this
        },
        SaE(start,end){
            this.tile(start[0],start[1],Tn.Start())
            this.tile(end[0],end[1],Tn.End())
            return this
        },
        border(type){
            for(let i=0;i<this.arr.length;i++)
                for(let j=0;j<this.arr[0].length;j++)
                    if(j===0||j===this.arr[0].length-1||i===0||i===this.arr.length-1)
                        this.tile(j,i,type)

            return this
        },
        portals(p1,p2,id=nextId("portal")){
            this.arr[p1[1]][p1[0]]=Tn.Portal('A',id);
            this.arr[p2[1]][p2[0]]=Tn.Portal('B',id);
            return this
        },
        addBorder(type){
            var nArr=new Array(this.arr[0].length+2).fill(type)
            this.arr.forEach(row=>{
                row.push(type)
                row.unshift(type)
            })
            this.arr.unshift(nArr)
            this.arr.push(nArr)
            return this
        },
        addEnt(...ents){
            while(ents.length>0){
                this.ents.push(ents.shift())
            }
            return this
        },
        setHelpInfo(str){
            this._hasSetHelp=true
            this.onLoad.push(()=>setHelpInfo(str))
            return this
        },
        /**@param {function(this)} func */
        if(condition,func,elseFunc=()=>{}){
            if(condition)
                func(this)
            else
                elseFunc(this)
            return this
        },
        /**@param {function(this)} func*/
        run(func){
            func(this)
            return this
        },
        get array(){
            entities=[]
            pickups=[]
            traps=[]
            if(!this._hasSetHelp)
                this.onLoad.push(()=>setHelpInfo())
            this.onLoad.forEach(func=>func(this))
            return this.arr
        },
        register(){
            floorFunc[getLastFloor()+1]=()=>this.array
        },
        getCode(){
            var w=this.arr[0].length,
                h=this.arr.length
            var out='mapKit().set(Tn.Path,'+w+','+h+')'
            var self=this
            var grassCoords=[]
            function addT(x,y){
                var t=self.get(x,y)
                if(t.is(Tn.trap)){
                    return `\n    .tile(${x},${y},Tn.Trap("${t.dir}",${t.delay},${t.speed}))`
                }else if(t.is(Tn.portal)){
                    if(t.type==='C'){
                        return `
                        .tile(${x},${y},Tn.OneWayPortal(${t.x},${t.y}))`
                    }else{
                        return `
                            .tile(${x},${y},Tn.Portal(${t.type},${t.id}))`
                    }
                }else if(t.is(Tn.rockSwitch)){
                    return ''
                }else if(t.is(Tn.lock,Tn.rock)){
                    var first=t.name.substr(0,1).toUpperCase(),
                        f2=t.tileUnder.name.substr(0,1).toUpperCase(),
                        tu=t.tileUnder
                    return `\n    .tile(${x},${y},Tn.${first+t.name.substr(1)}(Tn.${f2+t.tileUnder.name.substr(1)}))`
                }else{
                    if(t.is(Tn.path)&&t.color.startsWith('rgb')){
                        var sp=disectRGB(t.color)
                        if(isBetween(sp[0],160,170)&&isBetween(sp[1],160,170)&&isBetween(sp[2],160,170)){
                            return ''
                        }else if(sp[0]==='0'&&isBetween(sp[1],160,250)&&sp[2]==='0'){
                            grassCoords.push(v(x,y))
                            return ''
                        }
                    }
                    var first=t.name.substr(0,1).toUpperCase()
                    return `\n    .tile(${x},${y},Tn.${first+t.name.substr(1)}("${t.color}"${(t.hasImage===undefined)?'':',"'+t.hasImage+'"'}))`
                }
            }
            for(let i=0;i<this.arr.length;i++){
                for(let j=0;j<this.arr[i].length;j++){
                    out+=addT(j,i)
                }
            }
            if(grassCoords.length>0)
                out+=`\n    .tile([${grassCoords.map(p=>p.x).join(',')}],[${grassCoords.map(p=>p.y).join(',')}],Tn.Path(colors.grass))`
            
            
            if(this.ents.length>0){
                this.ents.forEach(ent=>{
                    out+='\n    .addEnt('+ent.toString()+')'
                })
            }

            return out
        },
        noEnts(){
            this.ents=[]
            return this
        },
        tell(str,btnStr){
            tell(str,btnStr)
            return this;
        },
        tellL(str,btnStr){
            tellL(str,btnStr)
            return this
        }
    }
}