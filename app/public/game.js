var app = new PIXI.Application({backgroundColor : 0x1099bb, autoResize: true, resolution: devicePixelRatio });
var gameViewElement = document.getElementById('game-view');
gameViewElement.appendChild(app.view);

// create a new Sprite from an image path
var bunny = PIXI.Sprite.fromImage('assets/sprites/bunny.png')

// center the sprite's anchor point
bunny.anchor.set(0.5);

// move the sprite to the center of the screen
bunny.x = app.screen.width / 2;
bunny.y = app.screen.height / 2;

app.stage.addChild(bunny);

// Listen for animate update
app.ticker.add(function(delta) {
    // just for fun, let's rotate mr rabbit a little
    // delta is 1 if running at 100% performance
    // creates frame-independent transformation
    bunny.rotation += 0.1 * delta;
});



// Resize
const parent = app.view.parentNode;
app.renderer.resize(parent.clientWidth, parent.clientHeight);
rect.position.set(app.screen.width, app.screen.height);