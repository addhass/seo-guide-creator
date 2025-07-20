#!/usr/bin/env node

// Automated Product Analysis Test Runner
// Run with: node tests/run-product-analysis-test.js

const CompetitorProductAnalyzer = require('../utils/competitor-product-analyzer.js');

// Focus on Shopify sites only for now
const SHOPIFY_TEST_DOMAINS = [
    'allbirds.com',          // Shopify - shoes
    'gymshark.com',          // Shopify - fitness apparel  
    'glossier.com',          // Shopify - beauty
    'bombas.com',            // Shopify - socks
    'mvmtwatches.com',       // Shopify - watches
    'kylicosmetics.com',     // Shopify - cosmetics
    'fashionnova.com',       // Shopify - fashion
    'colourpop.com',         // Shopify - makeup
    'skims.com',             // Shopify - shapewear
    'wholelattelove.com'     // Shopify - coffee machines
];

const TEST_DOMAINS = SHOPIFY_TEST_DOMAINS;

class AutomatedTest {
    constructor() {
        this.analyzer = new CompetitorProductAnalyzer();
        this.results = [];
    }

    async runTest(domain) {
        console.log('\n' + '='.repeat(60));
        console.log(`🧪 Testing: ${domain}`);
        console.log('='.repeat(60));
        
        const startTime = Date.now();
        
        try {
            console.log(`⏱️  Starting at ${new Date().toLocaleTimeString()}`);
            const result = await this.analyzer.analyzeCompetitor(domain);
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            
            if (result.success) {
                console.log(`\n✅ SUCCESS in ${duration}s`);
                console.log(`📍 Platform: ${result.platform || 'Unknown'}`);
                console.log(`📋 PLP: ${result.plpUrl}`);
                console.log(`📦 Products found: ${result.products?.length || 0}`);
                
                if (result.products && result.products.length > 0) {
                    console.log('\n🛍️ Sample Products:');
                    result.products.slice(0, 3).forEach((product, i) => {
                        console.log(`  ${i + 1}. ${product.productName || 'Unknown'}`);
                        console.log(`     Words: ${product.descriptionWordCount || 0}`);
                    });
                }
                
                if (result.analysis?.RECOMMENDATIONS) {
                    console.log('\n💡 Key Insights:');
                    const recs = result.analysis.RECOMMENDATIONS.keyTakeaways || [];
                    recs.slice(0, 3).forEach(rec => console.log(`  - ${rec}`));
                }
            } else {
                console.log(`\n❌ FAILED in ${duration}s`);
                console.log(`Error: ${result.error}`);
            }
            
            this.results.push({
                domain,
                success: result.success,
                duration,
                productCount: result.products?.length || 0,
                platform: result.platform,
                error: result.error
            });
            
        } catch (error) {
            console.log(`\n💥 EXCEPTION: ${error.message}`);
            this.results.push({
                domain,
                success: false,
                duration: ((Date.now() - startTime) / 1000).toFixed(1),
                error: error.message
            });
        }
    }

    async runAllTests() {
        console.log('🚀 Starting Automated Product Analysis Tests');
        console.log(`📅 ${new Date().toLocaleString()}`);
        console.log(`🔧 Testing ${TEST_DOMAINS.length} domains`);
        
        for (const domain of TEST_DOMAINS) {
            await this.runTest(domain);
            
            // Wait between tests to be respectful
            if (TEST_DOMAINS.indexOf(domain) < TEST_DOMAINS.length - 1) {
                console.log('\n⏳ Waiting 5 seconds before next test...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        this.printSummary();
    }

    async runSingleTest(domain) {
        console.log('🚀 Running Single Domain Test');
        console.log(`📅 ${new Date().toLocaleString()}`);
        
        await this.runTest(domain);
        this.printSummary();
    }

    printSummary() {
        console.log('\n\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        
        const successful = this.results.filter(r => r.success).length;
        const failed = this.results.filter(r => !r.success).length;
        
        console.log(`\n✅ Successful: ${successful}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${((successful / this.results.length) * 100).toFixed(1)}%`);
        
        console.log('\n📋 Detailed Results:');
        console.log('-'.repeat(60));
        
        this.results.forEach(result => {
            const status = result.success ? '✅' : '❌';
            const platform = result.platform ? `[${result.platform}]` : '[Unknown]';
            const products = result.success ? `${result.productCount} products` : result.error;
            
            console.log(`${status} ${result.domain.padEnd(20)} ${platform.padEnd(15)} ${result.duration}s - ${products}`);
        });
        
        // Platform breakdown
        const platforms = {};
        this.results.filter(r => r.success).forEach(r => {
            const p = r.platform || 'Unknown';
            platforms[p] = (platforms[p] || 0) + 1;
        });
        
        console.log('\n🏪 Platform Breakdown:');
        Object.entries(platforms).forEach(([platform, count]) => {
            console.log(`  ${platform}: ${count}`);
        });
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ Test Complete!');
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const test = new AutomatedTest();

if (args.length > 0) {
    // Test specific domain
    const domain = args[0];
    console.log(`Testing single domain: ${domain}`);
    test.runSingleTest(domain).catch(console.error);
} else {
    // Test all domains
    console.log('Testing all predefined domains...');
    test.runAllTests().catch(console.error);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Test interrupted by user');
    test.printSummary();
    process.exit(0);
});