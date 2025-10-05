#!/bin/bash

###############################################################################
# Nini's Adventures: Kitties Mayhem - AAA Edition Setup Script
# Automates installation and configuration
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Header
echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}  Nini's Adventures: Kitties Mayhem - AAA Edition${NC}"
echo -e "${BLUE}  Professional Setup Script${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | awk '{print $2}')
    echo -e "${GREEN}✓ Python found: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}✗ Python 3 not found. Please install Python 3.9 or higher.${NC}"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18 or higher.${NC}"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm found: $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm not found. Please install npm.${NC}"
    exit 1
fi

echo ""

# Step 2: Create directories
echo -e "${YELLOW}[2/6] Creating directories...${NC}"

mkdir -p texture_cache
mkdir -p logs
mkdir -p backups

echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Step 3: Install Python dependencies
echo -e "${YELLOW}[3/6] Installing Python dependencies...${NC}"

# Detect OS and use appropriate pip flags
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    pip3 install -r requirements.txt --break-system-packages
else
    pip3 install -r requirements.txt
fi

echo -e "${GREEN}✓ Python dependencies installed${NC}"
echo ""

# Step 4: Install Node.js dependencies
echo -e "${YELLOW}[4/6] Installing Node.js dependencies...${NC}"

npm install

echo -e "${GREEN}✓ Node.js dependencies installed${NC}"
echo ""

# Step 5: Create configuration files
echo -e "${YELLOW}[5/6] Creating configuration files...${NC}"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << EOF
# Texture Generation Service
TEXTURE_SERVICE_PORT=8080
CACHE_DIR=./texture_cache

# Game Server
GAME_SERVER_PORT=3000
HEALTH_SERVER_PORT=3001
MAX_PLAYERS=16
TICK_RATE=20

# Logging
LOG_LEVEL=INFO
EOF
    echo -e "${GREEN}✓ Configuration file (.env) created${NC}"
else
    echo -e "${BLUE}ℹ Configuration file already exists${NC}"
fi

echo ""

# Step 6: Create start scripts
echo -e "${YELLOW}[6/6] Creating start scripts...${NC}"

# Create start_texture_service script
cat > start_texture_service.sh << 'EOF'
#!/bin/bash
echo "Starting Texture Generation Service..."
python3 texture_generation_service.py
EOF
chmod +x start_texture_service.sh

# Create start_game_server script
cat > start_game_server.sh << 'EOF'
#!/bin/bash
echo "Starting Game Server..."
node game_server.js
EOF
chmod +x start_game_server.sh

# Create start_all script
cat > start_all.sh << 'EOF'
#!/bin/bash
echo "Starting all services..."
echo "Note: This will open multiple terminal windows"

# Function to detect OS and open terminal
open_terminal() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e "tell app \"Terminal\" to do script \"cd $(pwd) && $1\""
    elif command -v gnome-terminal &> /dev/null; then
        # Linux with gnome-terminal
        gnome-terminal -- bash -c "cd $(pwd) && $1; exec bash"
    elif command -v xterm &> /dev/null; then
        # Linux with xterm
        xterm -e "cd $(pwd) && $1" &
    else
        echo "Please run these commands manually in separate terminals:"
        echo "  1. ./start_texture_service.sh"
        echo "  2. ./start_game_server.sh"
        echo "  3. python3 -m http.server 8000"
        exit 1
    fi
}

# Start texture service
open_terminal "./start_texture_service.sh"
sleep 2

# Start game server
open_terminal "./start_game_server.sh"
sleep 2

# Start HTTP server for client
open_terminal "python3 -m http.server 8000"

echo ""
echo "All services started!"
echo ""
echo "Open your browser and navigate to:"
echo "  http://localhost:8000"
echo ""
EOF
chmod +x start_all.sh

# Create Windows batch files
cat > start_texture_service.bat << 'EOF'
@echo off
echo Starting Texture Generation Service...
python texture_generation_service.py
pause
EOF

cat > start_game_server.bat << 'EOF'
@echo off
echo Starting Game Server...
node game_server.js
pause
EOF

cat > start_all.bat << 'EOF'
@echo off
echo Starting all services...
echo.
echo Opening Texture Service...
start cmd /k "python texture_generation_service.py"
timeout /t 2 /nobreak >nul

echo Opening Game Server...
start cmd /k "node game_server.js"
timeout /t 2 /nobreak >nul

echo Opening HTTP Server...
start cmd /k "python -m http.server 8000"
timeout /t 2 /nobreak >nul

echo.
echo All services started!
echo.
echo Open your browser and navigate to:
echo   http://localhost:8000
echo.
pause
EOF

echo -e "${GREEN}✓ Start scripts created${NC}"
echo ""

# Final summary
echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}Setup complete!${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""
echo -e "${YELLOW}Quick Start:${NC}"
echo ""
echo -e "  ${BLUE}Option 1 - Start All Services Automatically:${NC}"
echo -e "    ${GREEN}./start_all.sh${NC}     (Linux/Mac)"
echo -e "    ${GREEN}start_all.bat${NC}      (Windows)"
echo ""
echo -e "  ${BLUE}Option 2 - Start Services Manually:${NC}"
echo -e "    ${GREEN}1.${NC} ./start_texture_service.sh  (or .bat on Windows)"
echo -e "    ${GREEN}2.${NC} ./start_game_server.sh       (or .bat on Windows)"
echo -e "    ${GREEN}3.${NC} python3 -m http.server 8000"
echo -e "    ${GREEN}4.${NC} Open http://localhost:8000 in your browser"
echo ""
echo -e "${YELLOW}Service URLs:${NC}"
echo -e "  Texture Service: ${GREEN}http://localhost:8080${NC}"
echo -e "  Game Server:     ${GREEN}ws://localhost:3000${NC}"
echo -e "  Health Check:    ${GREEN}http://localhost:3001/health${NC}"
echo -e "  Game Client:     ${GREEN}http://localhost:8000${NC}"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo -e "  Read ${GREEN}README.md${NC} for detailed information"
echo ""
echo -e "${BLUE}================================================================${NC}"
echo ""
echo -e "${GREEN}Happy gaming! 🎮${NC}"
echo ""
