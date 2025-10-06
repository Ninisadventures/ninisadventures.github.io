/**
 * Client-Side Texture Generator
 * Bulletproof fallback for static deployment
 * Generates all textures in JavaScript when backend unavailable
 */

class ClientTextureGenerator {
    constructor() {
        this.cache = new Map();
    }
    
    /**
     * Generate texture matching Python service API
     */
    async generate(config) {
        const cacheKey = JSON.stringify(config);
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const frames = [];
        for (let i = 0; i < (config.animation_frames || 1); i++) {
            const imageData = await this.generateFrame(config, i);
            frames.push(imageData);
        }
        
        const result = {
            diffuse: frames,
            metadata: {
                width: config.width,
                height: config.height,
                frames: config.animation_frames || 1,
                type: config.texture_type
            }
        };
        
        this.cache.set(cacheKey, result);
        return result;
    }
    
    async generateFrame(config, frameIndex) {
        const canvas = document.createElement('canvas');
        canvas.width = config.width;
        canvas.height = config.height;
        const ctx = canvas.getContext('2d');
        
        // Route to appropriate generator
        switch (config.texture_type) {
            case 'wall':
                this.generateWall(ctx, config, frameIndex);
                break;
            case 'sprite':
                this.generateSprite(ctx, config, frameIndex);
                break;
            case 'particle':
                this.generateParticle(ctx, config, frameIndex);
                break;
            case 'weapon':
                this.generateWeapon(ctx, config, frameIndex);
                break;
            case 'projectile':
                this.generateProjectile(ctx, config, frameIndex);
                break;
            case 'effect':
                this.generateEffect(ctx, config, frameIndex);
                break;
            case 'ui':
                this.generateUI(ctx, config, frameIndex);
                break;
            default:
                this.generateDefault(ctx, config, frameIndex);
        }
        
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    
    generateWall(ctx, config, frame) {
        const palette = this.getPalette(config.theme || 'banana');
        const w = config.width;
        const h = config.height;
        
        // Base color with noise
        const imgData = ctx.createImageData(w, h);
        const data = imgData.data;
        
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const noise = this.noise2D(x * 0.05, y * 0.05);
                const brightness = 0.7 + 0.3 * noise;
                
                data[idx] = palette.primary[0] * brightness;
                data[idx + 1] = palette.primary[1] * brightness;
                data[idx + 2] = palette.primary[2] * brightness;
                data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imgData, 0, 0);
        
        // Add detail
        ctx.fillStyle = `rgba(${palette.accent[0]}, ${palette.accent[1]}, ${palette.accent[2]}, 0.2)`;
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const size = 2 + Math.random() * 3;
            ctx.fillRect(x, y, size, size);
        }
    }
    
    generateSprite(ctx, config, frame) {
        const palette = this.getPalette(config.theme || 'banana');
        const w = config.width;
        const h = config.height;
        const cx = w / 2;
        const cy = h / 2;
        
        // Animation bounce
        const bounce = Math.sin(frame * 0.5) * 5;
        
        // Draw cat sprite
        ctx.fillStyle = `rgb(${palette.secondary[0]}, ${palette.secondary[1]}, ${palette.secondary[2]})`;
        
        // Body
        ctx.beginPath();
        ctx.arc(cx, cy + bounce, w / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - h / 6 + bounce, w / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.beginPath();
        ctx.moveTo(cx - w / 8, cy - h / 4 + bounce);
        ctx.lineTo(cx - w / 6, cy - h / 3 + bounce);
        ctx.lineTo(cx - w / 12, cy - h / 5 + bounce);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(cx + w / 8, cy - h / 4 + bounce);
        ctx.lineTo(cx + w / 6, cy - h / 3 + bounce);
        ctx.lineTo(cx + w / 12, cy - h / 5 + bounce);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(cx - w / 12, cy - h / 6 + bounce, w / 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + w / 12, cy - h / 6 + bounce, w / 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(cx - w / 12, cy - h / 6 + bounce, w / 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + w / 12, cy - h / 6 + bounce, w / 32, 0, Math.PI * 2);
        ctx.fill();
    }
    
    generateParticle(ctx, config, frame) {
        const palette = this.getPalette(config.theme || 'banana');
        const w = config.width;
        const h = config.height;
        const cx = w / 2;
        const cy = h / 2;
        
        const maxFrames = config.animation_frames || 1;
        const progress = frame / Math.max(1, maxFrames - 1);
        const radius = cx * (0.3 + 0.7 * progress);
        const alpha = 1 - progress;
        
        // Gradient circle
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, `rgba(${palette.accent[0]}, ${palette.accent[1]}, ${palette.accent[2]}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${palette.accent[0]}, ${palette.accent[1]}, ${palette.accent[2]}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }
    
    generateWeapon(ctx, config, frame) {
        const palette = this.getPalette(config.theme || 'banana');
        const w = config.width;
        const h = config.height;
        
        // Banana gun shape
        ctx.fillStyle = `rgb(${palette.primary[0]}, ${palette.primary[1]}, ${palette.primary[2]})`;
        ctx.strokeStyle = `rgb(${palette.accent[0]}, ${palette.accent[1]}, ${palette.accent[2]})`;
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.moveTo(w * 0.1, h * 0.5);
        ctx.quadraticCurveTo(w * 0.3, h * 0.2, w * 0.7, h * 0.4);
        ctx.quadraticCurveTo(w * 0.9, h * 0.45, w * 0.9, h * 0.6);
        ctx.quadraticCurveTo(w * 0.7, h * 0.6, w * 0.3, h * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Highlight
        ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
        ctx.beginPath();
        ctx.arc(w * 0.6, h * 0.45, w * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    generateProjectile(ctx, config, frame) {
        const palette = this.getPalette(config.theme || 'banana');
        const w = config.width;
        const h = config.height;
        const cx = w / 2;
        const cy = h / 2;
        
        // Glowing projectile
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
        gradient.addColorStop(0, `rgb(${palette.primary[0]}, ${palette.primary[1]}, ${palette.primary[2]})`);
        gradient.addColorStop(0.5, `rgba(${palette.primary[0]}, ${palette.primary[1]}, ${palette.primary[2]}, 0.5)`);
        gradient.addColorStop(1, `rgba(${palette.primary[0]}, ${palette.primary[1]}, ${palette.primary[2]}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }
    
    generateEffect(ctx, config, frame) {
        this.generateParticle(ctx, config, frame);
    }
    
    generateUI(ctx, config, frame) {
        const palette = this.getPalette(config.theme || 'banana');
        const w = config.width;
        const h = config.height;
        
        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);
        
        // Border
        ctx.strokeStyle = `rgb(${palette.accent[0]}, ${palette.accent[1]}, ${palette.accent[2]})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(3, 3, w - 6, h - 6);
    }
    
    generateDefault(ctx, config, frame) {
        // Checkerboard fallback
        const size = 16;
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(0, 0, config.width, config.height);
        ctx.fillStyle = '#000000';
        
        for (let y = 0; y < config.height; y += size) {
            for (let x = 0; x < config.width; x += size) {
                if ((x / size + y / size) % 2 === 0) {
                    ctx.fillRect(x, y, size, size);
                }
            }
        }
    }
    
    getPalette(theme) {
        const palettes = {
            banana: {
                primary: [241, 196, 15],
                secondary: [211, 84, 0],
                accent: [125, 102, 8],
                highlight: [249, 231, 159]
            },
            neon: {
                primary: [255, 0, 255],
                secondary: [0, 255, 255],
                accent: [255, 255, 0],
                highlight: [255, 255, 255]
            },
            cyberpunk: {
                primary: [0, 255, 255],
                secondary: [255, 0, 128],
                accent: [255, 255, 0],
                highlight: [128, 0, 255]
            }
        };
        
        return palettes[theme] || palettes.banana;
    }
    
    // Simple 2D noise function
    noise2D(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }
}

// Export for use
window.ClientTextureGenerator = ClientTextureGenerator;
