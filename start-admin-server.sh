#!/bin/bash

echo "🚀 Starting Admin Report Server..."
echo "================================"
echo "📍 URL: http://localhost:8888"
echo "🛑 Press Ctrl+C to stop"
echo "================================"
echo ""

# Kill any existing server
pkill -f "node admin/report-server.js" 2>/dev/null

# Start server
ADMIN_TOKEN=admin-secret-2025 node admin/report-server.js