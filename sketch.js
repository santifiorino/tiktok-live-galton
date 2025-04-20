import { Ball } from './Ball.js';
import { Peg } from './Peg.js';
import { GiftHistory } from './GiftHistory.js';
import {
  BALL_SIZE,
  ROWS,
  OFFSET_Y,
  MAX_BALLS,
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
let giftHistory;

let pegs = [];
let socket;
let scoreAnimations = [];
let userScores = {};
let avatarCache = new Map();
let canvas, ctx, canvasWidth, canvasHeight;

function displaySortedScores() {
  const sortedScores = Object.entries(userScores)
    .sort(([, a], [, b]) => b.score - a.score);

  console.log('Current Scores:');
  sortedScores.forEach(([username, data], index) => {
    console.log(`${index + 1}. ${username}: ${data.score}`);
  });
}

function createBalls() {
  const nextGift = giftHistory.getNextGift();
  if (!nextGift) return;

  const availableBall = BALL_POOL.find(ball => !ball.active);
  if (!availableBall) return;

  availableBall.initialize(nextGift.avatar, nextGift.diamondCount, nextGift.nickname);
  giftHistory.updateGiftProgress(nextGift);
}

function connectWebSocket() {
  socket = new WebSocket('ws://localhost:8765');

  socket.onopen = function (event) {
    console.log('Connected to WebSocket server');
  };

  socket.onmessage = function (event) {
    try {
      const data = JSON.parse(event.data);
      giftHistory.addGift(data);
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

  giftHistory.draw();
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

  giftHistory = new GiftHistory(ctx);

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
    const testGift = {
      diamond_count: 100,
      avatar: defaultAvatarUrl,
      nickname: 'Test User' + Math.random(),
      gift_amount: 1,
      gift_image: ''
    };
    giftHistory.addGift(testGift);
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