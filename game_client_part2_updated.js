/**
 * Game Client Part 2: Rendering Engine & Game Loop
 * BULLETPROOF VERSION
 */

// ============================================================================
// WORLD MANAGEMENT
// ============================================================================

class World {
    constructor(mapData) {
        this.mapData = mapData;
        this.width = mapData[0].length * GAME_SETTINGS.TILE_SIZE;
        this.height = mapData.length * GAME_SETTINGS.TILE_SIZE;
        this.tileSize = GAME_SETTINGS.TILE_SIZE;
    }
    
    isWallAt(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return true;
        }
        
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        return this.mapData[row][col] === 1;
    }
    
    getTileAt(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        
        if (row < 0 || row >= this.mapData.length || 
            col < 0 || col >= this.mapData[0].length) {
            return 0;
        }
        
        return this.mapData[row][col];
    }
}

// ============================================================================
// RAYCASTING ENGINE
// ============================================================================

class Ray {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.wallHitX = 0;
        this.wallHitY = 0;
        this.distance = 0;
        this.wasHitVertical = false;
        this.wallHitContent = 0;
    }
}

class RaycastEngine {
    constructor(world) {
        this.world = world;
        this.rays = [];
        this.numRays = Math.floor(GAME_SETTINGS.CANVAS_WIDTH / GAME_SETTINGS.WALL_STRIP_WIDTH);
    }
    
    castRay(rayAngle, playerX, playerY) {
        rayAngle = this._normalizeAngle(rayAngle);
        
        const isRayFacingDown = rayAngle > 0 && rayAngle < Math.PI;
        const isRayFacingUp = !isRayFacingDown;
        const isRayFacingRight = rayAngle < 0.5 * Math.PI || rayAngle > 1.5 * Math.PI;
        const isRayFacingLeft = !isRayFacingRight;
        
        // Horizontal intersection
        let foundHorzWallHit = false;
        let horzWallHitX = 0;
        let horzWallHitY = 0;
        let horzWallContent = 0;
        
        let yintercept = Math.floor(playerY / GAME_SETTINGS.TILE_SIZE) * GAME_SETTINGS.TILE_SIZE;
        yintercept += isRayFacingDown ? GAME_SETTINGS.TILE_SIZE : 0;
        
        let xintercept = playerX + (yintercept - playerY) / Math.tan(rayAngle);
        
        let ystep = GAME_SETTINGS.TILE_SIZE;
        ystep *= isRayFacingUp ? -1 : 1;
        
        let xstep = GAME_SETTINGS.TILE_SIZE / Math.tan(rayAngle);
        xstep *= (isRayFacingLeft && xstep > 0) ? -1 : 1;
        xstep *= (isRayFacingRight && xstep < 0) ? -1 : 1;
        
        let nextHorzTouchX = xintercept;
        let nextHorzTouchY = yintercept;
        
        while (nextHorzTouchX >= 0 && nextHorzTouchX <= this.world.width &&
               nextHorzTouchY >= 0 && nextHorzTouchY <= this.world.height) {
            
            const checkY = isRayFacingUp ? nextHorzTouchY - 1 : nextHorzTouchY;
            
            if (this.world.isWallAt(nextHorzTouchX, checkY)) {
                horzWallHitX = nextHorzTouchX;
                horzWallHitY = nextHorzTouchY;
                horzWallContent = this.world.getTileAt(nextHorzTouchX, checkY);
                foundHorzWallHit = true;
                break;
            }
            
            nextHorzTouchX += xstep;
            nextHorzTouchY += ystep;
        }
        
        // Vertical intersection
        let foundVertWallHit = false;
        let vertWallHitX = 0;
        let vertWallHitY = 0;
        let vertWallContent = 0;
        
        xintercept = Math.floor(playerX / GAME_SETTINGS.TILE_SIZE) * GAME_SETTINGS.TILE_SIZE;
        xintercept += isRayFacingRight ? GAME_SETTINGS.TILE_SIZE : 0;
        
        yintercept = playerY + (xintercept - playerX) * Math.tan(rayAngle);
        
        let xstep2 = GAME_SETTINGS.TILE_SIZE;
        xstep2 *= isRayFacingLeft ? -1 : 1;
        
        let ystep2 = GAME_SETTINGS.TILE_SIZE * Math.tan(rayAngle);
        ystep2 *= (isRayFacingUp && ystep2 > 0) ? -1 : 1;
        ystep2 *= (isRayFacingDown && ystep2 < 0) ? -1 : 1;
        
        let nextVertTouchX = xintercept;
        let nextVertTouchY = yintercept;
        
        while (nextVertTouchX >= 0 && nextVertTouchX <= this.world.width &&
               nextVertTouchY >= 0 && nextVertTouchY <= this.world.height) {
            
            const checkX = isRayFacingLeft ? nextVertTouchX - 1 : nextVertTouchX;
            
            if (this.world.isWallAt(checkX, nextVertTouchY)) {
                vertWallHitX = nextVertTouchX;
                vertWallHitY = nextVertTouchY;
                vertWallContent = this.world.getTileAt(checkX, nextVertTouchY);
                foundVertWallHit = true;
                break;
            }
            
            nextVertTouchX += xstep2;
            nextVertTouchY += ystep2;
        }
        
        const horzHitDistance = foundHorzWallHit
            ? this._distanceBetweenPoints(playerX, playerY, horzWallHitX, horzWallHitY)
            : Number.MAX_VALUE;
        const vertHitDistance = foundVertWallHit
            ? this._distanceBetweenPoints(playerX, playerY, vertWallHitX, vertWallHitY)
            : Number.MAX_VALUE;
        
        const ray = new Ray(playerX, playerY, rayAngle);
        
        if (vertHitDistance < horzHitDistance) {
            ray.distance = vertHitDistance;
            ray.wallHitX = vertWallHitX;
            ray.wallHitY = vertWallHitY;
            ray.wallHitContent = vertWallContent;
            ray.wasHitVertical = true;
        } else {
            ray.distance = horzHitDistance;
            ray.wallHitX = horzWallHitX;
            ray.wallHitY = horzWallHitY;
            ray.wallHitContent = horzWallContent;
            ray.wasHitVertical = false;
        }
        
        return ray;
    }
    
