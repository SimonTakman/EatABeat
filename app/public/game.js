const COLORS = [
    { main: 0xC39486, complement: 0x8C1932 },   // n3x2
    { main: 0xF6E82B, complement: 0x213263 },   // n1x1
    { main: 0xFFCFD6, complement: 0xEF1E31 },   // n2x3
    { main: 0xFFCFD6, complement: 0x006456 },   // n1x2
    { main: 0xFFC864, complement: 0x4C9173 }    // 3x4
];

class Game {
    constructor(container, track) {
        this.setTrack(track);
        this.setColor();
        this.windowWidth = 0;
        this.elements = {};
        this.obstacles = [];
        this.score = 0;
        this.hits = 0;
        this.passedBeats = 0;
        this.lastCollision = null;
        this.status = {
            beatIndex: 0,
            barIndex: -1
        };
        this.playerRadius = 18;
        this.isDamaging = false;

        // Clear container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Create App
        this.app = new PIXI.Application({backgroundColor : this.color.main, autoResize: true, autoStart: false });
        container.appendChild(this.app.view);
        this.addPlayer();
        this.addScore();
        this.addTitle();
        this.addExit();
        this.addOuch();
        this.app.ticker.add((delta) => this.onTickEvent(delta));

        // Mouse move to move player
        let cb = (e) => {
            this.elements.player.position.x = e.clientX;
            this.updatePlayerCollision();
        };
        let touchCb = (e) => {
            this.elements.player.position.x = e.targetTouches[0].clientX;
            this.updatePlayerCollision();
        };
        container.addEventListener('mousemove', cb);
        container.addEventListener('touchmove', touchCb);
    }

    onGameEnd() {
        this.score += this.hits / this.track.analysis.beats.length * 100;
        this.hits = 0;
        this.updateScore();

        // TODO: Temp, start over
        this.reset();
    }

    start() {
        this.app.start();
    }

    reset() {
        this.status.beatIndex = 0;
        this.status.barIndex = -1;

        this.setColor();
        this.app.renderer.backgroundColor = this.color.main;
        this.refreshPlayer();
        this.app.stage.removeChild(this.elements.score);
        this.addScore();
        this.app.stage.removeChild(this.elements.exit);
        this.addExit();
    }

    getDuration() {
        return ((new Date()).getTime() - window.startTime) / 1000;
    }

