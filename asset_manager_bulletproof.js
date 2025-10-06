/**
 * Bulletproof Asset Manager
 * Automatically detects and uses best available texture source
 */

class BulletproofAssetManager {
    constructor() {
        this.textures = new Map();
        this.sounds = new Map();
        this.loading = new Set();
        this.loaded = 0;
        this.total = 0;
        
        // Detect texture service availability
        this.backendAvailable = false;
        this.textureServiceUrl = CONFIG.TEXTURE_SERVICE_URL;
        this.useBackend = CONFIG.USE_BACKEND;
        
        // Initialize client-side generator as fallback
        this.clientGenerator = new ClientTextureGenerator();
        
        this.checkBackendAvailability();
    }
    
    async checkBackendAvailability() {
        if (!this.textureServiceUrl || !this.useBackend) {
            console.log('🎨 Using client-side texture generation (static mode)');
            this.backendAvailable = false;
            return;
        }
        
        try {
            const response = await fetch(`${this.textureServiceUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000) // 2 second timeout
            });
            
            if (response.ok) {
                console.log('✅ Backend texture service available');
                this.backendAvailable = true;
            } else {
                console.log('⚠️ Backend texture service not healthy, using fallback');
                this.backendAvailable = false;
            }
        } catch (error) {
            console.log('ℹ️ Backend texture service not available, using client-side generation');
            this.backendAvailable = false;
        }
    }
    
    async loadTextureFromService(name, config) {
        if (this.textures.has(name)) {
            return this.textures.get(name);
        }
        
        if (this.loading.has(name)) {
            while (this.loading.has(name)) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.textures.get(name);
        }
        
        this.loading.add(name);
        this.total++;
        
        try {
            let result;
            
            if (this.backendAvailable) {
                // Try backend first
                try {
                    result = await this._loadFromBackend(config);
                    console.log(`✅ Loaded ${name} from backend`);
                } catch (backendError) {
                    console.warn(`⚠️ Backend failed for ${name}, using fallback:`, backendError.message);
                    result = await this._loadFromClient(config);
                }
            } else {
                // Use client-side generation
                result = await this._loadFromClient(config);
                console.log(`🎨 Generated ${name} client-side`);
            }
            
            const asset = {
                frames: result.diffuse,
                normalMap: result.normal || null,
                specularMap: result.specular || null,
                metadata: result.metadata
            };
            
            this.textures.set(name, asset);
            this.loaded++;
            
            return asset;
            
        } catch (error) {
            console.error(`❌ Failed to load texture ${name}:`, error);
            // Return emergency fallback
            return this._createEmergencyFallback();
        } finally {
            this.loading.delete(name);
        }
    }
    
    async _loadFromBackend(config) {
        const response = await fetch(`${this.textureServiceUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!response.ok) {
            throw new Error(`Backend responded with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Convert base64 to ImageData
        const diffuse = await Promise.all(
            data.diffuse.map(base64 => this._base64ToImageData(base64))
        );
        
        return {
            diffuse,
            normal: data.normal ? await Promise.all(
                data.normal.map(b64 => this._base64ToImageData(b64))
            ) : null,
            specular: data.specular ? await Promise.all(
                data.specular.map(b64 => this._base64ToImageData(b64))
            ) : null,
            metadata: data.metadata
        };
    }
    
    async _loadFromClient(config) {
        const result = await this.clientGenerator.generate(config);
        
        return {
            diffuse: result.diffuse,
            normal: null,
            specular: null,
            metadata: result.metadata
        };
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
    
    _createEmergencyFallback() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Bright checkerboard so it's obvious
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#000000';
        for (let y = 0; y < size; y += 8) {
            for (let x = 0; x < size; x += 8) {
                if ((x / 8 + y / 8) % 2 === 0) {
                    ctx.fillRect(x, y, 8, 8);
                }
            }
        }
        
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
            { name: 'wall_banana', config: {
                texture_type: 'wall',
                width: 256,
                height: 256,
                quality: 'HIGH',
                theme: 'banana',
                enable_normal_map: false,
                enable_specular: false
            }},
            { name: 'kitty', config: {
                texture_type: 'sprite',
                width: 128,
                height: 128,
                quality: 'HIGH',
                theme: 'banana',
                animation_frames: 4
            }},
            { name: 'banana_gun', config: {
                texture_type: 'weapon',
                width: 256,
                height: 128,
                quality: 'HIGH',
                theme: 'banana'
            }},
            { name: 'banana_projectile', config: {
                texture_type: 'projectile',
                width: 64,
                height: 64,
                quality: 'MEDIUM',
                theme: 'banana'
            }},
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
            { name: 'ui_panel', config: {
                texture_type: 'ui',
                width: 256,
                height: 64,
                quality: 'MEDIUM',
                theme: 'banana'
            }}
        ];
        
        console.log('🎨 Preloading assets...');
        await Promise.all(
            assets.map(asset => this.loadTextureFromService(asset.name, asset.config))
        );
        console.log('✅ All assets loaded!');
    }
}

// Export
window.BulletproofAssetManager = BulletproofAssetManager;
