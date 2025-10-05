/**
 * Nini's Adventures: Kitties Mayhem - AAA Edition
 * Professional-grade 2.5D FPS with advanced rendering and networking
 */

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const CONFIG = {
    // Display
    CANVAS_WIDTH: 1280,
    CANVAS_HEIGHT: 720,
    TARGET_FPS: 60,
    
    // World
    TILE_SIZE: 64,
    MAP_ROWS: 15,
    MAP_COLS: 20,
    
    // Rendering
    FOV_ANGLE: 60 * (Math.PI / 180),
    RENDER_DISTANCE: 1000,
    WALL_STRIP_WIDTH: 1,
    MINIMAP_SCALE: 0.15,
    SHADOW_QUALITY: 'high',
    LIGHTING_ENABLED: true,
    PARTICLE_LIMIT: 1000,
    
    // Gameplay
    PLAYER_SPEED: 3.0,
    PLAYER_ROTATION_SPEED: 3 * (Math.PI / 180),
    PLAYER_RADIUS: 8,
    MAX_HEALTH: 100,
    MAX_AMMO: 100,
    PROJECTILE_SPEED: 8,
    PROJECTILE_DAMAGE: 25,
    
    // AI
    ENEMY_CHASE_RANGE: 400,
    ENEMY_ATTACK_RANGE: 30,
    ENEMY_ATTACK_DAMAGE: 2,
    ENEMY_SPEED: 2.0,
    ENEMY_HEALTH: 100,
    
    // Network
    SERVER_URL: 'ws://localhost:3000',
    TEXTURE_SERVICE_URL: 'http://localhost:8080',
    NETWORK_TICK_RATE: 20, // Updates per second
    
    // Audio
    MASTER_VOLUME: 0.7,
    SFX_VOLUME: 0.8,
    MUSIC_VOLUME: 0.5
};

// ============================================================================
// UTILITY CLASSES
// ============================================================================

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
    subtract(v) { return new Vector2(this.x - v.x, this.y - v.y); }
    multiply(scalar) { return new Vector2(this.x * scalar, this.y * scalar); }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() {
        const len = this.length();
        return len > 0 ? new Vector2(this.x / len, this.y / len) : new Vector2();
    }
    dot(v) { return this.x * v.x + this.y * v.y; }
    distance(v) { return this.subtract(v).length(); }
    angle() { return Math.atan2(this.y, this.x); }
    
    static fromAngle(angle, length = 1) {
        return new Vector2(Math.cos(angle) * length, Math.sin(angle) * length);
    }
}

class AABB {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    intersects(other) {
        return !(other.x > this.x + this.width ||
                other.x + other.width < this.x ||
                other.y > this.y + this.height ||
                other.y + other.height < this.y);
    }
    
    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
}

// ============================================================================
// ASSET MANAGER
// ============================================================================

class AssetManager {
    constructor() {
        this.textures = new Map();
        this.sounds = new Map();
        this.loading = new Set();
        this.loaded = 0;
        this.total = 0;
        this.textureServiceUrl = CONFIG.TEXTURE_SERVICE_URL;
    }
    
