const canvas = document.getElementById('home-canvas');
const ctx = canvas.getContext('2d');

const colors = ['red', 'orange', 'yellow', 'lime', 'cyan', 'rebeccapurple'];

function animate() {
    for(let y = 0; y < canvas.clientHeight; y += 10) {
        for(let x = 0; x < canvas.clientWidth; x += 10) {
            ctx.fillStyle = colors[parseInt(Math.random() * colors.length)];
            ctx.fillRect(x, y, x + 10, y + 10);
        }
    }
}

animate();
setInterval(animate, 500);