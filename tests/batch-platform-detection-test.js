#!/usr/bin/env node

// Batch Platform Detection Test
// Tests 10 Shopify + 10 WooCommerce sites for detection accuracy

const ShopifyDetector = require('../modules/platforms/shopify/detector');
const WooCommerceDetector = require('../modules/platforms/woocommerce/detector');

class BatchPlatformTest {
    constructor() {
        this.shopifyDetector = new ShopifyDetector();
        this.wcDetector = new WooCommerceDetector();
        this.proxyUrl = 'http://localhost:3001';
        this.results = [];
    }

    getTestSites() {
        return {
            shopify: [
                'allbirds.com',           // Sustainable shoes
                'bombas.com',             // Socks & underwear
                'gymshark.com',           // Fitness apparel
                'mvmtwatches.com',        // Watches
                'colourpop.com',          // Cosmetics
                'skims.com',              // Shapewear
                'fashionnova.com',        // Fashion
                'kylicosmetics.com',      // Beauty
                'jeffreestarcosmetics.com', // Makeup
                'rarebeauty.com'          // Selena Gomez beauty
            ],
            woocommerce: [
                'woocommerce.com',        // Official WooCommerce site
                'usabilitygeek.com',      // Known WC blog/shop
                'blog.templatetoaster.com', // WC tutorials site
                'bobwp.com',              // WooCommerce expert
                'websitesetup.org',       // Web tutorials with WC
                'wpbeginner.com',         // WordPress/WC tutorials  
                'codeinwp.com',           // WordPress themes/WC
                'elegantthemes.com',      // Divi theme (often WC)
                'wpforms.com',            // WordPress plugins
                'astra-theme.com'         // Popular WC theme
            ]
        };
    }

    async fetchSiteContent(url) {
        try {
            const response = await fetch(`${this.proxyUrl}/fetch-raw-page?url=${encodeURIComponent(`https://${url}`)}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Fetch failed');
            }
            
            return data.content;
        } catch (error) {
            throw new Error(`Failed to fetch ${url}: ${error.message}`);
        }
    }

    async testSite(site, expectedPlatform) {
        console.log(`\n🔍 Testing: ${site}`);
        console.log(`   Expected: ${expectedPlatform}`);
        
        try {
            const html = await this.fetchSiteContent(site);
            console.log(`   Content: ${html.length} chars`);
            
            // Run both detectors
            const shopifyResult = this.shopifyDetector.detect(html);
            const wcResult = this.wcDetector.detect(html, `https://${site}`);
            
            // Determine detected platform
            let detectedPlatform = 'none';
            let confidence = 'very_low';
            let score = 0;
            
            if (shopifyResult.detected && (!wcResult.isDetected || shopifyResult.score > wcResult.score)) {
                detectedPlatform = 'shopify';
                confidence = shopifyResult.confidenceLevel;
                score = shopifyResult.score;
            } else if (wcResult.isDetected) {
                detectedPlatform = 'woocommerce';
                confidence = wcResult.confidence;
                score = wcResult.score;
            }
            
            const correct = detectedPlatform === expectedPlatform;
            
            console.log(`   Shopify: ${shopifyResult.detected ? '✅' : '❌'} (${shopifyResult.score} pts)`);
            console.log(`   WooCommerce: ${wcResult.isDetected ? '✅' : '❌'} (${wcResult.score} pts)`);
            console.log(`   Detected: ${detectedPlatform} (${confidence})`);
            console.log(`   Result: ${correct ? '✅ CORRECT' : '❌ INCORRECT'}`);
            
            return {
                site,
                expectedPlatform,
                detectedPlatform,
                correct,
                confidence,
                score,
                shopifyScore: shopifyResult.score,
                wcScore: wcResult.score,
                contentLength: html.length,
                success: true
            };
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return {
                site,
                expectedPlatform,
                success: false,
                error: error.message
            };
        }
    }

