export class SpriteAtlas {
    constructor() {
        this.sprites = new Map();
        this.spritesToLoad = {
            'enemy': 'assets/sprites/enemy.png',
            'item': 'assets/sprites/item.png',
        };
    }

    async loadSprites() {
        console.log('Loading sprites...');
        const promises = [];

        for (const [name, url] of Object.entries(this.spritesToLoad)) {
            const promise = new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.sprites.set(name, img);
                    console.log(`Sprite '${name}' loaded from ${url}`);
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load sprite: ${url}. Creating a placeholder.`);
                    // To prevent total failure, we create a distinct placeholder sprite
                    const canvas = document.createElement('canvas');
                    canvas.width = 64;
                    canvas.height = 64;
                    const ctx = canvas.getContext('2d');

                    let placeholderColor = 'magenta'; // Default fallback color
                    if (name === 'enemy') {
                        placeholderColor = 'darkred';
                    } else if (name === 'item') {
                        placeholderColor = 'darkblue';
                    }

                    ctx.fillStyle = placeholderColor;
                    ctx.fillRect(0, 0, 64, 64);

                    // Add a letter to make it even clearer
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 32px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(name.charAt(0).toUpperCase(), 32, 32);

                    this.sprites.set(name, canvas);
                    resolve(); // Resolve even on error to not block the game
                };
                img.src = url;
            });
            promises.push(promise);
        }

        await Promise.all(promises);
        console.log('All sprites loaded.');
    }

    getSprite(name) {
        return this.sprites.get(name) || null;
    }
}