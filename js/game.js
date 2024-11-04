const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

var scalar = window.innerHeight / 210;
canvas.style.scale = scalar;

var filled = [];
var busting = false;

var mousePosition = { x: 0, y: 0 };
var dragging = null;

var score = 0;
const scoreText = document.getElementById('score');

for (let i = 0; i < 10; i++) {
    filled.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
}

var blocks = [];
const blockSelection = 36;

var highScore = 0;
const highScoreText = document.getElementById('high-score');

highScore = parseInt(localStorage.getItem('high-score'));
if (highScore == null || isNaN(highScore)) {
    highScore = 0;
    localStorage.setItem('high-score', 0);
}

if (highScore == 0) {
    highScoreText.innerText = 'High: 000';
} else {
    highScoreText.innerText = `High: ${highScore}`;
}

function animate() {
    requestAnimationFrame(animate);

    ctx.canvas.width = 100 * 1;
    ctx.canvas.height = (100 + 100) * 1;

    ctx.clearRect(0, 0, 100, 195)

    for (let x = 0; x < 100 * 1; x += 10 * 1) {
        for (let y = 0; y < 100 * 1; y += 10 * 1) {
            if (filled[x / (10 * 1)][y / (10 * 1)] == 0) {
                ctx.fillStyle = 'grey';
                ctx.fillRect(x, y, 10 * 1, 10 * 1);
                ctx.fillStyle = 'black';
                ctx.fillRect(x + (1 * 1), y + (1 * 1), (10 - 2) * 1, (10 - 2) * 1);
            } else {
                ctx.fillStyle = colors[filled[x / (10 * 1)][y / (10 * 1)] - 1];
                ctx.fillRect(x, y, 10 * 1, 10 * 1);
            }
        }
    }

    document.body.style.cursor = 'default';

    ctx.fillStyle = 'black';
    ctx.fillRect(0 * 1, 100 * 1, 100 * 1, 175 * 1);

    for (let i = 0; i < blocks.length; i++) {
        blocks[i].render();
    }

    if (dragging != null) {
        document.body.style.cursor = 'grabbing';

        let newX = mousePosition.x - dragging.offsetX;
        let newY = mousePosition.y - dragging.offsetY;

        if (newY < 100 && !checkOverlapY(dragging.block, newY)) {
            let snapX = parseInt(newX / 10) * 10;
            let snapY = parseInt(newY / 10) * 10;

            if (!checkOverlapX(dragging.block, snapX)) {
                dragging.block.x = snapX;
            }
            if (!checkOverlapY(dragging.block, snapY)) {
                dragging.block.y = snapY;
            }

            if (checkIntersect(dragging.block)) {
                dragging.block.color = 'white';
                ctx.fillStyle = 'white'
                dragging.block.render();
            } else {
                dragging.block.color = dragging.color;
            }

        } else {
            dragging.block.x = mousePosition.x - dragging.offsetX;
            dragging.block.y = mousePosition.y - dragging.offsetY;
        }
    }
}

animate();

canvas.addEventListener('mousedown', function (e) {
    if (dragging != null) {
        return;
    }

    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].checkClick(x / scalar, y / scalar) && checkBlockPossible(i)) {
            dragging = new DragRequest((x / scalar) - blocks[i].x, (y / scalar) - blocks[i].y, blocks[i], blocks[i].color);
        }
    }
});

document.body.addEventListener('mouseup', async function () {
    if (dragging == null) {
        return;
    }

    let mini = dragging.block.mini;

    if (checkIntersect(dragging.block)) {
        return;
    }

    for (let i = 0; i < mini.length; i++) {
        if ((dragging.block.x + mini[i].offsetX) / 10 > 10 || (dragging.block.y + mini[i].offsetY) / 10 > 10) {
            return;
        }
        filled[(dragging.block.x + mini[i].offsetX) / 10][(dragging.block.y + mini[i].offsetY) / 10] = 1;
    }

    switch (dragging.block.id) {
        case 0:
            addBlock(parseInt(Math.random() * blockSelection) + 1, 5, 110, 0);
            break;
        case 1:
            addBlock(parseInt(Math.random() * blockSelection) + 1, 35, 155, 1);
            break;
        default:
            addBlock(parseInt(Math.random() * blockSelection) + 1, 55, 110, 2);
            break;
    }

    dragging.block.color = dragging.color;
    dragging.block.disabled = true;
    dragging = null;

    playClickSound();
    
    await checkDestroy();

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('high-score', highScore);
        highScoreText.innerText = `High: ${highScore}`;
    }


    if (await checkGameOver()) {
        alert('Game over!');

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('high-score', highScore);
            highScoreText.innerText = `High: ${highScore}`;
        }

        playExplosion();
        blocks = [];
        score = 0;
        scoreText.innerText = '000';
        for (let x = 0; x < filled.length; x++) {
            for (let y = 0; y < filled[x].length; y++) {
                filled[x][y] = 0;
            }
        }
        addBlock(parseInt(Math.random() * blockSelection) + 1, 5, 110, 0);
        addBlock(parseInt(Math.random() * blockSelection) + 1, 35, 155, 1);
        addBlock(parseInt(Math.random() * blockSelection) + 1, 55, 110, 2);
    }
});

