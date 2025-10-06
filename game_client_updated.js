/**
 * Nini's Adventures: Kitties Mayhem - AAA Edition
 * BULLETPROOF VERSION - Works anywhere!
 * Uses BulletproofAssetManager instead of AssetManager
 */

// Note: CONFIG is loaded from config.js
// Note: BulletproofAssetManager is loaded from asset_manager_bulletproof.js

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
// AUDIO SYSTEM
// ============================================================================

class AudioSystem {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.initialized = false;
        this.sounds = new Map();
    }
    
    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = GAME_SETTINGS.MASTER_VOLUME;
            
            // Generate procedural sounds
            this.sounds.set('shoot', this._generateShootSound());
            this.sounds.set('hit', this._generateHitSound());
            this.sounds.set('explosion', this._generateExplosionSound());
            this.sounds.set('pickup', this._generatePickupSound());
            this.sounds.set('hurt', this._generateHurtSound());
            this.sounds.set('meow', this._generateMeowSound());
            
            this.initialized = true;
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.initialized = false;
        }
    }
    
    _generateShootSound() {
        if (!this.context) return null;
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
        if (!this.context) return null;
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
        if (!this.context) return null;
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
        if (!this.context) return null;
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
        if (!this.context) return null;
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
        if (!this.context) return null;
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
        if (!this.initialized || !this.context) return;
        
        const buffer = this.sounds.get(soundName);
        if (!buffer) return;
        
        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        gainNode.gain.value = volume * GAME_SETTINGS.SFX_VOLUME;
        
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
        this.velocity = this.velocity.multiply(0.95);
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
        
        if (this.particles.length > GAME_SETTINGS.PARTICLE_LIMIT) {
            this.particles = this.particles.slice(-GAME_SETTINGS.PARTICLE_LIMIT);
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
        this.radius = GAME_SETTINGS.PLAYER_RADIUS;
        this.maxHealth = GAME_SETTINGS.MAX_HEALTH;
        this.health = this.maxHealth;
        this.ammo = GAME_SETTINGS.MAX_AMMO;
        this.score = 0;
        this.turnDirection = 0;
        this.walkDirection = 0;
        this.shootCooldown = 0;
    }
    
    update(dt, input, world) {
        this.turnDirection = (input.left ? -1 : 0) + (input.right ? 1 : 0);
        this.walkDirection = (input.up ? 1 : 0) + (input.down ? -1 : 0);
        
        this.rotation += this.turnDirection * GAME_SETTINGS.PLAYER_ROTATION_SPEED;
        
        const moveStep = this.walkDirection * GAME_SETTINGS.PLAYER_SPEED;
        const newPos = this.position.add(
            Vector2.fromAngle(this.rotation, moveStep)
        );
        
        if (!world.isWallAt(newPos.x, newPos.y)) {
            this.position = newPos;
        }
        
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
            this.shootCooldown = 0.25;
            return true;
        }
        return false;
    }
}

class Enemy extends Entity {
    constructor(x, y) {
        super(x, y);
        this.maxHealth = GAME_SETTINGS.ENEMY_HEALTH;
        this.health = this.maxHealth;
        this.state = 'idle';
        this.target = null;
        this.attackCooldown = 0;
        this.animationFrame = 0;
        this.animationTime = 0;
    }
    
    update(dt, player, world) {
        const distToPlayer = this.position.distance(player.position);
        
        if (distToPlayer < GAME_SETTINGS.ENEMY_ATTACK_RANGE) {
            this.state = 'attack';
            if (this.attackCooldown <= 0) {
                player.takeDamage(GAME_SETTINGS.ENEMY_ATTACK_DAMAGE);
                this.attackCooldown = 1.0;
            }
        } else if (distToPlayer < GAME_SETTINGS.ENEMY_CHASE_RANGE) {
            this.state = 'chase';
            const direction = player.position.subtract(this.position).normalize();
            const newPos = this.position.add(direction.multiply(GAME_SETTINGS.ENEMY_SPEED));
            
            if (!world.isWallAt(newPos.x, newPos.y)) {
                this.position = newPos;
            }
        } else {
            this.state = 'idle';
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }
        
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
        this.velocity = Vector2.fromAngle(rotation, GAME_SETTINGS.PROJECTILE_SPEED);
        this.owner = owner;
        this.damage = GAME_SETTINGS.PROJECTILE_DAMAGE;
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

// Export for use in part 2
window.Vector2 = Vector2;
window.AABB = AABB;
window.AudioSystem = AudioSystem;
window.ParticleSystem = ParticleSystem;
window.Entity = Entity;
window.Player = Player;
window.Enemy = Enemy;
window.Projectile = Projectile;
