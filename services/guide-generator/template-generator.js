// Template Generator
// Creates actionable content templates based on patterns and opportunities

class TemplateGenerator {
    constructor() {
        this.templates = this.loadBaseTemplates();
    }
    
    /**
     * Create content templates based on analysis
     * @param {Object} patterns - Content patterns from analyzer
     * @param {Object} opportunities - Keyword opportunities
     * @param {Object} brandInfo - Brand information
     * @returns {Array} Generated templates
     */
    async createTemplates(patterns, opportunities, brandInfo) {
        console.log('📝 Creating content templates...');
        
        const templates = [];
        
        // Generate templates for each priority page
        for (const page of opportunities.priorityPages.slice(0, 5)) {
            const template = await this.generateTemplate(
                page,
                patterns,
                brandInfo
            );
            templates.push(template);
        }
        
        // Add templates for content gaps
        for (const gap of opportunities.contentGaps) {
            if (gap.priority === 'high') {
                const gapTemplate = await this.generateGapTemplate(gap, patterns, brandInfo);
                templates.push(gapTemplate);
            }
        }
        
        return templates;
    }
    
    /**
     * Generate template for a specific page type
     */
    async generateTemplate(page, patterns, brandInfo) {
        const baseTemplate = this.templates[page.pageType] || this.templates['standard-product-page'];
        
        const template = {
            title: `${page.pageType.replace(/-/g, ' ').toUpperCase()} Template`,
            targetKeyword: page.primaryKeyword.keyword,
            searchVolume: page.totalOpportunity,
            priority: page.priority,
            sections: []
        };
        
        // Build sections based on successful patterns
        template.sections = this.buildSections(page, patterns, baseTemplate);
        
        // Add specific examples
        template.examples = this.generateExamples(page, patterns, brandInfo);
        
        // Add optimization tips
        template.optimizationTips = this.getOptimizationTips(page, patterns);
        
        // Add content outline
        template.outline = this.createOutline(template.sections, page);
        
        return template;
    }
    
    /**
     * Build content sections
     */
    buildSections(page, patterns, baseTemplate) {
        const sections = [];
        
        // Start with base template sections
        baseTemplate.sections.forEach(baseSection => {
            const section = {
                ...baseSection,
                customization: []
            };
            
            // Customize based on patterns
            if (patterns.contentStructures.mostCommon.includes('bulletPoints') && 
                section.name === 'features') {
                section.format = 'bulleted-list';
                section.customization.push('Use bullet points for easy scanning');
            }
            
            if (patterns.commonElements.emotionalTriggers.trust && 
                section.name === 'guarantee') {
                section.customization.push('Emphasize trust signals and guarantees');
                section.examples = patterns.commonElements.emotionalTriggers.trust.examples;
            }
            
            sections.push(section);
        });
        
        // Add sections for winning formulas
        patterns.winningFormulas.forEach(formula => {
            if (!sections.find(s => s.name === formula.name.toLowerCase())) {
                sections.push({
                    name: formula.name,
                    description: formula.description,
                    wordCount: { min: 50, target: 100, max: 150 },
                    required: parseFloat(formula.frequency) > 40,
                    customization: [`Used by ${formula.frequency} of competitors`]
                });
            }
        });
        
        return sections;
    }
    
