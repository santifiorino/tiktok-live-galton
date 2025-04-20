import { BALL_SIZE } from '../config.js';

export class Peg {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    show(ctx, galtonPosToXCoord, galtonPosToYCoord) {
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(galtonPosToXCoord(this.x), galtonPosToYCoord(this.y), BALL_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
    }
} 