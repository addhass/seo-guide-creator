#!/usr/bin/env node

// Investigate PLP patterns for sites that failed PLP discovery

async function investigateSite(domain) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔍 Investigating: ${domain}`);
    console.log('='.repeat(50));
    
    const proxyUrl = 'http://localhost:3001';
    const baseUrl = `https://${domain}`;
    
    // Common e-commerce paths to check
    const pathsToCheck = [
        '/',  // Homepage might be the PLP
        '/shop',
        '/shop/all',
        '/catalog',
        '/all-products',
        '/products/all',
        '/store',
        '/collections',
        '/collections/all',
        '/collections/all-products',
        '/collections/shop-all',
        '/collections/new',
        '/collections/womens',
        '/collections/mens',
        '/womens',
        '/mens',
        '/new-arrivals'
    ];
    
    console.log('\n📍 Checking paths for product links...\n');
    
    for (const path of pathsToCheck) {
        const url = `${baseUrl}${path}`;
        
        try {
            const response = await fetch(`${proxyUrl}/fetch-raw-page?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            
            if (data.success) {
                // Count product links
                const productLinks = (data.content.match(/href=["']([^"']*\/products?\/[^"']+)["']/gi) || []).length;
                const collectionLinks = (data.content.match(/href=["']([^"']*\/collections?\/[^"']+)["']/gi) || []).length;
                
                // Check for product grid indicators
                const hasProductGrid = /<[^>]*class=["'][^"']*product[^"']*grid[^"']*["']/i.test(data.content);
                const hasProductList = /<[^>]*class=["'][^"']*product[^"']*list[^"']*["']/i.test(data.content);
                
                // Extract some sample product URLs if found
                const sampleProducts = [];
                const productMatches = data.content.match(/href=["']([^"']*\/products?\/[^"']+)["']/gi);
                if (productMatches) {
                    productMatches.slice(0, 3).forEach(match => {
                        const url = match.match(/href=["']([^"']+)["']/)[1];
                        sampleProducts.push(url);
                    });
                }
                
                console.log(`${path.padEnd(25)} - Products: ${productLinks}, Collections: ${collectionLinks}`);
                
                if (productLinks > 5) {
                    console.log(`  ✅ Potential PLP! Grid: ${hasProductGrid}, List: ${hasProductList}`);
                    if (sampleProducts.length > 0) {
                        console.log(`  Sample products:`);
                        sampleProducts.forEach(p => console.log(`    - ${p}`));
                    }
                }
                
                // Check final URL for redirects
                if (data.finalUrl && data.finalUrl !== url) {
                    console.log(`  ↪️  Redirected to: ${data.finalUrl}`);
                }
            } else {
                console.log(`${path.padEnd(25)} - ❌ ${data.error || 'Failed'}`);
            }
            
        } catch (error) {
            console.log(`${path.padEnd(25)} - 💥 ${error.message}`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

async function main() {
    const problemSites = [
        'gymshark.com',
        'rothys.com'
    ];
    
    for (const site of problemSites) {
        await investigateSite(site);
    }
}

main().catch(console.error);