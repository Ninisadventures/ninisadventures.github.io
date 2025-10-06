/**
 * Bulletproof Configuration System
 * Auto-detects environment and configures services accordingly
 */

class GameConfig {
    constructor() {
        this.env = this.detectEnvironment();
        this.config = this.getConfig();
    }
    
    detectEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'local';
        } else if (hostname.includes('github.io')) {
            return 'github-pages';
        } else if (hostname.includes('netlify.app') || hostname.includes('vercel.app')) {
            return 'static-hosting';
        } else {
            return 'production';
        }
    }
    
    getConfig() {
        const configs = {
            'local': {
                TEXTURE_SERVICE_URL: 'http://localhost:8080',
                GAME_SERVER_URL: 'ws://localhost:3000',
                USE_BACKEND: true,
                MULTIPLAYER_ENABLED: true,
                FALLBACK_MODE: false
            },
            'github-pages': {
                TEXTURE_SERVICE_URL: null,
                GAME_SERVER_URL: null,
                USE_BACKEND: false,
                MULTIPLAYER_ENABLED: false,
                FALLBACK_MODE: true
            },
            'static-hosting': {
                TEXTURE_SERVICE_URL: null,
                GAME_SERVER_URL: null,
                USE_BACKEND: false,
                MULTIPLAYER_ENABLED: false,
                FALLBACK_MODE: true
            },
            'production': {
                // Configure these for your production deployment
                TEXTURE_SERVICE_URL: null,
                GAME_SERVER_URL: null,
                USE_BACKEND: false,
                MULTIPLAYER_ENABLED: false,
                FALLBACK_MODE: true
            }
        };
        
        return configs[this.env];
    }
    
    // Game configuration
    get CANVAS_WIDTH() { return 1280; }
    get CANVAS_HEIGHT() { return 720; }
    get TARGET_FPS() { return 60; }
    get TILE_SIZE() { return 64; }
    get MAP_ROWS() { return 15; }
    get MAP_COLS() { return 20; }
    get FOV_ANGLE() { return 60 * (Math.PI / 180); }
    get RENDER_DISTANCE() { return 1000; }
    get WALL_STRIP_WIDTH() { return 1; }
    get MINIMAP_SCALE() { return 0.15; }
    get PARTICLE_LIMIT() { return 1000; }
    get PLAYER_SPEED() { return 3.0; }
    get PLAYER_ROTATION_SPEED() { return 3 * (Math.PI / 180); }
    get PLAYER_RADIUS() { return 8; }
    get MAX_HEALTH() { return 100; }
    get MAX_AMMO() { return 100; }
    get PROJECTILE_SPEED() { return 8; }
    get PROJECTILE_DAMAGE() { return 25; }
    get ENEMY_CHASE_RANGE() { return 400; }
    get ENEMY_ATTACK_RANGE() { return 30; }
    get ENEMY_ATTACK_DAMAGE() { return 2; }
    get ENEMY_SPEED() { return 2.0; }
    get ENEMY_HEALTH() { return 100; }
    get MASTER_VOLUME() { return 0.7; }
    get SFX_VOLUME() { return 0.8; }
    get MUSIC_VOLUME() { return 0.5; }
}

// Global config instance
const CONFIG = new GameConfig().config;
const GAME_SETTINGS = new GameConfig();

// Make available globally
window.CONFIG = CONFIG;
window.GAME_SETTINGS = GAME_SETTINGS;
