import {
    BALL_SIZE,
    ROWS,
    OFFSET_Y,
    binScores,
    binColours
} from './config.js';
import {
    map,
    galtonPosToXCoord,
    galtonPosToYCoord
} from './utils.js';

export class Ball {
    constructor(canvasWidth, offsetY, ctx, userScores, scoreAnimations, displaySortedScores) {
        this.canvasWidth = canvasWidth;
        this.offsetY = offsetY;
        this.ctx = ctx;
        this.userScores = userScores;
        this.scoreAnimations = scoreAnimations;
        this.displaySortedScores = displaySortedScores;
        this.reset();
        this.img = null;
        this.diamondCount = 1;
        this.username = '';
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.showX = 0;
        this.showY = -BALL_SIZE;
        this.animationStep = 0;
        this.fallSpeed = 2;
        this.active = false;
        this.diamondCount = 1;
        this.hasScored = false;
        this.username = '';
    }

    initialize(imgURL, diamondCount = 1, username = 'Anonymous') {
        this.reset();
        this.active = true;
        this.diamondCount = diamondCount;
        this.username = username;
        this.fallSpeed = map(this.diamondCount, 1, 1000, 2, 10);

        const img = new Image();
        img.onload = () => {
            this.img = img;
        };
        img.src = imgURL;
    }

    update() {
        if (this.animationStep != 0 && this.y < ROWS) {
            const animationSpeed = Math.min(map(this.diamondCount, 1, 1000, 0.05, 0.2), 0.2);
            this.animationStep += animationSpeed;
            if (this.animationStep >= 1) {
                this.animationStep = 0;
                this.x += this.multiplier;
                this.y += 1;

                this.multiplier = Math.random() < 0.5 ? -1 : 1;
                this.animationStep = 0.001;
            }
            this.showX = galtonPosToXCoord(this.x + this.multiplier * (Math.pow(this.animationStep, 1)), this.canvasWidth);
            this.showY = galtonPosToYCoord(this.y + (Math.pow(this.animationStep, 4)) - 1 / 2, this.offsetY);
            return;
        }

        if (this.y == 0 && this.showY >= this.offsetY - BALL_SIZE) {
            this.showY = this.offsetY - BALL_SIZE;
            this.multiplier = Math.random() < 0.5 ? -1 : 1;
            this.animationStep = 0.001;
            return;
        }

        this.fallSpeed *= 1.025;
        if (this.fallSpeed > 10) this.fallSpeed = 10;
        this.showY += this.fallSpeed;
        this.showY += 1;
        this.showX = galtonPosToXCoord(this.x, this.canvasWidth);

        if (this.showY >= galtonPosToYCoord(ROWS, this.offsetY) && !this.hasScored) {
            this.hasScored = true;
            const binWidth = (BALL_SIZE + 6) * 2;
            const startX = galtonPosToXCoord(-ROWS, this.canvasWidth) - binWidth / 2;
            const binIndex = Math.floor((this.showX - startX) / binWidth);

            if (binIndex >= 0 && binIndex <= ROWS) {
                const binScore = binScores[binIndex];

                if (this.username) {
                    if (!this.userScores[this.username]) {
                        this.userScores[this.username] = {
                            score: 0,
                            avatar: this.img.src
                        };
                    }
                    this.userScores[this.username].score += binScore;
                    this.displaySortedScores();
                }

                this.scoreAnimations.push({
                    x: this.showX,
                    y: galtonPosToYCoord(ROWS + 1, this.offsetY) - 30,
                    color: binColours[binIndex % binColours.length],
                    startTime: Date.now(),
                    score: "+" + binScore
                });
            }
        }
    }

    show() {
        if (this.img) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.showX, this.showY, BALL_SIZE / 2, 0, Math.PI * 2);
            this.ctx.closePath();
            this.ctx.clip();
            this.ctx.drawImage(this.img, this.showX - BALL_SIZE / 2, this.showY - BALL_SIZE / 2, BALL_SIZE, BALL_SIZE);
            this.ctx.restore();
        } else {
            this.ctx.fillStyle = "#FF0000";
            this.ctx.beginPath();
            this.ctx.arc(this.showX, this.showY, BALL_SIZE / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
} 