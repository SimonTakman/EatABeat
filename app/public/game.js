
var app = new PIXI.Application({backgroundColor : 0x1DB954, autoResize: true });
var gameViewElement = document.getElementById('game-view');
gameViewElement.appendChild(app.view);
app.stop();

var background, background2; 
let obstacles = [];
let score = 10000;
var position = 0;
let data = JSON.parse(mock);
let beats = data.analysis.beats;
let bars = data.analysis.bars;
console.log("Beats", beats);
console.log("Bars", bars);

PIXI.loader.load(onAssetsLoader);

// Add player
let playerRadius = 18;
let playerGraphics = new PIXI.Graphics()
    .lineStyle(0)
    .beginFill(0xFFFF0B, 1)
    .drawCircle(0, 0, playerRadius)
    .endFill();
app.stage.addChild(playerGraphics);

// Add score
let scoreText = new PIXI.Text(
    'SCORE ' + score ,
    {fontFamily : 'Courier New', fontSize: 20, fill : 0x000000, align : 'center'}
);
scoreText.x = 20;
scoreText.y = 20;
app.stage.addChild(scoreText);

// Mouse move to move player
gameViewElement.addEventListener('mousemove', function(e) {
    playerGraphics.position.x = e.clientX;

    updatePlayerCollision();
});


function onAssetsLoader(loader,res){
  background = PIXI.Sprite.fromImage('assets/sprites/background_v2.png')
  background2 = PIXI.Sprite.fromImage('assets/sprites/background2_v2.png')
  app.stage.addChild(background)
  app.stage.addChild(background2)
  app.start();
}

function addObstacle(width, height, xPosition) {
    var xLimit = app.renderer.width - width;
    var graphics = new PIXI.Graphics();
    graphics.beginFill(0xFF700B, 1);
    graphics.drawRect(xLimit * xPosition, 0, width, height);

    app.stage.addChild(graphics);
    obstacles.push(graphics);
}

function playerIsColliding() {
    var playerX = playerGraphics.x;
    var playerY = playerGraphics.y;
    var playerWidth = playerRadius * 2;
    var playerHeight = playerRadius * 2;
    for (var i = 0; i < obstacles.length; i++) {
        var ob = obstacles[i].getBounds();
        var isColiding = ob.x + ob.width > playerX && 
            ob.x < playerX + playerWidth && 
            ob.y + ob.height > playerY && 
            ob.y < playerY + playerHeight;
        if (isColiding)
            return true;
    }
    return false;
}

function updatePlayerCollision() {
    if (playerIsColliding()) {
        score -= 1;
        scoreText.setText("SCORE " + score);
    }
}

var d = new Date();
var startTime = d.getTime();
function getDuration() {
    return ((new Date()).getTime() - startTime) / 1000;
}

let lastBarIndex = -1;
let currentBeatIndex = 0;
let speedFactor = 1;
// Listen for animate update
app.ticker.add(function(delta) {

    // TODO: Actual duration of song
    var duration = getDuration();

    /* Update positions */
    // Use beats for speed factor
    for (var i = currentBeatIndex; i < beats.length; i++) {
        if (beats[i].start < duration)
            currentBeatIndex = i;
        else
            break;
    }
    let speed = (1 / beats[currentBeatIndex].duration) ** 2;

    // Update obstacles
    obstacles.forEach((o, index) => {
        // Delta is the built in frame-independent transformation
        o.y += 1 * delta  * speed;
        if (o.y > app.renderer.height) {
            app.stage.removeChild(o);
            obstacles.splice(index, 1);
        }
    });
    
    /*updateBackground*/ 
    updateBackground();
    /* Update model */
    updatePlayerCollision();

    var newBarIndex = lastBarIndex;
    for (var i = lastBarIndex + 1; i < bars.length; i++) {
        if (bars[i].start < duration)
            newBarIndex = i;
        else
            break;
    }


    if (newBarIndex != lastBarIndex) {
        lastBarIndex = newBarIndex;
        var factor = bars[newBarIndex].confidence;
        var width = factor * 200 + 100;
        var height = factor * 100 + 50;
        addObstacle(width, height, Math.random());
    }
    else if (lastBarIndex == bars.length - 1) {
        console.log("Done with bars");
    }
});

// Listen for window resize events
window.addEventListener('resize', resize);

// Resize function window
function resize() {
    const parent = app.view.parentNode;
    app.renderer.resize(parent.clientWidth, parent.clientHeight);
    playerGraphics.position.set(app.renderer.width * 0.5, app.renderer.height - playerRadius * 2);
    console.log("Using width: ", app.renderer.width, " and height: ", app.renderer.height);
}

function updateBackground() {
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
}

resize();
