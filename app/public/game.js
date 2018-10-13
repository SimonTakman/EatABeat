const COLORS = [
    { main: 0xCEF564, complement: 0x1E3264 },
    { main: 0xF573A1, complement: 0xC3F0C9 },
    { main: 0xFFC864, complement: 0x9FC3D1 },
    { main: 0xFFCCD3, complement: 0x9FC3D1 }
];

class Game {
    constructor(container, track) {
        this.setTrack(track);
        this.setColor();
        this.elements = {};
        this.obstacles = [];
        this.score = 0;
        this.hits = 0;
        this.lastCollision = null;
        this.status = {
            beatIndex: 0,
            barIndex: -1
        };
        this.startTime = (new Date()).getTime();
        this.playerRadius = 18;

        // Clear container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Create App
        this.app = new PIXI.Application({backgroundColor : this.color.main, autoResize: true });
        container.appendChild(this.app.view);
        this.addPlayer();
        this.addScore();
        this.app.ticker.add((delta) => this.onTickEvent(delta));

        // Mouse move to move player
        let cb = (e) => {
            this.elements.player.position.x = e.clientX;
            this.updatePlayerCollision();
        };
        container.addEventListener('mousemove', cb);
        container.addEventListener('touchmove', cb);
    }

    onGameEnd() {
        let possibleHits = this.track.analysis.bars.length;
        this.score += (possibleHits - this.hits) / this.track.analysis.bars.length * 100;
        this.hits = 0;
        this.updateScore();

        // TODO: Temp, start over
        this.reset();
    }

    reset() {
        this.startTime = (new Date()).getTime();
        this.status.beatIndex = 0;
        this.status.barIndex = -1;

        this.setColor();
        this.app.renderer.backgroundColor = this.color.main;
        this.refreshPlayer();
        this.app.stage.removeChild(this.elements.score);
        this.addScore();
    }

    getDuration() {
        // TODO: Actual duration of song
        return ((new Date()).getTime() - this.startTime) / 1000;
    }

    onTickEvent(delta) {
        let beats = this.track.analysis.beats;
        let bars = this.track.analysis.bars;
        var duration = this.getDuration();

        /* Update positions */
        // Use beats for speed factor
        for (var i = this.status.beatIndex; i < beats.length; i++) {
            if (beats[i].start < duration)
                this.status.beatIndex = i;
            else
                break;
        }
        let speed = (1 / beats[this.status.beatIndex].duration) ** 2;

        // Update obstacles
        this.obstacles.forEach((o, index) => {
            // Delta is the built in frame-independent transformation
            o.y += 1 * delta  * speed;
            if (o.y > this.app.renderer.height) {
                this.app.stage.removeChild(o);
                this.obstacles.splice(index, 1);

                if (this.obstacles.length == 0 && this.status.barIndex == bars.length - 1) {
                    // Game ended
                    console.log("End of game");
                    this.onGameEnd();
                }
            }
        });
        
        /* Update model */
        this.updatePlayerCollision();

        var newBarIndex = this.status.barIndex;
        for (var i = this.status.barIndex + 1; i < bars.length; i++) {
            if (bars[i].start < duration)
                newBarIndex = i;
            else
                break;
        }

        if (newBarIndex != this.status.barIndex) {
            this.status.barIndex = newBarIndex;
            var factor = bars[newBarIndex].confidence;
            var width = factor * 200 + 100;
            var height = factor * 100 + 50;
            this.addObstacle(width, height, Math.random());
        }
    }

    setTrack(track) {
        this.track = track;
        //this.track.analysis.bars = [this.track.analysis.bars[0], this.track.analysis.bars[1]];
    }

    setColor() {
        let newColor = null;
        do {
            let colorIndex = Math.round(Math.random() * (COLORS.length - 1));
            newColor = COLORS[colorIndex];
        } while (newColor == this.color);
        this.color = newColor;
    }

    addPlayer() {
        let playerGraphics = new PIXI.Graphics()
            .lineStyle(0)
            .beginFill(this.color.complement, 1)
            .drawCircle(0, 0, this.playerRadius)
            .endFill();
        playerGraphics.position.set(this.app.renderer.width * 0.5, this.app.renderer.height - this.playerRadius * 2);
        this.app.stage.addChild(playerGraphics);
        this.elements.player = playerGraphics;
    }

    refreshPlayer() {
        let playerX = this.elements.player.x;
        let playerY = this.elements.player.y;
        let playerGraphics = new PIXI.Graphics()
            .lineStyle(0)
            .beginFill(this.color.complement, 1)
            .drawCircle(0, 0, this.playerRadius)
            .endFill();
        playerGraphics.position.set(playerX, playerY);
        this.app.stage.removeChild(this.elements.player);
        this.app.stage.addChild(playerGraphics);
        this.elements.player = playerGraphics;
    }

    addScore() {
        let scoreText = new PIXI.Text("",
            {fontFamily : 'Courier New', fontSize: 20, fill : this.color.complement }
        );
        scoreText.x = 20;
        scoreText.y = 20;
        this.app.stage.addChild(scoreText);
        this.elements.score = scoreText;
        this.updateScore();
    }

    addObstacle(width, height, xPosition) {
        var xLimit = this.app.renderer.width - width;
        var graphics = new PIXI.Graphics();
        graphics.beginFill(this.color.complement, 1);
        graphics.drawRect(xLimit * xPosition, 0, width, height);

        this.app.stage.addChild(graphics);
        this.obstacles.push(graphics);
    }

    updateScore() {
        this.elements.score.setText('SCORE ' + this.score + "\nHITS " + this.hits);
    }

    isPlayerColliding() {
        var playerX = this.elements.player.x;
        var playerY = this.elements.player.y;
        var playerWidth = this.playerRadius * 2;
        var playerHeight = this.playerRadius * 2;
        for (var i = 0; i < this.obstacles.length; i++) {
            var ob = this.obstacles[i].getBounds();
            var isColiding = ob.x + ob.width > playerX && 
                ob.x < playerX + playerWidth && 
                ob.y + ob.height > playerY && 
                ob.y < playerY + playerHeight;
            if (isColiding) {
                if (this.obstacles[i] == this.lastCollision)
                    return false;
                this.lastCollision = this.obstacles[i];
                return true;
            }
        }
        return false;
    }

    updatePlayerCollision() {
        if (this.isPlayerColliding()) {
            this.hits += 1;
            this.updateScore()
        }
    }

    resize() {
        const parent = this.app.view.parentNode;
        this.app.renderer.resize(parent.clientWidth, parent.clientHeight);
        this.elements.player.position.set(this.app.renderer.width * 0.5, this.app.renderer.height - this.playerRadius * 2);
        console.log("Using width: ", this.app.renderer.width, " and height: ", this.app.renderer.height);
    }
}
var gameViewElement = document.getElementById('game-view');
let track = Cookies.get("track_id");
console.log("track")
let game;
let accessToken = Cookies.get("access_token")
if(track && accessToken){
  initPlayback();
  $.get({url: '/trackInfo', headers:{"Authorization": `Bearer ${accessToken}`}, data: {track_id: track}}, function(data){
    console.log("Hae")    
    console.log(data)
    game = new Game(gameViewElement, data);
    game.resize();
  }) 
}

// Listen for window resize events
window.addEventListener('resize', () => game.resize());