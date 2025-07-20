#!/usr/bin/env node

// Simple dashboard view for extraction progress

const fs = require('fs');
const path = require('path');

function viewDashboard() {
    console.clear();
    console.log('📊 PRODUCT DESCRIPTION EXTRACTION DASHBOARD');
    console.log('=' .repeat(60));
    console.log(`Generated: ${new Date().toLocaleString()}\n`);
    
    // Load stats history
    const statsPath = path.join(__dirname, '../data/extraction-stats-history.json');
    let history = [];
    
    try {
        if (fs.existsSync(statsPath)) {
            history = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        }
    } catch (error) {
        console.error('No stats history found. Run a test first!');
        return;
    }
    
    if (history.length === 0) {
        console.log('No data available. Run extraction tests to generate statistics.');
        return;
    }
    
    // Get latest run
    const latest = history[history.length - 1];
    
    // Current Performance
    console.log('📈 CURRENT PERFORMANCE');
    console.log('-'.repeat(30));
    console.log(`Latest Run: ${latest.testRunId}`);
    console.log(`Success Rate: ${Math.round((latest.summary.successfulExtractions / latest.summary.totalDomainsTested) * 100)}%`);
    console.log(`Avg Length: ${Math.round(latest.summary.averageCharsExtracted)} chars`);
    console.log(`Capture Rate: ${Math.round(latest.summary.averageCaptureRate)}%`);
    console.log(`Quality: ${latest.summary.overallQuality.toUpperCase()} ${getQualityStars(latest.summary.overallQuality)}`);
    
    // Platform Comparison
    console.log('\n🔍 PLATFORM COMPARISON');
    console.log('-'.repeat(30));
    console.log('Platform     | Detection | Success | Avg Chars | Quality');
    console.log('-------------|-----------|---------|-----------|--------');
    
    ['shopify', 'woocommerce'].forEach(platform => {
        const p = latest.platforms[platform];
        if (p.domainsTestedCount > 0) {
            console.log(
                `${platform.padEnd(12)} | ${String(p.detectionAccuracy + '%').padEnd(9)} | ${String(p.extractionSuccessRate + '%').padEnd(7)} | ${String(Math.round(p.averageCharsExtracted)).padEnd(9)} | ${getQualityStars(p.averageQualityScore)}`
            );
        }
    });
    
    // Content Coverage
    console.log('\n📋 CONTENT COVERAGE');
    console.log('-'.repeat(30));
    
    // Count what we're capturing vs missing
    const captured = {};
    const missed = {};
    
    latest.domainResults.forEach(result => {
        result.contentSources.captured.forEach(source => {
            captured[source] = (captured[source] || 0) + 1;
        });
        result.contentSources.missed.forEach(source => {
            missed[source] = (missed[source] || 0) + 1;
        });
    });
    
    console.log('✅ Capturing:');
    Object.entries(captured).forEach(([source, count]) => {
        const percent = Math.round((count / latest.summary.totalDomainsTested) * 100);
        console.log(`   ${source.replace(/_/g, ' ')}: ${percent}%`);
    });
    
    console.log('\n❌ Missing:');
    Object.entries(missed)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([source, count]) => {
            const percent = Math.round((count / latest.summary.totalDomainsTested) * 100);
            console.log(`   ${source.replace(/_/g, ' ')}: ${percent}%`);
        });
    
    // Progress Trend (if multiple runs)
    if (history.length > 1) {
        console.log('\n📊 PROGRESS TREND');
        console.log('-'.repeat(30));
        
        const recentRuns = history.slice(-5);
        recentRuns.forEach(run => {
            const captureBar = '█'.repeat(Math.round(run.summary.averageCaptureRate / 10));
            console.log(`${run.testRunId}: ${captureBar} ${Math.round(run.summary.averageCaptureRate)}%`);
        });
    }
    
    // Top Issues
    console.log('\n⚠️  TOP ISSUES');
    console.log('-'.repeat(30));
    
    const allIssues = {};
    latest.domainResults.forEach(result => {
        result.issues.forEach(issue => {
            allIssues[issue] = (allIssues[issue] || 0) + 1;
        });
    });
    
    Object.entries(allIssues)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([issue, count]) => {
            console.log(`• ${issue} (${count} occurrences)`);
        });
    
    if (Object.keys(allIssues).length === 0) {
        console.log('• No major issues detected');
    }
    
    // Recommendations
    if (latest.recommendations && latest.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS');
        console.log('-'.repeat(30));
        
        latest.recommendations.forEach(rec => {
            console.log(`[${rec.priority.toUpperCase()}] ${rec.description}`);
        });
    }
    
    // Quick Stats
    console.log('\n📊 QUICK STATS');
    console.log('-'.repeat(30));
    console.log(`Total Runs: ${history.length}`);
    console.log(`Domains Tracked: ${countUniqueDomains(history)}`);
    console.log(`Best Capture Rate: ${getBestCaptureRate(history)}%`);
    console.log(`Target: 80% capture rate`);
    
    console.log('\n' + '=' .repeat(60));
    console.log('💡 Run extraction tests to update these statistics');
}

function getQualityStars(quality) {
    if (typeof quality === 'number') {
        return '⭐'.repeat(Math.round(quality));
    }
    
    const map = {
        'excellent': '⭐⭐⭐⭐⭐',
        'good': '⭐⭐⭐⭐',
        'fair': '⭐⭐⭐',
        'poor': '⭐⭐',
        'unknown': '⭐'
    };
    
    return map[quality] || '⭐';
}

function countUniqueDomains(history) {
    const domains = new Set();
    history.forEach(run => {
        run.domainResults.forEach(result => {
            domains.add(result.domain);
        });
    });
    return domains.size;
}

function getBestCaptureRate(history) {
    let best = 0;
    history.forEach(run => {
        if (run.summary.averageCaptureRate > best) {
            best = run.summary.averageCaptureRate;
        }
    });
    return Math.round(best);
}

// Run dashboard
viewDashboard();