// Scraping Knowledge Base
// Stores and learns from successful scraping patterns

const fs = require('fs').promises;
const path = require('path');

class ScrapingKnowledgeBase {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/scraping-patterns.json');
        this.patterns = {};
        this.loadPatterns();
    }
    
    // Load existing patterns from file
    async loadPatterns() {
        try {
            const data = await fs.readFile(this.dbPath, 'utf8');
            this.patterns = JSON.parse(data);
            console.log(`📚 Loaded ${Object.keys(this.patterns).length} domain patterns`);
        } catch (error) {
            // File doesn't exist yet, create directory
            const dir = path.dirname(this.dbPath);
            await fs.mkdir(dir, { recursive: true });
            this.patterns = this.getDefaultPatterns();
            await this.savePatterns();
        }
    }
    
    // Save patterns to file
    async savePatterns() {
        await fs.writeFile(this.dbPath, JSON.stringify(this.patterns, null, 2));
    }
    
    // Default patterns for common platforms
    getDefaultPatterns() {
        return {
            'shopify': {
                platform: 'Shopify',
                confidence: 0.9,
                plpPatterns: ['/collections', '/collections/all', '/products'],
                pdpPatterns: ['/products/{slug}', '/collections/*/products/{slug}'],
                selectors: {
                    productGrid: '.product-grid, .collection-grid',
                    productLink: 'a[href*="/products/"]',
                    productTitle: 'h1.product__title, .product-single__title',
                    description: '.product__description, .product-description',
                    price: '.product__price, .price'
                },
                indicators: ['Shopify.shop', 'cdn.shopify.com'],
                notes: 'Standard Shopify structure, very consistent'
            },
            'woocommerce': {
                platform: 'WooCommerce',
                confidence: 0.8,
                plpPatterns: ['/shop', '/product-category/*'],
                pdpPatterns: ['/product/{slug}'],
                selectors: {
                    productGrid: '.products, ul.products',
                    productLink: 'a.woocommerce-loop-product__link',
                    productTitle: 'h1.product_title',
                    description: '.woocommerce-product-details__short-description, .product-description',
                    price: '.price, .woocommerce-Price-amount'
                },
                indicators: ['woocommerce', 'wp-content/plugins/woocommerce'],
                notes: 'WordPress + WooCommerce combo'
            },
            'magento': {
                platform: 'Magento',
                confidence: 0.7,
                plpPatterns: ['/catalog/category/view', '/*.html'],
                pdpPatterns: ['/catalog/product/view', '/*-{id}.html'],
                selectors: {
                    productGrid: '.products-grid, .product-items',
                    productLink: 'a.product-item-link',
                    productTitle: 'h1.page-title',
                    description: '.product-info-main .description, [itemprop="description"]',
                    price: '.price-box .price'
                },
                indicators: ['Magento', 'mage/', 'static/version'],
                notes: 'Complex but predictable structure'
            }
        };
    }
    
    // Learn from a successful scrape
    async learnFromSuccess(domain, data) {
        console.log(`🧠 Learning from successful scrape of ${domain}`);
        
        const domainKey = this.getDomainKey(domain);
        
        // Create or update pattern
        if (!this.patterns[domainKey]) {
            this.patterns[domainKey] = {
                domain: domainKey,
                successCount: 0,
                failureCount: 0,
                lastSuccess: null,
                lastFailure: null,
                patterns: {}
            };
        }
        
        const pattern = this.patterns[domainKey];
        pattern.successCount++;
        pattern.lastSuccess = new Date().toISOString();
        
        // Store successful patterns
        pattern.patterns = {
            ...pattern.patterns,
            plpUrl: data.plpUrl,
            plpPath: new URL(data.plpUrl).pathname,
            productCount: data.products?.length || 0,
            productUrls: data.products?.map(p => p.url) || [],
            productUrlPattern: this.detectUrlPattern(data.products?.map(p => p.url) || []),
            averageDescriptionLength: this.calculateAvgLength(data.products),
            descriptionStructure: this.analyzeStructure(data.products),
            lastAnalysis: data.analysis
        };
        
        await this.savePatterns();
        console.log(`✅ Updated knowledge base for ${domainKey}`);
    }
    
    // Learn from a failure
    async learnFromFailure(domain, error, attemptedPaths = []) {
        console.log(`📝 Recording failure for ${domain}`);
        
        const domainKey = this.getDomainKey(domain);
        
        if (!this.patterns[domainKey]) {
            this.patterns[domainKey] = {
                domain: domainKey,
                successCount: 0,
                failureCount: 0,
                patterns: {}
            };
        }
        
        const pattern = this.patterns[domainKey];
        pattern.failureCount++;
        pattern.lastFailure = new Date().toISOString();
        pattern.lastError = error;
        pattern.attemptedPaths = attemptedPaths;
        
        await this.savePatterns();
    }
    
    // Get patterns for a domain
    getPatternForDomain(domain) {
        const domainKey = this.getDomainKey(domain);
        
        // Direct match
        if (this.patterns[domainKey]) {
            return this.patterns[domainKey];
        }
        
        // Check if it matches a known platform
        for (const [platform, pattern] of Object.entries(this.patterns)) {
            if (pattern.indicators) {
                // This would need actual checking against the domain
                // For now, return null
            }
        }
        
        return null;
    }
    
    // Get suggestions for scraping
    getSuggestionsForDomain(domain) {
        const existing = this.getPatternForDomain(domain);
        const suggestions = [];
        
        if (existing && existing.successCount > 0) {
            suggestions.push({
                type: 'known_pattern',
                confidence: 'high',
                plpPath: existing.patterns.plpPath,
                message: `Previously successful PLP: ${existing.patterns.plpPath}`
            });
        }
        
        // Add platform-specific suggestions
        const platformSuggestions = [
            { path: '/shop', platforms: ['Shopify', 'WooCommerce'] },
            { path: '/products', platforms: ['Shopify', 'Generic'] },
            { path: '/collections/all', platforms: ['Shopify'] },
            { path: '/catalog', platforms: ['Magento', 'Generic'] }
        ];
        
        platformSuggestions.forEach(({ path, platforms }) => {
            suggestions.push({
                type: 'common_pattern',
                confidence: 'medium',
                path,
                platforms,
                message: `Common pattern for ${platforms.join(', ')}`
            });
        });
        
        return suggestions;
    }
    
    // Helper: Get consistent domain key
    getDomainKey(domain) {
        try {
            const url = domain.includes('://') ? domain : `https://${domain}`;
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return domain.replace('www.', '');
        }
    }
    
    // Helper: Detect URL patterns
    detectUrlPattern(urls) {
        if (!urls || urls.length === 0) return null;
        
        // Look for common patterns
        const patterns = urls.map(url => {
            const path = new URL(url).pathname;
            return path.replace(/[\d\-]+/g, '{id}').replace(/[a-z0-9\-]+$/i, '{slug}');
        });
        
        // Find most common pattern
        const counts = {};
        patterns.forEach(p => counts[p] = (counts[p] || 0) + 1);
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    }
    
    // Helper: Calculate average description length
    calculateAvgLength(products) {
        if (!products || products.length === 0) return 0;
        const lengths = products.map(p => p.descriptionWordCount || 0);
        return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
    }
    
    // Helper: Analyze description structure
    analyzeStructure(products) {
        if (!products || products.length === 0) return {};
        
        const structures = {
            hasBullets: 0,
            hasParagraphs: 0,
            hasSpecs: 0,
            avgParagraphs: 0
        };
        
        products.forEach(p => {
            if (p.features && p.features.length > 0) structures.hasBullets++;
            if (p.mainDescription) structures.hasParagraphs++;
            if (p.specifications) structures.hasSpecs++;
        });
        
        return {
            bulletPoints: `${Math.round(structures.hasBullets / products.length * 100)}%`,
            paragraphs: `${Math.round(structures.hasParagraphs / products.length * 100)}%`,
            specifications: `${Math.round(structures.hasSpecs / products.length * 100)}%`
        };
    }
    
    // Generate report for debugging
    generateReport() {
        const report = {
            totalDomains: Object.keys(this.patterns).length,
            successfulDomains: Object.values(this.patterns).filter(p => p.successCount > 0).length,
            failedDomains: Object.values(this.patterns).filter(p => p.failureCount > 0 && p.successCount === 0).length,
            patterns: {}
        };
        
        // Add top patterns
        Object.entries(this.patterns)
            .filter(([k, v]) => v.successCount > 0)
            .sort((a, b) => b[1].successCount - a[1].successCount)
            .slice(0, 10)
            .forEach(([domain, data]) => {
                report.patterns[domain] = {
                    successes: data.successCount,
                    failures: data.failureCount,
                    plpPath: data.patterns?.plpPath,
                    avgDescLength: data.patterns?.averageDescriptionLength
                };
            });
        
        return report;
    }
    
    // Get knowledge base prompt for Claude
    getKnowledgePrompt(domain) {
        const pattern = this.getPatternForDomain(domain);
        const suggestions = this.getSuggestionsForDomain(domain);
        
        let prompt = `\n\nKnowledge Base Information for ${domain}:\n`;
        
        if (pattern && pattern.successCount > 0) {
            prompt += `- Previously successful PLP: ${pattern.patterns.plpPath}\n`;
            prompt += `- Product URL pattern: ${pattern.patterns.productUrlPattern || 'Unknown'}\n`;
            prompt += `- Average description length: ${pattern.patterns.averageDescriptionLength} words\n`;
            prompt += `- Last successful scrape: ${pattern.lastSuccess}\n`;
        }
        
        if (suggestions.length > 0) {
            prompt += '\nSuggested paths to try:\n';
            suggestions.forEach(s => {
                prompt += `- ${s.path || s.plpPath}: ${s.message}\n`;
            });
        }
        
        return prompt;
    }
}

module.exports = ScrapingKnowledgeBase;