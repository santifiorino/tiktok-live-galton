import { MAX_HISTORY, HISTORY_POSITION, defaultAvatarUrl } from '../config.js';

export class GiftHistory {
    constructor(ctx) {
        this.ctx = ctx;
        this.giftHistory = [];
        this.giftQueue = [];
        this.lastGiftCompletionTime = 0;
        this.avatarCache = new Map();
    }

    addGift(data) {
        const avatarUrl = data.avatar || defaultAvatarUrl;

        const newGift = {
            diamondCount: data.diamond_count,
            avatar: avatarUrl,
            avatarImg: null,
            nickname: data.nickname || 'Anonymous',
            ballsRemaining: data.diamond_count,
            ballsSpawned: 0,
            gift_amount: data.gift_amount,
            gift_image: null
        };

        this.giftQueue.push(newGift);

        const avatarImg = new Image();
        avatarImg.onload = () => {
            newGift.avatarImg = avatarImg;
        };
        avatarImg.src = avatarUrl;

        const giftImg = new Image();
        giftImg.onload = () => {
            newGift.gift_image = giftImg;
        };
        giftImg.src = data.gift_image;

        return newGift;
    }

    getNextGift() {
        if (this.giftQueue.length === 0) return null;

        const currentTime = Date.now();
        const timeSinceLastCompletion = currentTime - this.lastGiftCompletionTime;

        if (timeSinceLastCompletion < 1000) {
            return null;
        }

        return this.giftQueue[0];
    }

    updateGiftProgress(gift) {
        gift.ballsRemaining--;
        gift.ballsSpawned++;

        if (gift.ballsRemaining <= 0) {
            this.giftHistory.unshift(gift);

            if (this.giftHistory.length > MAX_HISTORY) {
                this.giftHistory.pop();
            }

            this.giftQueue.shift();
            this.lastGiftCompletionTime = Date.now();
        }
    }

    preloadAvatar(url) {
        if (!this.avatarCache.has(url)) {
            const img = new Image();
            img.src = url;
            this.avatarCache.set(url, img);
        }
        return this.avatarCache.get(url);
    }

    drawGiftInfo(gift, x, y, bgColor) {
        const rectWidth = 300;
        const rectHeight = 60;
        const avatarSize = 40;
        const giftImageSize = 30;

        if (!gift || !gift.avatarImg) return;

        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(x, y, rectWidth, rectHeight);

        this.ctx.drawImage(gift.avatarImg, x + 10, y + 10, avatarSize, avatarSize);

        let displayName = gift.nickname;
        if (displayName.length > 17) {
            displayName = displayName.substring(0, 15) + '...';
        }

        this.ctx.fillStyle = "#000000";
        this.ctx.font = "600 14px 'Montserrat', sans-serif";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(displayName, x + 60, y + 22);

        this.ctx.font = "400 14px 'Montserrat', sans-serif";
        this.ctx.fillText(`${gift.ballsSpawned}/${gift.ballsSpawned + gift.ballsRemaining}`,
            x + 60, y + 43);

        if (gift.gift_image) {
            this.ctx.drawImage(gift.gift_image,
                x + rectWidth - giftImageSize - 10,
                y + 15,
                giftImageSize,
                giftImageSize
            );
            this.ctx.textAlign = "right";
            this.ctx.fillText(`${gift.gift_amount}x`,
                x + rectWidth - giftImageSize - 25,
                y + 30
            );
        }
    }

    draw() {
        const spacing = 70;
        const baseX = HISTORY_POSITION.x;
        const baseY = HISTORY_POSITION.y;

        this.ctx.fillStyle = "#000000";
        this.ctx.font = "700 36px 'Montserrat', sans-serif";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("GIFTS", baseX, baseY - 40);

        let giftsToShow = [];

        // Always show at least the last completed gift if there's nothing in the queue
        if (this.giftQueue.length === 0 && this.giftHistory.length > 0) {
            giftsToShow = [
                { gift: this.giftHistory[0], color: "#FFFFFF" },
                { gift: this.giftHistory[1], color: "#F0F0F0" },
                { gift: this.giftHistory[2], color: "#E0E0E0" },
                { gift: this.giftHistory[3], color: "#D0D0D0" },
                { gift: this.giftHistory[4], color: "#C0C0C0" }
            ];
        } else if (this.giftQueue.length > 0) {
            giftsToShow = [
                { gift: this.giftQueue[0], color: "#FFFFFF" },
                { gift: this.giftHistory[0], color: "#F0F0F0" },
                { gift: this.giftHistory[1], color: "#E0E0E0" },
                { gift: this.giftHistory[2], color: "#D0D0D0" },
                { gift: this.giftHistory[3], color: "#C0C0C0" }
            ];
        } else {
            giftsToShow = [
                { gift: null, color: "#FFFFFF" },
                { gift: null, color: "#F0F0F0" },
                { gift: null, color: "#E0E0E0" },
                { gift: null, color: "#D0D0D0" },
                { gift: null, color: "#C0C0C0" }
            ];
        }

        giftsToShow.forEach((item, index) => {
            if (item.gift) {
                this.drawGiftInfo(item.gift, baseX, baseY + (index * spacing), item.color);
            }
        });
    }
} 