    castAllRays(player) {
        this.rays = [];
        
        const rayAngleIncrement = GAME_SETTINGS.FOV_ANGLE / this.numRays;
        let rayAngle = player.rotation - (GAME_SETTINGS.FOV_ANGLE / 2);
        
        for (let i = 0; i < this.numRays; i++) {
            const ray = this.castRay(rayAngle, player.position.x, player.position.y);
            this.rays.push(ray);
            rayAngle += rayAngleIncrement;
        }
    }
    
    _normalizeAngle(angle) {
        angle = angle % (2 * Math.PI);
        if (angle < 0) {
            angle = (2 * Math.PI) + angle;
        }
        return angle;
    }
    
    _distanceBetweenPoints(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
}

// ============================================================================
// 3D RENDERER
// ============================================================================

class Renderer3D {
    constructor(canvas, assetManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assetManager = assetManager;
    }
    
    render(player, raycastEngine, enemies, projectiles, particleSystem) {
        // Clear
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);
        
        // Render 3D walls
        this._renderWalls(raycastEngine, player);
        
        // Render 3D sprites
        this._renderSprites(player, raycastEngine, enemies, projectiles);
        
        // Render HUD
        this._renderHUD(player);
        
        // Render weapon
        this._renderWeapon();
        
        // Render minimap
        this._renderMinimap(player, raycastEngine, enemies);
    }
    
