#!/usr/bin/env node

// Analyze product descriptions to ensure we're getting ALL content

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const ShopifyProductExtractor = require('../modules/platforms/shopify/product-extractor');
const WooCommerceProductExtractor = require('../modules/platforms/woocommerce/product-extractor');

async function analyzeDescriptions() {
    const proxyUrl = 'http://localhost:3001';
    
    console.log('🔍 Analyzing Product Description Extraction\n');
    
    // Test cases
    const testProducts = [
        {
            url: 'https://www.allbirds.com/products/mens-tree-runners',
            platform: 'shopify',
            name: 'Allbirds Tree Runner'
        },
        {
            url: 'https://bombas.com/products/womens-ankle-socks',
            platform: 'shopify',
            name: 'Bombas Ankle Socks'
        },
        {
            url: 'https://jococups.com/product/12oz-joco-cup/',
            platform: 'woocommerce',
            name: 'JOCO Cup 12oz'
        }
    ];
    
    for (const test of testProducts) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Testing: ${test.name} (${test.platform})`);
        console.log(`URL: ${test.url}`);
        console.log('='.repeat(60));
        
        try {
            const response = await fetch(`${proxyUrl}/fetch-raw-page?url=${encodeURIComponent(test.url)}`);
            const data = await response.json();
            
            if (!data.success) {
                console.log('❌ Failed to fetch page');
                continue;
            }
            
            // Use appropriate extractor
            let product;
            if (test.platform === 'shopify') {
                const extractor = new ShopifyProductExtractor();
                product = extractor.extract(data.content, test.url);
            } else {
                const extractor = new WooCommerceProductExtractor();
                product = extractor.extractProduct(data.content, test.url);
            }
            
            // Current extraction results
            console.log('\n📊 Current Extraction:');
            console.log(`Title: ${product.title}`);
            console.log(`Description Length: ${product.description.length} characters`);
            console.log(`Word Count: ${product.description.split(/\s+/).length} words`);
            
            // Show full description
            console.log('\n📝 Full Description:');
            console.log('-'.repeat(40));
            console.log(product.description);
            console.log('-'.repeat(40));
            
            // Analyze what's on the page
            const $ = cheerio.load(data.content);
            
            console.log('\n🔎 Page Analysis:');
            
            // Count all text content in common description areas
            const descriptionSelectors = [
                '.product__description',
                '.product-description', 
                '.product-single__description',
                '[data-product-description]',
                '.rte',
                '#tab-description',
                '.woocommerce-Tabs-panel--description',
                '.product-details__description'
            ];
            
            let totalTextFound = 0;
            descriptionSelectors.forEach(selector => {
                const elem = $(selector).first();
                if (elem.length) {
                    const text = elem.text().trim();
                    if (text.length > 50) {
                        console.log(`\nFound in ${selector}: ${text.length} chars`);
                        totalTextFound = Math.max(totalTextFound, text.length);
                    }
                }
            });
            
            // Compare extraction vs available content
            console.log(`\n📈 Extraction Efficiency:`);
            console.log(`Extracted: ${product.description.length} chars`);
            console.log(`Available: ${totalTextFound} chars`);
            console.log(`Coverage: ${totalTextFound > 0 ? ((product.description.length / totalTextFound) * 100).toFixed(1) : 'N/A'}%`);
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n✅ Analysis complete!');
}

// Run the analysis
analyzeDescriptions().catch(console.error);