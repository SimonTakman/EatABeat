var height = document.body.height;
var width = document.body.width;

var app = new PIXI.Application({backgroundColor : 0x1DB954, autoResize: true });
var gameViewElement = document.getElementById('game-view');
gameViewElement.appendChild(app.view);
app.stop();

let obstacles = [];
var position = 0
let data = JSON.parse(mock);
let beats = data.analysis.beats;
var background, background2; 

PIXI.loader.load(onAssetsLoader);

function onAssetsLoader(loader,res){
  background = PIXI.Sprite.fromImage('assets/sprites/background_v2.png')
  background2 = PIXI.Sprite.fromImage('assets/sprites/background2_v2.png')
  app.stage.addChild(background)
  app.stage.addChild(background2)
  app.start();
}


/*background.scale.x = 1.25
background.scale.y = 1.25
background2.scale.x = 1.25
background2.scale.y = 1.25*/
console.log(beats);

function addObstacle(width, height, xPosition) {
    var xLimit = app.renderer.width - width;
    var graphics = new PIXI.Graphics();
    graphics.beginFill(0xFF700B, 1);
    graphics.drawRect(xLimit * xPosition, 0, width, height);

    app.stage.addChild(graphics);
    obstacles.push(graphics);
}

var d = new Date();
var startTime = d.getTime();
function getDuration() {
    return ((new Date()).getTime() - startTime) / 1000;
}

let lastBeat = -1;
// Listen for animate update
app.ticker.add(function(delta) {

    position += 10;

    background.y = -(position * 0.6);
    background.y %= 1024 * 2;
    if(background.y < 0)
    {
        background.y += 1024 * 2;
    }
    background.y -= 1024;

    background2.y = -(position * 0.6) + 1024;
    background2.y %= 1024 * 2;
    if(background2.y < 0)
    {
        background2.y += 1024 * 2;
    }
    background2.y -= 1024;

    // just for fun, let's rotate mr rabbit a little
    // delta is 1 if running at 100% performance
    // creates frame-independent transformation
    // bunny.rotation += 0.1 * delta;

    /* Update positions */
    obstacles.forEach((o, index) => {
        o.y += 1;
        if (o.y > app.renderer.height) {
            app.stage.removeChild(o);
            obstacles.splice(index, 1);
        }
    });

    /* Spawn new things */
    var duration = getDuration();
    var newBeat = lastBeat;
    for (var i = lastBeat + 1; i < beats.length; i++) {
        if (beats[i].start < duration)
            newBeat = i;
        else
            break;
    }

    if (newBeat != lastBeat) {
        lastBeat = newBeat;
        //addObstacle(100, 50, Math.random());
    }
    else if (lastBeat == beats.length - 1) {
        console.log("Done with beats");
    }
});

// Listen for window resize events
window.addEventListener('resize', resize);

// Resize function window
function resize() {
    const parent = app.view.parentNode;
    app.renderer.resize(parent.clientWidth, parent.clientHeight);
    console.log("Using width: ", app.renderer.width, " and height: ", app.renderer.height);
}

resize();