    _renderWalls(raycastEngine, player) {
        const wallTexture = this.assetManager.getTexture('wall_banana');
        if (!wallTexture) return;
        
        for (let i = 0; i < raycastEngine.rays.length; i++) {
            const ray = raycastEngine.rays[i];
            
            const correctDistance = ray.distance * Math.cos(ray.angle - player.rotation);
            
            const distanceProjPlane = (this.canvas.width / 2) / Math.tan(GAME_SETTINGS.FOV_ANGLE / 2);
            const wallStripHeight = (GAME_SETTINGS.TILE_SIZE / correctDistance) * distanceProjPlane;
            
            const maxDistance = GAME_SETTINGS.RENDER_DISTANCE;
            const lightIntensity = Math.max(0.3, 1 - (correctDistance / maxDistance));
            
            const shadeFactor = ray.wasHitVertical ? 0.8 : 1.0;
            
            const textureOffsetX = ray.wasHitVertical
                ? Math.floor(ray.wallHitY % GAME_SETTINGS.TILE_SIZE)
                : Math.floor(ray.wallHitX % GAME_SETTINGS.TILE_SIZE);
            
            const x = i * GAME_SETTINGS.WALL_STRIP_WIDTH;
            const y = (this.canvas.height / 2) - (wallStripHeight / 2);
            
            this._drawTexturedWallStrip(
                wallTexture.frames[0],
                x, y, GAME_SETTINGS.WALL_STRIP_WIDTH, wallStripHeight,
                textureOffsetX, lightIntensity * shadeFactor
            );
        }
    }
    
    _drawTexturedWallStrip(texture, x, y, width, height, textureX, brightness) {
        const textureWidth = texture.width;
        const textureHeight = texture.height;
        
        textureX = Math.max(0, Math.min(textureWidth - 1, Math.floor(textureX)));
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1;
        tempCanvas.height = textureHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.putImageData(texture, -textureX, 0);
        
        this.ctx.save();
        this.ctx.globalAlpha = brightness;
        this.ctx.drawImage(tempCanvas, 0, 0, 1, textureHeight, x, y, width, height);
        this.ctx.restore();
    }
    
