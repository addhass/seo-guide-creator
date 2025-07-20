#!/usr/bin/env node

// Debug Allbirds extraction issue

const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function debugAllbirds() {
    const url = 'https://www.allbirds.com/products/mens-tree-runners';
    console.log(`🔍 Debugging Allbirds product extraction`);
    console.log(`URL: ${url}\n`);
    
    try {
        // Fetch via proxy
        const response = await fetch(`http://localhost:3001/fetch-raw-page?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        if (!data.success) {
            console.log('❌ Failed to fetch:', data.error);
            return;
        }
        
        console.log(`✅ Fetched ${data.content.length} chars`);
        
        const $ = cheerio.load(data.content);
        
        // Look for product info in different ways
        console.log('\n🔍 Searching for product description...\n');
        
        // Check meta description
        const metaDesc = $('meta[name="description"]').attr('content');
        if (metaDesc) {
            console.log(`📝 Meta description: "${metaDesc}"`);
        }
        
        // Look for any element containing "description" in class or id
        let foundElements = 0;
        $('[class*="description"], [id*="description"]').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text && text.length > 20) {
                foundElements++;
                console.log(`\n✅ Found description element ${foundElements}:`);
                console.log(`   Tag: ${elem.name}`);
                console.log(`   Class: ${$(elem).attr('class')}`);
                console.log(`   Text: "${text.substring(0, 100)}..."`);
            }
        });
        
        // Check for product JSON in scripts
        console.log('\n🔍 Checking for product data in scripts...\n');
        
        $('script').each((i, elem) => {
            const content = $(elem).html();
            if (content && content.includes('product') && content.includes('description')) {
                if (content.includes('window.')) {
                    console.log('✅ Found window.product data');
                    // Try to extract product object
                    const match = content.match(/window\.(\w+)\s*=\s*({[\s\S]*?});/);
                    if (match) {
                        try {
                            const obj = JSON.parse(match[2]);
                            if (obj.description) {
                                console.log(`   Description: "${obj.description.substring(0, 100)}..."`);
                            }
                        } catch (e) {
                            console.log('   Could not parse product JSON');
                        }
                    }
                }
            }
        });
        
        // Look for React/Next.js data
        console.log('\n🔍 Checking for React/Next.js data...\n');
        
        const nextData = $('#__NEXT_DATA__');
        if (nextData.length) {
            console.log('✅ Found Next.js data');
            try {
                const json = JSON.parse(nextData.html());
                // Navigate through the data structure
                if (json.props?.pageProps?.product) {
                    const product = json.props.pageProps.product;
                    console.log(`   Product title: ${product.title || 'N/A'}`);
                    console.log(`   Product description: ${product.description?.substring(0, 100) || 'N/A'}...`);
                }
            } catch (e) {
                console.log('   Could not parse Next.js data');
            }
        }
        
        // Manual search for text content
        console.log('\n🔍 Looking for descriptive text manually...\n');
        
        const textNodes = [];
        $('p, div').each((i, elem) => {
            const text = $(elem).clone().children().remove().end().text().trim();
            if (text && text.length > 100 && !text.includes('<') && !text.includes('{')) {
                textNodes.push({
                    tag: elem.name,
                    class: $(elem).attr('class') || 'no-class',
                    text: text.substring(0, 150)
                });
            }
        });
        
        console.log(`Found ${textNodes.length} potential description paragraphs:`);
        textNodes.slice(0, 5).forEach((node, i) => {
            console.log(`\n${i+1}. ${node.tag}.${node.class}`);
            console.log(`   "${node.text}..."`);
        });
        
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

debugAllbirds().catch(console.error);