---
layout: default
title: Testing Guide
---

# 🧪 Testing Guide

## Comprehensive System Validation

This guide helps you verify that all components of the AAA game system are working correctly.

---

## 1. Prerequisites Testing

### Verify Python Installation
```bash
python3 --version
# Expected: Python 3.9.0 or higher
```

### Verify Node.js Installation
```bash
node --version
# Expected: v18.0.0 or higher
```

### Verify npm Installation
```bash
npm --version
# Expected: 9.0.0 or higher
```

---

## 2. Installation Testing

### Test Python Dependencies
```bash
python3 -c "import numpy; import PIL; import aiohttp; import aiofiles; print('All Python dependencies OK')"
# Expected: All Python dependencies OK
```

### Test Node.js Dependencies
```bash
node -e "require('ws'); console.log('All Node.js dependencies OK')"
# Expected: All Node.js dependencies OK
```

---

## 3. Texture Service Testing

### Start the Service
```bash
python3 texture_generation_service.py
```

### Test Health Endpoint
Open a new terminal:
```bash
curl http://localhost:8080/health
# Expected: {"status": "healthy"}
```

### Test Stats Endpoint
```bash
curl http://localhost:8080/api/stats
# Expected: {"generated": 0, "cached": 0, "errors": 0}
```

### Test Texture Generation
```bash
curl -X POST http://localhost:8080/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "texture_type": "wall",
    "width": 64,
    "height": 64,
    "quality": "MEDIUM",
    "theme": "banana"
  }'
# Expected: JSON with diffuse, metadata fields
```

### Test Caching
Run the same request again:
```bash
curl http://localhost:8080/api/stats
# Expected: cached count should increase
```

### Performance Test
```bash
# Generate 10 textures and measure time
time for i in {1..10}; do
  curl -s -X POST http://localhost:8080/api/generate \
    -H "Content-Type: application/json" \
    -d "{\"texture_type\":\"wall\",\"width\":64,\"height\":64,\"quality\":\"MEDIUM\",\"seed\":$i}" \
    > /dev/null
done
# Expected: Should complete in < 5 seconds
```

---

## 4. Game Server Testing

### Start the Server
```bash
node game_server.js
```

### Test Health Endpoint
Open a new terminal:
```bash
curl http://localhost:3001/health
# Expected: {"status": "healthy", "players": 0, "projectiles": 0, "uptime": ...}
```

### Test Metrics Endpoint
```bash
curl http://localhost:3001/metrics
# Expected: JSON with players, projectiles, uptime, memory
```

### Test WebSocket Connection
Create a test file `test_ws.js`:
```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('✓ WebSocket connected');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('✓ Received:', msg.type);
  if (msg.type === 'init') {
    console.log('✓ Player ID:', msg.playerId);
    ws.close();
  }
});

ws.on('close', () => {
  console.log('✓ Connection closed');
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('✗ Error:', error);
  process.exit(1);
});
```

Run:
```bash
node test_ws.js
# Expected: Connection successful, received init message
```

### Load Test
```bash
# Start multiple connections
for i in {1..5}; do
  node test_ws.js &
done
wait
# Expected: All connections successful
```

---

## 5. Client Testing

### Start HTTP Server
```bash
python3 -m http.server 8000
```

### Open in Browser
Visit: http://localhost:8000

### Console Checks
Open browser DevTools (F12), check Console:

**Expected logs:**
```
Initializing game...
Preloading assets from texture service...
Connected to server
All assets loaded!
Game initialized!
```

**No errors expected**

### Network Tab Checks
Check DevTools → Network tab:

1. **index.html** - Status 200
2. **game_client.js** - Status 200
3. **game_client_part2.js** - Status 200
4. **WebSocket** - Status 101 (Switching Protocols)
5. **API calls to texture service** - Multiple 200s

### Performance Test
In console:
```javascript
// Check FPS
setInterval(() => {
  console.log('FPS check - should be close to 60');
}, 5000);
```

### Memory Test
In console:
```javascript
// Check memory (Chrome only)
console.log(performance.memory);
// Expected: usedJSHeapSize < 300MB
```

---

## 6. Gameplay Testing

### Basic Controls
1. Press **Start Game** button
2. Test movement:
   - **↑** or **W** - Should move forward
   - **↓** or **S** - Should move backward
   - **←** or **A** - Should turn left
   - **→** or **D** - Should turn right
