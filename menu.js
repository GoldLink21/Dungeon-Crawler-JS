const Menu={
    cur:'main',
    main:'main',
    game:'game',
    isMain(){return Menu.cur===Menu.main},
    isGame(){return Menu.cur===Menu.game},
    toMain(){Menu.cur=Menu.main},
    toGame(){Menu.cur=Menu.game},
}

var introFrame=0

function startGame(){
    HTML.board.style.display='block'
    HTML.mm.style.display='none'
    Clock1.pause()
    Clock1.start()
    Menu.toGame()
    loadFloor(-1);
    nextFloor()
    setTimeout(window.onresize,50)
}
