#!/usr/bin/env python3
"""
AAA-Quality Texture & Sprite Generation Service
Professional-grade procedural asset generation with caching, validation, and API
"""

import asyncio
import base64
import hashlib
import io
import json
import logging
import os
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
from aiohttp import web
import aiofiles
from functools import lru_cache

# Configure professional logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('texture_service.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class TextureType(Enum):
    """Supported texture types"""
    WALL = "wall"
    SPRITE = "sprite"
    PARTICLE = "particle"
    UI = "ui"
    WEAPON = "weapon"
    PROJECTILE = "projectile"
    EFFECT = "effect"
    ANIMATED = "animated"


class Quality(Enum):
    """Quality presets"""
    LOW = 64
    MEDIUM = 128
    HIGH = 256
    ULTRA = 512
    AAA = 1024


@dataclass
class TextureConfig:
    """Configuration for texture generation"""
    texture_type: str
    width: int
    height: int
    quality: str = "HIGH"
    theme: str = "banana"
    animation_frames: int = 1
    color_palette: Optional[List[str]] = None
    seed: Optional[int] = None
    enable_normal_map: bool = False
    enable_specular: bool = False
    enable_ao: bool = False  # Ambient occlusion
    compression: str = "png"
    
    def to_cache_key(self) -> str:
        """Generate unique cache key"""
        config_str = json.dumps(asdict(self), sort_keys=True)
        return hashlib.sha256(config_str.encode()).hexdigest()