3. Test shooting:
   - **SPACE** - Should shoot, ammo should decrease
   - Should see muzzle flash particles
   - Should hear shooting sound

### Enemy AI
1. Move close to an enemy (red cat)
2. **Expected:** Enemy should chase you
3. Get very close
4. **Expected:** Enemy should attack (health decreases)

### Combat
1. Shoot an enemy (aim with crosshair, press SPACE)
2. **Expected:**
   - Hit particles appear
   - Hit sound plays
   - Enemy health decreases
   - Enemy dies after ~4 hits
   - Score increases by 100

### HUD Verification
- **Health bar** - Should decrease when hit
- **Ammo count** - Should decrease when shooting
- **Score** - Should increase when killing enemies
- **Crosshair** - Should be visible in center
- **Minimap** - Should show player (green) and enemies (red)

---

## 7. Multiplayer Testing

### Two Players Test

**Terminal 1:**
```bash
# Services should already be running
```

**Browser 1:**
```
Open: http://localhost:8000
Start game
```

**Browser 2:**
```
Open: http://localhost:8000 (new tab/window)
Start game
```

**Expected:**
- Both players should see different positions
- Moving in Browser 1 should update in Browser 2
- Both players can shoot
- Server console shows 2 connected players

### Verify in Server Console:
```
Player joined { playerId: '...', playerCount: 1 }
Player joined { playerId: '...', playerCount: 2 }
```

### Check Server Metrics:
```bash
curl http://localhost:3001/metrics
# Expected: "players": 2
```

### Disconnect Test
Close Browser 1
```bash
curl http://localhost:3001/metrics
# Expected: "players": 1
```

Server console should show:
```
Player left { playerId: '...', playerCount: 1 }
```

---

## 8. Stress Testing

### Texture Service Load
```bash
# Generate 100 different textures rapidly
time for i in {1..100}; do
  curl -s -X POST http://localhost:8080/api/generate \
    -H "Content-Type: application/json" \
    -d "{\"texture_type\":\"sprite\",\"width\":128,\"height\":128,\"seed\":$i,\"animation_frames\":$((i%5+1))}" \
    > /dev/null &
done
wait

# Check stats
curl http://localhost:8080/api/stats
# Expected: generated + cached = 100, errors = 0
```

### Server Load
```bash
# Connect 10 simultaneous players
for i in {1..10}; do
  node test_ws.js &
done
wait

# Check server still responsive
curl http://localhost:3001/health
# Expected: {"status": "healthy", ...}
```

### Client FPS Test
In browser console:
```javascript
// Enable performance monitoring
let frames = 0;
let lastTime = performance.now();

function countFPS() {
  frames++;
  const now = performance.now();
  if (now - lastTime > 1000) {
    console.log('FPS:', frames);
    frames = 0;
    lastTime = now;
  }
  requestAnimationFrame(countFPS);
}
countFPS();

// Expected: FPS should stay above 50
```

---

## 9. Error Handling Testing

### Test Invalid Texture Request
```bash
curl -X POST http://localhost:8080/api/generate \
  -H "Content-Type: application/json" \
  -d '{"texture_type": "invalid"}'
# Expected: Error response or fallback texture
```

### Test Server with Invalid Message
```javascript
const ws = new WebSocket('ws://localhost:3000');
ws.on('open', () => {
  ws.send('invalid json');
});
// Expected: Server should handle gracefully, not crash
```

### Test Client with Service Offline
1. Stop texture service (Ctrl+C)
2. Open http://localhost:8000
3. **Expected:** 
   - Warning message appears
   - Game loads with fallback textures (checkerboard pattern)
   - Game still playable

---

## 10. Cross-Browser Testing

Test in multiple browsers:

### Chrome
```
Open: http://localhost:8000
Expected: Full functionality
```

### Firefox
```
Open: http://localhost:8000
Expected: Full functionality
```

### Edge
```
Open: http://localhost:8000
Expected: Full functionality
```

### Safari (Mac only)
```
Open: http://localhost:8000
Expected: Full functionality
Note: May need to enable WebRTC
```

---

## 11. Platform Testing

### Linux
```bash
./setup.sh
./start_all.sh
# Expected: All services start in separate terminals
```

