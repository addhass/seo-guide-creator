#!/usr/bin/env node

// Admin Report Server
// Serves admin reports with token-based authentication

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 8888;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-2025';

// Generate secure access links
function generateAccessLink(reportFile, token) {
    const hash = crypto.createHash('sha256')
        .update(`${reportFile}-${token}`)
        .digest('hex')
        .substring(0, 16);
    return `http://localhost:${PORT}/report?file=${reportFile}&auth=${hash}`;
}

// Verify access token
function verifyAccess(reportFile, authHash) {
    const expectedHash = crypto.createHash('sha256')
        .update(`${reportFile}-${ADMIN_TOKEN}`)
        .digest('hex')
        .substring(0, 16);
    return authHash === expectedHash;
}

// Create server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Homepage - list available reports
    if (pathname === '/') {
        try {
            const reportsDir = path.join(__dirname, '../admin-reports');
            const files = await fs.readdir(reportsDir);
            const htmlFiles = files.filter(f => f.endsWith('.html') && f.startsWith('admin-report-'));
            
            const html = `<!DOCTYPE html>
<html>
<head>
    <title>Admin Report Portal</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #1a1a1a;
            color: #e0e0e0;
            padding: 40px;
            margin: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #2a2a2a;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        h1 {
            color: #fff;
            border-bottom: 3px solid #d32f2f;
            padding-bottom: 15px;
            margin-bottom: 30px;
        }
        .report-list {
            list-style: none;
            padding: 0;
        }
        .report-item {
            background: #333;
            margin: 10px 0;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #4caf50;
        }
        .report-link {
            color: #4caf50;
            text-decoration: none;
            font-weight: bold;
            display: block;
            margin-top: 10px;
        }
        .report-link:hover {
            color: #45a049;
        }
        .security-notice {
            background: #d32f2f;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .no-reports {
            text-align: center;
            color: #999;
            padding: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔒 Admin Report Portal</h1>
        <div class="security-notice">
            ⚠️ Secure links below include authentication tokens. Do not share!
        </div>
        
        ${htmlFiles.length > 0 ? `
        <h2>Available Reports:</h2>
        <ul class="report-list">
            ${htmlFiles.map(file => {
                const link = generateAccessLink(file, ADMIN_TOKEN);
                const reportId = file.match(/admin-report-([a-f0-9]+)-/)?.[1] || 'unknown';
                const date = file.match(/(\d{4}-\d{2}-\d{2})\.html$/)?.[1] || 'unknown';
                
                return `
                <li class="report-item">
                    <strong>Report ID:</strong> ${reportId}<br>
                    <strong>Date:</strong> ${date}<br>
                    <a href="${link}" class="report-link">🔗 View Secure Report</a>
                </li>`;
            }).join('')}
        </ul>
        ` : `
        <div class="no-reports">
            <p>No reports available yet.</p>
            <p>Generate one with: ADMIN_TOKEN=${ADMIN_TOKEN} node admin/generate-report.js</p>
        </div>
        `}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #444; color: #666; text-align: center;">
            Server running on port ${PORT}
        </div>
    </div>
</body>
</html>`;
            
            res.writeHead(200, { 
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Encoding': 'utf-8'
            });
            res.end(html);
            
        } catch (error) {
            res.writeHead(500);
            res.end('Server error');
        }
    }
    
    // Report viewing with auth
    else if (pathname === '/report') {
        const file = parsedUrl.query.file;
        const auth = parsedUrl.query.auth;
        
        if (!file || !auth) {
            res.writeHead(400);
            res.end('Missing parameters');
            return;
        }
        
        if (!verifyAccess(file, auth)) {
            res.writeHead(403);
            res.end(`<!DOCTYPE html>
<html>
<head>
    <title>Access Denied</title>
    <style>
        body {
            background: #1a1a1a;
            color: #e0e0e0;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .error {
            background: #d32f2f;
            padding: 40px;
            border-radius: 10px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="error">
        <h1>🚫 Access Denied</h1>
        <p>Invalid authentication token</p>
    </div>
</body>
</html>`);
            return;
        }
        
        try {
            const reportPath = path.join(__dirname, '../admin-reports', file);
            const content = await fs.readFile(reportPath, 'utf8');
            res.writeHead(200, { 
                'Content-Type': 'text/html; charset=utf-8'
            });
            res.end(content);
        } catch (error) {
            res.writeHead(404);
            res.end('Report not found');
        }
    }
    
    else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`
🚀 Admin Report Server Started
================================
🔗 Access URL: http://localhost:${PORT}
🔒 Token: ${ADMIN_TOKEN}

Direct report links are available at the homepage.
Links include authentication - do not share!

Press Ctrl+C to stop the server.
================================
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down admin server...');
    server.close();
    process.exit(0);
});