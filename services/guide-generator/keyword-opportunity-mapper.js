// Keyword Opportunity Mapper
// Maps content patterns to keyword opportunities from SERP data

class KeywordOpportunityMapper {
    constructor() {
        this.minSearchVolume = 100; // Minimum monthly searches to consider
        this.categories = this.getKeywordCategories();
    }
    
    /**
     * Map keyword opportunities based on patterns and SERP data
     * @param {Object} patterns - Content patterns from analyzer
     * @param {Object} serpData - SERP and keyword data
     * @param {Object} brandInfo - Brand information
     * @returns {Object} Mapped keyword opportunities
     */
    async mapOpportunities(patterns, serpData, brandInfo) {
        console.log('🎯 Mapping keyword opportunities...');
        
        const opportunities = {
            keywords: [],
            totalSearchVolume: 0,
            categories: {},
            contentGaps: [],
            priorityPages: []
        };
        
        // Extract keywords from SERP data
        const keywords = this.extractKeywords(serpData);
        
        // Categorize keywords
        opportunities.categories = this.categorizeKeywords(keywords, patterns);
        
        // Identify content gaps
        opportunities.contentGaps = this.identifyGaps(keywords, patterns, serpData);
        
        // Map keywords to content types
        opportunities.keywords = this.mapKeywordsToContent(keywords, patterns);
        
        // Calculate total opportunity
        opportunities.totalSearchVolume = opportunities.keywords.reduce(
            (sum, kw) => sum + (kw.searchVolume || 0), 0
        );
        
        // Prioritize page creation
        opportunities.priorityPages = this.prioritizePages(opportunities);
        
        return opportunities;
    }
    
    /**
     * Extract keywords from SERP data
     */
    extractKeywords(serpData) {
        const keywords = [];
        
        // Main keyword
        if (serpData.keyword) {
            keywords.push({
                keyword: serpData.keyword,
                searchVolume: serpData.searchVolume || 1000,
                difficulty: serpData.difficulty || 'medium',
                intent: this.detectIntent(serpData.keyword),
                type: 'primary'
            });
        }
        
        // Related keywords
        if (serpData.relatedKeywords && Array.isArray(serpData.relatedKeywords)) {
            serpData.relatedKeywords.forEach(kw => {
                keywords.push({
                    keyword: typeof kw === 'string' ? kw : kw.keyword,
                    searchVolume: kw.searchVolume || 500,
                    difficulty: kw.difficulty || 'medium',
                    intent: this.detectIntent(kw.keyword || kw),
                    type: 'related'
                });
            });
        }
        
        // Generate long-tail variations
        const longTails = this.generateLongTails(serpData.keyword, serpData.brandInfo || {});
        keywords.push(...longTails);
        
        return keywords.filter(kw => kw.searchVolume >= this.minSearchVolume);
    }
    
    /**
     * Detect search intent from keyword
     */
    detectIntent(keyword) {
        const kw = keyword.toLowerCase();
        
        // Commercial intent
        if (kw.match(/buy|shop|deal|discount|coupon|sale|cheap|affordable/)) {
            return 'commercial';
        }
        
        // Transactional intent
        if (kw.match(/order|purchase|checkout|shipping|delivery/)) {
            return 'transactional';
        }
        
        // Informational intent
        if (kw.match(/how|what|why|guide|tutorial|tips|best|review/)) {
            return 'informational';
        }
        
        // Navigational intent
        if (kw.match(/brand|store|website|login|account/)) {
            return 'navigational';
        }
        
        // Default to commercial for product keywords
        return 'commercial';
    }
    
    /**
     * Generate long-tail keyword variations
     */
    generateLongTails(mainKeyword, brandInfo) {
        const variations = [];
        const modifiers = {
            quality: ['best', 'top', 'premium', 'quality'],
            comparison: ['vs', 'versus', 'compared to', 'alternative'],
            location: ['near me', 'online', brandInfo.targetMarket],
            intent: ['buy', 'shop', 'find', 'get'],
            attributes: ['affordable', 'eco-friendly', 'sustainable', 'organic']
        };
        
        Object.entries(modifiers).forEach(([type, mods]) => {
            mods.forEach(modifier => {
                variations.push({
                    keyword: `${modifier} ${mainKeyword}`,
                    searchVolume: 200, // Estimated
                    difficulty: 'low',
                    intent: this.detectIntent(`${modifier} ${mainKeyword}`),
                    type: 'long-tail',
                    category: type
                });
                
                variations.push({
                    keyword: `${mainKeyword} ${modifier}`,
                    searchVolume: 150, // Estimated
                    difficulty: 'low',
                    intent: this.detectIntent(`${mainKeyword} ${modifier}`),
                    type: 'long-tail',
                    category: type
                });
            });
        });
        
        return variations;
    }
    