    /**
     * Generate specific examples
     */
    generateExamples(page, patterns, brandInfo) {
        const examples = {
            openings: [],
            features: [],
            benefits: [],
            closings: []
        };
        
        // Opening examples based on patterns
        const openingPatterns = Object.keys(patterns.commonElements.openingPatterns);
        if (openingPatterns.length > 0) {
            examples.openings = [
                `Introducing the new ${brandInfo.name} ${page.primaryKeyword.keyword}...`,
                `Discover how ${brandInfo.name} revolutionizes ${page.primaryKeyword.keyword}...`,
                `Meet your new favorite ${page.primaryKeyword.keyword}...`
            ];
        }
        
        // Feature examples
        if (patterns.contentStructures.frequency.features?.percentage > 50) {
            examples.features = [
                '• Premium materials for lasting durability',
                '• Innovative design that solves [specific problem]',
                '• Eco-friendly construction with sustainable materials',
                '• [Technical specification] for superior performance'
            ];
        }
        
        // Benefit examples
        if (patterns.contentStructures.frequency.benefits?.percentage > 50) {
            examples.benefits = [
                'Save time with our efficient [feature]',
                'Enjoy peace of mind with our comprehensive warranty',
                'Experience the difference quality makes',
                'Join thousands of satisfied customers'
            ];
        }
        
        // Closing examples with CTAs
        const ctas = Object.keys(patterns.commonElements.callsToAction);
        if (ctas.length > 0) {
            examples.closings = [
                `Shop ${brandInfo.name} today and experience the difference.`,
                `Add to cart now and enjoy free shipping on orders over $50.`,
                `Limited time offer - Get yours before it's gone!`,
                `Join the ${brandInfo.name} family today.`
            ];
        }
        
        return examples;
    }
    
    /**
     * Get optimization tips
     */
    getOptimizationTips(page, patterns) {
        const tips = [];
        
        // Length optimization
        tips.push({
            category: 'Length',
            tip: `Aim for ${patterns.metrics.avgWords} words based on competitor average`,
            priority: 'high'
        });
        
        // Keyword optimization
        tips.push({
            category: 'Keywords',
            tip: `Include "${page.primaryKeyword.keyword}" in title, first paragraph, and 2-3 times naturally throughout`,
            priority: 'critical'
        });
        
        // Structure optimization
        if (patterns.contentStructures.frequency.bulletPoints?.percentage > 60) {
            tips.push({
                category: 'Format',
                tip: 'Use bullet points for features and benefits - competitors average 60%+ usage',
                priority: 'high'
            });
        }
        
        // Emotional triggers
        const triggers = Object.keys(patterns.commonElements.emotionalTriggers);
        if (triggers.length > 0) {
            tips.push({
                category: 'Psychology',
                tip: `Include ${triggers.join(', ')} triggers for emotional connection`,
                priority: 'medium'
            });
        }
        
        // Supporting keywords
        if (page.supportingKeywords && page.supportingKeywords.length > 0) {
            tips.push({
                category: 'LSI Keywords',
                tip: `Naturally include: ${page.supportingKeywords.slice(0, 3).map(k => k.keyword).join(', ')}`,
                priority: 'medium'
            });
        }
        
        return tips;
    }
    
    /**
     * Create content outline
     */
    createOutline(sections, page) {
        let totalWords = 0;
        const outline = {
            title: `SEO-Optimized ${page.pageType.replace(/-/g, ' ')} Outline`,
            sections: []
        };
        
        sections.forEach((section, index) => {
            const sectionWords = section.wordCount?.target || 100;
            totalWords += sectionWords;
            
            outline.sections.push({
                order: index + 1,
                name: section.name,
                wordCount: sectionWords,
                percentage: '0%', // Will calculate after
                keyPoints: section.customization || [],
                required: section.required || false
            });
        });
        
        // Calculate percentages
        outline.sections.forEach(section => {
            section.percentage = ((section.wordCount / totalWords) * 100).toFixed(1) + '%';
        });
        
        outline.totalWords = totalWords;
        outline.estimatedReadTime = Math.ceil(totalWords / 200) + ' min';
        
        return outline;
    }
    
