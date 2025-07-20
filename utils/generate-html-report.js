#!/usr/bin/env node

// Generate HTML Performance Report
// Creates a comprehensive report of platform module performance

const fs = require('fs').promises;
const path = require('path');

async function generateReport() {
    console.log('📊 Generating HTML Performance Report...');
    
    try {
        // Load data
        const patternsData = await fs.readFile('./data/platform-patterns.json', 'utf8');
        const patterns = JSON.parse(patternsData);
        
        let backlog = { non_standard_shopify_sites: [] };
        try {
            const backlogData = await fs.readFile('./data/backlog-sites.json', 'utf8');
            backlog = JSON.parse(backlogData);
        } catch (e) {
            // No backlog
        }
        
        const reportDate = new Date().toLocaleString();
        
        // Calculate overall stats
        let totalSuccess = 0;
        let totalFailure = 0;
        let totalPlatforms = 0;
        let activePlatforms = 0;
        
        Object.values(patterns.platforms).forEach(platform => {
            totalPlatforms++;
            if (platform.success_count > 0 || platform.failure_count > 0) {
                activePlatforms++;
                totalSuccess += platform.success_count;
                totalFailure += platform.failure_count;
            }
        });
        
        const overallRate = totalSuccess + totalFailure > 0 
            ? ((totalSuccess / (totalSuccess + totalFailure)) * 100).toFixed(1)
            : 0;
        
        // Generate HTML
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Platform Analysis Performance Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 30px;
        }
        h1, h2, h3 { margin-bottom: 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #e9ecef;
        }
        .stat-card .value {
            font-size: 2.5em;
            font-weight: bold;
            color: #3498db;
        }
        .stat-card .label {
            color: #7f8c8d;
            margin-top: 5px;
        }
        
        .platform-section {
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 5px solid #3498db;
        }
        .success { color: #27ae60; }
        .failure { color: #e74c3c; }
        .warning { color: #f39c12; }
        
        .progress-bar {
            width: 100%;
            height: 30px;
            background: #ecf0f1;
            border-radius: 15px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: #27ae60;
            text-align: center;
            line-height: 30px;
            color: white;
            font-weight: bold;
        }
        
        .domain-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 10px 0;
        }
        .domain-chip {
            background: #3498db;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
        }
        
        .pattern-box {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
        }
        
        .backlog-item {
            background: #fff4e5;
            border-left: 4px solid #f39c12;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
        }
        
        .timestamp {
            text-align: right;
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 E-commerce Platform Analysis Report</h1>
        <p>Comprehensive performance metrics for automated product description analysis</p>
        
        <h2>📊 Overall Performance</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="value">${overallRate}%</div>
                <div class="label">Overall Success Rate</div>
            </div>
            <div class="stat-card">
                <div class="value">${totalSuccess}</div>
                <div class="label">Successful Analyses</div>
            </div>
            <div class="stat-card">
                <div class="value">${totalFailure}</div>
                <div class="label">Failed Attempts</div>
            </div>
            <div class="stat-card">
                <div class="value">${activePlatforms}/${totalPlatforms}</div>
                <div class="label">Active Platforms</div>
            </div>
        </div>
        
        <h2>📈 Platform-Specific Performance</h2>
        ${Object.entries(patterns.platforms).map(([key, platform]) => {
            const total = platform.success_count + platform.failure_count;
            const rate = total > 0 ? (platform.success_count / total * 100).toFixed(1) : 0;
            const isActive = total > 0;
            
            return `
        <div class="platform-section">
            <h3>${platform.name} ${isActive ? '✅ Active' : '⏳ Not Yet Tested'}</h3>
            
            ${isActive ? `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${rate}%">${rate}% Success Rate</div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="value success">${platform.success_count}</div>
                    <div class="label">Successful</div>
                </div>
                <div class="stat-card">
                    <div class="value failure">${platform.failure_count}</div>
                    <div class="label">Failed</div>
                </div>
                <div class="stat-card">
                    <div class="value">${platform.detection.confidence_threshold}</div>
                    <div class="label">Confidence Threshold</div>
                </div>
            </div>
            
            <h4>🔍 Confirmed Regex Patterns:</h4>
            <div class="pattern-box">
                PLP Pattern: ${platform.patterns.plp.confirmed_regex}<br>
                PDP Pattern: ${platform.patterns.pdp.confirmed_regex}
            </div>
            
            ${platform.verified_domains.length > 0 ? `
            <h4>✓ Verified Domains (${platform.verified_domains.length}):</h4>
            <div class="domain-list">
                ${platform.verified_domains.map(domain => 
                    `<span class="domain-chip">${domain}</span>`
                ).join('')}
            </div>
            ` : ''}
            ` : `
            <p>This platform has not been tested yet. Patterns are defined and ready for use.</p>
            <div class="pattern-box">
                PLP Pattern: ${platform.patterns.plp.confirmed_regex}<br>
                PDP Pattern: ${platform.patterns.pdp.confirmed_regex}
            </div>
            `}
        </div>
            `;
        }).join('')}
        
        ${backlog.non_standard_shopify_sites.length > 0 ? `
        <h2>📋 Backlog - Non-Standard Sites</h2>
        <p>These sites were detected as Shopify but don't follow standard URL patterns:</p>
        ${backlog.non_standard_shopify_sites.map(site => `
        <div class="backlog-item">
            <h4>${site.domain}</h4>
            <p><strong>Issue:</strong> ${site.issue}</p>
            <p><strong>Confidence:</strong> ${site.confidence} | <strong>Score:</strong> ${site.score || 'N/A'}</p>
            <p><small>${site.notes}</small></p>
        </div>
        `).join('')}
        ` : ''}
        
        <h2>🎯 Key Achievements</h2>
        <ul style="margin-left: 20px; line-height: 2;">
            <li>Successfully implemented pattern-first approach with regex learning</li>
            <li>Achieved ${overallRate}% overall success rate</li>
            <li>Automated detection and extraction for Shopify platform</li>
            <li>Built self-learning system that improves with each successful extraction</li>
            <li>Created modular architecture for easy platform expansion</li>
        </ul>
        
        <h2>🚀 Next Steps</h2>
        <ol style="margin-left: 20px; line-height: 2;">
            <li>Continue testing Shopify sites to reach 90%+ success rate</li>
            <li>Begin WooCommerce platform implementation</li>
            <li>Handle non-standard sites in backlog</li>
            <li>Implement geographic location spoofing for international sites</li>
        </ol>
        
        <div class="timestamp">
            Report generated on ${reportDate}<br>
            Last pattern update: ${new Date(patterns.last_updated).toLocaleString()}
        </div>
    </div>
</body>
</html>`;
        
        // Save report
        const reportPath = path.join(__dirname, '../reports');
        await fs.mkdir(reportPath, { recursive: true });
        
        const filename = `performance-report-${new Date().toISOString().split('T')[0]}.html`;
        const filepath = path.join(reportPath, filename);
        
        await fs.writeFile(filepath, html);
        
        console.log(`✅ Report generated: ${filepath}`);
        console.log(`📊 Overall Success Rate: ${overallRate}%`);
        console.log(`🎯 Active Platforms: ${activePlatforms}/${totalPlatforms}`);
        
        // Also save latest.html for easy access
        await fs.writeFile(path.join(reportPath, 'latest.html'), html);
        
        return filepath;
        
    } catch (error) {
        console.error('Failed to generate report:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    generateReport();
}

module.exports = generateReport;