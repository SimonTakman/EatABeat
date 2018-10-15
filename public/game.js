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
        this.hits = 0;
        this.passedBeats = 0;
        this.lastCollision = null;
        this.status = {
            beatIndex: 0,
            barIndex: -1
        };
        this.playerRadius = 22;
        this.isDamaging = false;
        this.lastAveragePitch = 0;

        // Clear container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Create App
        this.app = new PIXI.Application({backgroundColor : this.color.main, autoResize: true, autoStart: false });
        container.appendChild(this.app.view);
        this.addPlayer();
        this.addScore();
        this.addExit();
        this.addOuch();
        //this.addTitle();
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
        this.elements.player.rotation = 0
        this.elements.player.y = this.app.renderer.height - this.playerRadius * 2
        this.elements.score.style.fill = this.color.complement;
        this.elements.player.tint = this.color.complement;
        this.elements.ouch.visible = false;
        this.app.stop();
        this.elements.score.style.fontSize = 50;
        this.elements.score.style.align = 'center';
        this.elements.score.setText("Good job!\n" + this.hits + "/" + this.passedBeats);
        let x = this.app.renderer.width / 2 - this.elements.score.width / 2;
        let y = this.app.renderer.height / 2 - this.elements.score.height / 2;
        this.elements.score.position.set(x, y);
    }

    start() {
        this.app.start();
        // Before window is closed
        window.onbeforeunload = function(){
          $.ajax({
            url: "https://api.spotify.com/v1/me/player/pause",
            type: "PUT",
            beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('access_token') );},
            success: function(data) {
              Cookies.remove("track_id");
            }
          });
        }
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
        let beats = this.track.analysis.beats;
        var duration = this.getDuration();

        // Update obstacles
        this.obstacles.forEach((o, index) => {
            // Delta is the built in frame-independent transformation
            o.y += 1 * delta  * this.speed;
            if (o.y > this.app.renderer.height + o.height) {
                this.passedBeats += 1;
                this.app.stage.removeChild(o);
                this.obstacles.splice(index, 1);
                this.updateScore();
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

            // Get average pitches
            let avgPitch = beats[newBarIndex].averagePitch;
            let nPitches = beats[newBarIndex].numberOfPitches;
            let sectionIndex = beats[newBarIndex].sectionIndex;

            if (avgPitch == 0)
                avgPitch = this.lastAveragePitch;
            else
                this.lastAveragePitch = avgPitch;

            // Spawning new obstacle
            var factor = beats[newBarIndex].confidence;
            var radius = Math.max(factor * (this.windowWidth / 7), 15);
            this.addObstacle(radius, avgPitch, sectionIndex % 2);
        }

        if (this.obstacles.length == 0 && this.status.barIndex == beats.length - 1) {
            // Game ended
            console.log("End of game");
            this.onGameEnd();
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

        // Process segments of each beat to get an average pitch
        let beats = this.track.analysis.beats;
        let segments = this.track.analysis.segments;
        console.log("Number of beats", beats.length, " and segments ", segments.length);
        for (var x = 0; x < beats.length; x++) {
            let beatStart = beats[x].start;
            let beatEnd = beatStart + beats[x].duration;
            let avgPitch = 0;
            let nPitches = 0;
            for (var i = 0; i < segments.length; i++) {
                let segStart = segments[i].start;
                let segEnd = segStart + segments[i].duration;
                if (segStart >= beatStart) {
                    if (segEnd < beatEnd) {
                        for (var j = 0; j < segments[i].pitches.length; j++) {
                            avgPitch += segments[i].pitches[j];
                            nPitches += 1;
                        }
                    } else {
                        break; // passed beat
                    }
                }
            }
            if (nPitches != 0)
                avgPitch /= nPitches;
            beats[x].averagePitch = avgPitch;
            beats[x].numberOfPitches = nPitches;
        }
        // Normalize the average pitch
        let minPitch = 1;
        let maxPitch = 0;
        for (var x = 0; x < beats.length; x++) {
            if (beats[x].numberOfPitches == 0 && x > 0) {
                beats[x].numberOfPitches = beats[x-1].numberOfPitches;
                beats[x].averagePitch = beats[x-1].averagePitch;
            }
            if (beats[x].averagePitch > maxPitch)
                maxPitch = beats[x].averagePitch;
            else if (beats[x].averagePitch < minPitch)
                minPitch = beats[x].averagePitch
        }
        for (var x = 0; x < beats.length; x++) {
            beats[x].averagePitch = (beats[x].averagePitch - minPitch) / (maxPitch - minPitch);
        }

        // Set current section
        let sections = this.track.analysis.sections;
        for (var x = 0; x < beats.length; x++) {
            let beatStart = beats[x].start;
            for (var i = 0; i < sections.length; i++) {
                let secStart = sections[i].start;
                if (secStart >= beatStart) {
                    beats[x].sectionIndex = i;
                    break;
                }
            }
        }
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
                fontFamily : 'Visitor',
                fontSize: 28,
                fill: this.color.complement
            }
        );
        scoreText.x = this.app.renderer.width - scoreText.width - 20;
        scoreText.y = 25;
        this.app.stage.addChild(scoreText);
        this.elements.score = scoreText;
        this.updateScore();
    }

    addOuch() {
        let ouchText = new PIXI.Text("YUM!",
            {
                fontFamily : 'Visitor',
                fontSize: 30,
                fill: 0x33CC33
            }
        );
        ouchText.visible = false;
        ouchText.x = this.app.renderer.width / 2 - ouchText.width / 2;
        ouchText.y = this.app.renderer.height / 2;
        this.app.stage.addChild(ouchText);
        this.elements.ouch = ouchText;
        this.updateScore();
    }

    addTitle() {
        let name = this.track.track.artists[0].name + " - " + this.track.track.name;
        if (name.length > 22)
            name = name.substring(0, 19) + '...';
        let titleText = new PIXI.Text(name,
            {
                fontFamily : 'Courier New',
                fontSize: 18,
                fontWeight: 'bold',
                fill: this.color.complement
            }
        );
        titleText.x = window.innerWidth / 2 - titleText.width / 2;
        titleText.y = 25;
        this.app.stage.addChild(titleText);
        this.elements.titleText = titleText;
    }

    addExit() {
        let exitText = new PIXI.Text("EXIT",
            {
                fontFamily : 'Visitor',
                fontSize: 28,
                //fontWeight: 'bold',
                fill: this.color.complement
            }
        );
        exitText.x = 20;
        exitText.y = 20;
        exitText.interactive = true;
        exitText.buttonMode = true;
        exitText.on("click", () => {
          // Pause song and then quit
          $.ajax({
            url: "https://api.spotify.com/v1/me/player/pause",
            type: "PUT",
            beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('access_token') );},
            success: function(data) {
              Cookies.remove("track_id");
              window.location.pathname = "";
            }
          });
        });
        exitText.on("pointerdown", () => window.location.pathname = "");
        this.app.stage.addChild(exitText);
        this.elements.exit = exitText;
    }

    addObstacle(radius, xPosition, type) {
        var xLimit = this.app.renderer.width;
        var x = Math.max(Math.min(xLimit * xPosition, xLimit - radius), radius);
        var graphics = new PIXI.Graphics();
        graphics.beginFill(this.color.complement, 1);
        if (type == 1)
            graphics.drawCircle(x, -radius, radius);
        else
            graphics.drawRoundedRect(x, -radius, radius * 2, radius * 2, radius / 2);

        this.app.stage.addChild(graphics);
        this.obstacles.push(graphics);
    }

    updateScore() {
        this.elements.score.setText("SCORE\n" + this.hits + "/" + this.passedBeats);
    }

    isPlayerColliding() {
        var pb = this.elements.player.getBounds();
        var playerX = pb.x;
        var playerY = pb.y;
        var playerWidth = pb.width;
        var playerHeight = pb.height;
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
            this.elements.player.y = this.app.renderer.height - this.playerRadius * 2.5
            this.elements.player.rotation -= 0.3
            this.elements.player.tint = 0x33CC33;
            this.elements.score.style.fill = 0x33CC33;
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
        this.elements.score.position.set(this.app.renderer.width - this.elements.score.width - 20, 20);
        //this.elements.titleText.position.set(window.innerWidth / 2 - this.elements.titleText.width / 2, 20);
        this.elements.ouch.position.set(this.app.renderer.width / 2 - this.elements.ouch.width / 2, this.app.renderer.height / 2);
        console.log("Using width: ", this.app.renderer.width, " and height: ", this.app.renderer.height);
    }
}
var gameViewElement = document.getElementById('game-view');
let track = Cookies.get("track_id");
let game;
let accessToken = Cookies.get("access_token")
if(track && accessToken){
  //initPlayback();
  $.get({url: '/trackInfo', headers:{"Authorization": `Bearer ${accessToken}`}, data: {track_id: track}}, function(data){
    game = new Game(gameViewElement, data);
    game.resize();
    // Plays on external device only if the cookie exists
    play(Cookies.get('track_id'), Cookies.get('ext_device_id'))
    .then(() => {
        game.start();
        gameViewElement.style.opacity = 1;
    })
    .catch(() => {
      console.log("NOO");
      Cookies.remove("ext_device_id");
      refreshPage();
    });
  })
}

// Listen for window resize events
window.addEventListener('resize', () => game.resize());