    async runBatchTest() {
        console.log('🧪 Batch Platform Detection Test');
        console.log('='.repeat(50));
        console.log('Testing 10 Shopify + 10 WooCommerce sites\n');
        
        const sites = this.getTestSites();
        
        // Test Shopify sites
        console.log('🛍️  TESTING SHOPIFY SITES');
        console.log('='.repeat(30));
        
        for (const site of sites.shopify) {
            const result = await this.testSite(site, 'shopify');
            this.results.push(result);
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Test WooCommerce sites  
        console.log('\n🛒 TESTING WOOCOMMERCE SITES');
        console.log('='.repeat(30));
        
        for (const site of sites.woocommerce) {
            const result = await this.testSite(site, 'woocommerce');
            this.results.push(result);
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        this.generateReport();
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 BATCH TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        const successful = this.results.filter(r => r.success);
        const failed = this.results.filter(r => !r.success);
        const correct = successful.filter(r => r.correct);
        
        const shopifyResults = successful.filter(r => r.expectedPlatform === 'shopify');
        const wcResults = successful.filter(r => r.expectedPlatform === 'woocommerce');
        
        const shopifyCorrect = shopifyResults.filter(r => r.correct);
        const wcCorrect = wcResults.filter(r => r.correct);
        
        console.log(`\n📈 Overall Performance:`);
        console.log(`   Sites tested: ${this.results.length}`);
        console.log(`   Successful fetches: ${successful.length}`);
        console.log(`   Failed fetches: ${failed.length}`);
        console.log(`   Correct detections: ${correct.length}`);
        console.log(`   Overall accuracy: ${successful.length > 0 ? (correct.length / successful.length * 100).toFixed(1) : 0}%`);
        
        console.log(`\n🛍️  Shopify Detection:`);
        console.log(`   Sites tested: ${shopifyResults.length}`);
        console.log(`   Correct: ${shopifyCorrect.length}`);
        console.log(`   Accuracy: ${shopifyResults.length > 0 ? (shopifyCorrect.length / shopifyResults.length * 100).toFixed(1) : 0}%`);
        
        console.log(`\n🛒 WooCommerce Detection:`);
        console.log(`   Sites tested: ${wcResults.length}`);
        console.log(`   Correct: ${wcCorrect.length}`);
        console.log(`   Accuracy: ${wcResults.length > 0 ? (wcCorrect.length / wcResults.length * 100).toFixed(1) : 0}%`);
        
        // Confidence analysis
        const highConfidence = successful.filter(r => ['high', 'very_high'].includes(r.confidence));
        const mediumConfidence = successful.filter(r => r.confidence === 'medium');
        const lowConfidence = successful.filter(r => ['low', 'very_low'].includes(r.confidence));
        
        console.log(`\n🔍 Confidence Distribution:`);
        console.log(`   High confidence: ${highConfidence.length} (${(highConfidence.length / successful.length * 100).toFixed(1)}%)`);
        console.log(`   Medium confidence: ${mediumConfidence.length} (${(mediumConfidence.length / successful.length * 100).toFixed(1)}%)`);
        console.log(`   Low confidence: ${lowConfidence.length} (${(lowConfidence.length / successful.length * 100).toFixed(1)}%)`);
        
        // Top performers
        const topShopify = shopifyCorrect.sort((a, b) => b.shopifyScore - a.shopifyScore).slice(0, 3);
        const topWC = wcCorrect.sort((a, b) => b.wcScore - a.wcScore).slice(0, 3);
        
        if (topShopify.length > 0) {
            console.log(`\n🏆 Top Shopify Detections:`);
            topShopify.forEach(r => {
                console.log(`   ${r.site}: ${r.shopifyScore} points (${r.confidence})`);
            });
        }
        
        if (topWC.length > 0) {
            console.log(`\n🏆 Top WooCommerce Detections:`);
            topWC.forEach(r => {
                console.log(`   ${r.site}: ${r.wcScore} points (${r.confidence})`);
            });
        }
        
        // Problem cases
        const incorrect = successful.filter(r => !r.correct);
        if (incorrect.length > 0) {
            console.log(`\n❌ Incorrect Detections:`);
            incorrect.forEach(r => {
                console.log(`   ${r.site}: Expected ${r.expectedPlatform}, got ${r.detectedPlatform} (Shopify: ${r.shopifyScore}, WC: ${r.wcScore})`);
            });
        }
        
        if (failed.length > 0) {
            console.log(`\n⚠️  Failed Requests:`);
            failed.forEach(r => {
                console.log(`   ${r.site}: ${r.error}`);
            });
        }
        
        console.log(`\n✨ Batch platform detection test complete!`);
        console.log(`💡 Ready for production with ${(correct.length / successful.length * 100).toFixed(1)}% accuracy`);
        
        return {
            totalTested: this.results.length,
            successful: successful.length,
            correct: correct.length,
            overallAccuracy: successful.length > 0 ? (correct.length / successful.length * 100) : 0,
            shopifyAccuracy: shopifyResults.length > 0 ? (shopifyCorrect.length / shopifyResults.length * 100) : 0,
            woocommerceAccuracy: wcResults.length > 0 ? (wcCorrect.length / wcResults.length * 100) : 0,
            results: this.results
        };
    }
}

// Run the test
async function runBatchTest() {
    const tester = new BatchPlatformTest();
    await tester.runBatchTest();
}

runBatchTest().catch(console.error);