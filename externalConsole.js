class ExternalConsole{
    constructor(parent=document.body,show=true){
        this.isVisible=show
        this.inputLog=[]
        /**@type {{str:string,func:Function,nn:string,max:number,min:number}[]} */
        this.commands=[];
        this.isFocused=false
        this.HTML={
            all:document.createElement('div'),
            input:document.createElement('input'),
            btn:document.createElement('button'),
            output:document.createElement('div')
        }
        this.HTML.all.style.border='solid black 1px'
        this.HTML.btn.textContent='Run'
        this.HTML.input.style.fontSize='15px'
        this.HTML.input.size=27
        this.HTML.input.placeholder='Command here'
        this.HTML.input.addEventListener('focus',()=>{this.isFocused=true})   
        this.HTML.input.addEventListener('blur',()=>{this.isFocused=false})     

        function append(...children){
            children.forEach(child=>{
                this.HTML.all.appendChild(child)
            })
        }
        append.apply(this,[this.HTML.input,this.HTML.btn,this.HTML.output])
        parent.appendChild(this.HTML.all)

        this.HTML.btn.addEventListener('click',()=>{
            this.run()
        })

        this.autocompletes=[]
        var t=this
        //Adds a default help command that gives insigt to all comands possible
        this.addCommand('help',()=>{
            var str=''
            t.commands.forEach(com=>{
                str+=`${com.str}  /  ${com.nn}`
                if(com.min!==undefined||com.max!==undefined){
                    str+=',&nbsp;&nbsp;'+`params: ${(com.min===com.max)?com.max:com.min+' - '+com.max}`
                }else{
                    str+=',&nbsp;&nbsp;params: ...any'
                }
                str+='<br>'
            })
            t.HTML.output.innerHTML=str
        },'?',0,0)
        //Events for telling when the input is focused 
        this.HTML.input.addEventListener('focus',()=>{
            document.dispatchEvent(new Event('consoleFocus'))
        })
        this.HTML.input.addEventListener('blur',()=>{
            document.dispatchEvent(new Event('consoleBlur'))
        })
        //Enter functionality to input field
        this.HTML.input.addEventListener('keyup',(event)=>{
            if(event.key==='Enter'){
                this.run()
                this.HTML.input.value=''
                this.HTML.input.blur()
                document.body.focus()
                
            }
        })

    }
    show(){
        if(!this.isVisible){
            this.HTML.all.style.display='block'
            this.isVisible=true
        }
    }
    hide(){
        if(this.isVisible){
            this.HTML.all.style.display='none'
            this.isVisible=false
        }
    }
    setOutput(str){
        this.HTML.output.innerHTML=str
    }
    error(reason){
        this.setOutput(reason.fontcolor('red'))
    }
    addCommand(str,func,nickName,minParams, maxParams=minParams){
        this.commands.push({str:str,func:func,nn:nickName,max:maxParams,min:minParams})
        this.autocompletes.push(str)
    }
    run(){
        var command=this.HTML.input.value
        if(command==='')
            return
        this.inputLog.push(command)
        var split=command.split(' ')
        var c=this.commands.find(com=>com.str===split[0]||com.nn===split[0])
        var front=split.shift()
        if(c){
            var run=true
            if((c.max!==undefined&&c.max<split.length)||(c.min!==undefined&&c.min>split.length)){
                run=false
                this.error(`Invalid number of params. Looking for ${(c.max===c.min)?c.max:c.min+' to '+c.max} params`)
            }if(run){
                this.setOutput('')
                c.func(...split)
            }
        }else{
            this.error(`Unknown command "${front}"`)
        }
    }
    /**Directly runs the command from a string without interrupting other things */
    runCommand(str){
        var t=this.HTML.input.value
        this.HTML.input.value=str
        this.run()
        this.HTML.input.value=t
    }
}