    _renderSprites(player, raycastEngine, enemies, projectiles) {
        const visibleSprites = [];
        
        enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            const dx = enemy.position.x - player.position.x;
            const dy = enemy.position.y - player.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const angleToSprite = Math.atan2(dy, dx);
            let angleDiff = angleToSprite - player.rotation;
            
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            if (Math.abs(angleDiff) < GAME_SETTINGS.FOV_ANGLE / 2 + 0.2) {
                visibleSprites.push({
                    entity: enemy,
                    distance: distance,
                    angle: angleToSprite,
                    type: 'enemy'
                });
            }
        });
        
        projectiles.forEach(proj => {
            const dx = proj.position.x - player.position.x;
            const dy = proj.position.y - player.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            visibleSprites.push({
                entity: proj,
                distance: distance,
                angle: Math.atan2(dy, dx),
                type: 'projectile'
            });
        });
        
        visibleSprites.sort((a, b) => b.distance - a.distance);
        
        visibleSprites.forEach(sprite => {
            this._render3DSprite(sprite, player, raycastEngine);
        });
    }
    
    _render3DSprite(sprite, player, raycastEngine) {
        const texture = sprite.type === 'enemy' 
            ? this.assetManager.getTexture('kitty')
            : this.assetManager.getTexture('banana_projectile');
        
        if (!texture) return;
        
        const frameIndex = sprite.type === 'enemy' 
            ? sprite.entity.animationFrame % texture.frames.length
            : 0;
        
        const spriteAngle = sprite.angle - player.rotation;
        const spriteDistance = sprite.distance * Math.cos(spriteAngle);
        
        const distanceProjPlane = (this.canvas.width / 2) / Math.tan(GAME_SETTINGS.FOV_ANGLE / 2);
        const spriteHeight = (GAME_SETTINGS.TILE_SIZE / spriteDistance) * distanceProjPlane;
        const spriteWidth = spriteHeight;
        
        const spriteScreenX = Math.tan(spriteAngle) * distanceProjPlane;
        const x = (this.canvas.width / 2) + spriteScreenX - (spriteWidth / 2);
        const y = (this.canvas.height / 2) - (spriteHeight / 2);
        
        if (spriteDistance < 10) return;
        
        const lightIntensity = Math.max(0.3, 1 - (sprite.distance / GAME_SETTINGS.RENDER_DISTANCE));
        
        this.ctx.save();
        this.ctx.globalAlpha = lightIntensity;
        
        const tempCanvas = document.createElement('canvas');
        const textureData = texture.frames[frameIndex];
        tempCanvas.width = textureData.width;
        tempCanvas.height = textureData.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(textureData, 0, 0);
        
        this.ctx.drawImage(tempCanvas, x, y, spriteWidth, spriteHeight);
        this.ctx.restore();
    }
    
    _renderHUD(player) {
        const padding = 20;
        const barWidth = 200;
        const barHeight = 20;
        
        this.ctx.fillStyle = '#c0392b';
        this.ctx.fillRect(padding, padding, barWidth, barHeight);
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(padding, padding, (player.health / player.maxHealth) * barWidth, barHeight);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(`Health: ${Math.floor(player.health)}`, padding + 5, padding + 15);
        
        this.ctx.fillText(`Ammo: ${player.ammo}`, padding, padding + 50);
        this.ctx.fillText(`Score: ${player.score}`, padding, padding + 80);
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const crosshairSize = 10;
        
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - crosshairSize, centerY);
        this.ctx.lineTo(centerX + crosshairSize, centerY);
        this.ctx.moveTo(centerX, centerY - crosshairSize);
        this.ctx.lineTo(centerX, centerY + crosshairSize);
        this.ctx.stroke();
    }
    
    _renderWeapon() {
        const weapon = this.assetManager.getTexture('banana_gun');
        if (!weapon) return;
        
        const weaponWidth = 256;
        const weaponHeight = 128;
        const x = this.canvas.width / 2 - weaponWidth / 2;
        const y = this.canvas.height - weaponHeight - 20;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = weapon.frames[0].width;
        tempCanvas.height = weapon.frames[0].height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(weapon.frames[0], 0, 0);
        
        this.ctx.drawImage(tempCanvas, x, y, weaponWidth, weaponHeight);
    }
    
    _renderMinimap(player, raycastEngine, enemies) {
        const minimapX = this.canvas.width - 210;
        const minimapY = 10;
        const minimapWidth = 200;
        const minimapHeight = 150;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(minimapX, minimapY, minimapWidth, minimapHeight);
        
        const scale = GAME_SETTINGS.MINIMAP_SCALE;
        
        this.ctx.save();
        this.ctx.translate(minimapX + minimapWidth / 2, minimapY + minimapHeight / 2);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(Math.cos(player.rotation) * 10, Math.sin(player.rotation) * 10);
        this.ctx.stroke();
        
        enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            const dx = (enemy.position.x - player.position.x) * scale;
            const dy = (enemy.position.y - player.position.y) * scale;
            
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(dx, dy, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
}

// ============================================================================
// MAIN GAME CLASS
// ============================================================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = GAME_SETTINGS.CANVAS_WIDTH;
        this.canvas.height = GAME_SETTINGS.CANVAS_HEIGHT;
        
        // Use BulletproofAssetManager
        this.assetManager = new BulletproofAssetManager();
        this.audioSystem = new AudioSystem();
        this.particleSystem = new ParticleSystem();
        
        this.mapData = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,1],
            [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
            [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
            [1,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        this.world = new World(this.mapData);
        this.player = new Player(GAME_SETTINGS.TILE_SIZE * 2, GAME_SETTINGS.TILE_SIZE * 2);
        this.enemies = [];
        this.projectiles = [];
        
        this._spawnEnemies(5);
        
        this.raycastEngine = new RaycastEngine(this.world);
        this.renderer = new Renderer3D(this.canvas, this.assetManager);
        
        this.input = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false
        };
        
        this._setupInput();
        
        this.lastTime = 0;
        this.running = false;
        this.loading = true;
    }
    
    async init() {
        console.log('🎮 Initializing game...');
        
        await this.assetManager.preloadAssets();
        await this.audioSystem.init();
        
        this.loading = false;
        console.log('✅ Game initialized!');
    }
    
    _setupInput() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.input.up = true;
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.input.down = true;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.input.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.input.right = true;
            if (e.key === ' ') {
                this.input.shoot = true;
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.input.up = false;
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.input.down = false;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.input.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.input.right = false;
            if (e.key === ' ') this.input.shoot = false;
        });
    }
    
    _spawnEnemies(count) {
        for (let i = 0; i < count; i++) {
            let x, y;
            do {
                x = Math.random() * this.world.width;
                y = Math.random() * this.world.height;
            } while (this.world.isWallAt(x, y));
            
            this.enemies.push(new Enemy(x, y));
        }
    }
    
    update(dt) {
        this.player.update(dt, this.input, this.world);
        
        if (this.input.shoot && this.player.shoot()) {
            const projectile = new Projectile(
                this.player.position.x,
                this.player.position.y,
                this.player.rotation,
                'player'
            );
            this.projectiles.push(projectile);
            this.audioSystem.play('shoot', 0.5);
            
            this.particleSystem.emit(
                this.player.position.x,
                this.player.position.y,
                10,
                { speed: 50, spread: Math.PI / 6, lifetime: 0.2, color: '#ffcc00', size: 4 }
            );
        }
        
        this.enemies.forEach(enemy => {
            enemy.update(dt, this.player, this.world);
        });
        
        this.projectiles.forEach(proj => {
            proj.update(dt, this.world);
            
            this.enemies.forEach(enemy => {
                if (proj.alive && enemy.alive) {
                    const dist = proj.position.distance(enemy.position);
                    if (dist < 20) {
                        enemy.takeDamage(proj.damage);
                        proj.alive = false;
                        
                        this.audioSystem.play3D('hit', this.player.position, enemy.position, 0.7);
                        
                        this.particleSystem.emit(
                            proj.position.x,
                            proj.position.y,
                            15,
                            { speed: 80, spread: Math.PI, lifetime: 0.5, color: '#ff6600', size: 3 }
                        );
                        
                        if (!enemy.alive) {
                            this.player.score += 100;
                            this.audioSystem.play3D('explosion', this.player.position, enemy.position);
                            
                            this.particleSystem.emit(
                                enemy.position.x,
                                enemy.position.y,
                                30,
                                { speed: 120, spread: Math.PI * 2, lifetime: 1.0, color: '#ff0000', size: 5 }
                            );
                        }
                    }
                }
            });
        });
        
        this.enemies = this.enemies.filter(e => e.alive);
        this.projectiles = this.projectiles.filter(p => p.alive);
        
        this.particleSystem.update(dt);
        
        this.raycastEngine.castAllRays(this.player);
        
        if (this.player.health <= 0) {
            this.gameOver();
        }
        
        if (this.enemies.length === 0) {
            this.win();
        }
    }
    
    render() {
        if (this.loading) {
            const ctx = this.canvas.getContext('2d');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);
            
            const progress = this.assetManager.getProgress();
            const barWidth = 400;
            const barHeight = 30;
            const x = this.canvas.width / 2 - barWidth / 2;
            const y = this.canvas.height / 2 + 50;
            
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(x, y, barWidth, barHeight);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(x, y, barWidth * progress, barHeight);
            
            return;
        }
        
        this.renderer.render(
            this.player,
            this.raycastEngine,
            this.enemies,
            this.projectiles,
            this.particleSystem
        );
    }
    
    gameLoop(currentTime) {
        if (!this.running) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(Math.min(deltaTime, 0.1));
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    stop() {
        this.running = false;
    }
    
    gameOver() {
        this.stop();
        alert('Game Over! Score: ' + this.player.score);
        location.reload();
    }
    
    win() {
        this.stop();
        alert('Victory! Score: ' + this.player.score);
        location.reload();
    }
}

// Auto-start game
window.addEventListener('load', async () => {
    const game = new Game();
    window.gameInstance = game; // Make available globally
    await game.init();
    game.start();
});
