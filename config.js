export const BALL_SIZE = 30;
export const ROWS = 10;
export const OFFSET_Y = 200;
export const MAX_BALLS = 250;
export const MAX_HISTORY = 6;

export const HISTORY_POSITION = { x: 395, y: 100 };
export const RANKING_POSITION = { x: 1200, y: 100 };

export const binColours = ["#ebc13e", "#a242ae", "#d07634", "#0b8bb0", "#5ca509", "#8c8c8c", "#5ca509", "#0b8bb0", "#d07634", "#a242ae", "#ebc13e"];
export const binScores = [100, 25, 10, 5, 2, 1, 2, 5, 10, 25, 100];

export const defaultAvatarUrl = "https://i.pinimg.com/736x/9f/16/72/9f1672710cba6bcb0dfd93201c6d4c00.jpg";

// Helper functions
export function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

export function galtonPosToXCoord(galtonX, canvasWidth) {
    return galtonX * (BALL_SIZE / 2 + 3) * 2 + canvasWidth / 2;
}

export function galtonPosToYCoord(galtonY) {
    return OFFSET_Y + galtonY * BALL_SIZE * 2;
} 