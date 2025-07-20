#!/usr/bin/env node

// View Pattern Learning Insights
// Shows what the system has learned from successful extractions

const PatternLearner = require('../utils/pattern-learner');
const fs = require('fs').promises;

async function viewInsights() {
    console.log('🎓 Pattern Learning Insights');
    console.log(`📅 ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    
    const learner = new PatternLearner();
    
    // Wait for learner to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get insights
    const insights = learner.getInsights();
    
    console.log('\n📊 Overall Statistics:');
    console.log(`   Total sites tested: ${insights.totalSites}`);
    console.log(`   Success rate: ${insights.successRate}%`);
    
    console.log('\n🎯 Top Detection Patterns:');
    insights.topDetectionPatterns.forEach((pattern, i) => {
        console.log(`   ${i+1}. ${pattern.pattern}`);
        console.log(`      Occurrences: ${pattern.occurrences} (${pattern.sites} unique sites)`);
    });
    
    console.log('\n📋 Common PLP Paths:');
    insights.commonPlpPaths.forEach((path, i) => {
        console.log(`   ${i+1}. ${path.path} - ${path.count} occurrences (${path.sites} sites)`);
    });
    
    if (insights.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        insights.recommendations.forEach(rec => {
            console.log(`   - ${rec}`);
        });
    }
    
    // Get reinforced patterns
    const reinforced = learner.getReinforcedPatterns('shopify');
    
    if (reinforced) {
        console.log('\n🔧 Reinforced Patterns:');
        console.log(`   Confidence threshold: ${reinforced.confidenceThreshold}`);
        
        if (reinforced.detection.length > 0) {
            console.log('\n   Detection patterns with high confidence:');
            reinforced.detection.slice(0, 5).forEach(p => {
                console.log(`   - ${p.pattern} (weight: ${p.weight}, confidence: ${p.confidence.toFixed(1)}%)`);
            });
        }
        
        if (reinforced.plpPaths.length > 0) {
            console.log('\n   Most successful PLP paths:');
            reinforced.plpPaths.slice(0, 5).forEach(path => {
                console.log(`   - ${path}`);
            });
        }
    }
    
    // Check backlog
    try {
        const backlogData = await fs.readFile('./data/backlog-sites.json', 'utf8');
        const backlog = JSON.parse(backlogData);
        
        if (backlog.non_standard_shopify_sites.length > 0) {
            console.log('\n📋 Sites in Backlog (non-standard patterns):');
            backlog.non_standard_shopify_sites.forEach(site => {
                console.log(`   - ${site.domain}: ${site.issue}`);
                console.log(`     Confidence: ${site.confidence}, Score: ${site.score || 'N/A'}`);
            });
        }
    } catch (e) {
        // No backlog file
    }
    
    // Generate regex patterns
    console.log('\n🔍 Generated Regex Patterns:');
    const regexPatterns = learner.generateRegexFromPaths(
        Array.from(learner.knowledge.platforms.shopify.plp.paths.entries())
    );
    
    regexPatterns.forEach(pattern => {
        console.log(`   ${pattern.description}: ${pattern.regex}`);
        console.log(`   Confidence: ${pattern.confidence.toFixed(1)}%`);
    });
}

viewInsights().catch(console.error);