    onTickEvent(delta) {
        let sections = this.track.analysis.sections;
        let beats = this.track.analysis.beats;
        let bars = this.track.analysis.bars;
        var duration = this.getDuration();

        // Update obstacles
        this.obstacles.forEach((o, index) => {
            // Delta is the built in frame-independent transformation
            o.y += 1 * delta  * this.speed;
            if (o.y > this.app.renderer.height) {
                this.passedBeats += 1;
                this.app.stage.removeChild(o);
                this.obstacles.splice(index, 1);
                this.updateScore();

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
        for (var i = this.status.barIndex + 1; i < beats.length; i++) {
            if (beats[i].start < duration) {
                newBarIndex = i;
            }
            else
                break;
        }

        if (newBarIndex != this.status.barIndex) {
            this.status.barIndex = newBarIndex;
            var factor = beats[newBarIndex].confidence;
            var radius = factor * (this.windowWidth / 5) + 2;
            this.addObstacle(radius, Math.random());
        }
    }

    setTrack(track) {
        this.track = track;
        // Calculate speed from tempo
        let minTempo = 90;
        let maxTempo = 160;
        console.log(this.track.features.tempo);
        let tempo = Math.max(Math.min(this.track.features.tempo, maxTempo), minTempo)
        let tempoScaled = (tempo - minTempo) / (maxTempo - minTempo);
        this.speed = tempoScaled * 5 + 5;
        //this.track.analysis.bars = [this.track.analysis.bars[0], this.track.analysis.bars[1]];
    }

    lightenColor(colorCode, amount) {
        console.log("Before", colorCode.toString(16));
        var num = parseInt(colorCode, 16);

        var r = (num >> 16) + amount;

        if (r > 255) {
            r = 255;
        } else if (r < 0) {
            r = 0;
        }

        var b = ((num >> 8) & 0x00FF) + amount;

        if (b > 255) {
            b = 255;
        } else if (b < 0) {
            b = 0;
        }

        var g = (num & 0x0000FF) + amount;

        if (g > 255) {
            g = 255;
        } else if (g < 0) {
            g = 0;
        }

        let newColor = (g | (b << 8) | (r << 16));
        console.log("Before", newColor.toString(16));
        return newColor;
    }

    setColor() {
        let newColor = null;
        do {
            let colorIndex = Math.round(Math.random() * (COLORS.length - 1));
            newColor = COLORS[colorIndex];
        } while (newColor == this.color);
        /*let valence = Math.round(this.track.features.valence * 100) - 25;
        valence = 0;
        this.color = {
            main: this.lightenColor(newColor.main, valence),
            complement: this.lightenColor(newColor.complement, valence)
        };*/
        this.color = newColor;
    }

    createPlayer(x, y) {
        var playerSprite = PIXI.Sprite.fromImage('assets/sprites/player_chubby.png')
        // center the sprite's anchor point
        playerSprite.anchor.set(0.5);
        // move the sprite to the center of the screen
        playerSprite.x = x;
        playerSprite.y = y;
        playerSprite.width = this.playerRadius * 2;
        playerSprite.height = this.playerRadius * 2;
        playerSprite.tint = this.color.complement;
        return playerSprite;
    }

    addPlayer() {
        let playerSprite = this.createPlayer(this.app.renderer.width * 0.5, this.app.renderer.height - this.playerRadius * 2);
        this.app.stage.addChild(playerSprite);
        this.elements.player = playerSprite;
    }

    refreshPlayer() {
        let playerX = this.elements.player.x;
        let playerY = this.elements.player.y;
        let playerSprite = this.createPlayer(playerX, playerY);
        this.app.stage.removeChild(this.elements.player);
        this.app.stage.addChild(playerSprite);
        this.elements.player = playerSprite;
    }

    addScore() {
        let scoreText = new PIXI.Text("",
            {
                fontFamily : 'Courier New',
                fontSize: 20,
                fontWeight: 'bold',
                fill: this.color.complement
            }
        );
        scoreText.x = 20;
        scoreText.y = 20;
        this.app.stage.addChild(scoreText);
        this.elements.score = scoreText;
        this.updateScore();
    }

    addOuch() {
        let ouchText = new PIXI.Text("YUM!",
            {
                fontFamily : 'Courier New',
                fontSize: 30,
                fontWeight: 'bold',
                fill: 0x00FF00
            }
        );
        ouchText.visible = false;
        ouchText.x = this.app.renderer.width / 2 - 50;
        ouchText.y = this.app.renderer.height / 2;
        this.app.stage.addChild(ouchText);
        this.elements.ouch = ouchText;
        this.updateScore();
    }

    addTitle() {
        let name = this.track.track.artists[0].name + " - " + this.track.track.name;
        if (name.length > 24)
            name = name.substring(0, 21) + '...';
        let titleText = new PIXI.Text(name,
            {
                fontFamily : 'Courier New',
                fontSize: 20,
                fontWeight: 'bold',
                fill: this.color.complement
            }
        );
        titleText.x = window.innerWidth / 2 - titleText.width / 2;
        titleText.y = 20;
        this.app.stage.addChild(titleText);
        this.elements.titleText = titleText;
    }

    addExit() {
        let exitText = new PIXI.Text("EXIT",
            {
                fontFamily : 'Courier New',
                fontSize: 24,
                fontWeight: 'bold',
                fill: this.color.complement
            }
        );
        exitText.x = this.app.renderer.width - 80;
        exitText.y = 20;
        exitText.interactive = true;
        exitText.buttonMode = true;
        exitText.on("click", () => window.location.pathname = "");
        this.app.stage.addChild(exitText);
        this.elements.exit = exitText;
    }

    addObstacle(radius, xPosition) {
        var xLimit = this.app.renderer.width;
        var graphics = new PIXI.Graphics();
        graphics.beginFill(this.color.complement, 1);
        graphics.drawCircle(xLimit * xPosition, -radius, radius);

        this.app.stage.addChild(graphics);
        this.obstacles.push(graphics);
    }

    updateScore() {
        this.elements.score.setText("SCORE " + this.hits + "/" + this.passedBeats);
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
            if (isColiding)
                return i;
        }
        return -1;
    }

    updatePlayerCollision() {
        let index = this.isPlayerColliding();
        if (index >= 0) {
            this.hits += 1;
            this.passedBeats += 1;
            this.updateScore()
            this.app.stage.removeChild(this.obstacles[index]);
            this.obstacles.splice(index, 1);
            this.elements.player.y = this.app.renderer.height - this.playerRadius * 3
            this.elements.player.rotation -= 0.3
            this.elements.player.tint = 0x00FF00;
            this.elements.score.style.fill = 0x00FF00;
            this.elements.ouch.visible = true;
        } else if(this.elements.ouch.visible && !this.isDamaging) {
            setTimeout(() => {
                this.elements.player.rotation = 0
                this.elements.player.y = this.app.renderer.height - this.playerRadius * 2
                this.elements.score.style.fill = this.color.complement;
                this.elements.player.tint = this.color.complement;
                this.elements.ouch.visible = false;
            }, 100)
        }
    }

    resize() {
        const parent = this.app.view.parentNode;
        this.windowWidth = parent.clientWidth;
        this.app.renderer.resize(parent.clientWidth, parent.clientHeight);
        this.elements.player.position.set(this.app.renderer.width * 0.5, this.app.renderer.height - this.playerRadius * 2);
        this.elements.exit.position.set(this.app.renderer.width - 80, 20);
        this.elements.titleText.position.set(window.innerWidth / 2 - this.elements.titleText.width / 2, 20);
        this.elements.ouch.position.set(this.app.renderer.width / 2 - 50, this.app.renderer.height / 2);
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
    game = new Game(gameViewElement, data);
    game.resize();
    play(Cookies.get('track_id'))
    .then(() => {
        game.start();
    })
    .catch(() => console.log("NOO"));
  })
}

// Listen for window resize events
window.addEventListener('resize', () => game.resize());
