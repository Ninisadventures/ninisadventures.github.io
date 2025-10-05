/**
 * AAA Multiplayer Game Server
 * Professional WebSocket server with authoritative game logic
 */

const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    PORT: 3000,
    TICK_RATE: 20, // Server updates per second
    MAX_PLAYERS: 16,
    PLAYER_TIMEOUT: 30000, // 30 seconds
    ENABLE_VALIDATION: true,
    ENABLE_LAG_COMPENSATION: true,
    ENABLE_LOGGING: true
};

// ============================================================================
// UTILITY CLASSES
// ============================================================================

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    distance(v) {
        return Math.sqrt((v.x - this.x) ** 2 + (v.y - this.y) ** 2);
    }
    
    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }
    
    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }
}

class Logger {
    static log(level, message, data = {}) {
        if (!CONFIG.ENABLE_LOGGING) return;
        
        const timestamp = new Date().toISOString();
        console.log(JSON.stringify({
            timestamp,
            level,
            message,
            data
        }));
    }
    
    static info(message, data) { this.log('INFO', message, data); }
    static warn(message, data) { this.log('WARN', message, data); }
    static error(message, data) { this.log('ERROR', message, data); }
}

// ============================================================================
// GAME STATE
// ============================================================================

class PlayerState {
    constructor(id, connection) {
        this.id = id;
        this.connection = connection;
        this.position = new Vector2(300 + Math.random() * 400, 300 + Math.random() * 400);
        this.rotation = Math.random() * Math.PI * 2;
        this.health = 100;
        this.maxHealth = 100;
        this.ammo = 100;
        this.score = 0;
        this.alive = true;
        this.lastUpdate = Date.now();
        this.inputSequence = 0;
    }
    
    update(data) {
        // Validate input
        if (!this._validateUpdate(data)) {
            Logger.warn('Invalid player update', { playerId: this.id });
            return false;
        }
        
        this.position.x = data.x;
        this.position.y = data.y;
        this.rotation = data.rotation;
        this.health = Math.max(0, Math.min(this.maxHealth, data.health));
        this.ammo = Math.max(0, data.ammo);
        this.score = data.score;
        this.lastUpdate = Date.now();
        this.inputSequence = data.inputSequence || this.inputSequence + 1;
        
        return true;
    }
    
    _validateUpdate(data) {
        if (!CONFIG.ENABLE_VALIDATION) return true;
        
        // Position bounds
        if (data.x < 0 || data.x > 1280 || data.y < 0 || data.y > 960) {
            return false;
        }
        
        // Speed check (anti-cheat)
        const maxSpeed = 10; // Max units per frame
        if (this.position) {
            const distance = new Vector2(data.x, data.y).distance(this.position);
            if (distance > maxSpeed) {
                Logger.warn('Speed check failed', {
                    playerId: this.id,
                    distance,
                    maxSpeed
                });
                return false;
            }
        }
        
        return true;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }
    }
    
    respawn() {
        this.position = new Vector2(300 + Math.random() * 400, 300 + Math.random() * 400);
        this.rotation = Math.random() * Math.PI * 2;
        this.health = this.maxHealth;
        this.alive = true;
    }
    
    serialize() {
        return {
            id: this.id,
            x: this.position.x,
            y: this.position.y,
            rotation: this.rotation,
            health: this.health,
            maxHealth: this.maxHealth,
            ammo: this.ammo,
            score: this.score,
            alive: this.alive
        };
    }
}

class ProjectileState {
    constructor(id, ownerId, x, y, rotation) {
        this.id = id;
        this.ownerId = ownerId;
        this.position = new Vector2(x, y);
        this.rotation = rotation;
        this.velocity = new Vector2(
            Math.cos(rotation) * 8,
            Math.sin(rotation) * 8
        );
        this.damage = 25;
        this.alive = true;
        this.lifetime = 5.0;
        this.createdAt = Date.now();
    }
    
