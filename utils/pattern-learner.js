// Pattern Learning System
// Learns and reinforces regex patterns from successful extractions

const fs = require('fs').promises;
const path = require('path');

class PatternLearner {
    constructor() {
        this.patternsPath = path.join(__dirname, '../data/platform-patterns.json');
        this.patterns = {};
        this.loadPatterns();
    }
    
    async loadPatterns() {
        try {
            const data = await fs.readFile(this.patternsPath, 'utf8');
            this.patterns = JSON.parse(data);
            console.log(`📚 Loaded patterns for ${Object.keys(this.patterns.platforms).length} platforms`);
        } catch (error) {
            console.error('Failed to load patterns:', error);
            this.patterns = { platforms: {} };
        }
    }
    
    async savePatterns() {
        this.patterns.last_updated = new Date().toISOString();
        await fs.writeFile(this.patternsPath, JSON.stringify(this.patterns, null, 2));
    }
    
    // Extract common pattern from multiple URLs
    extractCommonPattern(urls, type = 'plp') {
        if (!urls || urls.length === 0) return null;
        
        // For PLPs, look for /collections/ or /products/ patterns
        if (type === 'plp') {
            // Check if all URLs contain /collections/
            const allHaveCollections = urls.every(url => url.includes('/collections/'));
            if (allHaveCollections) {
                return '/collections/[\\w-]+$';
            }
            
            // Check for /shop pattern
            const allHaveShop = urls.every(url => url.match(/\/shop\/?$/));
            if (allHaveShop) {
                return '/shop/?$';
            }
        }
        
        // For PDPs, look for /products/ patterns
        if (type === 'pdp') {
            const allHaveProducts = urls.every(url => url.includes('/products/'));
            if (allHaveProducts) {
                // Check if it's a collection product URL
                const hasCollection = urls.some(url => url.includes('/collections/') && url.includes('/products/'));
                if (hasCollection) {
                    return '/collections/[\\w-]+/products/[\\w-]+$';
                }
                return '/products/[\\w-]+$';
            }
        }
        
        return null;
    }
    
    // Learn from successful extraction
    async learnFromSuccess(domain, platform, type, urls) {
        console.log(`🧠 Learning from ${urls.length} successful ${type} extractions for ${domain}`);
        
        // Ensure platform exists
        if (!this.patterns.platforms[platform]) {
            console.log(`⚠️ Platform ${platform} not found in patterns`);
            return;
        }
        
        const platformData = this.patterns.platforms[platform];
        
        // Add domain to verified list if not already there
        if (!platformData.verified_domains.includes(domain)) {
            platformData.verified_domains.push(domain);
        }
        
        // Extract paths from URLs
        const paths = urls.map(url => {
            try {
                return new URL(url).pathname;
            } catch (e) {
                return url; // If not a full URL, assume it's already a path
            }
        });
        
        // Find common pattern
        const commonPattern = this.extractCommonPattern(paths, type);
        
        if (commonPattern) {
            console.log(`✅ Identified pattern: ${commonPattern}`);
            
            // Reinforce or update the pattern
            const currentPattern = platformData.patterns[type].confirmed_regex;
            
            if (currentPattern !== commonPattern) {
                console.log(`📝 Updating ${type} pattern from ${currentPattern} to ${commonPattern}`);
                platformData.patterns[type].confirmed_regex = commonPattern;
            } else {
                console.log(`✓ Pattern confirmed: ${commonPattern}`);
            }
            
            // Add examples (keep unique, max 5)
            const examples = platformData.patterns[type].examples || [];
            paths.forEach(path => {
                if (!examples.includes(path) && examples.length < 5) {
                    examples.push(path);
                }
            });
            platformData.patterns[type].examples = examples;
        }
        
        // Update success count
        platformData.success_count = (platformData.success_count || 0) + 1;
        
        await this.savePatterns();
    }
    
    // Learn from failure
    async learnFromFailure(domain, platform, type, attemptedPaths) {
        if (!this.patterns.platforms[platform]) return;
        
        const platformData = this.patterns.platforms[platform];
        
        // Add to exclude patterns if pattern keeps failing
        if (type === 'plp' && attemptedPaths.length > 0) {
            const excludes = platformData.patterns.plp.exclude_patterns || [];
            attemptedPaths.forEach(path => {
                if (!excludes.includes(path) && excludes.length < 10) {
                    excludes.push(path);
                }
            });
            platformData.patterns.plp.exclude_patterns = excludes;
        }
        
        // Update failure count
        platformData.failure_count = (platformData.failure_count || 0) + 1;
        
        await this.savePatterns();
    }
    
    // Get patterns for a platform
    getPlatformPatterns(platform) {
        return this.patterns.platforms[platform] || null;
    }
    
    // Test if URL matches pattern
    matchesPattern(url, platform, type) {
        const platformData = this.patterns.platforms[platform];
        if (!platformData) return false;
        
        const pattern = platformData.patterns[type]?.confirmed_regex;
        if (!pattern) return false;
        
        try {
            const pathname = new URL(url).pathname;
            const regex = new RegExp(pattern);
            return regex.test(pathname);
        } catch (e) {
            return false;
        }
    }
    
    // Get best platform match based on HTML patterns with weights
    detectPlatform(html) {
        let bestMatch = null;
        let highestScore = 0;
        let matchedPatterns = [];
        
        for (const [platform, data] of Object.entries(this.patterns.platforms)) {
            let score = 0;
            let platformMatches = [];
            
            // Check HTML patterns
            if (data.detection.html_patterns) {
                data.detection.html_patterns.forEach(patternObj => {
                    try {
                        const regex = new RegExp(patternObj.pattern, 'gi');
                        const matches = html.match(regex);
                        if (matches) {
                            score += patternObj.weight;
                            platformMatches.push({
                                pattern: patternObj.pattern,
                                description: patternObj.description,
                                weight: patternObj.weight,
                                count: matches.length
                            });
                        }
                    } catch (e) {
                        console.error(`Invalid regex pattern: ${patternObj.pattern}`);
                    }
                });
            }
            
            // Legacy support for html_signatures
            if (data.detection.html_signatures) {
                data.detection.html_signatures.forEach(signature => {
                    const regex = new RegExp(signature, 'i');
                    if (regex.test(html)) {
                        score += 5; // Default weight
                        platformMatches.push({
                            pattern: signature,
                            weight: 5
                        });
                    }
                });
            }
            
            if (score >= data.detection.confidence_threshold && score > highestScore) {
                highestScore = score;
                bestMatch = platform;
                matchedPatterns = platformMatches;
            }
        }
        
        return {
            platform: bestMatch,
            confidence: highestScore,
            isConfident: highestScore >= (this.patterns.platforms[bestMatch]?.detection.confidence_threshold || 10),
            matchedPatterns: matchedPatterns,
            confidenceLevel: highestScore > 20 ? 'high' : highestScore > 10 ? 'medium' : 'low'
        };
    }
}

module.exports = PatternLearner;