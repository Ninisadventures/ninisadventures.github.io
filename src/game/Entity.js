export class Entity {
    constructor(x, y, spriteName) {
        this.x = x;
        this.y = y;
        this.spriteName = spriteName;
    }
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, null); // Player is not rendered as a sprite

        // Position and direction
        this.posX = x;
        this.posY = y;
        this.dirX = -1;
        this.dirY = 0;

        // Camera plane
        this.planeX = 0;
        this.planeY = 0.66; // Standard 66-degree FOV

        // Movement state
        this.moveSpeed = 0.05;
        this.rotSpeed = 0.03;
    }

    update(input) {
        // Rotation
        if (input.left) {
            const oldDirX = this.dirX;
            this.dirX = this.dirX * Math.cos(this.rotSpeed) - this.dirY * Math.sin(this.rotSpeed);
            this.dirY = oldDirX * Math.sin(this.rotSpeed) + this.dirY * Math.cos(this.rotSpeed);
            const oldPlaneX = this.planeX;
            this.planeX = this.planeX * Math.cos(this.rotSpeed) - this.planeY * Math.sin(this.rotSpeed);
            this.planeY = oldPlaneX * Math.sin(this.rotSpeed) + this.planeY * Math.cos(this.rotSpeed);
        }
        if (input.right) {
            const oldDirX = this.dirX;
            this.dirX = this.dirX * Math.cos(-this.rotSpeed) - this.dirY * Math.sin(-this.rotSpeed);
            this.dirY = oldDirX * Math.sin(-this.rotSpeed) + this.dirY * Math.cos(-this.rotSpeed);
            const oldPlaneX = this.planeX;
            this.planeX = this.planeX * Math.cos(-this.rotSpeed) - this.planeY * Math.sin(-this.rotSpeed);
            this.planeY = oldPlaneX * Math.sin(-this.rotSpeed) + this.planeY * Math.cos(-this.rotSpeed);
        }

        // Movement is now handled in the main game loop for collision detection.
    }
}