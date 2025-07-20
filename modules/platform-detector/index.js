// Platform Detection Module
// Responsible ONLY for detecting e-commerce platforms

const PatternLearner = require('../../utils/pattern-learner');

class PlatformDetector {
    constructor() {
        this.learner = new PatternLearner();
    }
    
    /**
     * Detect platform from HTML content
     * @param {string} url - The URL being analyzed
     * @param {string} html - The HTML content
     * @returns {Object} Detection result with platform, confidence, and details
     */
    async detect(url, html) {
        // Use pattern learner for detection
        const result = this.learner.detectPlatform(html);
        
        // Add URL-based hints
        const urlHints = this.getUrlHints(url);
        
        return {
            platform: result.platform,
            confidence: result.confidence,
            confidenceLevel: result.confidenceLevel,
            matchedPatterns: result.matchedPatterns,
            urlHints: urlHints,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Get platform hints from URL structure
     * @param {string} url - The URL to analyze
     * @returns {Object} URL-based hints
     */
    getUrlHints(url) {
        const hints = {
            hasCollections: url.includes('/collections'),
            hasProducts: url.includes('/products'),
            hasShop: url.includes('/shop'),
            hasCatalog: url.includes('/catalog')
        };
        
        // Shopify-specific URL patterns
        if (hints.hasCollections || (hints.hasProducts && !hints.hasCatalog)) {
            hints.likelyShopify = true;
        }
        
        return hints;
    }
    
    /**
     * Learn from confirmed platform detection
     * @param {string} domain - The domain
     * @param {string} platform - The confirmed platform
     * @param {Array} patterns - Patterns that were found
     */
    async recordConfirmedPlatform(domain, platform, patterns) {
        // This will be used to reinforce detection patterns
        console.log(`✅ Confirmed ${domain} is ${platform}`);
        // TODO: Implement pattern reinforcement
    }
}

module.exports = PlatformDetector;