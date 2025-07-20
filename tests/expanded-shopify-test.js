#!/usr/bin/env node

// Expanded Shopify Test Suite
// Tests a wider variety of Shopify stores to discover patterns

const ShopifyPlatform = require('../modules/platforms/shopify');

// Diverse set of Shopify stores across different industries
const TEST_SITES = [
    // Original test sites
    { domain: 'wholelattelove.com', category: 'coffee' },
    { domain: 'allbirds.com', category: 'footwear' },
    { domain: 'bombas.com', category: 'apparel' },
    
    // Additional Shopify stores
    { domain: 'gymshark.com', category: 'fitness apparel' },
    { domain: 'mvmtwatches.com', category: 'watches' },
    { domain: 'colourpop.com', category: 'cosmetics' },
    { domain: 'kylieskkin.com', category: 'beauty' },
    { domain: 'fashionnova.com', category: 'fashion' },
    { domain: 'chubbiesshorts.com', category: 'apparel' },
    { domain: 'rothys.com', category: 'sustainable shoes' },
    { domain: 'tattly.com', category: 'temporary tattoos' },
    { domain: 'piperwai.com', category: 'personal care' },
    { domain: 'deathwishcoffee.com', category: 'coffee' },
    { domain: 'partakefoods.com', category: 'food' },
    { domain: 'beardbrand.com', category: 'grooming' }
];

class ExpandedShopifyTest {
    constructor() {
        this.shopify = new ShopifyPlatform('http://localhost:3001');
        this.results = [];
        this.patterns = {
            plp: new Set(),
            pdp: new Set(),
            detection: new Map()
        };
    }
    
