const colors = ['red', 'orange', 'yellow', 'lime', 'cyan', 'rebeccapurple'];

class MiniBlock {
    offsetX = 0;
    offsetY = 0;

    parentBlock = null;
    ctx = null;

    constructor(parentBlock, ctx, offsetX, offsetY) {
        this.parentBlock = parentBlock;
        this.ctx = ctx;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    render() {
        this.ctx.fillStyle = colors[this.parentBlock.color];
        this.ctx.fillRect(this.parentBlock.x + this.offsetX, this.parentBlock.y + this.offsetY, 10, 10);

        if (this.parentBlock.disabled) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.17)';
            this.ctx.fillRect(this.parentBlock.x + this.offsetX + 1, this.parentBlock.y + this.offsetY + 1, 8, 8);
        }
    }

    checkClick(x, y) {
        return (x > this.parentBlock.x + this.offsetX && x < this.parentBlock.x + this.offsetX + 10 && y > this.parentBlock.y + this.offsetY && y < this.parentBlock.y + this.offsetY + 10)
    }
}

class ParentBlock {
    x = 0;
    y = 0;
    mini = [];
    color = 0;
    disabled = false;
    id = 0;

    constructor(x, y, color, id) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.id = id;
    }

    addMini(mini) {
        this.mini = mini;
    }

    render() {
        for (let i = 0; i < this.mini.length; i++) {
            this.mini[i].render();
        }
    }

    checkClick(x, y) {
        for (let i = 0; i < this.mini.length; i++) {
            if (this.mini[i].checkClick(x, y) && !this.disabled) {
                return true;
            }
        }
        return false;
    }
}

class DragRequest {
    offsetX = 0;
    offsetY = 0;
    block = null;
    id = 0;

    color;

    constructor(x, y, block, color, id) {
        this.offsetX = x;
        this.offsetY = y;
        this.block = block;
        this.color = color;
        this.id = id;
    }
}