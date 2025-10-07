export class SpriteRenderer {
    constructor(canvas, spriteAtlas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.spriteAtlas = spriteAtlas;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    render(player, entities, zBuffer) {
        // Sort sprites from far to near
        entities.sort((a, b) => {
            const distA = Math.pow(player.posX - a.x, 2) + Math.pow(player.posY - a.y, 2);
            const distB = Math.pow(player.posX - b.x, 2) + Math.pow(player.posY - b.y, 2);
            return distB - distA;
        });

        for (const sprite of entities) {
            const spriteX = sprite.x - player.posX;
            const spriteY = sprite.y - player.posY;

            const invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);

            const transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
            const transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY);

            if (transformY <= 0) continue;

            const spriteScreenX = Math.floor((this.width / 2) * (1 + transformX / transformY));
            const spriteHeight = Math.abs(Math.floor(this.height / transformY));
            const drawStartY = Math.floor(Math.max(0, -spriteHeight / 2 + this.height / 2));
            const drawEndY = Math.floor(Math.min(this.height - 1, spriteHeight / 2 + this.height / 2));

            const spriteWidth = Math.abs(Math.floor(this.height / transformY));
            const drawStartX = Math.floor(Math.max(0, -spriteWidth / 2 + spriteScreenX));
            const drawEndX = Math.floor(Math.min(this.width - 1, spriteWidth / 2 + spriteScreenX));

            const image = this.spriteAtlas.getSprite(sprite.spriteName);
            if (!image) continue;

            // Loop through every vertical stripe of the sprite on screen
            for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
                if (transformY < zBuffer[stripe]) {
                    const texX = Math.floor((stripe - (-spriteWidth / 2 + spriteScreenX)) * image.width / spriteWidth);
                    if (texX < 0 || texX >= image.width) continue;

                    this.ctx.drawImage(image,
                        texX, 0,
                        1, image.height,
                        stripe, drawStartY,
                        1, spriteHeight
                    );
                }
            }
        }
    }
}