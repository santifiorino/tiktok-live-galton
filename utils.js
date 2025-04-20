import { BALL_SIZE } from './config.js';

/**
 * Converts a Galton board x-position to canvas x-coordinate
 * @param {number} galtonX - The x-position in the Galton board grid
 * @param {number} canvasWidth - The width of the canvas
 * @returns {number} The x-coordinate on the canvas
 */
export function galtonPosToXCoord(galtonX, canvasWidth) {
    return galtonX * (BALL_SIZE / 2 + 3) * 2 + canvasWidth / 2;
}

/**
 * Converts a Galton board y-position to canvas y-coordinate
 * @param {number} galtonY - The y-position in the Galton board grid
 * @param {number} offsetY - The vertical offset from the top
 * @returns {number} The y-coordinate on the canvas
 */
export function galtonPosToYCoord(galtonY, offsetY) {
    return offsetY + galtonY * BALL_SIZE * 2;
}

/**
 * Maps a value from one range to another
 * @param {number} value - The value to map
 * @param {number} start1 - The start of the input range
 * @param {number} stop1 - The end of the input range
 * @param {number} start2 - The start of the output range
 * @param {number} stop2 - The end of the output range
 * @returns {number} The mapped value
 */
export function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

/**
 * Creates a circular mask for avatar images
 * @param {number} size - The size of the mask
 * @returns {HTMLCanvasElement} The mask canvas
 */
export function createCircleMask(size) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = size;
    maskCanvas.height = size;
    const maskCtx = maskCanvas.getContext('2d');

    maskCtx.fillStyle = '#fff';
    maskCtx.beginPath();
    maskCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    maskCtx.fill();

    return maskCanvas;
} 