    /**
     * Categorize keywords by type and intent
     */
    categorizeKeywords(keywords, patterns) {
        const categories = {
            'product-pages': [],
            'category-pages': [],
            'guide-content': [],
            'comparison-pages': [],
            'landing-pages': []
        };
        
        keywords.forEach(kw => {
            // Product pages - specific product keywords
            if (kw.intent === 'commercial' || kw.intent === 'transactional') {
                categories['product-pages'].push(kw);
            }
            
            // Category pages - broader terms
            if (kw.type === 'primary' || (kw.searchVolume > 1000 && !kw.keyword.includes('how'))) {
                categories['category-pages'].push(kw);
            }
            
            // Guide content - informational keywords
            if (kw.intent === 'informational' || kw.keyword.match(/guide|how|tips|best/)) {
                categories['guide-content'].push(kw);
            }
            
            // Comparison pages
            if (kw.keyword.match(/vs|versus|compare|alternative/)) {
                categories['comparison-pages'].push(kw);
            }
            
            // Landing pages - high-volume commercial
            if (kw.searchVolume > 500 && kw.intent === 'commercial') {
                categories['landing-pages'].push(kw);
            }
        });
        
        // Add opportunity scores
        Object.keys(categories).forEach(cat => {
            const totalVolume = categories[cat].reduce((sum, kw) => sum + kw.searchVolume, 0);
            categories[cat] = {
                keywords: categories[cat],
                count: categories[cat].length,
                totalVolume,
                avgVolume: categories[cat].length > 0 ? Math.round(totalVolume / categories[cat].length) : 0
            };
        });
        
        return categories;
    }
    
    /**
     * Identify content gaps based on competitor analysis
     */
    identifyGaps(keywords, patterns, serpData) {
        const gaps = [];
        
        // Check for missing content types
        if (!patterns.contentStructures.frequency.usageInstructions ||
            patterns.contentStructures.frequency.usageInstructions.percentage < 30) {
            gaps.push({
                type: 'how-to-content',
                opportunity: 'Add detailed usage instructions and tutorials',
                keywords: keywords.filter(kw => kw.keyword.includes('how')),
                priority: 'high'
            });
        }
        
        if (!patterns.contentStructures.frequency.socialProof ||
            patterns.contentStructures.frequency.socialProof.percentage < 40) {
            gaps.push({
                type: 'social-proof',
                opportunity: 'Include customer reviews and testimonials',
                keywords: keywords.filter(kw => kw.keyword.includes('review')),
                priority: 'medium'
            });
        }
        
        // Check for missing comparison content
        const comparisonKeywords = keywords.filter(kw => kw.keyword.match(/vs|compare|alternative/));
        if (comparisonKeywords.length > 0 && !patterns.winningFormulas.find(f => f.name.includes('Comparison'))) {
            gaps.push({
                type: 'comparison-content',
                opportunity: 'Create comparison guides and versus pages',
                keywords: comparisonKeywords,
                priority: 'high'
            });
        }
        
        // Check for FAQ opportunities
        const questionKeywords = keywords.filter(kw => kw.keyword.includes('?') || kw.keyword.match(/what|how|why/));
        if (questionKeywords.length > 3) {
            gaps.push({
                type: 'faq-content',
                opportunity: 'Build comprehensive FAQ section',
                keywords: questionKeywords,
                priority: 'medium'
            });
        }
        
        return gaps;
    }
    
    /**
     * Map keywords to specific content recommendations
     */
    mapKeywordsToContent(keywords, patterns) {
        return keywords.map(kw => {
            const recommendation = {
                ...kw,
                contentType: this.determineContentType(kw),
                contentLength: this.recommendLength(kw, patterns),
                contentElements: this.recommendElements(kw, patterns),
                priority: this.calculatePriority(kw)
            };
            
            return recommendation;
        });
    }
    
    /**
     * Determine best content type for keyword
     */
    determineContentType(keyword) {
        const kw = keyword.keyword.toLowerCase();
        
        if (kw.match(/review|rating/)) return 'review-rich-product-page';
        if (kw.match(/how|guide|tutorial/)) return 'educational-guide';
        if (kw.match(/vs|versus|compare/)) return 'comparison-page';
        if (kw.match(/best|top/)) return 'listicle-category-page';
        if (kw.match(/buy|shop/)) return 'transactional-landing-page';
        
        return 'standard-product-page';
    }
    
