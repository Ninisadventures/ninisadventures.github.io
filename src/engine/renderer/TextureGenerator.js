import { NoiseGenerator } from '../utils/NoiseGenerator.js';
import { ColorUtils } from '../utils/ColorUtils.js';

export class TextureGenerator {
    static generateWallTexture(type, width = 64, height = 64) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        switch (type) {
            case 'stone':
                this.generateStoneTexture(data, width, height);
                break;
            case 'brick':
                this.generateBrickTexture(data, width, height);
                break;
            case 'metal':
                this.generateMetalTexture(data, width, height);
                break;
            case 'concrete':
                this.generateConcreteTexture(data, width, height);
                break;
            case 'wood':
                this.generateWoodTexture(data, width, height);
                break;
            case 'marble':
                this.generateMarbleTexture(data, width, height);
                break;
            default:
                this.generateStoneTexture(data, width, height);
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    static generateStoneTexture(data, width, height) {
        const baseColor = [120, 120, 110];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;

                const noise1 = NoiseGenerator.fbm(x, y, 4, 0.5, 0.1);
                const noise2 = NoiseGenerator.fbm(x, y, 2, 0.3, 0.05);
                const spotNoise = NoiseGenerator.simplex2D(x, y, 0.3);

                let color = [...baseColor];

                const variation = (noise1 + noise2) * 40;
                color = color.map(c => Math.max(0, Math.min(255, c + variation)));

                if (spotNoise > 0.3) {
                    color = ColorUtils.darken(color, 0.7);
                }

                data[idx] = color[0];
                data[idx + 1] = color[1];
                data[idx + 2] = color[2];
                data[idx + 3] = 255;
            }
        }
    }

    static generateBrickTexture(data, width, height) {
        const brickColor = [140, 70, 50];
        const mortarColor = [200, 200, 190];
        const brickWidth = 16;
        const brickHeight = 8;
        const mortarWidth = 2;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;

                const row = Math.floor(y / (brickHeight + mortarWidth));
                const col = Math.floor((x + (row % 2) * (brickWidth / 2)) / (brickWidth + mortarWidth));

                const brickX = (x + (row % 2) * (brickWidth / 2)) % (brickWidth + mortarWidth);
                const brickY = y % (brickHeight + mortarWidth);

                let color;

                if (brickX < brickWidth && brickY < brickHeight) {
                    color = [...brickColor];
                    const noise = NoiseGenerator.fbm(x + col * 100, y + row * 100, 3, 0.4, 0.2);
                    const variation = noise * 30;
                    color = color.map(c => Math.max(0, Math.min(255, c + variation)));
                } else {
                    color = [...mortarColor];
                    const noise = NoiseGenerator.simplex2D(x, y, 0.1);
                    const variation = noise * 10;
                    color = color.map(c => Math.max(0, Math.min(255, c + variation)));
                }

                data[idx] = color[0];
                data[idx + 1] = color[1];
                data[idx + 2] = color[2];
                data[idx + 3] = 255;
            }
        }
    }

    static generateMetalTexture(data, width, height) {
        const baseColor = [100, 100, 120];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;

                const scratchNoise = NoiseGenerator.simplex2D(x * 0.1, y, 0.5);
                const surfaceNoise = NoiseGenerator.fbm(x, y, 3, 0.3, 0.1);

                let color = [...baseColor];

                const variation = surfaceNoise * 20;
                color = color.map(c => Math.max(0, Math.min(255, c + variation)));

                if (Math.abs(scratchNoise) > 0.6) {
                    const scratchIntensity = (Math.abs(scratchNoise) - 0.6) * 2.5;
                    color = color.map(c => Math.min(255, c + scratchIntensity * 80));
                }

                data[idx] = color[0];
                data[idx + 1] = color[1];
                data[idx + 2] = color[2];
                data[idx + 3] = 255;
            }
        }
    }

    static generateConcreteTexture(data, width, height) {
        const baseColor = [160, 160, 150];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;

                const noise1 = NoiseGenerator.fbm(x, y, 5, 0.5, 0.05);
                const noise2 = NoiseGenerator.fbm(x, y, 3, 0.3, 0.2);
                const spotNoise = NoiseGenerator.simplex2D(x, y, 0.4);

                let color = [...baseColor];

                const variation = (noise1 + noise2) * 25;
                color = color.map(c => Math.max(0, Math.min(255, c + variation)));

                if (spotNoise > 0.4) {
                    const aggregateColor = [180, 180, 170];
                    const blend = (spotNoise - 0.4) * 2.5;
                    color = ColorUtils.interpolate(color, aggregateColor, blend);
                }

                data[idx] = color[0];
                data[idx + 1] = color[1];
                data[idx + 2] = color[2];
                data[idx + 3] = 255;
            }
        }
    }

    static generateWoodTexture(data, width, height) {
        const woodColors = [
            [139, 90, 43],
            [160, 110, 70],
            [180, 130, 90]
        ];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;

                const grainPattern = Math.sin(y * 0.3 + NoiseGenerator.simplex2D(x, y, 0.1) * 3) * 0.5 + 0.5;
                const grainNoise = NoiseGenerator.fbm(x, y, 4, 0.4, 0.2);

                const colorIndex = Math.floor(grainPattern * woodColors.length);
                const clampedIndex = Math.max(0, Math.min(woodColors.length - 1, colorIndex));
                let color = [...woodColors[clampedIndex]];

                const variation = grainNoise * 20;
                color = color.map(c => Math.max(0, Math.min(255, c + variation)));

                data[idx] = color[0];
                data[idx + 1] = color[1];
                data[idx + 2] = color[2];
                data[idx + 3] = 255;
            }
        }
    }

    static generateMarbleTexture(data, width, height) {
        const baseColor = [240, 240, 235];
        const veinColor = [180, 180, 175];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;

                const veinNoise1 = NoiseGenerator.fbm(x, y, 4, 0.5, 0.02);
                const veinNoise2 = NoiseGenerator.fbm(x + 100, y + 100, 3, 0.6, 0.03);
                const turbulence = Math.sin(x * 0.1 + y * 0.05 + veinNoise1 * 8 + veinNoise2 * 4);

                let color = [...baseColor];

                const colorNoise = NoiseGenerator.simplex2D(x, y, 0.05);
                const colorVariation = colorNoise * 10;
                color = color.map(c => Math.max(0, Math.min(255, c + colorVariation)));

                const veinStrength = Math.abs(turbulence);
                if (veinStrength > 0.7) {
                    const blend = (veinStrength - 0.7) * 3.33;
                    color = ColorUtils.interpolate(color, veinColor, blend);
                }

                data[idx] = color[0];
                data[idx + 1] = color[1];
                data[idx + 2] = color[2];
                data[idx + 3] = 255;
            }
        }
    }

    static generateFloorTexture(type, width = 64, height = 64) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        switch (type) {
            case 'tile':
                this.generateTileTexture(data, width, height);
                break;
            case 'carpet':
                this.generateCarpetTexture(data, width, height);
                break;
            case 'dirt':
                this.generateDirtTexture(data, width, height);
                break;
            default:
                this.generateTileTexture(data, width, height);
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    static generateTileTexture(data, width, height) {
        const tileColor = [220, 220, 210];
        const groutColor = [180, 180, 170];
        const tileSize = 16;
        const groutWidth = 2;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;

                const tileX = x % (tileSize + groutWidth);
                const tileY = y % (tileSize + groutWidth);

                const isTile = tileX < tileSize && tileY < tileSize;
                const baseColor = isTile ? tileColor : groutColor;
                const noiseVariation = isTile ? 15 : 10;

                const noise = NoiseGenerator.simplex2D(x, y, 0.1);
                const variation = noise * noiseVariation;
                const color = baseColor.map(c => Math.max(0, Math.min(255, c + variation)));

                data[idx] = color[0];
                data[idx + 1] = color[1];
                data[idx + 2] = color[2];
                data[idx + 3] = 255;
            }
        }
    }

    static generateCarpetTexture(data, width, height) {
        const baseColor = [80, 60, 90]; // A deep purple

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;

                const noise = NoiseGenerator.fbm(x, y, 5, 0.6, 0.15);

                let color = [...baseColor];

                const variation = noise * 30;
                color = color.map(c => Math.max(0, Math.min(255, c + variation)));

                data[idx] = color[0];
                data[idx + 1] = color[1];
                data[idx + 2] = color[2];
                data[idx + 3] = 255;
            }
        }
    }

    static generateDirtTexture(data, width, height) {
        const darkColor = [80, 50, 30];
        const lightColor = [110, 70, 50];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;

                const noise1 = NoiseGenerator.fbm(x, y, 4, 0.5, 0.05); // Large patches
                const noise2 = NoiseGenerator.fbm(x, y, 3, 0.4, 0.2);  // Smaller details

                const blendFactor = (noise1 + noise2) / 2;

                let color = ColorUtils.interpolate(darkColor, lightColor, blendFactor);

                data[idx] = color[0];
                data[idx + 1] = color[1];
                data[idx + 2] = color[2];
                data[idx + 3] = 255;
            }
        }
    }
}