// Content Pattern Analyzer
// Identifies winning content formulas from competitor descriptions

class ContentPatternAnalyzer {
    constructor() {
        this.patterns = {
            structural: this.getStructuralPatterns(),
            linguistic: this.getLinguisticPatterns(),
            persuasion: this.getPersuasionPatterns()
        };
    }
    
    /**
     * Analyze competitor content to identify patterns
     * @param {Array} competitorData - Array of competitor product data
     * @returns {Object} Identified patterns and metrics
     */
    async analyze(competitorData) {
        console.log('🔍 Analyzing content patterns...');
        
        const analysis = {
            winningFormulas: [],
            metrics: {
                avgLength: 0,
                avgSentences: 0,
                avgReadability: 0
            },
            topPatterns: [],
            contentStructures: [],
            commonElements: []
        };
        
        // Extract all descriptions
        const descriptions = this.extractDescriptions(competitorData);
        
        // Calculate basic metrics
        analysis.metrics = this.calculateMetrics(descriptions);
        
        // Identify structural patterns
        analysis.contentStructures = this.identifyStructures(descriptions);
        
        // Find common elements
        analysis.commonElements = this.findCommonElements(descriptions);
        
        // Identify winning formulas
        analysis.winningFormulas = this.identifyWinningFormulas(descriptions);
        
        // Rank patterns by effectiveness
        analysis.topPatterns = this.rankPatterns(analysis);
        
        return analysis;
    }
    
    /**
     * Extract all product descriptions from competitor data
     */
    extractDescriptions(competitorData) {
        const descriptions = [];
        
        competitorData.forEach(competitor => {
            if (competitor.products && Array.isArray(competitor.products)) {
                competitor.products.forEach(product => {
                    if (product.description || product.contentSections) {
                        descriptions.push({
                            domain: competitor.domain,
                            title: product.title,
                            mainDescription: product.description,
                            contentSections: product.contentSections || {},
                            fullContent: this.combineContent(product),
                            captureRate: product.metrics?.captureRate || 0
                        });
                    }
                });
            }
        });
        
        return descriptions;
    }
    
    /**
     * Combine all content sections into full text
     */
    combineContent(product) {
        let fullContent = product.description || '';
        
        if (product.contentSections) {
            Object.values(product.contentSections).forEach(section => {
                if (typeof section === 'string') {
                    fullContent += ' ' + section;
                }
            });
        }
        
        return fullContent.trim();
    }
    
    /**
     * Calculate content metrics
     */
    calculateMetrics(descriptions) {
        const metrics = {
            avgLength: 0,
            avgWords: 0,
            avgSentences: 0,
            avgReadability: 0,
            lengthDistribution: {
                short: 0,  // < 100 words
                medium: 0, // 100-300 words
                long: 0    // > 300 words
            }
        };
        
        descriptions.forEach(desc => {
            const content = desc.fullContent;
            const words = content.split(/\s+/).length;
            const sentences = content.split(/[.!?]+/).length;
            
            metrics.avgLength += content.length;
            metrics.avgWords += words;
            metrics.avgSentences += sentences;
            
            // Categorize length
            if (words < 100) metrics.lengthDistribution.short++;
            else if (words <= 300) metrics.lengthDistribution.medium++;
            else metrics.lengthDistribution.long++;
        });
        
        const count = descriptions.length || 1;
        metrics.avgLength = Math.round(metrics.avgLength / count);
        metrics.avgWords = Math.round(metrics.avgWords / count);
        metrics.avgSentences = Math.round(metrics.avgSentences / count);
        
        return metrics;
    }
    
    /**
     * Identify content structures
     */
    identifyStructures(descriptions) {
        const structures = [];
        
        descriptions.forEach(desc => {
            const structure = {
                hasBulletPoints: /[•·⚬◦▪▫◾◽★☆]/g.test(desc.fullContent),
                hasNumberedList: /\d+[.)]/g.test(desc.fullContent),
                hasQuestions: /\?/g.test(desc.fullContent),
                hasBenefits: /benefit|advantage|improve|enhance/gi.test(desc.fullContent),
                hasFeatures: /feature|specification|material|ingredient/gi.test(desc.fullContent),
                hasUsageInstructions: /how to|usage|instruction|step/gi.test(desc.fullContent),
                hasSocialProof: /customer|review|rated|loved|favorite/gi.test(desc.fullContent),
                sections: Object.keys(desc.contentSections || {})
            };
            
            structures.push(structure);
        });
        
