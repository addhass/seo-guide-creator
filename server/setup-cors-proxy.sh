#!/bin/bash

# Setup script for CORS Proxy Server
echo "🚀 Setting up CORS Proxy Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create start script
cat > start-proxy.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting CORS Proxy Server..."
echo "📍 Server will run on http://localhost:3001"
echo "⏹️  Press Ctrl+C to stop"
echo ""
npm start
EOF

chmod +x start-proxy.sh

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Run: ./start-proxy.sh"
echo "   2. Open your Product Guide Builder in browser"
echo "   3. Try the 'Generate from About Us' feature"
echo ""
echo "💡 The proxy will automatically handle CORS issues!"