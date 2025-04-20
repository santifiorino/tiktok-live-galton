import { Ball } from './Ball.js';
import { Peg } from './Peg.js';
import {
  BALL_SIZE,
  ROWS,
  OFFSET_Y,
  MAX_BALLS,
  MAX_HISTORY,
  HISTORY_POSITION,
  RANKING_POSITION,
  binColours,
  binScores,
  defaultAvatarUrl
} from './config.js';
import {
  galtonPosToXCoord,
  galtonPosToYCoord,
  map,
  createCircleMask
} from './utils.js';

const BALL_POOL = [];
let sharedCircleMask;
let giftHistory = [];

let pegs = [];
let balls = [];
let socket;
let giftQueue = [];

let canvas, ctx;
let canvasWidth, canvasHeight;

let lastBallDropTime = 0;
let lastGifterId = null;
let lastGiftCompletionTime = 0;
let scoreAnimations = [];
let userScores = {};
let avatarCache = new Map();

function displaySortedScores() {
  const sortedScores = Object.entries(userScores)
    .sort(([, a], [, b]) => b.score - a.score);

  console.log('Current Scores:');
  sortedScores.forEach(([username, data], index) => {
    console.log(`${index + 1}. ${username}: ${data.score}`);
  });
}

function createBalls() {
  if (giftQueue.length === 0) return;

  const currentTime = Date.now();
  const timeSinceLastCompletion = currentTime - lastGiftCompletionTime;

  if (timeSinceLastCompletion < 1000) {
    return;
  }

  const currentGift = giftQueue[0];
  const availableBall = BALL_POOL.find(ball => !ball.active);

  if (!availableBall) return;

  availableBall.initialize(currentGift.avatar, currentGift.diamondCount, currentGift.nickname);
  currentGift.ballsRemaining--;
  currentGift.ballsSpawned++;

  if (currentGift.ballsRemaining <= 0) {
    giftHistory.unshift(currentGift);

    if (giftHistory.length > MAX_HISTORY) {
      giftHistory.pop();
    }

    giftQueue.shift();
    lastGiftCompletionTime = currentTime;
  }
}

function connectWebSocket() {
  socket = new WebSocket('ws://localhost:8765');

  socket.onopen = function (event) {
    console.log('Connected to WebSocket server');
  };

  socket.onmessage = function (event) {
    try {
      const data = JSON.parse(event.data);
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

      giftQueue.push(newGift);

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

      createBalls();
    } catch (e) {
      console.error('Error parsing WebSocket message:', e);
    }
  };

  socket.onclose = function (event) {
    console.log('Disconnected from WebSocket server');
    setTimeout(connectWebSocket, 3000);
  };

  socket.onerror = function (error) {
    console.error('WebSocket error:', error);
  };
}

function drawQueueInfo() {
  const upcomingGifts = giftQueue.slice(1, 4);
  const currentGift = giftQueue[0];
  const previousGifts = giftHistory.slice(0, 4);
  const displayGifts = new Array(7).fill(null);

  if (currentGift) {
    displayGifts[3] = currentGift;
  } else if (previousGifts.length > 0) {
    displayGifts[3] = previousGifts[0];
  }

  let nextPosition = 2;
  upcomingGifts.forEach((gift, index) => {
    displayGifts[nextPosition - index] = gift;
  });

  let completedPosition = 4;
  previousGifts.forEach((gift, index) => {
    if (currentGift) {
      displayGifts[completedPosition + index] = gift;
    } else if (index > 0) {
      displayGifts[completedPosition + (index - 1)] = gift;
    }
  });

  const validGifts = displayGifts.filter(gift => gift && gift.avatarImg);

  if (validGifts.length > 0) {
    const rectWidth = 275;
    const rectHeight = 60;
    const spacing = 70;
    const avatarSize = 40;
    const giftImageSize = 30;

    for (let i = 0; i < displayGifts.length; i++) {
      const gift = displayGifts[i];
      if (!gift || !gift.avatarImg) continue;

      const rectX = HISTORY_POSITION.x;
      const rectY = HISTORY_POSITION.y + (i * spacing);

      let bgColor;
      if (i === 3) {
        bgColor = "#FFFFFF";
      } else if (i === 2 || i === 4) {
        bgColor = "#F0F0F0";
      } else if (i === 1 || i === 5) {
        bgColor = "#E0E0E0";
      } else {
        bgColor = "#D0D0D0";
      }

      ctx.fillStyle = bgColor;
      ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

      ctx.drawImage(gift.avatarImg, rectX + 10, rectY + 10, avatarSize, avatarSize);

      let displayName = gift.nickname;
      if (displayName.length > 17) {
        displayName = displayName.substring(0, 15) + '...';
      }

      ctx.fillStyle = "#000000";
      ctx.font = "14px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(displayName, rectX + 60, rectY + 22);

      ctx.fillText(`${gift.ballsSpawned}/${gift.ballsSpawned + gift.ballsRemaining}`,
        rectX + 60, rectY + 43);

      if (gift.gift_image) {
        ctx.drawImage(gift.gift_image,
          rectX + rectWidth - giftImageSize - 10,
          rectY + 15,
          giftImageSize,
          giftImageSize
        );
        ctx.textAlign = "right";
        ctx.fillText(`${gift.gift_amount}x`,
          rectX + rectWidth - giftImageSize - 25,
          rectY + 30
        );
      }
    }
  }
}

