#!/usr/bin/env node

// Debug extraction issues

const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function debugExtraction(url) {
    console.log(`\n🔍 Debugging extraction for: ${url}`);
    console.log('='.repeat(60));
    
    try {
        // Fetch the page
        const response = await fetch(`http://localhost:3001/fetch-raw-page?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        if (!data.success) {
            console.log('❌ Failed to fetch page');
            return;
        }
        
        console.log(`✅ Fetched ${data.content.length} chars of HTML`);
        
        const $ = cheerio.load(data.content);
        
        // Debug title extraction
        console.log('\n📋 Title candidates:');
        const titleSelectors = [
            'h1.product__title',
            'h1.product-title',
            'h1[itemprop="name"]',
            '.product__info h1',
            '.product-single__title',
            'h1'
        ];
        
        titleSelectors.forEach(selector => {
            const found = $(selector).length;
            if (found > 0) {
                console.log(`   ✅ ${selector}: "${$(selector).first().text().trim().substring(0, 50)}..."`);
            } else {
                console.log(`   ❌ ${selector}: not found`);
            }
        });
        
        // Debug description extraction
        console.log('\n📝 Description candidates:');
        const descSelectors = [
            '.product__description',
            '.product-description',
            '.product-single__description',
            '[itemprop="description"]',
            '.product__text',
            '.rte',
            '.product-details',
            '.description'
        ];
        
        descSelectors.forEach(selector => {
            const elem = $(selector);
            if (elem.length > 0) {
                const text = elem.first().text().trim();
                console.log(`   ✅ ${selector}: ${text.length} chars`);
                if (text.length > 0) {
                    console.log(`      "${text.substring(0, 100)}..."`);
                }
            } else {
                console.log(`   ❌ ${selector}: not found`);
            }
        });
        
        // Look for product data in scripts
        console.log('\n🔍 Checking for product JSON:');
        
        // Check JSON-LD
        $('script[type="application/ld+json"]').each((i, elem) => {
            const content = $(elem).html();
            if (content && content.includes('Product')) {
                console.log(`   ✅ Found JSON-LD with Product data`);
                try {
                    const json = JSON.parse(content);
                    if (json['@type'] === 'Product' || (Array.isArray(json) && json.some(j => j['@type'] === 'Product'))) {
                        console.log('      Product found in structured data');
                    }
                } catch (e) {
                    console.log('      Failed to parse JSON-LD');
                }
            }
        });
        
        // Check for Shopify product variable
        const productVarMatch = data.content.match(/var\s+product\s*=\s*({[\s\S]*?});/);
        if (productVarMatch) {
            console.log('   ✅ Found Shopify product variable');
        }
        
        // Look for any description-like content
        console.log('\n🔍 Searching for description patterns:');
        const descPatterns = [
            'product-description',
            'product__description',
            'description',
            'product-details',
            'product-info'
        ];
        
        descPatterns.forEach(pattern => {
            const regex = new RegExp(`class=["'][^"']*${pattern}[^"']*["']`, 'gi');
            const matches = data.content.match(regex);
            if (matches) {
                console.log(`   ✅ Found ${matches.length} elements with "${pattern}" in class`);
            }
        });
        
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

// Test problematic URLs
const urls = [
    'https://www.allbirds.com/products/mens-tree-runners',
    'https://www.deathwishcoffee.com/products/death-wish-coffee-1'
];

async function main() {
    for (const url of urls) {
        await debugExtraction(url);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

main().catch(console.error);