#!/bin/bash
# Start the CORS proxy server in background

echo "🚀 Starting Product Description Guide Builder Server in background..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📌 IMPORTANT: Server runs in BACKGROUND"
echo "✅ SAFE TO PRESS ESCAPE after 'Server is running' message"
echo "⏱️  Wait ~3 seconds for startup confirmation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Kill any existing proxy server
pkill -f "cors-proxy-server.js" 2>/dev/null

# Start server in background and save PID
cd server && nohup npm start > ../server.log 2>&1 &
SERVER_PID=$!

echo "✅ Server started with PID: $SERVER_PID"
echo "📄 Server logs are being written to server.log"
echo "🔍 To check if server is running: curl http://localhost:3001/health"
echo "🛑 To stop server: ./stop-server.sh"

# Wait a moment for server to start
sleep 2

# Check if server started successfully
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Server is running successfully!"
    echo "👍 You can now PRESS ESCAPE to continue"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "⚠️  Server may still be starting. Check server.log for details."
fi