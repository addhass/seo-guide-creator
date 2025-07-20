#!/usr/bin/env node

// View Pattern Insights
// Shows what patterns have been learned

const fs = require('fs').promises;

async function viewInsights() {
    console.log('🎓 Pattern Learning Summary');
    console.log(`📅 ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    
    try {
        // Load platform patterns
        const patternsData = await fs.readFile('./data/platform-patterns.json', 'utf8');
        const patterns = JSON.parse(patternsData);
        
        console.log('\n📊 Platform Statistics:\n');
        
        for (const [platform, data] of Object.entries(patterns.platforms)) {
            if (data.success_count > 0 || data.failure_count > 0) {
                const total = data.success_count + data.failure_count;
                const rate = total > 0 ? (data.success_count / total * 100).toFixed(1) : 0;
                
                console.log(`${data.name}:`);
                console.log(`   ✅ Success: ${data.success_count}`);
                console.log(`   ❌ Failures: ${data.failure_count}`);
                console.log(`   📈 Success Rate: ${rate}%`);
                console.log(`   🔍 Detection Threshold: ${data.detection.confidence_threshold}`);
                
                if (data.verified_domains.length > 0) {
                    console.log(`   ✓ Verified sites: ${data.verified_domains.join(', ')}`);
                }
                
                console.log(`\n   📋 Confirmed Patterns:`);
                console.log(`   PLP: ${data.patterns.plp.confirmed_regex}`);
                console.log(`   PDP: ${data.patterns.pdp.confirmed_regex}`);
                
                console.log();
            }
        }
        
        // Load backlog
        try {
            const backlogData = await fs.readFile('./data/backlog-sites.json', 'utf8');
            const backlog = JSON.parse(backlogData);
            
            if (backlog.non_standard_shopify_sites.length > 0) {
                console.log('\n📋 Non-Standard Sites (Backlog):\n');
                backlog.non_standard_shopify_sites.forEach(site => {
                    console.log(`${site.domain}:`);
                    console.log(`   Issue: ${site.issue}`);
                    console.log(`   Confidence: ${site.confidence}, Score: ${site.score || 'N/A'}`);
                    console.log(`   Notes: ${site.notes}`);
                    console.log();
                });
            }
        } catch (e) {
            // No backlog
        }
        
        console.log('\n🚀 Next Steps:');
        console.log('   1. Continue testing more Shopify sites to reinforce patterns');
        console.log('   2. Handle backlog sites with non-standard patterns later');
        console.log('   3. Move to WooCommerce platform when Shopify is mastered');
        
    } catch (error) {
        console.error('Error loading pattern data:', error.message);
    }
}

viewInsights().catch(console.error);