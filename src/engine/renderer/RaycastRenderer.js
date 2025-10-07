export class RaycastRenderer {
    constructor(canvas, textureAtlas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.textureAtlas = textureAtlas;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    render(player, world, zBuffer) {
        const g = this.ctx;

        // Render ceiling and floor
        const ceilingMaterial = this.textureAtlas.getTexture('ceiling');
        if (ceilingMaterial) {
            g.drawImage(ceilingMaterial, 0, 0, this.width, this.height / 2);
        } else {
            g.fillStyle = '#444444';
            g.fillRect(0, 0, this.width, this.height / 2);
        }
        const floorMaterial = this.textureAtlas.getTexture(world.floorMaterial);
        if (floorMaterial) {
            g.drawImage(floorMaterial, 0, this.height / 2, this.width, this.height / 2);
        } else {
            g.fillStyle = '#888888';
            g.fillRect(0, this.height / 2, this.width, this.height);
        }

        // Wall rendering
        for (let x = 0; x < this.width; x++) {
            let cameraX = (2 * x) / (this.width - 1) - 1;
            if (!Number.isFinite(cameraX)) cameraX = 0;

            const rayDirX = player.dirX + player.planeX * cameraX;
            const rayDirY = player.dirY + player.planeY * cameraX;

            let mapX = Math.floor(player.posX);
            let mapY = Math.floor(player.posY);

            const deltaDistX = (rayDirX === 0) ? 1e30 : Math.abs(1 / rayDirX);
            const deltaDistY = (rayDirY === 0) ? 1e30 : Math.abs(1 / rayDirY);

            let stepX, sideDistX;
            if (rayDirX < 0) {
                stepX = -1;
                sideDistX = (player.posX - mapX) * deltaDistX;
            } else {
                stepX = 1;
                sideDistX = (mapX + 1.0 - player.posX) * deltaDistX;
            }

            let stepY, sideDistY;
            if (rayDirY < 0) {
                stepY = -1;
                sideDistY = (player.posY - mapY) * deltaDistY;
            } else {
                stepY = 1;
                sideDistY = (mapY + 1.0 - player.posY) * deltaDistY;
            }

            let hit = 0, side = 0, steps = 0;
            while (hit === 0 && steps < 2048) {
                if (sideDistX < sideDistY) {
                    sideDistX += deltaDistX;
                    mapX += stepX;
                    side = 0;
                } else {
                    sideDistY += deltaDistY;
                    mapY += stepY;
                    side = 1;
                }
                if (mapX < 0 || mapY < 0 || mapX >= world.map[0].length || mapY >= world.map.length) break;
                if (world.getWall(mapX, mapY) > 0) hit = 1;
                steps++;
            }

            let perpWallDist;
            if (side === 0) {
                perpWallDist = (sideDistX - deltaDistX);
            } else {
                perpWallDist = (sideDistY - deltaDistY);
            }

            if (!Number.isFinite(perpWallDist) || perpWallDist <= 0) {
                perpWallDist = 1e-4;
            }

            const lineHeight = Math.floor(this.height / perpWallDist);
            const drawStart = Math.max(0, Math.floor(-lineHeight / 2 + this.height / 2));
            const drawEnd = Math.min(this.height - 1, Math.floor(lineHeight / 2 + this.height / 2));

            const wallMaterialId = world.getWall(mapX, mapY);
            const wallMaterialName = world.getMaterialName(wallMaterialId);
            const texture = this.textureAtlas.getTexture(wallMaterialName);
            if (!texture) continue;

            let wallX;
            if (side === 0) {
                wallX = player.posY + perpWallDist * rayDirY;
            } else {
                wallX = player.posX + perpWallDist * rayDirX;
            }
            wallX -= Math.floor(wallX);
            if (!Number.isFinite(wallX)) wallX = 0.5;

            let texX = Math.floor(wallX * texture.width);
            if ((side === 0 && rayDirX > 0) || (side === 1 && rayDirY < 0)) {
                texX = texture.width - 1 - texX;
            }
            if (texX < 0) texX = 0;

            g.save();
            const darkness = side === 1 ? 0.7 : 1.0;
            g.globalAlpha = darkness;
            g.drawImage(texture, texX, 0, 1, texture.height, x, drawStart, 1, lineHeight);
            g.restore();

            zBuffer[x] = perpWallDist;
        }
    }
}