import { Entity } from './Entity.js';

export class World {
    constructor() {
        this.map = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 2, 3, 0, 0, 4, 5, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 6, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 2, 0, 0, 0, 0, 3, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ];

        this.entities = [
            new Entity(3.5, 3.5, 'enemy'),
            new Entity(6.5, 2.5, 'item'),
        ];

        this.floorMaterial = 'dirt';

        this.materialMap = {
            1: 'stone',
            2: 'brick',
            3: 'metal',
            4: 'concrete',
            5: 'wood',
            6: 'marble',
        };
    }

    getWall(x, y) {
        if (x < 0 || x >= this.map[0].length || y < 0 || y >= this.map.length) {
            return 1; // Treat out-of-bounds as a wall
        }
        return this.map[y][x];
    }

    getMaterialName(wallId) {
        return this.materialMap[wallId] || 'stone'; // Default to stone
    }
}