    async loadTextureFromService(name, config) {
        if (this.textures.has(name)) {
            return this.textures.get(name);
        }
        
        if (this.loading.has(name)) {
            // Wait for ongoing load
            while (this.loading.has(name)) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.textures.get(name);
        }
        
        this.loading.add(name);
        this.total++;
        
        try {
            const response = await fetch(`${this.textureServiceUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) {
                throw new Error(`Texture service error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Convert base64 to ImageData
            const textures = await Promise.all(
                data.diffuse.map(base64 => this._base64ToImageData(base64))
            );
            
            const asset = {
                frames: textures,
                normalMap: data.normal ? await Promise.all(
                    data.normal.map(b64 => this._base64ToImageData(b64))
                ) : null,
                specularMap: data.specular ? await Promise.all(
                    data.specular.map(b64 => this._base64ToImageData(b64))
                ) : null,
                metadata: data.metadata
            };
            
            this.textures.set(name, asset);
            this.loaded++;
            
            return asset;
            
        } catch (error) {
            console.error(`Failed to load texture ${name}:`, error);
            // Return fallback texture
            return this._createFallbackTexture();
        } finally {
            this.loading.delete(name);
        }
    }
    
    async _base64ToImageData(base64) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(ctx.getImageData(0, 0, img.width, img.height));
            };
            img.onerror = reject;
            img.src = 'data:image/png;base64,' + base64;
        });
    }
    
    _createFallbackTexture() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Checkerboard pattern
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, size / 2, size / 2);
        ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
        
        return {
            frames: [ctx.getImageData(0, 0, size, size)],
            normalMap: null,
            specularMap: null,
            metadata: { width: size, height: size, frames: 1 }
        };
    }
    
    getTexture(name) {
        return this.textures.get(name);
    }
    
    getProgress() {
        return this.total > 0 ? this.loaded / this.total : 1;
    }
    
    async preloadAssets() {
        const assets = [
            // Walls
            { name: 'wall_banana', config: {
                texture_type: 'wall',
                width: 256,
                height: 256,
                quality: 'HIGH',
                theme: 'banana',
                enable_normal_map: true,
                enable_specular: true
            }},
            
            // Characters
            { name: 'kitty', config: {
                texture_type: 'sprite',
                width: 128,
                height: 128,
                quality: 'HIGH',
                theme: 'banana',
                animation_frames: 4
            }},
            
            // Weapons
            { name: 'banana_gun', config: {
                texture_type: 'weapon',
                width: 256,
                height: 128,
                quality: 'HIGH',
                theme: 'banana'
            }},
            
            // Projectiles
            { name: 'banana_projectile', config: {
                texture_type: 'projectile',
                width: 64,
                height: 64,
                quality: 'MEDIUM',
                theme: 'banana'
            }},
            
            // Effects
            { name: 'explosion', config: {
                texture_type: 'effect',
                width: 128,
                height: 128,
                quality: 'HIGH',
                theme: 'banana',
                animation_frames: 6
            }},
            
            { name: 'muzzle_flash', config: {
                texture_type: 'particle',
                width: 64,
                height: 64,
                quality: 'MEDIUM',
                theme: 'banana',
                animation_frames: 3
            }},
            
            // Pickups
            { name: 'health_pickup', config: {
                texture_type: 'sprite',
                width: 64,
                height: 64,
                quality: 'MEDIUM',
                theme: 'banana'
            }},
            
            { name: 'ammo_pickup', config: {
                texture_type: 'sprite',
                width: 64,
                height: 64,
                quality: 'MEDIUM',
                theme: 'banana'
            }},
            
            // UI
            { name: 'ui_panel', config: {
                texture_type: 'ui',
                width: 256,
                height: 64,
                quality: 'MEDIUM',
                theme: 'banana'
            }}
        ];
        
        console.log('Preloading assets from texture service...');
        await Promise.all(
            assets.map(asset => this.loadTextureFromService(asset.name, asset.config))
        );
        console.log('All assets loaded!');
    }
}

// ============================================================================
// AUDIO SYSTEM
// ============================================================================

class AudioSystem {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        this.masterGain.gain.value = CONFIG.MASTER_VOLUME;
        
        this.sounds = new Map();
        this.music = null;
    }
    
    async init() {
        // Generate procedural sounds
        this.sounds.set('shoot', this._generateShootSound());
        this.sounds.set('hit', this._generateHitSound());
        this.sounds.set('explosion', this._generateExplosionSound());
        this.sounds.set('pickup', this._generatePickupSound());
        this.sounds.set('hurt', this._generateHurtSound());
        this.sounds.set('meow', this._generateMeowSound());
    }
    
    _generateShootSound() {
        const duration = 0.15;
        const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / this.context.sampleRate;
            const envelope = Math.exp(-t * 10);
            data[i] = envelope * (Math.random() * 2 - 1) * 0.3;
        }
        
        return buffer;
    }
    
    _generateHitSound() {
        const duration = 0.1;
        const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / this.context.sampleRate;
            const envelope = Math.exp(-t * 20);
            data[i] = envelope * Math.sin(t * 1000) * 0.5;
        }
        
        return buffer;
    }
    
    _generateExplosionSound() {
        const duration = 0.5;
        const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / this.context.sampleRate;
            const envelope = Math.exp(-t * 3);
            data[i] = envelope * (Math.random() * 2 - 1) * 0.7;
        }
        
        return buffer;
    }
    
    _generatePickupSound() {
        const duration = 0.2;
        const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / this.context.sampleRate;
            const freq = 440 + t * 880;
            const envelope = Math.exp(-t * 8);
            data[i] = envelope * Math.sin(2 * Math.PI * freq * t) * 0.3;
        }
        
        return buffer;
    }
    
    _generateHurtSound() {
        const duration = 0.3;
        const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / this.context.sampleRate;
            const freq = 200 - t * 150;
            const envelope = Math.exp(-t * 5);
            data[i] = envelope * Math.sin(2 * Math.PI * freq * t) * 0.4;
        }
        
        return buffer;
    }
    
    _generateMeowSound() {
        const duration = 0.4;
        const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / this.context.sampleRate;
            const freq = 600 + Math.sin(t * 10) * 200;
            const envelope = Math.exp(-t * 4);
            data[i] = envelope * Math.sin(2 * Math.PI * freq * t) * 0.3;
        }
        
        return buffer;
    }
    
    play(soundName, volume = 1.0) {
        const buffer = this.sounds.get(soundName);
        if (!buffer) return;
        
        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        gainNode.gain.value = volume * CONFIG.SFX_VOLUME;
        
        source.start(0);
    }
    
    play3D(soundName, listenerPos, sourcePos, volume = 1.0) {
        const distance = listenerPos.distance(sourcePos);
        const maxDistance = 500;
        const attenuation = Math.max(0, 1 - distance / maxDistance);
        
        this.play(soundName, volume * attenuation);
    }
}

// ============================================================================
// PARTICLE SYSTEM
// ============================================================================

