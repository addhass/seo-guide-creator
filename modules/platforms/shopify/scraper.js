// Shopify Platform Scraper
// Specialized scraping logic for Shopify stores

const ComprehensiveShopifyExtractor = require('./comprehensive-extractor');

class ShopifyScraper {
    constructor(proxyUrl = 'http://localhost:3001', geoClient = null) {
        this.proxyUrl = proxyUrl;
        this.platform = 'shopify';
        this.productExtractor = new ComprehensiveShopifyExtractor();
        this.geoClient = geoClient; // Optional geo-aware client
    }
    
    /**
     * Find the best Product Listing Page (PLP) for a Shopify store
     * @param {string} domain - Domain to analyze
     * @returns {Object} PLP discovery result
     */
    async findPlp(domain) {
        console.log(`🔍 [Shopify] Finding PLP for ${domain}`);
        
        const baseUrl = `https://${domain.replace(/^https?:\/\//, '')}`;
        const pathsToTry = [
            // Standard Shopify patterns
            '/collections/all',
            '/collections/all-products', 
            '/collections/frontpage',
            '/collections',
            '/products',
            // Category-specific fallbacks
            '/collections/womens',
            '/collections/mens',
            '/collections/womens-shoes',
            '/collections/mens-shoes',
            '/collections/new-arrivals',
            '/collections/best-sellers'
            // Skip non-standard patterns for now:
            // '/shop',
            // '/'  // Homepage as PLP
        ];
        
        for (const path of pathsToTry) {
            const url = `${baseUrl}${path}`;
            console.log(`  Trying: ${url}`);
            
            try {
                // Use geo-aware fetch if available, otherwise fallback to proxy
                const response = this.geoClient 
                    ? await this.geoClient.fetch(`${this.proxyUrl}/fetch-raw-page?url=${encodeURIComponent(url)}`)
                    : await fetch(`${this.proxyUrl}/fetch-raw-page?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                
                if (data.success) {
                    const finalUrl = data.finalUrl || url;
                    
                    // Handle subdomain redirects (e.g., gymshark)
                    if (finalUrl !== url && new URL(finalUrl).hostname !== new URL(url).hostname) {
                        console.log(`  ↪️  Redirected to different domain: ${finalUrl}`);
                        // Try to fetch from the redirected URL
                        const redirectResponse = this.geoClient
                            ? await this.geoClient.fetch(`${this.proxyUrl}/fetch-raw-page?url=${encodeURIComponent(finalUrl)}`)
                            : await fetch(`${this.proxyUrl}/fetch-raw-page?url=${encodeURIComponent(finalUrl)}`);
                        const redirectData = await redirectResponse.json();
                        
                        if (redirectData.success) {
                            const plpCheck = await this.validatePlp(redirectData.content, finalUrl);
                            if (plpCheck.isValid) {
                                console.log(`  ✅ Found valid PLP at redirected URL: ${finalUrl}`);
                                return {
                                    success: true,
                                    url: finalUrl,
                                    path: new URL(finalUrl).pathname,
                                    productCount: plpCheck.productCount,
                                    confidence: plpCheck.confidence
                                };
                            }
                        }
                    }
                    
                    // Check if this is a valid PLP
                    const plpCheck = await this.validatePlp(data.content, finalUrl);
                    
                    if (plpCheck.isValid) {
                        console.log(`  ✅ Found valid PLP at: ${finalUrl}`);
                        return {
                            success: true,
                            url: finalUrl,
                            path: new URL(finalUrl).pathname,
                            productCount: plpCheck.productCount,
                            confidence: plpCheck.confidence
                        };
                    }
                }
            } catch (error) {
                console.log(`  ❌ Error: ${error.message}`);
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return {
            success: false,
            error: 'No valid PLP found'
        };
    }
    
    /**
     * Validate if a page is a valid Shopify PLP
     */
    async validatePlp(html, url) {
        // Quick checks for Shopify PLP indicators
        const indicators = {
            hasProductGrid: /<[^>]*class=["'][^"']*product-grid[^"']*["']/i.test(html),
            hasCollectionGrid: /<[^>]*class=["'][^"']*collection[^"']*grid[^"']*["']/i.test(html),
            hasProductLinks: /href=["']([^"']*\/products\/[^"']+)["']/gi.test(html),
            isCollectionPage: url.includes('/collections/'),
            isShopPage: url.endsWith('/shop') || url.endsWith('/shop/'),
            isHomepage: new URL(url).pathname === '/',
            hasProducts: /class=["'][^"']*product[^"']*["']/gi.test(html)
        };
        
        // Count product links
        const productLinks = html.match(/href=["']([^"']*\/products\/[^"']+)["']/gi) || [];
        
        // Calculate confidence
        let confidence = 0;
        if (indicators.hasProductGrid) confidence += 30;
        if (indicators.hasCollectionGrid) confidence += 20;
        if (indicators.hasProductLinks) confidence += 30;
        if (indicators.isCollectionPage) confidence += 10;
        if (indicators.isShopPage) confidence += 15;
        if (productLinks.length > 5) confidence += 10;
        if (productLinks.length > 10) confidence += 10;
        
        // Special case for homepage PLPs (like rothys)
        if (indicators.isHomepage && productLinks.length > 10) {
            confidence += 20;
        }
        
        return {
            isValid: (confidence >= 40 && productLinks.length > 3) || productLinks.length > 10,
            confidence: Math.min(confidence, 100),
            productCount: productLinks.length,
            indicators
        };
    }
    
    /**
     * Extract product URLs from a Shopify PLP
     * @param {string} plpUrl - The PLP URL
     * @returns {Object} Extraction result
     */
    async extractProductUrls(plpUrl) {
        console.log(`📦 [Shopify] Extracting products from ${plpUrl}`);
        
        try {
            // Fetch the page - use raw HTML
            const response = this.geoClient
                ? await this.geoClient.fetch(`${this.proxyUrl}/fetch-raw-page?url=${encodeURIComponent(plpUrl)}`)
                : await fetch(`${this.proxyUrl}/fetch-raw-page?url=${encodeURIComponent(plpUrl)}`);
            const data = await response.json();
            
            if (!data.success) {
                return { success: false, error: 'Failed to fetch page' };
            }
            
            // Extract product URLs using Shopify-specific patterns
            const productUrls = this.parseProductUrls(data.content, plpUrl);
            
            return {
                success: true,
                urls: productUrls,
                count: productUrls.length
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Parse product URLs from Shopify HTML
     */
    parseProductUrls(html, baseUrl) {
        const urls = new Set();
        const baseHost = new URL(baseUrl).origin;
        
        // Pattern 1: Direct product links
        const productLinkRegex = /href=["']([^"']*\/products\/[^"'?#]+)["']/gi;
        let match;
        
        while ((match = productLinkRegex.exec(html)) !== null) {
            const url = match[1];
            // Convert relative URLs to absolute
            const absoluteUrl = url.startsWith('http') ? url : `${baseHost}${url}`;
            urls.add(absoluteUrl.split('?')[0]); // Remove query params
        }
        
        // Pattern 2: Data attributes with product URLs
        const dataUrlRegex = /data-(?:url|href|product-url)=["']([^"']*\/products\/[^"']+)["']/gi;
        
        while ((match = dataUrlRegex.exec(html)) !== null) {
            const url = match[1];
            const absoluteUrl = url.startsWith('http') ? url : `${baseHost}${url}`;
            urls.add(absoluteUrl.split('?')[0]);
        }
        
        // Convert Set to Array and limit to reasonable number
        return Array.from(urls).slice(0, 100);
    }
    
    /**
     * Extract product description from a Shopify PDP
     * @param {string} pdpUrl - Product page URL
     * @returns {Object} Product data
     */
    async extractProductData(pdpUrl) {
        console.log(`📝 [Shopify] Extracting product data from ${pdpUrl}`);
        
        try {
            // Use raw HTML for complete extraction
            const response = this.geoClient
                ? await this.geoClient.fetch(`${this.proxyUrl}/fetch-raw-page?url=${encodeURIComponent(pdpUrl)}`)
                : await fetch(`${this.proxyUrl}/fetch-raw-page?url=${encodeURIComponent(pdpUrl)}`);
            const data = await response.json();
            
            if (!data.success) {
                return { success: false, error: 'Failed to fetch page' };
            }
            
            // Extract product data using advanced extractor
            const productData = this.productExtractor.extract(data.content, pdpUrl);
            
            return {
                success: true,
                ...productData
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = ShopifyScraper;