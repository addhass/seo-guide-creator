# CORS Bypass Setup Guide

This guide provides multiple options to bypass CORS restrictions for the "Generate from About Us" feature.

## 🚀 Option 1: Local Proxy Server (RECOMMENDED)

### Quick Setup
```bash
# Run the setup script
./setup-cors-proxy.sh

# Start the proxy server
./start-proxy.sh
```

### Manual Setup
```bash
# Install dependencies
npm install

# Start the server
npm start
```

The proxy server will run on `http://localhost:3001` and automatically handle CORS issues.

### How It Works
- Fetches pages server-side (no CORS restrictions)
- Cleans and extracts About Us content
- Returns clean text to your browser
- Much more reliable than public proxies

## 🌐 Option 2: Browser Configuration

### Chrome (Development Only)
```bash
# macOS/Linux
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security

# Windows
chrome.exe --user-data-dir="c:/chrome-dev-session" --disable-web-security
```

⚠️ **Warning**: Only use for development. Never browse other sites with disabled security.

### Firefox
1. Type `about:config` in address bar
2. Search for `security.fileuri.strict_origin_policy`
3. Set to `false`
4. Restart Firefox

## 📱 Option 3: Browser Extension

Install a CORS extension:
- **Chrome**: "CORS Unblock" or "CORS Toggle"
- **Firefox**: "CORS Everywhere"

Enable the extension when using the About Us feature.

## ☁️ Option 4: Deploy to Server

### Deploy proxy to Vercel/Netlify
1. Create a serverless function
2. Use the same proxy logic
3. No local server needed

### Example Vercel Function
```javascript
// api/fetch-page.js
export default async function handler(req, res) {
    const { url } = req.query;
    
    // Same logic as cors-proxy-server.js
    // ... fetch and clean content ...
    
    res.json({ content: cleanContent });
}
```

## 🔧 Troubleshooting

### Local Proxy Issues
- **Port 3001 in use**: Change PORT in `cors-proxy-server.js`
- **Dependencies fail**: Ensure Node.js 16+ is installed
- **Network errors**: Check firewall settings

### Browser Issues
- **Still getting CORS**: Clear browser cache
- **Extension conflicts**: Disable other extensions
- **Mixed content**: Ensure HTTPS if needed

## 📊 Performance Comparison

| Method | Reliability | Setup | Security | Speed |
|--------|-------------|-------|----------|-------|
| Local Proxy | ⭐⭐⭐⭐⭐ | Medium | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Browser Config | ⭐⭐⭐ | Easy | ⭐ | ⭐⭐⭐⭐⭐ |
| Extension | ⭐⭐⭐ | Easy | ⭐⭐ | ⭐⭐⭐⭐ |
| Public Proxy | ⭐⭐ | None | ⭐⭐⭐ | ⭐⭐ |

## 🎯 Recommended Approach

1. **Development**: Use local proxy server
2. **Production**: Deploy proxy to cloud service
3. **Quick testing**: Browser extension
4. **Fallback**: Manual content input (already implemented)

The local proxy server provides the best balance of reliability, security, and performance.