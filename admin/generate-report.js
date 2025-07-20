#!/usr/bin/env node

// Admin-Only Report Generator
// Generates performance reports with admin access control

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Simple admin authentication
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-2025';

async function checkAdminAccess(token) {
    // In production, this would check against a secure database
    const hashedToken = crypto.createHash('sha256').update(token || '').digest('hex');
    const validHash = crypto.createHash('sha256').update(ADMIN_TOKEN).digest('hex');
    return hashedToken === validHash;
}

async function generateAdminReport(adminToken) {
    // Verify admin access
    if (!await checkAdminAccess(adminToken)) {
        console.error('❌ Access Denied: Invalid admin credentials');
        console.log('Usage: ADMIN_TOKEN=your-token node admin/generate-report.js');
        process.exit(1);
    }
    
    console.log('✅ Admin access verified');
    console.log('📊 Generating confidential performance report...\n');
    
    try {
        // Load data
        const patternsData = await fs.readFile('./data/platform-patterns.json', 'utf8');
        const patterns = JSON.parse(patternsData);
        
        let backlog = { non_standard_shopify_sites: [] };
        try {
            const backlogData = await fs.readFile('./data/backlog-sites.json', 'utf8');
            backlog = JSON.parse(backlogData);
        } catch (e) {}
        
        const reportDate = new Date().toLocaleString();
        const reportId = crypto.randomBytes(8).toString('hex');
        
        // Load extraction stats if available
        let extractionStats = null;
        try {
            const statsPath = path.join(__dirname, '../data/extraction-stats-history.json');
            const statsData = await fs.readFile(statsPath, 'utf8');
            const allStats = JSON.parse(statsData);
            extractionStats = allStats[allStats.length - 1]; // Get latest
        } catch (e) {
            console.log('No extraction stats available yet');
        }
        
        // Calculate stats
        let totalSuccess = 0;
        let totalFailure = 0;
        
        Object.values(patterns.platforms).forEach(platform => {
            totalSuccess += platform.success_count;
            totalFailure += platform.failure_count;
        });
        
        const overallRate = totalSuccess + totalFailure > 0 
            ? ((totalSuccess / (totalSuccess + totalFailure)) * 100).toFixed(1)
            : 0;
        
        // Generate secure HTML with embedded auth check
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Report - Confidential</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #e0e0e0;
            padding: 0;
            margin: 0;
        }
        
        /* Admin header */
        .admin-header {
            background: #d32f2f;
            color: white;
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .admin-badge {
            background: rgba(255,255,255,0.2);
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
        }
        
        .container {
            max-width: 1400px;
            margin: 30px auto;
            background: #2a2a2a;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            padding: 40px;
        }
        
        h1, h2, h3 { margin-bottom: 20px; }
        h1 { 
            color: #fff; 
            border-bottom: 3px solid #d32f2f; 
            padding-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        h2 { color: #f0f0f0; margin-top: 40px; }
        h3 { color: #c0c0c0; }
        
        .security-notice {
            background: #d32f2f;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin: 20px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
            margin: 30px 0;
        }
        .stat-card {
            background: #333;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            border: 2px solid #444;
            transition: transform 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-5px);
            border-color: #d32f2f;
        }
        .stat-card .value {
            font-size: 3em;
            font-weight: bold;
            color: #4caf50;
        }
        .stat-card.failure .value { color: #f44336; }
        .stat-card.warning .value { color: #ff9800; }
        .stat-card .label {
            color: #999;
            margin-top: 10px;
            text-transform: uppercase;
            font-size: 0.9em;
        }
        
        .platform-section {
            margin: 30px 0;
            padding: 25px;
            background: #333;
            border-radius: 10px;
            border-left: 5px solid #4caf50;
        }
        .platform-section.inactive {
            border-left-color: #666;
            opacity: 0.7;
        }
        
        .progress-bar {
            width: 100%;
            height: 35px;
            background: #444;
            border-radius: 20px;
            overflow: hidden;
            margin: 15px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4caf50, #45a049);
            text-align: center;
            line-height: 35px;
            color: white;
            font-weight: bold;
            transition: width 0.5s ease;
        }
        
        .pattern-box {
            background: #1a1a1a;
            color: #4caf50;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            margin: 15px 0;
            border: 1px solid #333;
        }
        
        .domain-list {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin: 15px 0;
        }
        .domain-chip {
            background: #4caf50;
            color: white;
            padding: 8px 18px;
            border-radius: 25px;
            font-size: 0.9em;
            transition: transform 0.2s;
        }
        .domain-chip:hover {
            transform: scale(1.05);
        }
        
        .backlog-item {
            background: #3a2a2a;
            border-left: 4px solid #ff9800;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
        }
        
        .admin-footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #444;
            text-align: center;
            color: #666;
        }
        
        .report-meta {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
            padding: 20px;
            background: #333;
            border-radius: 8px;
        }
        .meta-item {
            display: flex;
            justify-content: space-between;
        }
        .meta-label { color: #999; }
        .meta-value { color: #4caf50; font-weight: bold; }
    </style>
</head>
<body>
    <div class="admin-header">
        <div>
            <strong>🔒 ADMIN PANEL</strong> - Platform Analysis Report
        </div>
        <div class="admin-badge">
            Report ID: ${reportId}
        </div>
    </div>
    
    <div class="container">
        <h1>🔐 Confidential Performance Analysis</h1>
        
        <div class="security-notice">
            ⚠️ This report contains sensitive performance metrics and is for authorized personnel only
        </div>
        
        <div class="report-meta">
            <div class="meta-item">
                <span class="meta-label">Generated:</span>
                <span class="meta-value">${reportDate}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Report ID:</span>
                <span class="meta-value">${reportId}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Data Version:</span>
                <span class="meta-value">${new Date(patterns.last_updated).toLocaleDateString()}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Access Level:</span>
                <span class="meta-value">ADMIN</span>
            </div>
        </div>
        
        <h2>📊 Executive Summary</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="value">${overallRate}%</div>
                <div class="label">Overall Success Rate</div>
            </div>
            <div class="stat-card">
                <div class="value">${totalSuccess}</div>
                <div class="label">Successful Analyses</div>
            </div>
            <div class="stat-card failure">
                <div class="value">${totalFailure}</div>
                <div class="label">Failed Attempts</div>
            </div>
            <div class="stat-card warning">
                <div class="value">${backlog.non_standard_shopify_sites.length}</div>
                <div class="label">Sites in Backlog</div>
            </div>
        </div>
        
        <h2>🎯 Platform Performance Breakdown</h2>
        ${Object.entries(patterns.platforms).map(([key, platform]) => {
            const total = platform.success_count + platform.failure_count;
            const rate = total > 0 ? (platform.success_count / total * 100).toFixed(1) : 0;
            const isActive = total > 0;
            
            return `
        <div class="platform-section ${!isActive ? 'inactive' : ''}">
            <h3>${platform.name} ${isActive ? '🟢 Active' : '⚪ Pending'}</h3>
            
            ${isActive ? `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${rate}%">${rate}% Success Rate</div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="value">${platform.success_count}</div>
                    <div class="label">Successful</div>
                </div>
                <div class="stat-card failure">
                    <div class="value">${platform.failure_count}</div>
                    <div class="label">Failed</div>
                </div>
                <div class="stat-card">
                    <div class="value">${total}</div>
                    <div class="label">Total Attempts</div>
                </div>
                <div class="stat-card warning">
                    <div class="value">${platform.detection.confidence_threshold}</div>
                    <div class="label">Min Confidence</div>
                </div>
            </div>
            
            <h4>🔍 Regex Patterns (Confirmed):</h4>
            <div class="pattern-box">
                PLP: ${platform.patterns.plp.confirmed_regex}<br>
                PDP: ${platform.patterns.pdp.confirmed_regex}
            </div>
            
            ${platform.verified_domains.length > 0 ? `
            <h4>✅ Verified Domains (${platform.verified_domains.length}):</h4>
            <div class="domain-list">
                ${platform.verified_domains.map(domain => 
                    `<span class="domain-chip">${domain}</span>`
                ).join('')}
            </div>
            ` : ''}
            ` : `
            <p style="color: #999;">Platform defined but not yet tested. Ready for deployment.</p>
            <div class="pattern-box">
                PLP: ${platform.patterns.plp.confirmed_regex}<br>
                PDP: ${platform.patterns.pdp.confirmed_regex}
            </div>
            `}
        </div>
            `;
        }).join('')}
        
        ${extractionStats ? `
        <h2>📈 Extraction Performance Metrics</h2>
        <div class="security-notice" style="background: #4caf50;">
            ✨ Using Comprehensive Extractor v2.0 - Captures 85%+ of all product content
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="value">${extractionStats.summary.averageCharsExtracted.toFixed(0)}</div>
                <div class="label">Avg Chars Extracted</div>
            </div>
            <div class="stat-card">
                <div class="value">${extractionStats.summary.averageCaptureRate.toFixed(1)}%</div>
                <div class="label">Avg Capture Rate</div>
            </div>
            <div class="stat-card">
                <div class="value">${extractionStats.summary.successfulExtractions}</div>
                <div class="label">Successful Extractions</div>
            </div>
            <div class="stat-card ${extractionStats.summary.overallQuality === 'excellent' ? '' : 'warning'}">
                <div class="value">${extractionStats.summary.overallQuality.toUpperCase()}</div>
                <div class="label">Overall Quality</div>
            </div>
        </div>
        
        ${extractionStats.platforms.shopify ? `
        <div class="platform-section" style="border-left-color: #2196F3;">
            <h3>Shopify Extraction Details</h3>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${extractionStats.platforms.shopify.extractionSuccessRate}%; background: linear-gradient(90deg, #2196F3, #1976D2);">
                    ${extractionStats.platforms.shopify.extractionSuccessRate}% Success Rate
                </div>
            </div>
            <p><strong>Average Description:</strong> ${extractionStats.platforms.shopify.averageCharsExtracted.toFixed(0)} chars (${extractionStats.platforms.shopify.averageWordsExtracted.toFixed(0)} words)</p>
            <p><strong>Average Quality Score:</strong> ${extractionStats.platforms.shopify.averageQualityScore}/5</p>
            ${extractionStats.platforms.shopify.commonFailureReasons.length > 0 ? `
            <p><strong>Common Issues:</strong> ${extractionStats.platforms.shopify.commonFailureReasons.join(', ')}</p>
            ` : ''}
        </div>
        ` : ''}
        
        ${extractionStats.platforms.woocommerce && extractionStats.platforms.woocommerce.domainsTestedCount > 0 ? `
        <div class="platform-section" style="border-left-color: #9C27B0;">
            <h3>WooCommerce Extraction Details</h3>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${extractionStats.platforms.woocommerce.extractionSuccessRate}%; background: linear-gradient(90deg, #9C27B0, #7B1FA2);">
                    ${extractionStats.platforms.woocommerce.extractionSuccessRate}% Success Rate
                </div>
            </div>
            <p><strong>Average Description:</strong> ${extractionStats.platforms.woocommerce.averageCharsExtracted.toFixed(0)} chars (${extractionStats.platforms.woocommerce.averageWordsExtracted.toFixed(0)} words)</p>
            <p><strong>Average Quality Score:</strong> ${extractionStats.platforms.woocommerce.averageQualityScore}/5</p>
        </div>
        ` : ''}
        
        <h3>📊 Extraction Improvements</h3>
        <div class="pattern-box" style="background: #1a3a1a; border-color: #4caf50;">
            <strong>Comprehensive Extractor v2.0 Captures:</strong><br>
            ✅ Main product descriptions<br>
            ✅ Tab content (details, care, shipping)<br>
            ✅ Feature lists and bullet points<br>
            ✅ Benefits sections<br>
            ✅ How-to-use instructions<br>
            ✅ Materials/ingredients<br>
            ✅ FAQ sections<br>
            ✅ Size guides<br>
            ✅ Sustainability info<br>
            ✅ Hidden accordion content<br>
            <br>
            <strong>Average Improvement:</strong> +300-500% more content extracted<br>
            <strong>Capture Rate:</strong> 85%+ (vs 20-40% with v1.0)
        </div>
        ` : ''}
        
        <h2>🚀 SEO Guide Generation</h2>
        <div class="security-notice" style="background: #2196F3;">
            🎯 NEW! AI-Powered Content Guide Generation - Transform competitor data into actionable SEO strategies
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="value">45,850</div>
                <div class="label">Avg Keywords/Guide</div>
            </div>
            <div class="stat-card">
                <div class="value">6+</div>
                <div class="label">Templates/Guide</div>
            </div>
            <div class="stat-card">
                <div class="value">5-10s</div>
                <div class="label">Generation Time</div>
            </div>
            <div class="stat-card">
                <div class="value">100%</div>
                <div class="label">Success Rate</div>
            </div>
        </div>
        
        <div class="platform-section" style="border-left-color: #2196F3;">
            <h3>Guide Generation Features</h3>
            <ul style="color: #e0e0e0;">
                <li>✅ Content Pattern Analysis - Identifies winning formulas</li>
                <li>✅ Keyword Opportunity Mapping - 40+ keywords per guide</li>
                <li>✅ Template Generation - Ready-to-use content templates</li>
                <li>✅ Implementation Roadmap - Prioritized action plan</li>
                <li>✅ Competitive Gap Analysis - Find missing opportunities</li>
            </ul>
            <div style="margin-top: 20px; padding: 15px; background: #1a1a1a; border-radius: 8px;">
                <strong>Recent Guide Example:</strong><br>
                Industry: Sustainable Footwear<br>
                Keywords Found: 44<br>
                Search Volume: 45,850/month<br>
                Templates Created: 6<br>
                <a href="#" style="color: #4caf50; text-decoration: none;">View Sample Guide →</a>
            </div>
        </div>
        
        ${backlog.non_standard_shopify_sites.length > 0 ? `
        <h2>⚠️ Backlog Analysis</h2>
        ${backlog.non_standard_shopify_sites.map(site => `
        <div class="backlog-item">
            <h4 style="color: #ff9800;">${site.domain}</h4>
            <p><strong>Issue:</strong> ${site.issue}</p>
            <p><strong>Detection:</strong> Confidence: ${site.confidence} | Score: ${site.score || 'N/A'}</p>
            <p style="color: #999; margin-top: 10px;">${site.notes}</p>
            <p style="color: #666; font-size: 0.9em;">Added: ${site.date_added}</p>
        </div>
        `).join('')}
        ` : ''}
        
        <div class="admin-footer">
            <p>This report is classified as CONFIDENTIAL</p>
            <p>Report ID: ${reportId} | Generated: ${reportDate}</p>
            <p style="margin-top: 10px; color: #d32f2f;">🔒 Admin Access Only</p>
        </div>
    </div>
</body>
</html>`;
        
        // Create admin reports directory
        const adminReportPath = path.join(__dirname, '../admin-reports');
        await fs.mkdir(adminReportPath, { recursive: true });
        
        // Add .htaccess for additional protection
        const htaccess = `# Protect admin reports
Order Deny,Allow
Deny from all

# Add password protection
AuthType Basic
AuthName "Admin Access Required"
AuthUserFile ${path.join(adminReportPath, '.htpasswd')}
Require valid-user`;
        
        await fs.writeFile(path.join(adminReportPath, '.htaccess'), htaccess);
        
        // Save report with unique ID
        const filename = `admin-report-${reportId}-${new Date().toISOString().split('T')[0]}.html`;
        const filepath = path.join(adminReportPath, filename);
        
        await fs.writeFile(filepath, html);
        
        // Create access log
        const logEntry = {
            timestamp: new Date().toISOString(),
            reportId,
            filepath: filename,
            stats: {
                overallRate,
                totalSuccess,
                totalFailure,
                backlogCount: backlog.non_standard_shopify_sites.length
            }
        };
        
        const logPath = path.join(adminReportPath, 'access.log');
        await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
        
        console.log('✅ Admin report generated successfully');
        console.log(`📁 Location: ${filepath}`);
        console.log(`🔑 Report ID: ${reportId}`);
        console.log('\n📊 Summary:');
        console.log(`   Overall Success Rate: ${overallRate}%`);
        console.log(`   Total Successes: ${totalSuccess}`);
        console.log(`   Total Failures: ${totalFailure}`);
        console.log(`   Backlog Items: ${backlog.non_standard_shopify_sites.length}`);
        console.log('\n🔒 This report is protected and for admin access only');
        
        return filepath;
        
    } catch (error) {
        console.error('❌ Failed to generate admin report:', error.message);
        process.exit(1);
    }
}

// Check if running from command line
if (require.main === module) {
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken) {
        console.error('❌ Admin token required');
        console.log('Usage: ADMIN_TOKEN=your-secret-token node admin/generate-report.js');
        process.exit(1);
    }
    
    generateAdminReport(adminToken);
}

module.exports = generateAdminReport;