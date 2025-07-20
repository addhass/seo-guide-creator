#!/usr/bin/env node

// Quick Shopify Test - Test 5 sites
const ShopifyPlatform = require('../modules/platforms/shopify');

const TEST_SITES = [
    { domain: 'gymshark.com', category: 'fitness apparel' },
    { domain: 'mvmtwatches.com', category: 'watches' },
    { domain: 'colourpop.com', category: 'cosmetics' },
    { domain: 'rothys.com', category: 'sustainable shoes' },
    { domain: 'deathwishcoffee.com', category: 'coffee' }
];

async function testSite(shopify, siteInfo) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🧪 Testing: ${siteInfo.domain} (${siteInfo.category})`);
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    
    try {
        // Fetch homepage
        const homepageUrl = `https://${siteInfo.domain}`;
        const response = await fetch(`http://localhost:3001/fetch-raw-page?url=${encodeURIComponent(homepageUrl)}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Failed to fetch homepage');
        }
        
        // Run analysis
        const result = await shopify.analyze(siteInfo.domain, data.content);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        if (result.success) {
            console.log(`\n✅ SUCCESS in ${duration}s`);
            console.log(`📊 Score: ${result.detection.score}`);
            console.log(`📋 PLP: ${result.plp.url}`);
            console.log(`🛍️ Products: ${result.summary.productsFound} found`);
        } else {
            console.log(`\n❌ FAILED in ${duration}s`);
            console.log(`   Error: ${result.error}`);
        }
        
        return { ...siteInfo, success: result.success, duration };
        
    } catch (error) {
        console.error(`💥 Error: ${error.message}`);
        return { ...siteInfo, success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🚀 Quick Shopify Test');
    console.log(`📅 ${new Date().toLocaleString()}`);
    
    const shopify = new ShopifyPlatform('http://localhost:3001');
    const results = [];
    
    for (const site of TEST_SITES) {
        const result = await testSite(shopify, site);
        results.push(result);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    console.log(`\n\n${'='.repeat(50)}`);
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    
    const successful = results.filter(r => r.success).length;
    console.log(`\n✅ Success Rate: ${successful}/${results.length} (${(successful/results.length*100).toFixed(0)}%)`);
    
    results.forEach(r => {
        const icon = r.success ? '✅' : '❌';
        console.log(`${icon} ${r.domain.padEnd(25)} ${r.category}`);
    });
}

runTests().catch(console.error);