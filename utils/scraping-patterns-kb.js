// Scraping Patterns Knowledge Base
// Pattern-first approach: Try known patterns before AI

const fs = require('fs').promises;
const path = require('path');

class ScrapingPatternsKB {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/scraping-patterns-v2.json');
        this.patterns = {};
        this.platformDetectors = {};
        this.loadPatterns();
    }
    
    async loadPatterns() {
        try {
            const data = await fs.readFile(this.dbPath, 'utf8');
            const loaded = JSON.parse(data);
            this.patterns = loaded.patterns || {};
            this.platformDetectors = loaded.platformDetectors || this.getDefaultPlatformDetectors();
            console.log(`📚 Loaded patterns for ${Object.keys(this.patterns).length} domains`);
        } catch (error) {
            const dir = path.dirname(this.dbPath);
            await fs.mkdir(dir, { recursive: true });
            this.patterns = {};
            this.platformDetectors = this.getDefaultPlatformDetectors();
            await this.savePatterns();
        }
    }
    
    async savePatterns() {
        await fs.writeFile(this.dbPath, JSON.stringify({
            patterns: this.patterns,
            platformDetectors: this.platformDetectors,
            lastUpdated: new Date().toISOString()
        }, null, 2));
    }
    
    // Platform detection patterns
    getDefaultPlatformDetectors() {
        return {
            shopify: {
                name: 'Shopify',
                detectors: {
                    html: [
                        /Shopify\.shop/i,
                        /cdn\.shopify\.com/i,
                        /shopify-section/i
                    ],
                    headers: {
                        'x-shopify-stage': /.*/
                    }
                },
                patterns: {
                    plp: {
                        paths: ['/collections', '/collections/all', '/collections/{category}'],
                        selectors: {
                            productGrid: [
                                '.product-grid',
                                '.collection-grid',
                                '.grid--collection',
                                '[class*="product"][class*="grid"]'
                            ],
                            productLink: [
                                'a[href*="/products/"]',
                                '.product-item a',
                                '.grid__item a'
                            ]
                        }
                    },
                    pdp: {
                        urlPatterns: [
                            /\/products\/[\w-]+$/,
                            /\/collections\/[\w-]+\/products\/[\w-]+$/
                        ],
                        selectors: {
                            title: [
                                'h1.product__title',
                                '.product-single__title',
                                'h1[class*="product"][class*="title"]'
                            ],
                            description: [
                                '.product__description',
                                '.product-description',
                                '[class*="product"][class*="description"]',
                                '.rte' // Rich text editor content
                            ],
                            shortDescription: [
                                '.product-short-description',
                                '.product__text'
                            ]
                        }
                    }
                }
            },
            woocommerce: {
                name: 'WooCommerce',
                detectors: {
                    html: [
                        /woocommerce/i,
                        /wp-content\/plugins\/woocommerce/i,
                        /wc-product/i
                    ]
                },
                patterns: {
                    plp: {
                        paths: ['/shop', '/product-category/{category}'],
                        selectors: {
                            productGrid: [
                                '.products',
                                'ul.products',
                                '.woocommerce-loop-product'
                            ],
                            productLink: [
                                'a.woocommerce-loop-product__link',
                                '.products a[href*="/product/"]'
                            ]
                        }
                    },
                    pdp: {
                        urlPatterns: [
                            /\/product\/[\w-]+$/
                        ],
                        selectors: {
                            title: [
                                'h1.product_title',
                                '.product_title'
                            ],
                            description: [
                                '.woocommerce-product-details__short-description',
                                '.product-description',
                                '#tab-description'
                            ]
                        }
                    }
                }
            },
            generic: {
                name: 'Generic E-commerce',
                patterns: {
                    plp: {
                        paths: [
                            '/shop', '/products', '/catalog', '/store',
                            '/category/{category}', '/browse', '/all'
                        ],
                        selectors: {
                            productGrid: [
                                '[class*="product"][class*="grid"]',
                                '[class*="product"][class*="list"]',
                                '[id*="product"][class*="grid"]',
                                '.items', '.catalog'
                            ],
                            productLink: [
                                'a[href*="/product"]',
                                'a[href*="/p/"]',
                                'a[href*="/item"]',
                                '.product a',
                                '.item a'
                            ]
                        }
                    },
                    pdp: {
                        urlPatterns: [
                            /\/product\//i,
                            /\/p\//i,
                            /\/item\//i,
                            /\/([\w-]+)-p[\d]+/i
                        ],
                        selectors: {
                            title: [
                                'h1',
                                '[itemprop="name"]',
                                '.product-name',
                                '.product-title'
                            ],
                            description: [
                                '[itemprop="description"]',
                                '.product-description',
                                '.description',
                                '#description',
                                '.product-details'
                            ]
                        }
                    }
                }
            }
        };
    }
    
    // Detect platform for a domain
    async detectPlatform(domain, pageHtml = '') {
        for (const [platformKey, platform] of Object.entries(this.platformDetectors)) {
            if (platform.detectors?.html) {
                for (const pattern of platform.detectors.html) {
                    if (pattern.test(pageHtml)) {
                        console.log(`🎯 Detected platform: ${platform.name}`);
                        return platformKey;
                    }
                }
            }
        }
        return 'generic';
    }
    
    // Get or create pattern for domain
    getDomainPattern(domain) {
        const domainKey = this.normalizeDomain(domain);
        
        if (!this.patterns[domainKey]) {
            this.patterns[domainKey] = {
                domain: domainKey,
                platform: null,
                confirmed: {
                    plp: null,
                    pdp: {
                        urlPattern: null,
                        selectors: {}
                    }
                },
                attempts: [],
                successes: 0,
                failures: 0,
                lastUpdated: new Date().toISOString()
            };
        }
        
        return this.patterns[domainKey];
    }
    
    // Try known patterns first
    async tryKnownPatterns(domain, type = 'plp') {
        const domainPattern = this.getDomainPattern(domain);
        
        // 1. Try confirmed patterns for this domain
        if (domainPattern.confirmed[type]) {
            console.log(`✅ Using confirmed ${type} pattern for ${domain}`);
            return {
                source: 'confirmed',
                pattern: domainPattern.confirmed[type]
            };
        }
        
        // 2. Try platform-specific patterns
        const platform = domainPattern.platform || 'generic';
        const platformPatterns = this.platformDetectors[platform]?.patterns?.[type];
        
        if (platformPatterns) {
            console.log(`🔍 Trying ${platform} platform patterns for ${type}`);
            return {
                source: 'platform',
                pattern: platformPatterns
            };
        }
        
        // 3. Return generic patterns
        return {
            source: 'generic',
            pattern: this.platformDetectors.generic.patterns[type]
        };
    }
    
    // Record successful pattern
    async recordSuccess(domain, type, successData) {
        const domainPattern = this.getDomainPattern(domain);
        domainPattern.successes++;
        domainPattern.lastUpdated = new Date().toISOString();
        
        // Update confirmed patterns
        if (type === 'plp' && successData.url) {
            domainPattern.confirmed.plp = {
                url: successData.url,
                path: new URL(successData.url).pathname,
                selector: successData.selector
            };
        } else if (type === 'pdp' && successData.urlPattern) {
            domainPattern.confirmed.pdp = {
                urlPattern: successData.urlPattern,
                selectors: successData.selectors || {}
            };
        }
        
        // Detect platform if not set
        if (!domainPattern.platform && successData.html) {
            domainPattern.platform = await this.detectPlatform(domain, successData.html);
        }
        
        await this.savePatterns();
        console.log(`✅ Recorded successful ${type} pattern for ${domain}`);
    }
    
    // Record failed attempt
    async recordFailure(domain, type, attemptData) {
        const domainPattern = this.getDomainPattern(domain);
        domainPattern.failures++;
        domainPattern.lastUpdated = new Date().toISOString();
        
        domainPattern.attempts.push({
            type,
            timestamp: new Date().toISOString(),
            attempted: attemptData,
            success: false
        });
        
        // Keep only last 10 attempts
        if (domainPattern.attempts.length > 10) {
            domainPattern.attempts = domainPattern.attempts.slice(-10);
        }
        
        await this.savePatterns();
    }
    
    // Clean up bad/failed patterns for a domain
    async cleanupDomain(domain) {
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        
        if (this.domains && this.domains[cleanDomain]) {
            console.log(`🧹 Cleaning up failed patterns for ${cleanDomain}`);
            
            // Remove confirmed patterns that didn't work
            if (this.domains[cleanDomain].confirmed) {
                delete this.domains[cleanDomain].confirmed;
            }
            
            // Reset success count to 0
            this.domains[cleanDomain].successes = 0;
            
            // Mark as needing fresh analysis
            this.domains[cleanDomain].needsFreshAnalysis = true;
            this.domains[cleanDomain].lastCleanup = new Date().toISOString();
            
            await this.savePatterns();
        }
    }
    
    // Get AI hints based on knowledge base
    getAIHints(domain) {
        const domainPattern = this.getDomainPattern(domain);
        const hints = [];
        
        // Add confirmed patterns
        if (domainPattern.confirmed.plp) {
            hints.push(`Known PLP: ${domainPattern.confirmed.plp.url}`);
        }
        
        // Add platform info
        if (domainPattern.platform) {
            hints.push(`Platform: ${this.platformDetectors[domainPattern.platform]?.name || domainPattern.platform}`);
        }
        
        // Add failure info
        if (domainPattern.failures > 0) {
            const recentAttempts = domainPattern.attempts.slice(-3);
            hints.push(`Failed attempts: ${domainPattern.failures}`);
            if (recentAttempts.length > 0) {
                hints.push('Recent attempts: ' + recentAttempts.map(a => a.attempted.path || a.attempted.url).join(', '));
            }
        }
        
        // Add similar domain patterns
        const similarDomains = this.findSimilarDomains(domain);
        if (similarDomains.length > 0) {
            hints.push(`Similar successful domains: ${similarDomains.join(', ')}`);
        }
        
        return hints;
    }
    
    // Find similar successful domains
    findSimilarDomains(domain) {
        const domainPattern = this.getDomainPattern(domain);
        const similar = [];
        
        for (const [key, pattern] of Object.entries(this.patterns)) {
            if (key !== domain && pattern.successes > 0) {
                // Same platform
                if (pattern.platform === domainPattern.platform) {
                    similar.push(key);
                }
            }
        }
        
        return similar.slice(0, 3);
    }
    
    // Test if URL matches pattern
    testUrlPattern(url, patterns) {
        if (!Array.isArray(patterns)) patterns = [patterns];
        
        for (const pattern of patterns) {
            if (pattern instanceof RegExp && pattern.test(url)) {
                return true;
            } else if (typeof pattern === 'string') {
                // Convert string pattern to regex
                const regexPattern = pattern
                    .replace(/\{[\w-]+\}/g, '[\\w-]+')
                    .replace(/\*/g, '.*');
                if (new RegExp(regexPattern).test(url)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Extract using selectors
    extractWithSelectors(html, selectors) {
        // This would use jsdom or cheerio in real implementation
        // For now, return placeholder
        return {
            found: false,
            selector: null,
            content: null
        };
    }
    
    // Normalize domain
    normalizeDomain(domain) {
        try {
            const url = domain.includes('://') ? domain : `https://${domain}`;
            return new URL(url).hostname.replace('www.', '').toLowerCase();
        } catch {
            return domain.replace('www.', '').toLowerCase();
        }
    }
    
    // Generate status report
    generateReport() {
        const report = {
            totalDomains: Object.keys(this.patterns).length,
            confirmedPatterns: 0,
            platformBreakdown: {},
            successRate: 0
        };
        
        let totalAttempts = 0;
        let totalSuccesses = 0;
        
        for (const pattern of Object.values(this.patterns)) {
            if (pattern.confirmed.plp || pattern.confirmed.pdp.urlPattern) {
                report.confirmedPatterns++;
            }
            
            totalAttempts += pattern.successes + pattern.failures;
            totalSuccesses += pattern.successes;
            
            const platform = pattern.platform || 'unknown';
            report.platformBreakdown[platform] = (report.platformBreakdown[platform] || 0) + 1;
        }
        
        report.successRate = totalAttempts > 0 ? 
            Math.round(totalSuccesses / totalAttempts * 100) : 0;
        
        return report;
    }
}

module.exports = ScrapingPatternsKB;