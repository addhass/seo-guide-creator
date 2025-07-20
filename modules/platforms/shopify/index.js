// Shopify Platform Module
// Main entry point for all Shopify-related functionality

const ShopifyDetector = require('./detector');
const ShopifyScraper = require('./scraper');
const PatternLearner = require('../../../utils/pattern-learner');
const fs = require('fs').promises;
const path = require('path');

class ShopifyPlatform {
    constructor(proxyUrl) {
        this.name = 'shopify';
        this.detector = new ShopifyDetector();
        this.scraper = new ShopifyScraper(proxyUrl);
        this.learner = new PatternLearner();
        this.backlogPath = path.join(__dirname, '../../../data/backlog-sites.json');
    }
    
    /**
     * Full analysis workflow for a Shopify site
     * @param {string} domain - Domain to analyze
     * @param {string} html - Homepage HTML for detection
     * @returns {Object} Complete analysis result
     */
    async analyze(domain, html) {
        const result = {
            domain,
            platform: 'shopify',
            detection: null,
            plp: null,
            products: [],
            analysis: null,
            timestamp: new Date().toISOString()
        };
        
        // Step 1: Confirm it's Shopify
        console.log(`\n🏪 [Shopify] Analyzing ${domain}`);
        result.detection = this.detector.detect(html);
        
        if (!result.detection.detected) {
            return {
                ...result,
                success: false,
                error: 'Not detected as Shopify'
            };
        }
        
        console.log(`✅ Confirmed as Shopify (confidence: ${result.detection.confidenceLevel})`);
        
        // Step 2: Find PLP
        result.plp = await this.scraper.findPlp(domain);
        
        if (!result.plp.success) {
            // Learn from failure
            await this.learner.learnFromFailure(domain, 'shopify', 'plp', []);
            
            // Add to backlog if it's a Shopify site but doesn't follow standard patterns
            if (result.detection.confidenceLevel === 'high' || result.detection.confidenceLevel === 'medium') {
                await this.addToBacklog(domain, 'Non-standard PLP pattern', result.detection);
            }
            
            return {
                ...result,
                success: false,
                error: 'Could not find valid PLP - added to backlog for future review'
            };
        }
        
        // Learn from successful PLP discovery
        await this.learner.learnFromSuccess(domain, 'shopify', 'plp', [result.plp.url]);
        
        // Step 3: Extract product URLs
        const productExtraction = await this.scraper.extractProductUrls(result.plp.url);
        
        if (!productExtraction.success) {
            return {
                ...result,
                success: false,
                error: 'Could not extract product URLs'
            };
        }
        
        // Learn from successful product URL extraction
        if (productExtraction.urls.length > 0) {
            await this.learner.learnFromSuccess(domain, 'shopify', 'pdp', productExtraction.urls);
        }
        
        // Step 4: Extract product data (first 3 products)
        const productsToAnalyze = productExtraction.urls.slice(0, 3);
        
        for (const productUrl of productsToAnalyze) {
            const productData = await this.scraper.extractProductData(productUrl);
            if (productData.success) {
                result.products.push(productData);
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // Step 5: Analyze patterns
        result.analysis = this.analyzeProducts(result.products);
        
        return {
            ...result,
            success: true,
            summary: {
                productsFound: productExtraction.count,
                productsAnalyzed: result.products.length,
                plpUrl: result.plp.url
            }
        };
    }
    
    /**
     * Analyze product data for patterns
     */
    analyzeProducts(products) {
        if (!products || products.length === 0) {
            return { error: 'No products to analyze' };
        }
        
        const analysis = {
            count: products.length,
            averageDescriptionLength: 0,
            commonPatterns: [],
            recommendations: []
        };
        
        // Calculate average description length
        const lengths = products.map(p => p.description?.length || 0);
        analysis.averageDescriptionLength = Math.round(
            lengths.reduce((a, b) => a + b, 0) / lengths.length
        );
        
        // Add recommendations
        if (analysis.averageDescriptionLength < 100) {
            analysis.recommendations.push('Consider longer, more detailed descriptions');
        }
        
        if (analysis.averageDescriptionLength > 500) {
            analysis.recommendations.push('Consider more concise descriptions');
        }
        
        return analysis;
    }
    
    /**
     * Add site to backlog for future review
     */
    async addToBacklog(domain, issue, detection) {
        try {
            // Load existing backlog
            let backlog = { non_standard_shopify_sites: [] };
            try {
                const data = await fs.readFile(this.backlogPath, 'utf8');
                backlog = JSON.parse(data);
            } catch (e) {
                // File doesn't exist yet
            }
            
            // Check if already in backlog
            const exists = backlog.non_standard_shopify_sites.find(site => site.domain === domain);
            if (!exists) {
                backlog.non_standard_shopify_sites.push({
                    domain,
                    issue,
                    detected_as: 'shopify',
                    confidence: detection.confidenceLevel,
                    score: detection.score,
                    date_added: new Date().toISOString().split('T')[0],
                    notes: `Detection score: ${detection.score}, Matched patterns: ${detection.matchedPatterns.length}`
                });
                
                await fs.writeFile(this.backlogPath, JSON.stringify(backlog, null, 2));
                console.log(`📋 Added ${domain} to backlog for future review`);
            }
        } catch (error) {
            console.error('Failed to add to backlog:', error.message);
        }
    }
}

module.exports = ShopifyPlatform;