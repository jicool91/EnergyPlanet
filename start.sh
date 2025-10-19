#!/bin/bash

# Energy Planet - Quick Start Script
# Автоматический запуск для локальной разработки

set -e

echo "🚀 Energy Planet - Starting..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Docker
echo "📦 Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check ngrok
echo "🌐 Checking ngrok..."
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}⚠️  ngrok not found. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install ngrok/ngrok/ngrok
    else
        echo -e "${RED}Please install ngrok manually: https://ngrok.com/download${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ ngrok is installed${NC}"

# Start Docker Compose
echo ""
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Check backend health
echo "🏥 Checking backend health..."
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start. Check logs: docker logs energy-planet-backend${NC}"
        exit 1
    fi
    sleep 1
done

# Apply migrations
echo ""
echo "📊 Applying database migrations..."
docker exec -i energy-planet-postgres psql -U energyplanet_app -d energy_planet < backend/migrations/001_initial_schema.sql 2>/dev/null || echo "Migrations already applied or error occurred"

# Start ngrok
echo ""
echo "🌐 Starting ngrok tunnels..."
echo -e "${YELLOW}Opening ngrok in background...${NC}"
echo ""

# Kill existing ngrok processes
pkill -f ngrok || true
sleep 2

# Start ngrok for backend and webapp
ngrok http 3000 --log=stdout > /tmp/ngrok-backend.log &
NGROK_BACKEND_PID=$!
sleep 2

ngrok http 5173 --log=stdout > /tmp/ngrok-webapp.log &
NGROK_WEBAPP_PID=$!
sleep 3

# Get ngrok URLs
echo ""
echo "🔗 Getting ngrok URLs..."
BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
# Second ngrok runs on port 4041
WEBAPP_URL=$(curl -s http://localhost:4041/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$BACKEND_URL" ] || [ -z "$WEBAPP_URL" ]; then
    echo -e "${RED}❌ Failed to get ngrok URLs. Starting ngrok manually...${NC}"
    echo ""
    echo "Please run in separate terminals:"
    echo "  Terminal 1: ngrok http 3000"
    echo "  Terminal 2: ngrok http 5173"
    echo ""
    exit 1
fi

# Update webapp .env
echo ""
echo "⚙️  Updating webapp configuration..."
cat > webapp/.env << EOF
VITE_API_URL=${BACKEND_URL}/api/v1
VITE_ENV=development
VITE_CDN_URL=https://cdn.energyplanet.game
EOF

# Restart webapp to pick up new env
docker-compose restart webapp
sleep 2

# Print summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Energy Planet is running!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📡 URLs:"
echo "  Backend API:     ${BACKEND_URL}"
echo "  Webapp:          ${WEBAPP_URL}"
echo "  ngrok Dashboard: http://127.0.0.1:4040"
echo ""
echo "📱 Telegram Bot Setup:"
echo "  1. Open @BotFather in Telegram"
echo "  2. Send: /mybots"
echo "  3. Select your bot"
echo "  4. Bot Settings → Menu Button → Edit Menu Button URL"
echo "  5. Enter URL: ${WEBAPP_URL}"
echo ""
echo "🧪 Test:"
echo "  Health check: curl ${BACKEND_URL}/health"
echo "  Open in browser: ${WEBAPP_URL}"
echo ""
echo "📋 Useful commands:"
echo "  Logs: docker-compose logs -f backend"
echo "  Stop: docker-compose down"
echo "  Database: docker exec -it energy-planet-postgres psql -U energyplanet_app -d energy_planet"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠️  Keep this terminal open to keep ngrok running!${NC}"
echo -e "${YELLOW}⚠️  Press Ctrl+C to stop everything${NC}"
echo ""

# Save URLs to file for later use
cat > .ngrok-urls << EOF
BACKEND_URL=${BACKEND_URL}
WEBAPP_URL=${WEBAPP_URL}
BACKEND_PID=${NGROK_BACKEND_PID}
WEBAPP_PID=${NGROK_WEBAPP_PID}
EOF

# Keep script running
echo "📊 Watching logs (Ctrl+C to stop)..."
echo ""
docker-compose logs -f backend webapp

# Cleanup on exit
trap "echo 'Stopping...'; docker-compose down; kill $NGROK_BACKEND_PID $NGROK_WEBAPP_PID 2>/dev/null; exit" INT TERM
