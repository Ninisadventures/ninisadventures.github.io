export class MaterialSystem {
    constructor() {
        this.materials = {
            // Walls
            stone: { type: 'wall', generator: 'stone' },
            brick: { type: 'wall', generator: 'brick' },
            metal: { type: 'wall', generator: 'metal' },
            concrete: { type: 'wall', generator: 'concrete' },
            wood: { type: 'wall', generator: 'wood' },
            marble: { type: 'wall', generator: 'marble' },

            // Floors
            tile: { type: 'floor', generator: 'tile' },
            carpet: { type: 'floor', generator: 'carpet' },
            dirt: { type: 'floor', generator: 'dirt' },

            // Special
            ceiling: { type: 'floor', color: '#444444' }, // Simple color for ceiling
        };
    }

    getMaterial(name) {
        return this.materials[name] || null;
    }
}