document.body.addEventListener('mousemove', function (e) {
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    mousePosition = { x: x / scalar, y: y / scalar }
});

function checkIntersect(block) {
    let mini = block.mini;

    for (let i = 0; i < mini.length; i++) {
        if ((dragging.block.x + mini[i].offsetX) / 10 < 10 && (dragging.block.y + mini[i].offsetY) / 10 < 10 && filled[(dragging.block.x + mini[i].offsetX) / 10][(dragging.block.y + mini[i].offsetY) / 10] == 1) {
            return true;
        }
    }
    return false;
}

async function checkGameOver() {
    await sleep(1500);

    for (let i = 0; i < blocks.length; i++) {
        if (!blocks[i].disabled) {
            for (let x = 0; x < filled.length; x++) {
                for (let y = 0; y < filled[x].length; y++) {
                    let allWork = true;
                    if (filled[x + blocks[i].mini[0].offsetX / 10][y + blocks[i].mini[0].offsetY / 10] == 0) {
                        for (let m = 0; m < blocks[i].mini.length; m++) {
                            if (x + blocks[i].mini[m].offsetX / 10 >= 10 || y + blocks[i].mini[m].offsetY / 10 >= 10 || filled[x + blocks[i].mini[m].offsetX / 10][y + blocks[i].mini[m].offsetY / 10] == 1) {
                                allWork = false;
                            }
                        }
                    }
                    if (allWork && filled[x + blocks[i].mini[0].offsetX / 10][y + blocks[i].mini[0].offsetY / 10] == 0) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

function checkBlockPossible(i) {
    for (let x = 0; x < filled.length; x++) {
        for (let y = 0; y < filled[x].length; y++) {
            let allWork = true;
            if (filled[x + blocks[i].mini[0].offsetX / 10][y + blocks[i].mini[0].offsetY / 10] == 0) {
                for (let m = 0; m < blocks[i].mini.length; m++) {
                    if (x + blocks[i].mini[m].offsetX / 10 >= 10 || y + blocks[i].mini[m].offsetY / 10 >= 10 || filled[x + blocks[i].mini[m].offsetX / 10][y + blocks[i].mini[m].offsetY / 10] == 1) {
                        allWork = false;
                    }
                }
            }
            if (allWork && filled[x + blocks[i].mini[0].offsetX / 10][y + blocks[i].mini[0].offsetY / 10] == 0) {
                console.log(i, x, y)
                return true;
            }
        }
    }
    return false;
}

async function checkDestroy() {
    busting = true;
    let counter = 1;

    for (let x = 0; x < filled.length; x++) {
        let hasColumn = true;
        for (let y = 0; y < filled[x].length; y++) {
            if (filled[x][y] == 0)
                hasColumn = false;
        }
        if (hasColumn) {
            await destroyColumn(x);
            counter *= 2;
        }
    }
    for (let y = 0; y < filled[0].length; y++) {
        let hasRow = true;
        for (let x = 0; x < filled.length; x++) {
            if (filled[x][y] == 0)
                hasRow = false;
        }
        if (hasRow) {
            await destroyRow(y);
            counter *= 2;
        }
    }

    score += (counter - 1) * 100;
    scoreText.innerText = score;

    if (score == 0) {
        scoreText.innerText = '000';
    }

    if (counter > 1) {
        let sound = parseInt(Math.random() * 3);
        switch (sound) {
            case 0:
                playEpicBust();
                break;
            case 1:
                playWhatABust();
                break;
            case 2:
                playSkillfulBust();
                break;
            default:
                break;
        }
    }

    await sleep(400);
    if (counter > 1) {
        for (let i = 0; i < 10; i++) {
            //playClickSound2();
            //await sleep(100);
        }
    }
}

async function destroyColumn(x) {
    for (let b = 0; b < blocks.length; b++) {
        for (let m = 0; m < blocks[b].mini.length; m++) {
            if ((blocks[b].x + blocks[b].mini[m].offsetX) / 10 == x) {
                filled[(blocks[b].x + blocks[b].mini[m].offsetX) / 10][(blocks[b].y + blocks[b].mini[m].offsetY) / 10] = 0;
                blocks[b].mini.splice(m, 1);

                if (blocks[b].mini.length == 0) {
                    blocks.splice(b, 1);
                    b--;
                }

                m--;
                playClickSound2();
                await sleep(80);
            }
        }
    }

    for (let i = 0; i < 10; i++) {
        filled[x][i] = 0;
    }
}

async function destroyRow(y) {
    for (let b = 0; b < blocks.length; b++) {
        console.log(blocks[b], b, blocks.length)
        for (let m = 0; m < blocks[b].mini.length; m++) {
            if ((blocks[b].y + blocks[b].mini[m].offsetY) / 10 == y) {
                filled[(blocks[b].x + blocks[b].mini[m].offsetX) / 10][(blocks[b].y + blocks[b].mini[m].offsetY) / 10] = 0;
                blocks[b].mini.splice(m, 1);

                m--;
                playClickSound2();
                await sleep(80);
            }
        }
    }

    for (let i = 0; i < 10; i++) {
        filled[i][y] = 0;
    }
}

function checkOverlapX(block, x) {
    let minis = block.mini;

    for (let i = 0; i < minis.length; i++) {
        if (x + minis[i].offsetX < 0) {
            return true;
        }
        if (x + minis[i].offsetX >= 100) {
            return true;
        }
    }
}

function checkOverlapY(block, y) {
    let minis = block.mini;

    for (let i = 0; i < minis.length; i++) {
        if (y + minis[i].offsetY < 0) {
            return true;
        }
        if (y + minis[i].offsetY >= 100) {
            return true;
        }
    }
}

function addBlock(type, x, y, id) {
    let color = parseInt(Math.random() * colors.length);
    let tempBlock = new ParentBlock(x, y, color, id);

    let miniBlocks = [];

    switch (type) {
        case 0:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 0));
            break;
        //I
        case 1:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 20));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 30));
            break;
        // I rotated
        case 2:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 30, 0));
            break;

        // 3 x 3
        case 3:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 20));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 20));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 20));
            break;

        // 2 x 2
        case 4:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            break;

        // L vertical
        case 5:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 20));
            break;
        case 6:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 20));
            break;
        case 7:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 20));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 20));
            break;
        case 8:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 20));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 20));
            break;

        // L horizontal
        case 9:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 10));
            break;
        case 10:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 0));
            break;
        case 11:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 0));
            break;
        case 12:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 10));
            break;

        // Horizontal noodles
        case 13:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 10));
            break;
        case 14:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 0));
            break;
        // Vertical noodles
        case 15:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 20));
            break;
        case 16:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 20));
            break;
        //Verical pipes
        case 17:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 20));
            break;
        case 18:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 20));
            break;
        // Horizontal pipes
        case 19:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 0));
            break;
        case 20:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 10));
            break;

        // 3 x 3
        case 21:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 20));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 20));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 20));
            break;

        // 2 x 2
        case 22:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            break;

        // 3 x 3
        case 23:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 20));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 20));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 20));
            break;

        // 2 x 2
        case 24:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            break;

        // 1 x 1
        case 25:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            break;

        // 1 x 2
        case 26:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            break;

        // 2 x 1
        case 27:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            break;

        //I
        case 28:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 20));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 30));
            break;
        // I rotated
        case 29:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 30, 0));
            break;

        //I
        case 30:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 20));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 30));
            break;
        // I rotated
        case 31:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 30, 0));
            break;

        // 1 x 3
        case 32:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 20));
            break;

        // 3 x 1
        case 33:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 20, 0));

        // Corners
        case 34:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            break;

        case 35:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            break;

        case 36:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            break;

        case 37:
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 0));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 0, 10));
            miniBlocks.push(new MiniBlock(tempBlock, ctx, 10, 0));

        default:
            break;
    }

    tempBlock.addMini(miniBlocks);
    blocks.push(tempBlock);
}

addBlock(parseInt(Math.random() * blockSelection) + 1, 5, 110, 0);
addBlock(parseInt(Math.random() * blockSelection) + 1, 35, 155, 1);
addBlock(parseInt(Math.random() * blockSelection) + 1, 55, 110, 2);

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}