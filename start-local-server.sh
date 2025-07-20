#!/bin/bash

# Start local server for testing
echo "🚀 Starting local development server..."
echo "📍 Server will run at: http://localhost:3000"
echo ""
echo "Available pages:"
echo "  - http://localhost:3000/product-guide-builder-modular.html (Main app)"
echo "  - http://localhost:3000/auth.html (Login/Signup)"
echo "  - http://localhost:3000/dashboard.html (API Keys)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start Python HTTP server
python3 -m http.server 3000