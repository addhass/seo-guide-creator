// WooCommerce Platform Scraper
// Specialized scraping logic for WordPress/WooCommerce stores

const ComprehensiveWooCommerceExtractor = require('./comprehensive-extractor');

class WooCommerceScraper {
    constructor(proxyUrl = 'http://localhost:3001', geoClient = null) {
        this.proxyUrl = proxyUrl;
        this.platform = 'woocommerce';
        this.productExtractor = new ComprehensiveWooCommerceExtractor();
        this.geoClient = geoClient; // Optional geo-aware client
    }
    
    /**
     * Find the best Product Listing Page (PLP) for a WooCommerce store
     * @param {string} domain - Domain to analyze
     * @returns {Object} PLP discovery result
     */
    async findPlp(domain) {
        console.log(`🔍 [WooCommerce] Finding PLP for ${domain}`);
        
        const baseUrl = `https://${domain.replace(/^https?:\/\//, '')}`;
        const pathsToTry = [
            // Standard WooCommerce patterns
            '/shop',
            '/shop/',
            '/store',
            '/store/',
            '/products',
            '/products/',
            // Category-based patterns
            '/product-category/all',
            '/product-category/shop',
            '/category/all',
            // Common customizations
            '/all-products',
            '/catalog',
            '/collection',
            // Homepage as PLP (some stores)
            '/'
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
                    
                    // Handle redirects
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
     * Validate if a page is a valid WooCommerce PLP
     */
    async validatePlp(html, url) {
        // WooCommerce PLP indicators
        const indicators = {
            hasProductGrid: /<[^>]*class=["'][^"']*products[^"']*["']/i.test(html),
            hasWooCommerceProducts: /<[^>]*class=["'][^"']*woocommerce[^"']*["']/i.test(html),
            hasProductLinks: /href=["']([^"']*\/product\/[^"']+)["']/gi.test(html),
            hasShopClass: /<[^>]*class=["'][^"']*shop[^"']*["']/i.test(html),
            isShopPage: url.includes('/shop') || url.includes('/store') || url.includes('/products'),
            isHomepage: new URL(url).pathname === '/',
            hasPricing: /class=["'][^"']*price[^"']*["']/i.test(html),
            hasAddToCart: /add[_-]to[_-]cart/i.test(html)
        };
        
        // Count product links (WooCommerce uses /product/ URLs)
        const productLinks = html.match(/href=["']([^"']*\/product\/[^"']+)["']/gi) || [];
        
        // Calculate confidence
        let confidence = 0;
        if (indicators.hasProductGrid) confidence += 25;
        if (indicators.hasWooCommerceProducts) confidence += 30;
        if (indicators.hasProductLinks) confidence += 25;
        if (indicators.hasShopClass) confidence += 15;
        if (indicators.isShopPage) confidence += 10;
        if (indicators.hasPricing) confidence += 10;
        if (indicators.hasAddToCart) confidence += 15;
        if (productLinks.length > 5) confidence += 10;
        if (productLinks.length > 10) confidence += 10;
        
        // Special case for homepage PLPs
        if (indicators.isHomepage && productLinks.length > 8) {
            confidence += 20;
        }
        
        return {
            isValid: (confidence >= 40 && productLinks.length > 3) || productLinks.length > 8,
            confidence: Math.min(confidence, 100),
            productCount: productLinks.length,
            indicators
        };
    }
    
    /**
     * Extract product URLs from a WooCommerce PLP
     * @param {string} plpUrl - The PLP URL
     * @returns {Object} Extraction result
     */
    async extractProductUrls(plpUrl) {
        console.log(`📦 [WooCommerce] Extracting products from ${plpUrl}`);
        
        try {
            // Fetch the page
            const response = this.geoClient
                ? await this.geoClient.fetch(`${this.proxyUrl}/fetch-raw-page?url=${encodeURIComponent(plpUrl)}`)
                : await fetch(`${this.proxyUrl}/fetch-raw-page?url=${encodeURIComponent(plpUrl)}`);
            const data = await response.json();
            
            if (!data.success) {
                return { success: false, error: 'Failed to fetch page' };
            }
            
            // Extract product URLs using WooCommerce-specific patterns
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
     * Parse product URLs from WooCommerce HTML
     */
    parseProductUrls(html, baseUrl) {
        const urls = new Set();
        const baseHost = new URL(baseUrl).origin;
        
        // Pattern 1: Direct product links (/product/product-name)
        const productLinkRegex = /href=["']([^"']*\/product\/[^"'?#]+)["']/gi;
        let match;
        
        while ((match = productLinkRegex.exec(html)) !== null) {
            const url = match[1];
            // Convert relative URLs to absolute
            const absoluteUrl = url.startsWith('http') ? url : `${baseHost}${url}`;
            urls.add(absoluteUrl.split('?')[0]); // Remove query params
        }
        
        // Pattern 2: WooCommerce product links with data attributes
        const dataUrlRegex = /data-(?:url|href|product-url)=["']([^"']*\/product\/[^"']+)["']/gi;
        
        while ((match = dataUrlRegex.exec(html)) !== null) {
            const url = match[1];
            const absoluteUrl = url.startsWith('http') ? url : `${baseHost}${url}`;
            urls.add(absoluteUrl.split('?')[0]);
        }
        
        // Pattern 3: WooCommerce permalink structure (custom permalinks)
        const customProductRegex = /href=["']([^"']*\/[^"'\/]+\/[^"'\/]+\/)["']/gi;
        const potentialProducts = [];
        
        while ((match = customProductRegex.exec(html)) !== null) {
            const url = match[1];
            // Only consider if it looks like a product URL and contains product indicators
            if (this.looksLikeProductUrl(url, html)) {
                const absoluteUrl = url.startsWith('http') ? url : `${baseHost}${url}`;
                potentialProducts.push(absoluteUrl.split('?')[0]);
            }
        }
        
        // Add potential products if we don't have many direct matches
        if (urls.size < 5) {
            potentialProducts.slice(0, 20).forEach(url => urls.add(url));
        }
        
        // Convert Set to Array and limit to reasonable number
        return Array.from(urls).slice(0, 100);
    }
    
    /**
     * Check if a URL looks like a WooCommerce product URL
     */
    looksLikeProductUrl(url, html) {
        // Skip obvious non-product URLs
        const skipPatterns = [
            /\/(shop|cart|checkout|my-account|contact|about|blog|category|tag)\//i,
            /\.(jpg|jpeg|png|gif|css|js|pdf)$/i,
            /\/wp-/i,
            /#/,
            /mailto:/,
            /tel:/
        ];
        
        if (skipPatterns.some(pattern => pattern.test(url))) {
            return false;
        }
        
        // Look for product indicators near this URL in the HTML
        const urlEscaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const contextRegex = new RegExp(`href=["']${urlEscaped}["'][^>]*>([^<]+)</`, 'i');
        const contextMatch = html.match(contextRegex);
        
        if (contextMatch) {
            const linkText = contextMatch[1];
            // If link text suggests it's a product (contains price, product terms, etc.)
            return /\$|\£|€|price|buy|product|shop/i.test(linkText);
        }
        
        return false;
    }
    
    /**
     * Extract product description from a WooCommerce PDP
     * @param {string} pdpUrl - Product page URL
     * @returns {Object} Product data
     */
    async extractProductData(pdpUrl) {
        console.log(`📝 [WooCommerce] Extracting product data from ${pdpUrl}`);
        
        try {
            // Use raw HTML for complete extraction
            const response = this.geoClient
                ? await this.geoClient.fetch(`${this.proxyUrl}/fetch-raw-page?url=${encodeURIComponent(pdpUrl)}`)
                : await fetch(`${this.proxyUrl}/fetch-raw-page?url=${encodeURIComponent(pdpUrl)}`);
            const data = await response.json();
            
            if (!data.success) {
                return { success: false, error: 'Failed to fetch page' };
            }
            
            // Extract product data using WooCommerce-specific extractor
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

module.exports = WooCommerceScraper;