// Huge disgusting long list of global variables
var canvas = document.getElementById("canvas"),
    tileSize = 32,
    height = tileSize * 5,
    highscore = window.localStorage.getItem("1derlust-highscore") || 0,
    dir = 1,
    score = 0,
    bounces = 0,
    playAreaX = tileSize * 2,
    playAreaY = tileSize * 2,
    playAreaWidth = tileSize * 18,
    levelledUp = "",
    width = playAreaWidth,
    playerWidth = 16,
    player = {
        dx: 0,
        ddx: 0,
        maxdx: 256,
        x: (width / 2) - (playerWidth / 2),
        y: playAreaY,
        accel: 256
    },
    targetWidth = 24 * 4,
    targetX = 14 * tileSize,
    targetY = playAreaY,
    ctx,
    now = timestamp(),
    last = timestamp(),
    dt = 0,
    counter = 0,
    fps = 60,
    step = 1/fps,
    stopped = false;

init();
genNewTarget();
frame();

// Set stuff up
function init() {
    canvas.width = width;
    canvas.style.width = width + "px";

    canvas.height = height;
    canvas.style.height = height + "px";

    ctx = canvas.getContext("2d");
    ctx.font = "16pt monospace";

    document.addEventListener("touchstart", fire);
    window.addEventListener("keydown", fire);
}

// Draw main background
function drawBackground() {
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0, 0, width, height);
}

// Draw play area
function drawPlayArea() {
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, targetY, playAreaWidth, tileSize);
}

// Draw target
function drawTarget() {
    var baseX = targetX,
        baseY = targetY,
        x,
        y,
        height = 8,
        width = targetWidth / 4;

    ctx.fillStyle = "rgb(255, 255, 255)";

    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            if ((y % 2 && !(x % 2)) || (!(y % 2) && x % 2)) {
                ctx.fillRect(baseX + (x * 4), baseY + (y * 4), 4, 4);
            }
        }
    }
}

// Is player totally inside the target?
function playerInsideTarget() {
    return player.x >= targetX
        && player.x + playerWidth <= targetX + targetWidth;
}

// Is player inside OR just overlapping the edge of the target?
function playerOverlappingTarget() {
    var x1 = player.x,
        x2 = player.x + playerWidth,
        tx1 = targetX,
        tx2 = targetX + targetWidth;

    return (x1 >= tx1 && x1 <= tx2) || (x2 >= tx1 && x2 <= tx2);
}

// Carry out single action
function fire(ev) {
    ev.preventDefault();

    if (stopped) {
        score = 0;
        bounces = 0;
        player.accel = 256;
        player.maxdx = 256;
        targetWidth = 24 * 4;
        stopped = false;
    } else {
        if (playerInsideTarget()) {
            increaseScore();
            genNewTarget();
        } else if (playerOverlappingTarget()) {
            genNewTarget();
        } else {
            stopped = true;
        }
    }
}

// Level-up based on given value. This is all very basic, just trial and error,
// really. There are much better ways to do this.
function levelUp(val) {
    var lu = false;

    if (!(val % 5)) {
        player.maxdx += 32;
        levelledUp = 'speed';
        lu = true;
    }

    if (!(val % 10)) {
        player.accel += 64;
        levelledUp = 'acceleration';
        lu = true;
    }

    if (!(val % 15)) {
        if (targetWidth == playerWidth) {
            console.log('win!');
            stopped = true;
        }

        targetWidth -= 4;
        levelledUp = 'target';
        lu = true;
    }

    return lu;
}

// Increase the score and handle highscore updates
function increaseScore() {
    if (++score > highscore) {
        highscore = score;
        window.localStorage.setItem("1derlust-highscore", score);
    }
}

// Choose a new location for the next target
function genNewTarget() {
    var min = 0,
        max = Math.floor((playAreaWidth - targetWidth) / tileSize),
        newTargetX = targetX,
        rndTile;

    while (Math.abs(newTargetX - targetX) < 3) {
        rndTile = Math.floor(Math.random() * (max - min + 1)) + min;
        newTargetX = tileSize * rndTile;
    }

    targetX = newTargetX;
}

// Get most detailed timestamp available
function timestamp() {
    return window.performance && window.performance.now
        ? window.performance.now()
        : new Date().getTime();
}

// Process each frame
function frame() {
    now = timestamp();
    dt = dt + Math.min(1, (now - last) / 1000);

    while (dt > step) {
        dt = dt - step;

        if (!stopped) {
            update(counter, step);
        }
    }

    render();
    last = now;
    ++counter;
    requestAnimationFrame(frame, canvas);
}

// Draw everything
function render(frame) {
    drawBackground();
    drawPlayArea();
    drawPlayer();
    drawTarget();
    drawText();
}

// Draw the title, score, high score, and any level up messages
function drawText()
{
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.textAlign = "left";
    ctx.fillText("1derlust: the 1 bit, 1d, 1 button challenge", 10, 24);

    ctx.fillText("score: " + score, 10, height - 16);

    ctx.textAlign = "right";
    ctx.fillText("high: " + highscore, width - 10, height - 16);

    if (levelledUp == "speed") {
        ctx.textAlign = "center";
        ctx.fillText("LEVELLED UP: speed!", width / 2, tileSize * 4);
    } else if (levelledUp == "acceleration") {
        ctx.textAlign = "center";
        ctx.fillText("LEVELLED UP: acceleration!", width / 2, tileSize * 4);
    } else if (levelledUp == "target") {
        ctx.textAlign = "center";
        ctx.fillText("LEVELLED UP: target size", width / 2, tileSize * 4);
    }
}

// Draw the player, a rather fetching white square
function drawPlayer() {
    color = 255;
    ctx.fillStyle = "rgb(" + color + ", " + color + ", " + color + ")";
    ctx.fillRect(player.x, player.y + 8, tileSize / 2, tileSize / 2);
}

// Update the player's position and speed
function update(frame, dt) {
    var maxdx = player.maxdx;
    var bounced = 0;

    if (dir == 1) {
        player.ddx = player.accel;

        if (player.x + playerWidth > playAreaWidth) {
            player.x = playAreaWidth - playerWidth;
            dir = 0;
            player.ddx = 0;
            player.dx = 0;
            bounced = 1;
        }
    } else {
        player.ddx = -player.accel;

        if (player.x < 0) {
            player.x = 0;
            dir = 1;
            player.ddx = 0;
            player.dx = 0;
            bounced = 1;
        }
    }

    if (bounced) {
        bounces++;

        if (levelUp(bounces)) {
            setTimeout(function() { levelledUp = ""; }, 1000);
        }
    }

    player.x = player.x + (dt * player.dx);
    player.dx = bound(player.dx + (dt * player.ddx), -maxdx, maxdx);
}

// Ensure given value is between given limits
function bound(x, min, max) {
    return Math.max(min, Math.min(max, x));
}