    update(dt) {
        this.position = this.position.add(this.velocity.multiply(dt));
        this.lifetime -= dt;
        
        if (this.lifetime <= 0) {
            this.alive = false;
        }
    }
    
    serialize() {
        return {
            id: this.id,
            ownerId: this.ownerId,
            x: this.position.x,
            y: this.position.y,
            rotation: this.rotation
        };
    }
}

class GameState {
    constructor() {
        this.players = new Map();
        this.projectiles = new Map();
        this.nextProjectileId = 0;
    }
    
    addPlayer(id, connection) {
        const player = new PlayerState(id, connection);
        this.players.set(id, player);
        Logger.info('Player joined', { playerId: id, playerCount: this.players.size });
        return player;
    }
    
    removePlayer(id) {
        this.players.delete(id);
        Logger.info('Player left', { playerId: id, playerCount: this.players.size });
    }
    
    addProjectile(ownerId, x, y, rotation) {
        const id = `proj_${this.nextProjectileId++}`;
        const projectile = new ProjectileState(id, ownerId, x, y, rotation);
        this.projectiles.set(id, projectile);
        return projectile;
    }
    
    update(dt) {
        // Update projectiles
        for (const [id, projectile] of this.projectiles) {
            projectile.update(dt);
            
            if (!projectile.alive) {
                this.projectiles.delete(id);
                continue;
            }
            
            // Check collisions with players
            for (const [playerId, player] of this.players) {
                if (playerId === projectile.ownerId || !player.alive) continue;
                
                const distance = projectile.position.distance(player.position);
                if (distance < 20) {
                    player.takeDamage(projectile.damage);
                    projectile.alive = false;
                    this.projectiles.delete(id);
                    
                    // Award score to shooter
                    const shooter = this.players.get(projectile.ownerId);
                    if (shooter && !player.alive) {
                        shooter.score += 100;
                    }
                    
                    break;
                }
            }
        }
        
        // Check for timed-out players
        const now = Date.now();
        for (const [id, player] of this.players) {
            if (now - player.lastUpdate > CONFIG.PLAYER_TIMEOUT) {
                Logger.warn('Player timeout', { playerId: id });
                this.removePlayer(id);
            }
        }
    }
    
    serialize() {
        return {
            players: Array.from(this.players.values()).map(p => p.serialize()),
            projectiles: Array.from(this.projectiles.values()).map(p => p.serialize())
        };
    }
}

// ============================================================================
// SERVER
// ============================================================================

class GameServer {
    constructor() {
        this.gameState = new GameState();
        this.wss = null;
        this.tickInterval = null;
        this.lastTickTime = Date.now();
    }
    
    start() {
        // Create WebSocket server
        this.wss = new WebSocket.Server({ port: CONFIG.PORT });
        
        this.wss.on('connection', (ws) => {
            this._handleConnection(ws);
        });
        
        // Start game loop
        this.tickInterval = setInterval(() => {
            this._tick();
        }, 1000 / CONFIG.TICK_RATE);
        
        Logger.info('Server started', { port: CONFIG.PORT, tickRate: CONFIG.TICK_RATE });
    }
    
