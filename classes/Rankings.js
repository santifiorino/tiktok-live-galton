import { RANKING_POSITION } from '../config.js';

export class Rankings {
    constructor(ctx) {
        this.ctx = ctx;
        this.userScores = {};
        this.avatarCache = new Map();
    }

    preloadAvatar(url) {
        if (!this.avatarCache.has(url)) {
            const img = new Image();
            img.src = url;
            this.avatarCache.set(url, img);
        }
        return this.avatarCache.get(url);
    }

    updateScore(username, score, avatar) {
        if (!this.userScores[username]) {
            this.userScores[username] = {
                score: 0,
                avatar: avatar
            };
        }
        this.userScores[username].score += score;
        this.displaySortedScores();
    }

    displaySortedScores() {
        const sortedScores = Object.entries(this.userScores)
            .sort(([, a], [, b]) => b.score - a.score);

        console.log('Current Scores:');
        sortedScores.forEach(([username, data], index) => {
            console.log(`${index + 1}. ${username}: ${data.score}`);
        });
    }

    draw() {
        const spacing = 70;
        const baseX = RANKING_POSITION.x;
        const baseY = RANKING_POSITION.y;
        const avatarSize = 40;

        this.ctx.fillStyle = "#000000";
        this.ctx.font = "700 36px 'Montserrat', sans-serif";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("RANKING", baseX, baseY - 40);

        // Get top 5 scores
        const sortedScores = Object.entries(this.userScores)
            .sort(([, a], [, b]) => b.score - a.score)
            .slice(0, 5);

        sortedScores.forEach(([username, data], index) => {
            const rectWidth = 300;
            const rectHeight = 60;
            const rectY = baseY + (index * spacing);

            // Background color gradient
            let bgColor;
            if (index === 0) {
                bgColor = "#FFD700"; // Gold
            } else if (index === 1) {
                bgColor = "#C0C0C0"; // Silver
            } else if (index === 2) {
                bgColor = "#CD7F32"; // Bronze
            } else if (index === 3) {
                bgColor = "#FFFFFF";
            } else {
                bgColor = "#F0F0F0";
            }

            this.ctx.fillStyle = bgColor;
            this.ctx.fillRect(baseX, rectY, rectWidth, rectHeight);

            // Draw rank number
            this.ctx.fillStyle = "#000000";
            this.ctx.font = "bold 24px 'Montserrat', sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(`#${index + 1}`, baseX + 30, rectY + rectHeight / 2);

            // Draw avatar
            if (data.avatar) {
                const avatarImg = this.preloadAvatar(data.avatar);
                if (avatarImg.complete) {
                    this.ctx.drawImage(avatarImg, baseX + 60, rectY + 10, avatarSize, avatarSize);
                }
            }

            // Draw username
            let displayName = username;
            if (displayName.length > 17) {
                displayName = displayName.substring(0, 15) + '...';
            }
            this.ctx.font = "600 14px 'Montserrat', sans-serif";
            this.ctx.textAlign = "left";
            this.ctx.fillText(displayName, baseX + 110, rectY + 22);

            // Draw score
            this.ctx.font = "400 14px 'Montserrat', sans-serif";
            this.ctx.fillText(`${data.score} points`, baseX + 110, rectY + 43);
        });
    }
} 