    /**
     * Generate template for content gap
     */
    async generateGapTemplate(gap, patterns, brandInfo) {
        const template = {
            title: `Content Gap: ${gap.type.replace(/-/g, ' ').toUpperCase()}`,
            opportunity: gap.opportunity,
            priority: gap.priority,
            searchVolume: gap.keywords.reduce((sum, kw) => sum + kw.searchVolume, 0),
            sections: []
        };
        
        // Build sections based on gap type
        switch (gap.type) {
            case 'how-to-content':
                template.sections = [
                    {
                        name: 'Introduction',
                        description: 'Hook reader with the problem this solves',
                        wordCount: { min: 50, target: 75, max: 100 }
                    },
                    {
                        name: 'Step-by-Step Instructions',
                        description: 'Clear, numbered steps with visuals',
                        wordCount: { min: 200, target: 300, max: 400 },
                        format: 'numbered-list'
                    },
                    {
                        name: 'Pro Tips',
                        description: 'Expert advice and common mistakes to avoid',
                        wordCount: { min: 100, target: 150, max: 200 }
                    },
                    {
                        name: 'FAQ',
                        description: 'Answer common questions',
                        wordCount: { min: 100, target: 150, max: 200 },
                        format: 'q-and-a'
                    }
                ];
                break;
                
            case 'comparison-content':
                template.sections = [
                    {
                        name: 'Overview',
                        description: 'Introduction to products being compared',
                        wordCount: { min: 75, target: 100, max: 150 }
                    },
                    {
                        name: 'Comparison Table',
                        description: 'Side-by-side feature comparison',
                        format: 'table',
                        wordCount: { min: 100, target: 150, max: 200 }
                    },
                    {
                        name: 'Detailed Analysis',
                        description: 'In-depth look at key differences',
                        wordCount: { min: 200, target: 300, max: 400 }
                    },
                    {
                        name: 'Verdict',
                        description: 'Clear recommendation based on use cases',
                        wordCount: { min: 75, target: 100, max: 150 }
                    }
                ];
                break;
                
            case 'social-proof':
                template.sections = [
                    {
                        name: 'Customer Reviews',
                        description: 'Highlight best reviews with star ratings',
                        format: 'testimonial-cards',
                        wordCount: { min: 150, target: 200, max: 300 }
                    },
                    {
                        name: 'Success Stories',
                        description: 'Detailed customer case studies',
                        wordCount: { min: 200, target: 300, max: 400 }
                    },
                    {
                        name: 'Statistics',
                        description: 'Satisfaction rates, return rates, etc.',
                        format: 'data-visualization',
                        wordCount: { min: 50, target: 75, max: 100 }
                    }
                ];
                break;
                
            default:
                template.sections = this.templates['standard-product-page'].sections;
        }
        
        template.examples = this.generateGapExamples(gap, brandInfo);
        template.outline = this.createOutline(template.sections, { pageType: gap.type });
        
        return template;
    }
    
    /**
     * Generate examples for gap templates
     */
    generateGapExamples(gap, brandInfo) {
        const examples = {};
        
        switch (gap.type) {
            case 'how-to-content':
                examples.titles = [
                    `How to Use ${brandInfo.name} Products: Complete Guide`,
                    `Step-by-Step: Getting Started with ${brandInfo.name}`,
                    `Master Your ${brandInfo.name}: Tips & Tutorials`
                ];
                examples.steps = [
                    '1. Unpack your product and check all components',
                    '2. Follow the quick-start guide included',
                    '3. Download our app for additional features',
                    '4. Customize settings to your preference'
                ];
                break;
                
            case 'comparison-content':
                examples.titles = [
                    `${brandInfo.name} vs. Competitors: Honest Comparison`,
                    `Why Choose ${brandInfo.name}? Complete Analysis`,
                    `${brandInfo.name} Alternative: Is It Right for You?`
                ];
                examples.criteria = [
                    'Price & Value',
                    'Quality & Durability',
                    'Features & Innovation',
                    'Customer Support',
                    'Warranty & Returns'
                ];
                break;
                
            case 'social-proof':
                examples.testimonials = [
                    '★★★★★ "Best purchase I\'ve made this year!" - Sarah M.',
                    '★★★★★ "Exceeded all my expectations" - John D.',
                    '★★★★★ "Customer service is outstanding" - Lisa R.'
                ];
                examples.stats = [
                    '98% customer satisfaction rate',
                    'Average 4.8/5 star rating',
                    'Less than 2% return rate',
                    '10,000+ happy customers'
                ];
                break;
        }
        
        return examples;
    }
    