    stop() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
        }
        
        if (this.wss) {
            this.wss.close();
        }
        
        Logger.info('Server stopped');
    }
    
    _handleConnection(ws) {
        // Check player limit
        if (this.gameState.players.size >= CONFIG.MAX_PLAYERS) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Server full'
            }));
            ws.close();
            return;
        }
        
        // Generate unique ID
        const playerId = crypto.randomBytes(8).toString('hex');
        const player = this.gameState.addPlayer(playerId, ws);
        
        // Send initialization
        ws.send(JSON.stringify({
            type: 'init',
            playerId: playerId,
            player: player.serialize()
        }));
        
        // Send current game state
        this._broadcastState();
        
        // Handle messages
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                this._handleMessage(playerId, data);
            } catch (error) {
                Logger.error('Message parse error', { playerId, error: error.message });
            }
        });
        
        // Handle disconnect
        ws.on('close', () => {
            this.gameState.removePlayer(playerId);
            this._broadcastState();
        });
        
        ws.on('error', (error) => {
            Logger.error('WebSocket error', { playerId, error: error.message });
        });
    }
    
    _handleMessage(playerId, data) {
        const player = this.gameState.players.get(playerId);
        if (!player) return;
        
        switch (data.type) {
            case 'update':
                player.update(data);
                break;
                
            case 'shoot':
                if (player.ammo > 0) {
                    this.gameState.addProjectile(
                        playerId,
                        data.x,
                        data.y,
                        data.rotation
                    );
                    player.ammo--;
                }
                break;
                
            case 'respawn':
                if (!player.alive) {
                    player.respawn();
                }
                break;
                
            case 'chat':
                this._broadcastMessage({
                    type: 'chat',
                    playerId: playerId,
                    message: data.message
                });
                break;
                
            default:
                Logger.warn('Unknown message type', { playerId, type: data.type });
        }
    }
    
    _tick() {
        const now = Date.now();
        const dt = (now - this.lastTickTime) / 1000;
        this.lastTickTime = now;
        
        // Update game state
        this.gameState.update(dt);
        
        // Broadcast to all clients
        this._broadcastState();
    }
    
    _broadcastState() {
        const state = {
            type: 'state',
            ...this.gameState.serialize(),
            timestamp: Date.now()
        };
        
        const message = JSON.stringify(state);
        
        for (const player of this.gameState.players.values()) {
            if (player.connection.readyState === WebSocket.OPEN) {
                player.connection.send(message);
            }
        }
    }
    
    _broadcastMessage(message) {
        const messageStr = JSON.stringify(message);
        
        for (const player of this.gameState.players.values()) {
            if (player.connection.readyState === WebSocket.OPEN) {
                player.connection.send(messageStr);
            }
        }
    }
}

// ============================================================================
// HEALTH CHECK HTTP SERVER
// ============================================================================

class HealthServer {
    constructor(gameServer) {
        this.gameServer = gameServer;
        this.server = null;
    }
    
    start(port = 3001) {
        this.server = http.createServer((req, res) => {
            if (req.url === '/health') {
                const health = {
                    status: 'healthy',
                    players: this.gameServer.gameState.players.size,
                    projectiles: this.gameServer.gameState.projectiles.size,
                    uptime: process.uptime()
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(health));
            } else if (req.url === '/metrics') {
                const metrics = {
                    players: this.gameServer.gameState.players.size,
                    projectiles: this.gameServer.gameState.projectiles.size,
                    uptime: process.uptime(),
                    memory: process.memoryUsage()
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(metrics));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        this.server.listen(port, () => {
            Logger.info('Health server started', { port });
        });
    }
    
    stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

function main() {
    console.log('='.repeat(60));
    console.log('  Nini\'s Adventures: Kitties Mayhem - Game Server');
    console.log('  AAA Edition - Professional Multiplayer Server');
    console.log('='.repeat(60));
    console.log('');
    
    // Start game server
    const gameServer = new GameServer();
    gameServer.start();
    
    // Start health check server
    const healthServer = new HealthServer(gameServer);
    healthServer.start(3001);
    
    console.log('');
    console.log('Server Information:');
    console.log(`  WebSocket: ws://localhost:${CONFIG.PORT}`);
    console.log(`  Health Check: http://localhost:3001/health`);
    console.log(`  Metrics: http://localhost:3001/metrics`);
    console.log(`  Max Players: ${CONFIG.MAX_PLAYERS}`);
    console.log(`  Tick Rate: ${CONFIG.TICK_RATE} Hz`);
    console.log('');
    console.log('Server is running. Press Ctrl+C to stop.');
    console.log('');
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down gracefully...');
        gameServer.stop();
        healthServer.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\nShutting down gracefully...');
        gameServer.stop();
        healthServer.stop();
        process.exit(0);
    });
}

// Run server
if (require.main === module) {
    main();
}

module.exports = { GameServer, HealthServer };