    async testSite(siteInfo) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🧪 Testing: ${siteInfo.domain} (${siteInfo.category})`);
        console.log('='.repeat(60));
        
        const startTime = Date.now();
        
        try {
            // Fetch homepage for detection
            const homepageUrl = `https://${siteInfo.domain}`;
            const response = await fetch(`http://localhost:3001/fetch-raw-page?url=${encodeURIComponent(homepageUrl)}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error('Failed to fetch homepage');
            }
            
            // Run full Shopify analysis
            const result = await this.shopify.analyze(siteInfo.domain, data.content);
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            
            // Collect patterns if successful
            if (result.success) {
                this.collectPatterns(result, siteInfo);
            }
            
            // Display results
            this.displayResult(result, duration);
            
            this.results.push({
                ...siteInfo,
                success: result.success,
                duration,
                result
            });
            
        } catch (error) {
            console.error(`💥 Exception: ${error.message}`);
            this.results.push({
                ...siteInfo,
                success: false,
                error: error.message
            });
        }
    }
    
    collectPatterns(result, siteInfo) {
        // Collect PLP patterns
        if (result.plp && result.plp.url) {
            const plpPath = new URL(result.plp.url).pathname;
            this.patterns.plp.add(plpPath);
        }
        
        // Collect detection patterns
        if (result.detection && result.detection.matchedPatterns) {
            result.detection.matchedPatterns.forEach(pattern => {
                const key = pattern.pattern;
                if (!this.patterns.detection.has(key)) {
                    this.patterns.detection.set(key, {
                        count: 0,
                        sites: [],
                        avgWeight: pattern.weight
                    });
                }
                const patternData = this.patterns.detection.get(key);
                patternData.count++;
                patternData.sites.push(siteInfo.domain);
            });
        }
        
        // Collect PDP patterns
        if (result.products && result.products.length > 0) {
            result.products.forEach(product => {
                if (product.url) {
                    const pdpPath = new URL(product.url).pathname;
                    // Extract pattern (remove specific product slug)
                    const pattern = pdpPath.replace(/\/[^\/]+$/, '/*');
                    this.patterns.pdp.add(pattern);
                }
            });
        }
    }
    
    displayResult(result, duration) {
        if (result.success) {
            console.log(`\n✅ SUCCESS in ${duration}s`);
            console.log(`📊 Detection: Shopify (${result.detection.confidenceLevel} confidence, score: ${result.detection.score})`);
            console.log(`📋 PLP: ${result.plp.url}`);
            console.log(`🛍️ Products: Found ${result.summary.productsFound}, analyzed ${result.products.length}`);
        } else {
            console.log(`\n❌ FAILED in ${duration}s`);
            console.log(`   Error: ${result.error}`);
            if (result.detection) {
                console.log(`   Detection score: ${result.detection.score}`);
            }
        }
    }
    
    async runAllTests() {
        console.log('🚀 Expanded Shopify Test Suite');
        console.log(`📅 ${new Date().toLocaleString()}`);
        console.log(`🏪 Testing ${TEST_SITES.length} Shopify stores`);
        
        for (let i = 0; i < TEST_SITES.length; i++) {
            const site = TEST_SITES[i];
            console.log(`\n📍 Progress: ${i + 1}/${TEST_SITES.length}`);
            
            await this.testSite(site);
            
            // Rate limiting
            if (i < TEST_SITES.length - 1) {
                console.log('\n⏳ Waiting 2 seconds...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        this.printSummary();
        this.analyzePatterns();
    }
    
    printSummary() {
        console.log(`\n\n${'='.repeat(60)}`);
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        
        const successful = this.results.filter(r => r.success).length;
        const failed = this.results.filter(r => !r.success).length;
        
        console.log(`\n✅ Successful: ${successful}/${this.results.length}`);
        console.log(`❌ Failed: ${failed}/${this.results.length}`);
        console.log(`📈 Success Rate: ${((successful / this.results.length) * 100).toFixed(1)}%`);
        
        // Group by category
        const byCategory = {};
        this.results.forEach(result => {
            if (!byCategory[result.category]) {
                byCategory[result.category] = { success: 0, failed: 0 };
            }
            if (result.success) {
                byCategory[result.category].success++;
            } else {
                byCategory[result.category].failed++;
            }
        });
        
        console.log('\n📦 Results by Category:');
        Object.entries(byCategory).forEach(([category, stats]) => {
            const total = stats.success + stats.failed;
            const rate = ((stats.success / total) * 100).toFixed(0);
            console.log(`   ${category}: ${stats.success}/${total} (${rate}%)`);
        });
    }
    
    analyzePatterns() {
        console.log(`\n\n${'='.repeat(60)}`);
        console.log('🔍 PATTERN ANALYSIS');
        console.log('='.repeat(60));
        
        // PLP Patterns
        console.log('\n📋 Product Listing Page Patterns:');
        const plpPatterns = Array.from(this.patterns.plp).sort();
        const plpGroups = {};
        
        plpPatterns.forEach(pattern => {
            const base = pattern.split('/')[1] || 'root';
            if (!plpGroups[base]) plpGroups[base] = [];
            plpGroups[base].push(pattern);
        });
        
        Object.entries(plpGroups).forEach(([base, patterns]) => {
            console.log(`   /${base}/* (${patterns.length} variations)`);
            if (patterns.length <= 3) {
                patterns.forEach(p => console.log(`      ${p}`));
            }
        });
        
        // Detection Patterns
        console.log('\n🎯 Most Effective Detection Patterns:');
        const sortedDetection = Array.from(this.patterns.detection.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10);
        
        sortedDetection.forEach(([pattern, data]) => {
            console.log(`   ${pattern}: ${data.count} sites (weight: ${data.avgWeight})`);
        });
        
        // PDP Patterns
        console.log('\n🛍️ Product Detail Page Patterns:');
        const pdpPatterns = Array.from(this.patterns.pdp);
        const pdpGroups = {};
        
        pdpPatterns.forEach(pattern => {
            const base = pattern.match(/^(\/[^\/]+\/[^\/]+)/)?.[1] || pattern;
            if (!pdpGroups[base]) pdpGroups[base] = 0;
            pdpGroups[base]++;
        });
        
        Object.entries(pdpGroups)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([pattern, count]) => {
                console.log(`   ${pattern}/*: ${count} occurrences`);
            });
    }
}

// Run expanded test
const test = new ExpandedShopifyTest();
test.runAllTests().catch(console.error);