### macOS
```bash
chmod +x setup.sh start_all.sh
./setup.sh
./start_all.sh
# Expected: All services start in separate Terminal windows
```

### Windows
```cmd
setup.bat
start_all.bat
# Expected: All services start in separate cmd windows
```

---

## 12. Performance Benchmarks

### Expected Performance

| Metric | Target | Acceptable |
|--------|--------|------------|
| Client FPS | 60 | >50 |
| Server Tick Rate | 20 Hz | 20 Hz |
| Texture Gen (first) | <200ms | <500ms |
| Texture Gen (cached) | <10ms | <50ms |
| Server Latency | <50ms | <100ms |
| Memory (Client) | <300MB | <500MB |
| Memory (Server) | <100MB | <200MB |
| Asset Load Time | <5s | <10s |

### Measure Performance

**Client FPS:**
```javascript
// In browser console
console.log('Average FPS over 10 seconds...');
// Watch the FPS counter
```

**Server Response Time:**
```bash
time curl http://localhost:3001/health
# Expected: < 0.1s
```

**Texture Generation:**
```bash
time curl -X POST http://localhost:8080/api/generate \
  -H "Content-Type: application/json" \
  -d '{"texture_type":"wall","width":256,"height":256}'
# Expected: < 0.5s
```

---

## 13. Regression Testing Checklist

After any code changes, verify:

- [ ] Texture service starts without errors
- [ ] Game server starts without errors
- [ ] Client loads without console errors
- [ ] All textures load correctly
- [ ] Player can move in all directions
- [ ] Player can shoot
- [ ] Enemies chase and attack
- [ ] Projectiles hit enemies
- [ ] Score increases on kill
- [ ] HUD displays correctly
- [ ] Minimap works
- [ ] Audio plays
- [ ] Particles appear
- [ ] Multiplayer synchronizes
- [ ] Server validates input
- [ ] Health endpoints respond
- [ ] Performance meets benchmarks

---

## 14. Automated Test Suite (Future)

### Unit Tests Template

**Python (pytest):**
```python
def test_texture_generation():
    generator = AdvancedTextureGenerator()
    config = TextureConfig(texture_type="wall", width=64, height=64)
    result = await generator.generate(config)
    assert result['diffuse']
    assert result['metadata']['width'] == 64
```

**JavaScript (Jest):**
```javascript
test('Vector2 addition', () => {
  const v1 = new Vector2(1, 2);
  const v2 = new Vector2(3, 4);
  const result = v1.add(v2);
  expect(result.x).toBe(4);
  expect(result.y).toBe(6);
});
```

---

## ✅ Test Results Template

### Test Execution Log

```
Date: ___________
Tester: _________

Prerequisites:
[ ] Python 3.9+ ✓/✗
[ ] Node.js 18+ ✓/✗
[ ] Modern Browser ✓/✗

Installation:
[ ] Python deps installed ✓/✗
[ ] Node deps installed ✓/✗
[ ] Setup script completed ✓/✗

Service Tests:
[ ] Texture service health ✓/✗
[ ] Game server health ✓/✗
[ ] WebSocket connection ✓/✗

Functionality:
[ ] Asset loading ✓/✗
[ ] Movement controls ✓/✗
[ ] Shooting mechanics ✓/✗
[ ] Enemy AI ✓/✗
[ ] Collision detection ✓/✗
[ ] HUD display ✓/✗
[ ] Audio playback ✓/✗
[ ] Particle effects ✓/✗

Multiplayer:
[ ] Player sync ✓/✗
[ ] State broadcast ✓/✗
[ ] Disconnect handling ✓/✗

Performance:
[ ] FPS > 50 ✓/✗
[ ] Load time < 10s ✓/✗
[ ] Server latency < 100ms ✓/✗

Notes:
_________________________
_________________________
```

---

## 🎯 Success Criteria

### Minimum Viable

- All services start without errors
- Client loads and renders 3D view
- Player can move and shoot
- Enemies appear and chase
- Basic multiplayer works

### Full AAA Quality

- Sustained 60 FPS on modern hardware
- All textures load from service
- Advanced maps (normal, specular) working
- Particle effects smooth
- Audio synchronized
- 10+ players supported
- <50ms network latency
- Professional UI/UX

---

**Testing complete when all checkboxes pass! ✅**