        return this.summarizeStructures(structures);
    }
    
    /**
     * Summarize common structures
     */
    summarizeStructures(structures) {
        const summary = {
            mostCommon: [],
            frequency: {}
        };
        
        // Count occurrences
        const elements = [
            'bulletPoints', 'numberedList', 'questions', 'benefits',
            'features', 'usageInstructions', 'socialProof'
        ];
        
        elements.forEach(element => {
            const key = 'has' + element.charAt(0).toUpperCase() + element.slice(1);
            const count = structures.filter(s => s[key]).length;
            const percentage = (count / structures.length * 100).toFixed(1);
            
            summary.frequency[element] = {
                count,
                percentage: parseFloat(percentage)
            };
            
            if (percentage > 50) {
                summary.mostCommon.push(element);
            }
        });
        
        return summary;
    }
    
    /**
     * Find common elements across descriptions
     */
    findCommonElements(descriptions) {
        const elements = {
            openingPatterns: [],
            closingPatterns: [],
            keyPhrases: [],
            emotionalTriggers: [],
            callsToAction: []
        };
        
        // Analyze openings (first 50 chars)
        const openings = descriptions.map(d => d.fullContent.substring(0, 50).toLowerCase());
        elements.openingPatterns = this.findPatterns(openings);
        
        // Analyze closings (last 50 chars)
        const closings = descriptions.map(d => {
            const content = d.fullContent;
            return content.substring(content.length - 50).toLowerCase();
        });
        elements.closingPatterns = this.findPatterns(closings);
        
        // Find emotional triggers
        elements.emotionalTriggers = this.findEmotionalTriggers(descriptions);
        
        // Find CTAs
        elements.callsToAction = this.findCTAs(descriptions);
        
        return elements;
    }
    
    /**
     * Find patterns in text segments
     */
    findPatterns(segments) {
        const patterns = {};
        
        // Common opening words
        const commonStarters = ['introducing', 'discover', 'meet', 'our', 'the', 'experience'];
        
        commonStarters.forEach(starter => {
            const count = segments.filter(s => s.includes(starter)).length;
            if (count > segments.length * 0.2) {
                patterns[starter] = (count / segments.length * 100).toFixed(1) + '%';
            }
        });
        
        return patterns;
    }
    
    /**
     * Find emotional triggers in content
     */
    findEmotionalTriggers(descriptions) {
        const triggers = {
            urgency: ['limited', 'exclusive', 'now', 'today', 'hurry'],
            trust: ['guarantee', 'certified', 'proven', 'trusted', 'authentic'],
            value: ['save', 'free', 'bonus', 'deal', 'offer'],
            quality: ['premium', 'luxury', 'finest', 'superior', 'best'],
            social: ['loved', 'popular', 'trending', 'favorite', 'recommended']
        };
        
        const found = {};
        
        Object.entries(triggers).forEach(([category, words]) => {
            const count = descriptions.filter(d => {
                const content = d.fullContent.toLowerCase();
                return words.some(word => content.includes(word));
            }).length;
            
            if (count > 0) {
                found[category] = {
                    frequency: (count / descriptions.length * 100).toFixed(1) + '%',
                    examples: words.filter(w => 
                        descriptions.some(d => d.fullContent.toLowerCase().includes(w))
                    )
                };
            }
        });
        
        return found;
    }
    
    /**
     * Find calls to action
     */
    findCTAs(descriptions) {
        const ctaPatterns = [
            /shop now/gi,
            /buy now/gi,
            /add to cart/gi,
            /learn more/gi,
            /discover/gi,
            /explore/gi,
            /get yours/gi,
            /try it/gi
        ];
        
        const ctas = {};
        
        ctaPatterns.forEach(pattern => {
            const matches = descriptions.filter(d => pattern.test(d.fullContent));
            if (matches.length > 0) {
                const cta = pattern.source.replace(/\\/g, '');
                ctas[cta] = (matches.length / descriptions.length * 100).toFixed(1) + '%';
            }
        });
        
        return ctas;
    }
    
    /**
     * Identify winning formulas based on patterns
     */
    identifyWinningFormulas(descriptions) {
        const formulas = [];
        
        // Formula 1: Problem-Solution-Benefit
        const psb = descriptions.filter(d => {
            const content = d.fullContent.toLowerCase();
            return content.includes('problem') || content.includes('struggle') ||
                   content.includes('solution') || content.includes('solve');
        });
        
        if (psb.length > descriptions.length * 0.3) {
            formulas.push({
                name: 'Problem-Solution-Benefit',
                frequency: (psb.length / descriptions.length * 100).toFixed(1) + '%',
                description: 'Identifies customer pain point, presents product as solution, highlights benefits'
            });
        }
        
        // Formula 2: Feature-Benefit Stack
        const featureBenefit = descriptions.filter(d => {
            const content = d.fullContent;
            return content.match(/[•·]/g) && content.match(/benefit|advantage|improve/gi);
        });
        
        if (featureBenefit.length > descriptions.length * 0.4) {
            formulas.push({
                name: 'Feature-Benefit Stack',
                frequency: (featureBenefit.length / descriptions.length * 100).toFixed(1) + '%',
                description: 'Lists features with corresponding benefits in bullet format'
            });
        }
        
        // Formula 3: Story-Driven
        const storyDriven = descriptions.filter(d => {
            const content = d.fullContent.toLowerCase();
            return content.includes('story') || content.includes('journey') ||
                   content.includes('inspired') || content.includes('founded');
        });
        
        if (storyDriven.length > descriptions.length * 0.2) {
            formulas.push({
                name: 'Story-Driven',
                frequency: (storyDriven.length / descriptions.length * 100).toFixed(1) + '%',
                description: 'Uses brand or product story to create emotional connection'
            });
        }
        
        // Formula 4: Social Proof Heavy
        const socialProof = descriptions.filter(d => {
            const content = d.fullContent.toLowerCase();
            return content.includes('customer') || content.includes('review') ||
                   content.includes('rated') || content.includes('loved by');
        });
        
        if (socialProof.length > descriptions.length * 0.3) {
            formulas.push({
                name: 'Social Proof Heavy',
                frequency: (socialProof.length / descriptions.length * 100).toFixed(1) + '%',
                description: 'Emphasizes customer satisfaction and reviews'
            });
        }
        
        return formulas;
    }
    
    /**
     * Rank patterns by effectiveness
     */
    rankPatterns(analysis) {
        const patterns = [];
        
        // Add structural patterns
        Object.entries(analysis.contentStructures.frequency).forEach(([element, data]) => {
            if (data.percentage > 30) {
                patterns.push({
                    type: 'structural',
                    element,
                    importance: data.percentage,
                    recommendation: this.getRecommendation('structural', element, data.percentage)
                });
            }
        });
        
        // Add winning formulas
        analysis.winningFormulas.forEach(formula => {
            patterns.push({
                type: 'formula',
                element: formula.name,
                importance: parseFloat(formula.frequency),
                recommendation: formula.description
            });
        });
        
        // Sort by importance
        return patterns.sort((a, b) => b.importance - a.importance).slice(0, 10);
    }
    
    /**
     * Get recommendation for pattern
     */
    getRecommendation(type, element, percentage) {
        const recommendations = {
            structural: {
                bulletPoints: 'Use bullet points to highlight key features and benefits',
                benefits: 'Clearly state product benefits and customer value',
                features: 'List specific features with technical details',
                usageInstructions: 'Include how-to content or usage scenarios',
                socialProof: 'Add customer testimonials or satisfaction metrics'
            }
        };
        
        return recommendations[type]?.[element] || `Include ${element} (used by ${percentage}% of competitors)`;
    }
    
    /**
     * Define structural patterns
     */
    getStructuralPatterns() {
        return {
            'opening-hook': 'Attention-grabbing first sentence',
            'feature-list': 'Bulleted list of product features',
            'benefit-stack': 'Multiple benefits in sequence',
            'social-proof': 'Customer testimonials or ratings',
            'technical-specs': 'Detailed specifications',
            'usage-instructions': 'How to use the product',
            'guarantee': 'Money-back or satisfaction guarantee',
            'cta': 'Clear call to action'
        };
    }
    
    /**
     * Define linguistic patterns
     */
    getLinguisticPatterns() {
        return {
            'power-words': ['revolutionary', 'transform', 'essential', 'ultimate'],
            'sensory-words': ['smooth', 'crisp', 'vibrant', 'luxurious'],
            'action-verbs': ['discover', 'experience', 'unlock', 'elevate'],
            'inclusive-language': ['your', 'you\'ll', 'we', 'our']
        };
    }
    
    /**
     * Define persuasion patterns
     */
    getPersuasionPatterns() {
        return {
            'scarcity': 'Limited time or quantity',
            'authority': 'Expert endorsements or certifications',
            'reciprocity': 'Free gifts or bonuses',
            'commitment': 'Small yes leading to purchase',
            'liking': 'Relatable brand story',
            'consensus': 'Popularity indicators'
        };
    }
}

module.exports = ContentPatternAnalyzer;