    /**
     * Recommend content length based on keyword
     */
    recommendLength(keyword, patterns) {
        const baseLength = patterns.metrics.avgWords || 200;
        
        // Informational content needs more depth
        if (keyword.intent === 'informational') {
            return {
                min: baseLength * 2,
                target: baseLength * 3,
                max: baseLength * 4
            };
        }
        
        // Commercial content can be more concise
        if (keyword.intent === 'commercial') {
            return {
                min: baseLength * 0.8,
                target: baseLength,
                max: baseLength * 1.5
            };
        }
        
        return {
            min: baseLength,
            target: baseLength * 1.2,
            max: baseLength * 2
        };
    }
    
    /**
     * Recommend content elements based on keyword
     */
    recommendElements(keyword, patterns) {
        const elements = [];
        
        // Base elements from successful patterns
        patterns.contentStructures.mostCommon.forEach(element => {
            elements.push(element);
        });
        
        // Keyword-specific elements
        if (keyword.keyword.match(/review/)) {
            elements.push('customer-reviews', 'rating-summary', 'testimonials');
        }
        
        if (keyword.keyword.match(/how|guide/)) {
            elements.push('step-by-step-instructions', 'video-tutorial', 'faq');
        }
        
        if (keyword.keyword.match(/compare|vs/)) {
            elements.push('comparison-table', 'pros-cons-list', 'verdict');
        }
        
        if (keyword.intent === 'commercial') {
            elements.push('pricing-info', 'shipping-details', 'guarantee');
        }
        
        return [...new Set(elements)]; // Remove duplicates
    }
    
    /**
     * Calculate keyword priority
     */
    calculatePriority(keyword) {
        let score = 0;
        
        // Volume score (0-40 points)
        if (keyword.searchVolume > 5000) score += 40;
        else if (keyword.searchVolume > 1000) score += 30;
        else if (keyword.searchVolume > 500) score += 20;
        else if (keyword.searchVolume > 100) score += 10;
        
        // Difficulty score (0-30 points)
        if (keyword.difficulty === 'low') score += 30;
        else if (keyword.difficulty === 'medium') score += 20;
        else if (keyword.difficulty === 'high') score += 10;
        
        // Intent score (0-30 points)
        if (keyword.intent === 'commercial') score += 30;
        else if (keyword.intent === 'transactional') score += 25;
        else if (keyword.intent === 'informational') score += 20;
        else score += 15;
        
        // Return priority level
        if (score >= 70) return 'critical';
        if (score >= 50) return 'high';
        if (score >= 30) return 'medium';
        return 'low';
    }
    
    /**
     * Prioritize page creation based on opportunities
     */
    prioritizePages(opportunities) {
        const pages = [];
        
        // Group keywords by suggested pages
        const pageGroups = {};
        
        opportunities.keywords.forEach(kw => {
            const pageType = kw.contentType;
            if (!pageGroups[pageType]) {
                pageGroups[pageType] = {
                    type: pageType,
                    keywords: [],
                    totalVolume: 0
                };
            }
            
            pageGroups[pageType].keywords.push(kw);
            pageGroups[pageType].totalVolume += kw.searchVolume;
        });
        
        // Convert to array and sort by opportunity
        Object.values(pageGroups).forEach(group => {
            pages.push({
                pageType: group.type,
                primaryKeyword: group.keywords[0], // Highest volume
                supportingKeywords: group.keywords.slice(1),
                totalOpportunity: group.totalVolume,
                estimatedTraffic: Math.round(group.totalVolume * 0.03), // 3% CTR estimate
                priority: this.calculatePagePriority(group)
            });
        });
        
        return pages.sort((a, b) => b.totalOpportunity - a.totalOpportunity).slice(0, 10);
    }
    
    /**
     * Calculate page priority
     */
    calculatePagePriority(pageGroup) {
        if (pageGroup.totalVolume > 10000) return 'critical';
        if (pageGroup.totalVolume > 5000) return 'high';
        if (pageGroup.totalVolume > 1000) return 'medium';
        return 'low';
    }
    
    /**
     * Define keyword categories
     */
    getKeywordCategories() {
        return {
            'product': ['buy', 'shop', 'price', 'sale', 'deal'],
            'informational': ['how', 'what', 'why', 'guide', 'tutorial'],
            'comparison': ['vs', 'versus', 'compare', 'alternative', 'better'],
            'review': ['review', 'rating', 'testimonial', 'feedback'],
            'brand': ['brand', 'company', 'store', 'official']
        };
    }
}

module.exports = KeywordOpportunityMapper;