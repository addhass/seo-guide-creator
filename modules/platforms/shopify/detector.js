// Shopify Platform Detector
// Specialized detection logic for Shopify stores

class ShopifyDetector {
    constructor() {
        this.name = 'Shopify';
        this.patterns = this.getDetectionPatterns();
    }
    
    getDetectionPatterns() {
        return [
            {
                regex: /Shopify\.shop/gi,
                weight: 10,
                description: 'Shopify.shop global object'
            },
            {
                regex: /cdn\.shopify\.com|cdn\.shopifycdn\.com/gi,
                weight: 8,
                description: 'Shopify CDN URLs'
            },
            {
                regex: /<[^>]+class=["'][^"']*shopify-section[^"']*["']/gi,
                weight: 7,
                description: 'Shopify section classes'
            },
            {
                regex: /data-shopify|shopify-analytics|shopify_features/gi,
                weight: 5,
                description: 'Shopify data attributes'
            },
            {
                regex: /\/cdn\/shop\/t\/\d+\/assets\//gi,
                weight: 6,
                description: 'Shopify theme assets path'
            },
            {
                regex: /ShopifyAnalytics\.meta|Shopify\.theme|Shopify\.currency/gi,
                weight: 8,
                description: 'Shopify JavaScript objects'
            },
            {
                regex: /monorail-edge\.shopifysvc\.com/gi,
                weight: 7,
                description: 'Shopify analytics service'
            },
            {
                regex: /<meta[^>]+property=["']og:platform["'][^>]+content=["']shopify["']/gi,
                weight: 10,
                description: 'Shopify platform meta tag'
            },
            {
                regex: /\.myshopify\.com/gi,
                weight: 9,
                description: 'Shopify subdomain'
            },
            {
                regex: /\/s\/files\/\d+\/\d+\/\d+\//gi,
                weight: 5,
                description: 'Shopify file storage pattern'
            }
        ];
    }
    
    /**
     * Detect if HTML is from a Shopify store
     * @param {string} html - HTML content to analyze
     * @returns {Object} Detection result
     */
    detect(html) {
        const startTime = Date.now();
        let totalScore = 0;
        const matchedPatterns = [];
        
        console.log(`🔍 [Shopify Detector] Analyzing ${html.length} chars of HTML`);
        
        this.patterns.forEach(pattern => {
            const matches = html.match(pattern.regex);
            if (matches) {
                totalScore += pattern.weight;
                matchedPatterns.push({
                    pattern: pattern.description,
                    weight: pattern.weight,
                    matches: matches.length
                });
            }
        });
        
        // Determine confidence level
        let confidenceLevel = 'none';
        if (totalScore >= 20) confidenceLevel = 'high';
        else if (totalScore >= 10) confidenceLevel = 'medium';
        else if (totalScore >= 5) confidenceLevel = 'low';
        
        const detectTime = Date.now() - startTime;
        console.log(`⏱️  [Shopify Detector] Detection completed in ${detectTime}ms (score: ${totalScore})`);
        
        return {
            detected: totalScore >= 10, // Minimum score to confirm Shopify
            score: totalScore,
            confidenceLevel,
            matchedPatterns,
            platform: totalScore >= 10 ? 'shopify' : null,
            performanceMs: detectTime
        };
    }
    
    /**
     * Get URL patterns specific to Shopify
     */
    getUrlPatterns() {
        return {
            plp: {
                primary: /\/collections\/[\w-]+$/,
                alternatives: [
                    /\/collections$/,
                    /\/collections\/all$/,
                    /\/collections\/all-products$/,
                    /\/products$/  // Some stores use this as PLP
                ]
            },
            pdp: {
                primary: /\/products\/[\w-]+$/,
                collection: /\/collections\/[\w-]+\/products\/[\w-]+$/
            }
        };
    }
    
    /**
     * Get common PLP paths to try for Shopify
     */
    getPlpPaths() {
        return [
            '/collections/all',
            '/collections/all-products',
            '/collections/frontpage',
            '/collections',
            '/products'
        ];
    }
    
    /**
     * Check if URL matches Shopify PLP pattern
     */
    isPlpUrl(url) {
        const patterns = this.getUrlPatterns().plp;
        const pathname = new URL(url).pathname;
        
        // Check primary pattern
        if (patterns.primary.test(pathname)) {
            return { matches: true, type: 'collection' };
        }
        
        // Check alternatives
        for (const pattern of patterns.alternatives) {
            if (pattern.test(pathname)) {
                return { matches: true, type: 'alternative' };
            }
        }
        
        return { matches: false };
    }
    
    /**
     * Check if URL matches Shopify PDP pattern
     */
    isPdpUrl(url) {
        const patterns = this.getUrlPatterns().pdp;
        const pathname = new URL(url).pathname;
        
        if (patterns.primary.test(pathname)) {
            return { matches: true, type: 'direct' };
        }
        
        if (patterns.collection.test(pathname)) {
            return { matches: true, type: 'collection' };
        }
        
        return { matches: false };
    }
}

module.exports = ShopifyDetector;