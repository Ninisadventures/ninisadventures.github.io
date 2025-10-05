# ⚡ Quick Start Guide

Get up and running in **5 minutes**!

## 🎯 Prerequisites

- Python 3.9+ installed
- Node.js 18+ installed
- Modern web browser

## 📦 One-Command Setup

### Linux/Mac:
```bash
chmod +x setup.sh && ./setup.sh
```

### Windows:
```cmd
setup.bat
```

## 🚀 Start Playing

### Automatic (Recommended):

**Linux/Mac:**
```bash
./start_all.sh
```

**Windows:**
```cmd
start_all.bat
```

Then open: **http://localhost:8000**

### Manual:

Open 3 terminals and run:

**Terminal 1** - Texture Service:
```bash
python3 texture_generation_service.py
```

**Terminal 2** - Game Server:
```bash
node game_server.js
```

**Terminal 3** - HTTP Server:
```bash
python3 -m http.server 8000
```

Then open: **http://localhost:8000**

## 🎮 Controls

- **↑ / W** - Move Forward
- **↓ / S** - Move Backward
- **← / A** - Turn Left
- **→ / D** - Turn Right
- **SPACE** - Shoot

## ✅ Verify Installation

### Check Texture Service:
```bash
curl http://localhost:8080/health
```
Expected: `{"status": "healthy"}`

### Check Game Server:
```bash
curl http://localhost:3001/health
```
Expected: `{"status": "healthy", "players": 0, ...}`

## 🐛 Common Issues

### "Module not found"
**Solution:** Run `npm install` and `pip install -r requirements.txt --break-system-packages`

### "Port already in use"
**Solution:** Kill the process using the port or change the port in configuration

### "CORS error"
**Solution:** Don't open index.html directly. Use `python3 -m http.server 8000`

### Assets not loading
**Solution:** Ensure texture service is running on port 8080

## 📊 Test Multiplayer

1. Open http://localhost:8000 in first browser tab
2. Open http://localhost:8000 in second browser tab
3. Both players should see each other!

## 🎯 Objectives

- Defeat all enemy kitties
- Survive and maximize score
- Each kill: +100 points

## 🔧 Quick Configuration

### Lower graphics for better performance:
Edit `game_client.js`, change:
```javascript
CONFIG.RENDER_DISTANCE = 500; // Default: 1000
```

### Change player count:
Edit `game_server.js`, change:
```javascript
MAX_PLAYERS: 8, // Default: 16
```

## 📖 Next Steps

- Read **README.md** for complete documentation
- Check **Architecture** section for system details
- Explore **Configuration** options for customization

## 🎉 That's it!

You're ready to play! Have fun! 🚀

---

**Need help?** Check the Troubleshooting section in README.md
