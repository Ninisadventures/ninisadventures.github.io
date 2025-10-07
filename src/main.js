import { TextureAtlas } from './engine/assets/TextureAtlas.js';
import { SpriteAtlas } from './engine/assets/SpriteAtlas.js';
import { RaycastRenderer } from './engine/renderer/RaycastRenderer.js';
import { SpriteRenderer } from './engine/renderer/SpriteRenderer.js';
import { World } from './game/World.js';
import { Player } from './game/Entity.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = 640;
        this.canvas.height = 480;

        this.zBuffer = new Float32Array(this.canvas.width);

        this.textureAtlas = new TextureAtlas();
        this.spriteAtlas = new SpriteAtlas();

        this.raycastRenderer = new RaycastRenderer(this.canvas, this.textureAtlas);
        this.spriteRenderer = new SpriteRenderer(this.canvas, this.spriteAtlas);

        this.world = new World();
        this.player = new Player(2.5, 3.5);

        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
        };

        this.lastTime = 0;
    }

    async init() {
        console.log('Initializing game...');
        this.setupInput();
        this.textureAtlas.build();
        await this.spriteAtlas.loadSprites();
        console.log('Game initialized.');
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'w' || e.key === 'ArrowUp') this.input.forward = true;
            if (e.key === 's' || e.key === 'ArrowDown') this.input.backward = true;
            if (e.key === 'a' || e.key === 'ArrowLeft') this.input.left = true;
            if (e.key === 'd' || e.key === 'ArrowRight') this.input.right = true;
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'w' || e.key === 'ArrowUp') this.input.forward = false;
            if (e.key === 's' || e.key === 'ArrowDown') this.input.backward = false;
            if (e.key === 'a' || e.key === 'ArrowLeft') this.input.left = false;
            if (e.key === 'd' || e.key === 'ArrowRight') this.input.right = false;
        });
    }

    gameLoop(timestamp) {
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        // Handle rotation from player input
        this.player.update(this.input);

        // Calculate movement vector
        let moveX = 0;
        let moveY = 0;
        if (this.input.forward) {
            moveX += this.player.dirX * this.player.moveSpeed;
            moveY += this.player.dirY * this.player.moveSpeed;
        }
        if (this.input.backward) {
            moveX -= this.player.dirX * this.player.moveSpeed;
            moveY -= this.player.dirY * this.player.moveSpeed;
        }

        // Wall-sliding collision detection
        const nextX = this.player.posX + moveX;
        if (this.world.getWall(Math.floor(nextX), Math.floor(this.player.posY)) === 0) {
            this.player.posX = nextX;
        }

        const nextY = this.player.posY + moveY;
        if (this.world.getWall(Math.floor(this.player.posX), Math.floor(nextY)) === 0) {
            this.player.posY = nextY;
        }
    }

    render() {
        // Handle canvas resizing
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
        const height = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));

        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.raycastRenderer.width = width;
            this.raycastRenderer.height = height;
            this.spriteRenderer.width = width;
            this.spriteRenderer.height = height;
            this.zBuffer = new Float32Array(width);
        }

        this.raycastRenderer.render(this.player, this.world, this.zBuffer);
        this.spriteRenderer.render(this.player, this.world.entities, this.zBuffer);
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Entry point
window.addEventListener('load', async () => {
    const game = new Game();
    await game.init();
    game.start();
});