import { TextureGenerator } from '../renderer/TextureGenerator.js';
import { MaterialSystem } from '../renderer/MaterialSystem.js';

export class TextureAtlas {
    constructor(width = 64, height = 64) {
        this.width = width;
        this.height = height;
        this.textures = new Map();
        this.materialSystem = new MaterialSystem();
    }

    build() {
        console.log('Building Texture Atlas...');
        for (const name in this.materialSystem.materials) {
            const material = this.materialSystem.getMaterial(name);

            if (material.generator) {
                let texture;
                if (material.type === 'wall') {
                    texture = TextureGenerator.generateWallTexture(material.generator, this.width, this.height);
                } else if (material.type === 'floor') {
                    texture = TextureGenerator.generateFloorTexture(material.generator, this.width, this.height);
                }
                this.textures.set(name, texture);
            } else if (material.color) {
                // Handle simple color materials (like the ceiling)
                const canvas = document.createElement('canvas');
                canvas.width = this.width;
                canvas.height = this.height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = material.color;
                ctx.fillRect(0, 0, this.width, this.height);
                this.textures.set(name, canvas);
            }
        }
        console.log('Texture Atlas built successfully.');
    }

    getTexture(name) {
        return this.textures.get(name) || null;
    }
}