function drawGiftInfo(gift, x, y, bgColor) {
  const rectWidth = 300;
  const rectHeight = 60;
  const avatarSize = 40;
  const giftImageSize = 30;

  if (!gift || !gift.avatarImg) return;

  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, rectWidth, rectHeight);

  ctx.drawImage(gift.avatarImg, x + 10, y + 10, avatarSize, avatarSize);

  let displayName = gift.nickname;
  if (displayName.length > 17) {
    displayName = displayName.substring(0, 15) + '...';
  }

  ctx.fillStyle = "#000000";
  ctx.font = "600 14px 'Montserrat', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(displayName, x + 60, y + 22);

  ctx.font = "400 14px 'Montserrat', sans-serif";
  ctx.fillText(`${gift.ballsSpawned}/${gift.ballsSpawned + gift.ballsRemaining}`,
    x + 60, y + 43);

  if (gift.gift_image) {
    ctx.drawImage(gift.gift_image,
      x + rectWidth - giftImageSize - 10,
      y + 15,
      giftImageSize,
      giftImageSize
    );
    ctx.textAlign = "right";
    ctx.fillText(`${gift.gift_amount}x`,
      x + rectWidth - giftImageSize - 25,
      y + 30
    );
  }
}

function drawCurrentGift() {
  const spacing = 70;
  const baseX = HISTORY_POSITION.x;
  const baseY = HISTORY_POSITION.y;

  ctx.fillStyle = "#000000";
  ctx.font = "700 36px 'Montserrat', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("GIFTS", baseX, baseY - 40);

  let giftsToShow = [];

  // Always show at least the last completed gift if there's nothing in the queue
  if (giftQueue.length === 0 && giftHistory.length > 0) {
    giftsToShow = [
      { gift: giftHistory[0], color: "#FFFFFF" },
      { gift: giftHistory[1], color: "#F0F0F0" },
      { gift: giftHistory[2], color: "#E0E0E0" },
      { gift: giftHistory[3], color: "#D0D0D0" },
      { gift: giftHistory[4], color: "#C0C0C0" }
    ];
  } else if (giftQueue.length > 0) {
    giftsToShow = [
      { gift: giftQueue[0], color: "#FFFFFF" },
      { gift: giftHistory[0], color: "#F0F0F0" },
      { gift: giftHistory[1], color: "#E0E0E0" },
      { gift: giftHistory[2], color: "#D0D0D0" },
      { gift: giftHistory[3], color: "#C0C0C0" }
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
      drawGiftInfo(item.gift, baseX, baseY + (index * spacing), item.color);
    }
  });
}

