class Game {
    constructor(container, track) {
        this.track = track;
        this.elements = {};
        this.score = 0;

        // Clear container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Create App
        this.app = new PIXI.Application({backgroundColor : 0x1099bb, autoResize: true });
        container.appendChild(this.app.view);
        this.addPlayer();
        this.addScore();

        // Mouse move to move player
        let cb = (e) => {
            this.elements.player.position.x = e.clientX;
            this.updatePlayerCollision();
        };
        container.addEventListener('mousemove', cb);
        container.addEventListener('touchmove', cb);

        this.reset();
    }

    start() {
        var d = new Date();
        var startTime = d.getTime();
        function getDuration() {
            return ((new Date()).getTime() - startTime) / 1000;
        }

        let beats = this.track.analysis.beats;
        let bars = this.track.analysis.bars;

        let lastBarIndex = -1;
        let currentBeatIndex = 0;
        // Listen for animate update
        this.app.ticker.add((delta) => {

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
            this.obstacles.forEach((o, index) => {
                // Delta is the built in frame-independent transformation
                o.y += 1 * delta  * speed;
                if (o.y > this.app.renderer.height) {
                    this.app.stage.removeChild(o);
                    this.obstacles.splice(index, 1);
                }
            });
            
            /* Update model */
            this.updatePlayerCollision();

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
                this.addObstacle(width, height, Math.random());
            }
            else if (lastBarIndex == bars.length - 1) {
                console.log("Done with bars");
            }
        });
    }

    reset() {
        this.obstacles = [];
        this.score = 10000;
    }

    addPlayer() {
        let playerRadius = 18;
        let playerGraphics = new PIXI.Graphics()
            .lineStyle(0)
            .beginFill(0xFFFF0B, 1)
            .drawCircle(0, 0, playerRadius)
            .endFill();
        this.app.stage.addChild(playerGraphics);
        this.elements.player = playerGraphics;
        this.playerRadius = 18;
    }

    addScore() {
        let scoreText = new PIXI.Text(
            'SCORE ' + this.score ,
            {fontFamily : 'Courier New', fontSize: 20, fill : 0x000000, align : 'center'}
        );
        scoreText.x = 20;
        scoreText.y = 20;
        this.app.stage.addChild(scoreText);
        this.elements.score = scoreText;
    }

    addObstacle(width, height, xPosition) {
        var xLimit = this.app.renderer.width - width;
        var graphics = new PIXI.Graphics();
        graphics.beginFill(0xFF700B, 1);
        graphics.drawRect(xLimit * xPosition, 0, width, height);

        this.app.stage.addChild(graphics);
        this.obstacles.push(graphics);
    }

    updateScore() {
        this.elements.score.setText("SCORE " + this.score);
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
                return true;
        }
        return false;
    }

    updatePlayerCollision() {
        if (this.isPlayerColliding()) {
            this.score += 1;
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
let track = JSON.parse(mock);
let game = new Game(gameViewElement, track);

// Listen for window resize events
window.addEventListener('resize', () => game.resize());
game.resize();
game.start();