#!/usr/bin/env node

// Debug Shopify Detection
// Figure out why detection is failing

const ShopifyDetector = require('../modules/platforms/shopify/detector');

async function debugDetection(domain) {
    console.log(`\n🔍 Debugging Shopify detection for ${domain}`);
    
    const detector = new ShopifyDetector();
    const proxyUrl = 'http://localhost:3001';
    
    try {
        // Fetch via proxy - try both endpoints
        const url = `https://${domain}`;
        console.log(`Fetching: ${url}`);
        
        // First try the text extraction endpoint
        console.log('\n1️⃣ Using /fetch-page (text extraction):');
        const response = await fetch(`${proxyUrl}/fetch-page?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        // Also try raw HTML endpoint
        console.log('\n2️⃣ Using /fetch-raw-page (full HTML):');
        const rawResponse = await fetch(`${proxyUrl}/fetch-raw-page?url=${encodeURIComponent(url)}`);
        const rawData = await rawResponse.json();
        
        if (!data.success) {
            console.log('❌ Fetch failed:', data.error);
            return;
        }
        
        console.log(`✅ Fetched successfully`);
        console.log(`   Content length: ${data.content.length} chars`);
        
        // Check for Shopify markers manually
        console.log('\n📍 Manual pattern checks:');
        
        const patterns = detector.getDetectionPatterns();
        patterns.forEach(pattern => {
            const matches = data.content.match(pattern.regex);
            if (matches) {
                console.log(`   ✅ ${pattern.description}: ${matches.length} matches`);
                if (matches.length <= 3) {
                    matches.forEach(m => console.log(`      "${m.substring(0, 60)}..."`));
                }
            } else {
                console.log(`   ❌ ${pattern.description}: No matches`);
            }
        });
        
        // Run detector on raw HTML
        if (rawData.success) {
            console.log(`\n🔍 Raw HTML length: ${rawData.content.length} chars`);
            
            console.log('\n🤖 Running detector on RAW HTML:');
            const rawResult = detector.detect(rawData.content);
            console.log(`   Detected: ${rawResult.detected}`);
            console.log(`   Score: ${rawResult.score}`);
            console.log(`   Confidence: ${rawResult.confidenceLevel}`);
            
            // Sample content check
            console.log('\n📄 Sample content from raw HTML:');
            const shopifyIndex = rawData.content.toLowerCase().indexOf('shopify');
            if (shopifyIndex !== -1) {
                console.log(`   First "shopify" at position ${shopifyIndex}:`);
                console.log(`   "${rawData.content.substring(shopifyIndex - 20, shopifyIndex + 80)}"`);
            } else {
                console.log('   No "shopify" found in raw HTML!');
            }
        } else {
            console.log('\n⚠️  Failed to fetch raw HTML');
        }
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

// Test sites
const sites = ['wholelattelove.com', 'allbirds.com', 'bombas.com'];

async function runDebug() {
    for (const site of sites) {
        await debugDetection(site);
        console.log('\n' + '-'.repeat(60));
    }
}

runDebug().catch(console.error);