class Particle {
    constructor(x, y, velocity, lifetime, color, size) {
        this.position = new Vector2(x, y);
        this.velocity = velocity;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.color = color;
        this.size = size;
        this.alpha = 1.0;
    }
    
    update(dt) {
        this.position = this.position.add(this.velocity.multiply(dt));
        this.velocity = this.velocity.multiply(0.95); // Damping
        this.lifetime -= dt;
        this.alpha = this.lifetime / this.maxLifetime;
        return this.lifetime > 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    emit(x, y, count, config = {}) {
        const {
            speed = 100,
            spread = Math.PI * 2,
            lifetime = 1.0,
            color = '#ffcc00',
            size = 3
        } = config;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.random() - 0.5) * spread;
            const velocity = Vector2.fromAngle(angle, speed * (0.5 + Math.random() * 0.5));
            
            this.particles.push(new Particle(
                x, y, velocity,
                lifetime * (0.5 + Math.random() * 0.5),
                color,
                size * (0.5 + Math.random() * 0.5)
            ));
        }
        
        // Limit particle count
        if (this.particles.length > CONFIG.PARTICLE_LIMIT) {
            this.particles = this.particles.slice(-CONFIG.PARTICLE_LIMIT);
        }
    }
    
    update(dt) {
        this.particles = this.particles.filter(p => p.update(dt));
    }
    
    render(ctx, camera) {
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            
            // Convert to screen space
            const screenX = particle.position.x - camera.x;
            const screenY = particle.position.y - camera.y;
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}

// ============================================================================
// GAME ENTITIES
// ============================================================================

class Entity {
    constructor(x, y) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2();
        this.rotation = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.alive = true;
        this.radius = 10;
    }
    
    update(dt) {}
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        this.radius = CONFIG.PLAYER_RADIUS;
        this.maxHealth = CONFIG.MAX_HEALTH;
        this.health = this.maxHealth;
        this.ammo = CONFIG.MAX_AMMO;
        this.score = 0;
        this.turnDirection = 0;
        this.walkDirection = 0;
        this.shootCooldown = 0;
    }
    
    update(dt, input, world) {
        // Movement
        this.turnDirection = (input.left ? -1 : 0) + (input.right ? 1 : 0);
        this.walkDirection = (input.up ? 1 : 0) + (input.down ? -1 : 0);
        
        this.rotation += this.turnDirection * CONFIG.PLAYER_ROTATION_SPEED;
        
        const moveStep = this.walkDirection * CONFIG.PLAYER_SPEED;
        const newPos = this.position.add(
            Vector2.fromAngle(this.rotation, moveStep)
        );
        
        if (!world.isWallAt(newPos.x, newPos.y)) {
            this.position = newPos;
        }
        
        // Shooting
        if (this.shootCooldown > 0) {
            this.shootCooldown -= dt;
        }
    }
    
    canShoot() {
        return this.shootCooldown <= 0 && this.ammo > 0;
    }
    
    shoot() {
        if (this.canShoot()) {
            this.ammo--;
            this.shootCooldown = 0.25; // 4 shots per second
            return true;
        }
        return false;
    }
}

class Enemy extends Entity {
    constructor(x, y) {
        super(x, y);
        this.maxHealth = CONFIG.ENEMY_HEALTH;
        this.health = this.maxHealth;
        this.state = 'idle';
        this.target = null;
        this.attackCooldown = 0;
        this.animationFrame = 0;
        this.animationTime = 0;
    }
    
    update(dt, player, world) {
        const distToPlayer = this.position.distance(player.position);
        
        // State machine
        if (distToPlayer < CONFIG.ENEMY_ATTACK_RANGE) {
            this.state = 'attack';
            if (this.attackCooldown <= 0) {
                player.takeDamage(CONFIG.ENEMY_ATTACK_DAMAGE);
                this.attackCooldown = 1.0;
            }
        } else if (distToPlayer < CONFIG.ENEMY_CHASE_RANGE) {
            this.state = 'chase';
            const direction = player.position.subtract(this.position).normalize();
            const newPos = this.position.add(direction.multiply(CONFIG.ENEMY_SPEED));
            
            if (!world.isWallAt(newPos.x, newPos.y)) {
                this.position = newPos;
            }
        } else {
            this.state = 'idle';
        }
        
        // Update cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }
        
        // Animation
        this.animationTime += dt;
        if (this.animationTime > 0.2) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTime = 0;
        }
    }
}

class Projectile extends Entity {
    constructor(x, y, rotation, owner) {
        super(x, y);
        this.rotation = rotation;
        this.velocity = Vector2.fromAngle(rotation, CONFIG.PROJECTILE_SPEED);
        this.owner = owner;
        this.damage = CONFIG.PROJECTILE_DAMAGE;
        this.radius = 4;
        this.lifetime = 5.0;
    }
    
    update(dt, world) {
        this.position = this.position.add(this.velocity.multiply(dt * 60));
        this.lifetime -= dt;
        
        if (this.lifetime <= 0 || world.isWallAt(this.position.x, this.position.y)) {
            this.alive = false;
        }
    }
}

// Continued in next file...
