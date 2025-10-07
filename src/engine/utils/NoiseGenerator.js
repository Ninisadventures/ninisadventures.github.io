export class NoiseGenerator {
    static simplex2D(x, y, scale = 0.1) {
        // Simple noise implementation
        x *= scale;
        y *= scale;

        const grad = (hash, x, y) => {
            const h = hash & 7;
            const u = h < 4 ? x : y;
            const v = h < 4 ? y : x;
            return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
        };

        const hash = (x, y) => {
            let h = Math.floor(x) * 374761393 + Math.floor(y) * 668265263;
            h = (h ^ (h >> 13)) * 1274126177;
            return h ^ (h >> 16);
        };

        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const xf = x - xi;
        const yf = y - yi;

        const u = xf * xf * (3.0 - 2.0 * xf);
        const v = yf * yf * (3.0 - 2.0 * yf);

        const n00 = grad(hash(xi, yi), xf, yf);
        const n01 = grad(hash(xi, yi + 1), xf, yf - 1);
        const n10 = grad(hash(xi + 1, yi), xf - 1, yf);
        const n11 = grad(hash(xi + 1, yi + 1), xf - 1, yf - 1);

        const x1 = n00 * (1 - u) + n10 * u;
        const x2 = n01 * (1 - u) + n11 * u;

        return x1 * (1 - v) + x2 * v;
    }

    static fbm(x, y, octaves = 4, persistence = 0.5, scale = 0.1) {
        let value = 0;
        let amplitude = 1;
        let frequency = scale;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            value += this.simplex2D(x, y, frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }

        return value / maxValue;
    }
}