class AdvancedTextureGenerator:
    """Professional texture generation with advanced algorithms"""
    
    def __init__(self, cache_dir: str = "./texture_cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.stats = {
            'generated': 0,
            'cached': 0,
            'errors': 0
        }
        
    async def generate(self, config: TextureConfig) -> Dict[str, Any]:
        """
        Generate texture with full validation and caching
        
        Returns:
            Dict containing texture data, metadata, and optional maps
        """
        try:
            cache_key = config.to_cache_key()
            cached = await self._get_from_cache(cache_key)
            
            if cached:
                self.stats['cached'] += 1
                logger.info(f"Cache hit for {config.texture_type}")
                return cached
            
            # Generate based on type
            result = await self._generate_texture(config)
            
            # Save to cache
            await self._save_to_cache(cache_key, result)
            
            self.stats['generated'] += 1
            logger.info(f"Generated new {config.texture_type} texture")
            
            return result
            
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Error generating texture: {e}", exc_info=True)
            raise
    
    async def _generate_texture(self, config: TextureConfig) -> Dict[str, Any]:
        """Core generation logic"""
        # Use seed for reproducibility
        if config.seed:
            np.random.seed(config.seed)
        
        # Select generation method
        generator_map = {
            "wall": self._generate_wall_texture,
            "sprite": self._generate_sprite_texture,
            "particle": self._generate_particle_texture,
            "ui": self._generate_ui_texture,
            "weapon": self._generate_weapon_texture,
            "projectile": self._generate_projectile_texture,
            "effect": self._generate_effect_texture,
            "animated": self._generate_animated_texture
        }
        
        generator = generator_map.get(config.texture_type, self._generate_default)
        
        # Generate frames
        frames = []
        for frame_idx in range(config.animation_frames):
            img = await generator(config, frame_idx)
            
            # Post-processing
            img = await self._apply_post_processing(img, config)
            
            frames.append(img)
        
        # Build result
        result = {
            'diffuse': self._encode_images(frames),
            'metadata': {
                'width': config.width,
                'height': config.height,
                'frames': config.animation_frames,
                'type': config.texture_type,
                'timestamp': datetime.now().isoformat()
            }
        }
        
        # Generate additional maps if requested
        if config.enable_normal_map:
            result['normal'] = self._encode_images([
                await self._generate_normal_map(img) for img in frames
            ])
        
        if config.enable_specular:
            result['specular'] = self._encode_images([
                await self._generate_specular_map(img) for img in frames
            ])
        
        if config.enable_ao:
            result['ao'] = self._encode_images([
                await self._generate_ao_map(img) for img in frames
            ])
        
        return result
    
    async def _generate_wall_texture(self, config: TextureConfig, frame: int) -> Image.Image:
        """Generate AAA-quality wall texture with procedural detail"""
        img = Image.new('RGB', (config.width, config.height))
        draw = ImageDraw.Draw(img)
        
        # Base color from theme
        palette = self._get_theme_palette(config.theme)
        base_color = palette['primary']
        
        # Procedural noise for variation
        noise = self._generate_perlin_noise(config.width, config.height, scale=0.1)
        pixels = img.load()
        
        for y in range(config.height):
            for x in range(config.width):
                # Apply noise variation
                noise_val = noise[y, x]
                r = int(base_color[0] * (0.8 + 0.4 * noise_val))
                g = int(base_color[1] * (0.8 + 0.4 * noise_val))
                b = int(base_color[2] * (0.8 + 0.4 * noise_val))
                pixels[x, y] = (
                    max(0, min(255, r)),
                    max(0, min(255, g)),
                    max(0, min(255, b))
                )
        
        # Add detail layers
        img = await self._add_detail_layer(img, palette)
        img = await self._add_weathering(img)
        
        return img
    
    async def _generate_sprite_texture(self, config: TextureConfig, frame: int) -> Image.Image:
        """Generate character/sprite with animation support"""
        img = Image.new('RGBA', (config.width, config.height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        palette = self._get_theme_palette(config.theme)
        
        # Animation offset
        bounce = int(np.sin(frame * 0.5) * 5)
        
        # Draw character (example: cat)
        center_x, center_y = config.width // 2, config.height // 2
        
        # Body
        body_radius = config.width // 3
        draw.ellipse(
            [center_x - body_radius, center_y - body_radius + bounce,
             center_x + body_radius, center_y + body_radius + bounce],
            fill=palette['secondary']
        )
        
        # Head
        head_radius = config.width // 4
        head_y = center_y - body_radius // 2
        draw.ellipse(
            [center_x - head_radius, head_y - head_radius + bounce,
             center_x + head_radius, head_y + head_radius + bounce],
            fill=palette['secondary']
        )
        
        # Ears (animated)
        ear_offset = 2 + int(np.sin(frame * 0.3) * 3)
        left_ear = [
            (center_x - head_radius // 2, head_y - head_radius + bounce),
            (center_x - head_radius, head_y - head_radius - ear_offset + bounce),
            (center_x - head_radius // 4, head_y - head_radius // 2 + bounce)
        ]
        right_ear = [
            (center_x + head_radius // 2, head_y - head_radius + bounce),
            (center_x + head_radius, head_y - head_radius - ear_offset + bounce),
            (center_x + head_radius // 4, head_y - head_radius // 2 + bounce)
        ]
        draw.polygon(left_ear, fill=palette['secondary'])
        draw.polygon(right_ear, fill=palette['secondary'])
        
        # Eyes
        eye_size = config.width // 16
        draw.ellipse(
            [center_x - head_radius // 2 - eye_size, head_y - eye_size + bounce,
             center_x - head_radius // 2 + eye_size, head_y + eye_size + bounce],
            fill=(255, 255, 255)
        )
        draw.ellipse(
            [center_x + head_radius // 2 - eye_size, head_y - eye_size + bounce,
             center_x + head_radius // 2 + eye_size, head_y + eye_size + bounce],
            fill=(255, 255, 255)
        )
        
        # Pupils
        pupil_size = eye_size // 2
        draw.ellipse(
            [center_x - head_radius // 2 - pupil_size, head_y - pupil_size + bounce,
             center_x - head_radius // 2 + pupil_size, head_y + pupil_size + bounce],
            fill=(0, 0, 0)
        )
        draw.ellipse(
            [center_x + head_radius // 2 - pupil_size, head_y - pupil_size + bounce,
             center_x + head_radius // 2 + pupil_size, head_y + pupil_size + bounce],
            fill=(0, 0, 0)
        )
        
        # Add soft shadow
        img = await self._add_soft_shadow(img)
        
        return img
    
    async def _generate_particle_texture(self, config: TextureConfig, frame: int) -> Image.Image:
        """Generate particle effect texture"""
        img = Image.new('RGBA', (config.width, config.height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        palette = self._get_theme_palette(config.theme)
        center = config.width // 2
        
        # Animated particle expansion
        radius = int(center * (0.3 + 0.7 * (frame / max(1, config.animation_frames - 1))))
        alpha = int(255 * (1 - frame / max(1, config.animation_frames - 1)))
        
        # Gradient particle
        for r in range(radius, 0, -1):
            color_alpha = int(alpha * (r / radius))
            color = palette['accent'] + (color_alpha,)
            draw.ellipse(
                [center - r, center - r, center + r, center + r],
                fill=color
            )
        
        # Apply blur for soft edges
        img = img.filter(ImageFilter.GaussianBlur(radius=3))
        
        return img
    
    async def _generate_weapon_texture(self, config: TextureConfig, frame: int) -> Image.Image:
        """Generate weapon sprite"""
        img = Image.new('RGBA', (config.width, config.height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        palette = self._get_theme_palette(config.theme)
        
        # Banana gun shape
        points = [
            (config.width * 0.1, config.height * 0.5),
            (config.width * 0.5, config.height * 0.3),
            (config.width * 0.9, config.height * 0.5),
            (config.width * 0.9, config.height * 0.7),
            (config.width * 0.5, config.height * 0.5),
            (config.width * 0.1, config.height * 0.7)
        ]
        
        draw.polygon(points, fill=palette['primary'], outline=palette['accent'])
        
        # Add highlights
        highlight = ImageEnhance.Brightness(img).enhance(1.3)
        img = Image.blend(img, highlight, 0.3)
        
        return img
    
    async def _generate_projectile_texture(self, config: TextureConfig, frame: int) -> Image.Image:
        """Generate projectile texture"""
        img = Image.new('RGBA', (config.width, config.height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        palette = self._get_theme_palette(config.theme)
        center = config.width // 2
        
        # Glowing projectile
        for r in range(center, 0, -2):
            alpha = int(255 * (r / center))
            color = palette['primary'] + (alpha,)
            draw.ellipse(
                [center - r, center - r, center + r, center + r],
                fill=color
            )
        
        return img
    
    async def _generate_effect_texture(self, config: TextureConfig, frame: int) -> Image.Image:
        """Generate visual effect texture"""
        return await self._generate_particle_texture(config, frame)
    
    async def _generate_animated_texture(self, config: TextureConfig, frame: int) -> Image.Image:
        """Generate animated texture sequence"""
        return await self._generate_sprite_texture(config, frame)
    
    async def _generate_ui_texture(self, config: TextureConfig, frame: int) -> Image.Image:
        """Generate UI element texture"""
        img = Image.new('RGBA', (config.width, config.height), (0, 0, 0, 180))
        draw = ImageDraw.Draw(img)
        
        palette = self._get_theme_palette(config.theme)
        
        # Border
        border_width = 3
        draw.rectangle(
            [border_width, border_width, 
             config.width - border_width, config.height - border_width],
            outline=palette['accent'], width=border_width
        )
        
        return img
    
    async def _generate_default(self, config: TextureConfig, frame: int) -> Image.Image:
        """Fallback generator"""
        img = Image.new('RGB', (config.width, config.height), (128, 128, 128))
        return img
    
    def _generate_perlin_noise(self, width: int, height: int, scale: float = 0.1) -> np.ndarray:
        """Generate Perlin-like noise"""
        # Simplified Perlin noise implementation
        lin_x = np.linspace(0, scale * width, width, endpoint=False)
        lin_y = np.linspace(0, scale * height, height, endpoint=False)
        x, y = np.meshgrid(lin_x, lin_y)
        
        # Combine multiple octaves
        noise = np.zeros((height, width))
        amplitude = 1.0
        frequency = 1.0
        
        for _ in range(4):  # 4 octaves
            noise += amplitude * np.sin(x * frequency) * np.cos(y * frequency)
            amplitude *= 0.5
            frequency *= 2.0
        
        # Normalize to 0-1
        noise = (noise - noise.min()) / (noise.max() - noise.min())
        return noise
    
    def _get_theme_palette(self, theme: str) -> Dict[str, tuple]:
        """Get color palette for theme"""
        palettes = {
            'banana': {
                'primary': (241, 196, 15),      # Banana yellow
                'secondary': (211, 84, 0),      # Orange
                'accent': (125, 102, 8),        # Dark yellow
                'highlight': (249, 231, 159)    # Light yellow
            },
            'neon': {
                'primary': (255, 0, 255),
                'secondary': (0, 255, 255),
                'accent': (255, 255, 0),
                'highlight': (255, 255, 255)
            },
            'cyberpunk': {
                'primary': (0, 255, 255),
                'secondary': (255, 0, 128),
                'accent': (255, 255, 0),
                'highlight': (128, 0, 255)
            }
        }
        return palettes.get(theme, palettes['banana'])
    
    async def _apply_post_processing(self, img: Image.Image, config: TextureConfig) -> Image.Image:
        """Apply post-processing effects"""
        # Sharpen for clarity
        img = img.filter(ImageFilter.SHARPEN)
        
        # Adjust contrast based on quality
        quality_multiplier = Quality[config.quality].value / 256
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.0 + quality_multiplier * 0.2)
        
        return img
    
    async def _add_detail_layer(self, img: Image.Image, palette: Dict) -> Image.Image:
        """Add fine detail to texture"""
        detail = Image.new('RGBA', img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(detail)
        
        # Add random detail marks
        for _ in range(20):
            x = np.random.randint(0, img.width)
            y = np.random.randint(0, img.height)
            size = np.random.randint(2, 5)
            alpha = np.random.randint(20, 60)
            color = palette['accent'] + (alpha,)
            draw.ellipse([x, y, x + size, y + size], fill=color)
        
        return Image.alpha_composite(img.convert('RGBA'), detail).convert('RGB')
    
    async def _add_weathering(self, img: Image.Image) -> Image.Image:
        """Add weathering effects for realism"""
        # Slight noise overlay
        noise = np.random.randint(-10, 10, (img.height, img.width, 3), dtype=np.int16)
        img_array = np.array(img, dtype=np.int16)
        img_array = np.clip(img_array + noise, 0, 255).astype(np.uint8)
        return Image.fromarray(img_array)
    
    async def _add_soft_shadow(self, img: Image.Image) -> Image.Image:
        """Add soft shadow to sprite"""
        shadow = Image.new('RGBA', img.size, (0, 0, 0, 0))
        shadow.paste((0, 0, 0, 80), (0, 0, img.width, img.height))
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=5))
        
        # Offset shadow
        result = Image.new('RGBA', img.size, (0, 0, 0, 0))
        result.paste(shadow, (2, 2), shadow)
        result.paste(img, (0, 0), img)
        
        return result
    
    async def _generate_normal_map(self, img: Image.Image) -> Image.Image:
        """Generate normal map from diffuse"""
        # Convert to grayscale
        gray = img.convert('L')
        gray_array = np.array(gray, dtype=np.float32) / 255.0
        
        # Calculate gradients
        grad_x = np.gradient(gray_array, axis=1)
        grad_y = np.gradient(gray_array, axis=0)
        
        # Construct normal vectors
        normal_x = -grad_x
        normal_y = -grad_y
        normal_z = np.ones_like(gray_array)
        
        # Normalize
        length = np.sqrt(normal_x**2 + normal_y**2 + normal_z**2)
        normal_x /= length
        normal_y /= length
        normal_z /= length
        
        # Convert to RGB (0-255 range)
        normal_map = np.stack([
            ((normal_x + 1) * 0.5 * 255).astype(np.uint8),
            ((normal_y + 1) * 0.5 * 255).astype(np.uint8),
            ((normal_z + 1) * 0.5 * 255).astype(np.uint8)
        ], axis=2)
        
        return Image.fromarray(normal_map)
    
    async def _generate_specular_map(self, img: Image.Image) -> Image.Image:
        """Generate specular map"""
        # Use brightness as specular intensity
        gray = img.convert('L')
        enhancer = ImageEnhance.Contrast(gray)
        specular = enhancer.enhance(2.0)
        return specular.convert('RGB')
    
    async def _generate_ao_map(self, img: Image.Image) -> Image.Image:
        """Generate ambient occlusion map"""
        # Simplified AO based on edge detection
        edges = img.convert('L').filter(ImageFilter.FIND_EDGES)
        edges_array = np.array(edges)
        ao_array = 255 - edges_array  # Invert: dark where edges
        return Image.fromarray(ao_array).convert('RGB')
    
    def _encode_images(self, images: List[Image.Image]) -> List[str]:
        """Encode images to base64"""
        encoded = []
        for img in images:
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            encoded.append(base64.b64encode(buffer.getvalue()).decode('utf-8'))
        return encoded
    
    async def _get_from_cache(self, cache_key: str) -> Optional[Dict]:
        """Retrieve from cache"""
        cache_file = self.cache_dir / f"{cache_key}.json"
        if cache_file.exists():
            try:
                async with aiofiles.open(cache_file, 'r') as f:
                    content = await f.read()
                    return json.loads(content)
            except Exception as e:
                logger.warning(f"Cache read error: {e}")
        return None
    
    async def _save_to_cache(self, cache_key: str, data: Dict):
        """Save to cache"""
        cache_file = self.cache_dir / f"{cache_key}.json"
        try:
            async with aiofiles.open(cache_file, 'w') as f:
                await f.write(json.dumps(data))
        except Exception as e:
            logger.warning(f"Cache write error: {e}")


# Web Service
class TextureService:
    """RESTful API for texture generation"""
    
    def __init__(self):
        self.generator = AdvancedTextureGenerator()
        self.app = web.Application()
        self._setup_routes()
    
    def _setup_routes(self):
        """Configure API routes"""
        self.app.router.add_post('/api/generate', self.handle_generate)
        self.app.router.add_get('/api/stats', self.handle_stats)
        self.app.router.add_get('/health', self.handle_health)
    
    async def handle_generate(self, request: web.Request) -> web.Response:
        """
        POST /api/generate
        Body: TextureConfig JSON
        Returns: Generated texture data
        """
        try:
            data = await request.json()
            config = TextureConfig(**data)
            
            result = await self.generator.generate(config)
            
            return web.json_response(result)
            
        except Exception as e:
            logger.error(f"Generation error: {e}", exc_info=True)
            return web.json_response(
                {'error': str(e)},
                status=500
            )
    
    async def handle_stats(self, request: web.Request) -> web.Response:
        """GET /api/stats - Service statistics"""
        return web.json_response(self.generator.stats)
    
    async def handle_health(self, request: web.Request) -> web.Response:
        """GET /health - Health check"""
        return web.json_response({'status': 'healthy'})
    
    def run(self, host: str = '0.0.0.0', port: int = 8080):
        """Start the service"""
        logger.info(f"Starting Texture Generation Service on {host}:{port}")
        web.run_app(self.app, host=host, port=port)


if __name__ == '__main__':
    service = TextureService()
    service.run()