    /**
     * Load base templates
     */
    loadBaseTemplates() {
        return {
            'standard-product-page': {
                sections: [
                    {
                        name: 'headline',
                        description: 'Compelling product title with main keyword',
                        wordCount: { min: 10, target: 15, max: 20 },
                        required: true
                    },
                    {
                        name: 'introduction',
                        description: 'Hook the reader and introduce the product',
                        wordCount: { min: 50, target: 75, max: 100 },
                        required: true
                    },
                    {
                        name: 'features',
                        description: 'Key product features and specifications',
                        wordCount: { min: 100, target: 150, max: 200 },
                        format: 'bulleted-list',
                        required: true
                    },
                    {
                        name: 'benefits',
                        description: 'How the product improves customer\'s life',
                        wordCount: { min: 100, target: 150, max: 200 },
                        required: true
                    },
                    {
                        name: 'use-cases',
                        description: 'Specific scenarios where product excels',
                        wordCount: { min: 75, target: 100, max: 150 },
                        required: false
                    },
                    {
                        name: 'guarantee',
                        description: 'Warranty, returns, and trust signals',
                        wordCount: { min: 50, target: 75, max: 100 },
                        required: true
                    },
                    {
                        name: 'call-to-action',
                        description: 'Clear next step for the customer',
                        wordCount: { min: 20, target: 30, max: 50 },
                        required: true
                    }
                ]
            },
            'educational-guide': {
                sections: [
                    {
                        name: 'introduction',
                        description: 'Set context and promise value',
                        wordCount: { min: 100, target: 150, max: 200 }
                    },
                    {
                        name: 'background',
                        description: 'Why this topic matters',
                        wordCount: { min: 150, target: 200, max: 300 }
                    },
                    {
                        name: 'main-content',
                        description: 'Core educational content',
                        wordCount: { min: 400, target: 600, max: 800 }
                    },
                    {
                        name: 'examples',
                        description: 'Real-world applications',
                        wordCount: { min: 150, target: 200, max: 300 }
                    },
                    {
                        name: 'summary',
                        description: 'Key takeaways',
                        wordCount: { min: 75, target: 100, max: 150 }
                    },
                    {
                        name: 'next-steps',
                        description: 'How to apply this knowledge',
                        wordCount: { min: 50, target: 75, max: 100 }
                    }
                ]
            },
            'comparison-page': {
                sections: [
                    {
                        name: 'overview',
                        description: 'Introduction to comparison',
                        wordCount: { min: 75, target: 100, max: 150 }
                    },
                    {
                        name: 'comparison-table',
                        description: 'Side-by-side features',
                        format: 'table',
                        wordCount: { min: 100, target: 150, max: 200 }
                    },
                    {
                        name: 'detailed-analysis',
                        description: 'Deep dive into differences',
                        wordCount: { min: 300, target: 400, max: 500 }
                    },
                    {
                        name: 'use-case-recommendations',
                        description: 'Which option for which customer',
                        wordCount: { min: 150, target: 200, max: 250 }
                    },
                    {
                        name: 'verdict',
                        description: 'Clear recommendation',
                        wordCount: { min: 75, target: 100, max: 150 }
                    }
                ]
            },
            'listicle-category-page': {
                sections: [
                    {
                        name: 'introduction',
                        description: 'What this list covers and why',
                        wordCount: { min: 75, target: 100, max: 150 }
                    },
                    {
                        name: 'selection-criteria',
                        description: 'How items were chosen',
                        wordCount: { min: 75, target: 100, max: 150 }
                    },
                    {
                        name: 'list-items',
                        description: 'Individual product entries',
                        format: 'numbered-list',
                        wordCount: { min: 500, target: 750, max: 1000 }
                    },
                    {
                        name: 'comparison-summary',
                        description: 'Quick reference comparison',
                        format: 'table',
                        wordCount: { min: 100, target: 150, max: 200 }
                    },
                    {
                        name: 'buying-guide',
                        description: 'How to choose the right option',
                        wordCount: { min: 150, target: 200, max: 300 }
                    }
                ]
            }
        };
    }
}

module.exports = TemplateGenerator;