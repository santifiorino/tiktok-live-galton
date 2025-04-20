import { ROWS } from '../config.js';

export class BinHistory {
    constructor() {
        this.bins = new Array(ROWS + 1).fill(0);
        console.log('BinHistory initialized with', ROWS + 1, 'bins');
    }

    incrementBin(binIndex) {
        if (binIndex >= 0 && binIndex <= ROWS) {
            this.bins[binIndex]++;
            console.log(`Ball fell into bin ${binIndex}`);
            this.logBinDistribution();
        } else {
            console.warn(`Invalid bin index: ${binIndex}`);
        }
    }

    getBinCount(binIndex) {
        if (binIndex >= 0 && binIndex <= ROWS) {
            return this.bins[binIndex];
        }
        return 0;
    }

    getTotalBalls() {
        return this.bins.reduce((sum, count) => sum + count, 0);
    }

    logBinDistribution() {
        console.log('Bin Distribution:', JSON.stringify(this.bins));
    }

    reset() {
        this.bins = new Array(ROWS + 1).fill(0);
        console.log('BinHistory reset');
    }
} 