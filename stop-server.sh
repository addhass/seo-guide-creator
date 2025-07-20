#!/bin/bash
# Stop the CORS proxy server

echo "🛑 Stopping Product Description Guide Builder Server..."

# Find and kill the proxy server process
if pkill -f "cors-proxy-server.js"; then
    echo "✅ Server stopped successfully!"
else
    echo "⚠️  No running server found."
fi

# Clean up any orphaned node processes on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null

echo "🧹 Cleaned up any remaining processes on port 3001"