function drawBins() {
  const binWidth = (BALL_SIZE + 6) * 2;
  const binHeight = canvasHeight - galtonPosToYCoord(ROWS, OFFSET_Y);
  const startX = galtonPosToXCoord(-ROWS, canvasWidth) - binWidth / 2;

  for (let i = 0; i <= ROWS; i++) {
    const x = startX + (i * binWidth);
    const y = galtonPosToYCoord(ROWS, OFFSET_Y) + 50;

    ctx.fillStyle = binColours[i % binColours.length];
    ctx.fillRect(x, y, binWidth, binHeight);

    ctx.fillStyle = "#222222";
    ctx.font = "bold 24px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(binScores[i], x + binWidth / 2, y + 40);
  }
}

function preloadAvatar(url) {
  if (!avatarCache.has(url)) {
    const img = new Image();
    img.src = url;
    avatarCache.set(url, img);
  }
  return avatarCache.get(url);
}

function drawRankings() {
  const spacing = 70;
  const baseX = RANKING_POSITION.x;
  const baseY = RANKING_POSITION.y;
  const avatarSize = 40;

  ctx.fillStyle = "#000000";
  ctx.font = "700 36px 'Montserrat', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("RANKING", baseX, baseY - 40);

  // Get top 5 scores instead of 6
  const sortedScores = Object.entries(userScores)
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

    ctx.fillStyle = bgColor;
    ctx.fillRect(baseX, rectY, rectWidth, rectHeight);

    // Draw rank number
    ctx.fillStyle = "#000000";
    ctx.font = "bold 24px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`#${index + 1}`, baseX + 30, rectY + rectHeight / 2);

    // Draw avatar
    if (data.avatar) {
      const avatarImg = preloadAvatar(data.avatar);
      if (avatarImg.complete) {
        ctx.drawImage(avatarImg, baseX + 60, rectY + 10, avatarSize, avatarSize);
      }
    }

    // Draw username
    let displayName = username;
    if (displayName.length > 17) {
      displayName = displayName.substring(0, 15) + '...';
    }
    ctx.font = "600 14px 'Montserrat', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(displayName, baseX + 110, rectY + 22);

    // Draw score
    ctx.font = "400 14px 'Montserrat', sans-serif";
    ctx.fillText(`${data.score} points`, baseX + 110, rectY + 43);
  });
}

function draw() {
  ctx.fillStyle = "#DCDCDC";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  drawBins();

  for (const peg of pegs) {
    peg.show(ctx,
      (x) => galtonPosToXCoord(x, canvasWidth),
      (y) => galtonPosToYCoord(y, OFFSET_Y));
  }

  // Update and draw score animations
  const currentTime = Date.now();
  for (let i = scoreAnimations.length - 1; i >= 0; i--) {
    const animation = scoreAnimations[i];
    const age = currentTime - animation.startTime;

    if (age > 1000) {
      scoreAnimations.splice(i, 1);
    } else {
      const opacity = 1 - (age / 1000);
      const yOffset = age / 30;

      ctx.fillStyle = animation.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(animation.score, animation.x, animation.y - yOffset);
    }
  }

  BALL_POOL.forEach(ball => {
    if (ball.active) {
      ball.update();
      ball.show();
      if (ball.showY >= canvasHeight) {
        ball.active = false;
      }
    }
  });

  drawCurrentGift();
  drawRankings();

  requestAnimationFrame(draw);
}

function init() {
  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');

  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  document.body.appendChild(canvas);

  sharedCircleMask = createCircleMask(BALL_SIZE);

  for (let i = 0; i < MAX_BALLS; i++) {
    BALL_POOL.push(new Ball(canvasWidth, OFFSET_Y, ctx, userScores, scoreAnimations, displaySortedScores));
  }

  for (let y = 0; y < ROWS; y++) {
    for (let x = -y; x <= y; x += 2) {
      pegs.push(new Peg(x, y));
    }
  }

  connectWebSocket();

  canvas.addEventListener('click', function () {
    giftQueue.push({
      diamondCount: 100,
      avatar: defaultAvatarUrl,
      nickname: 'Test User' + Math.random(),
      ballsRemaining: 100,
      ballsSpawned: 0
    });
    createBalls();
  });

  setInterval(createBalls, 50);

  requestAnimationFrame(draw);
}

window.addEventListener('resize', function () {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
});

document.addEventListener('DOMContentLoaded', init);