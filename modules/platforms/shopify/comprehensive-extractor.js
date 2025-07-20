// Comprehensive Product Extractor for Shopify
// Captures ALL product-related content for complete SEO analysis

const cheerio = require('cheerio');

class ComprehensiveShopifyExtractor {
    constructor() {
        this.name = 'ComprehensiveShopifyExtractor';
        this.version = '2.0.0';
    }
    
    /**
     * Extract ALL product content comprehensively
     */
    extract(html, url) {
        const $ = cheerio.load(html);
        const data = {
            url,
            title: '',
            description: '',
            contentSections: {},
            features: [],
            specifications: {},
            extractedSources: [],
            metrics: {
                mainDescriptionChars: 0,
                additionalContentChars: 0,
                totalCharsExtracted: 0,
                estimatedTotalChars: 0,
                captureRate: 0
            }
        };
        
        // Extract title
        data.title = this.extractTitle($);
        
        // 1. Main description
        const mainDesc = this.extractMainDescription($);
        data.description = mainDesc;
        data.metrics.mainDescriptionChars = mainDesc.length;
        if (mainDesc) data.extractedSources.push('main_description');
        
        // 2. Extract ALL content sections
        const sections = this.extractAllContentSections($);
        data.contentSections = sections.content;
        
        // Add all sections to description
        Object.entries(sections.content).forEach(([section, content]) => {
            if (content && content.trim()) {
                data.description += `\n\n${section}:\n${content}`;
                data.metrics.additionalContentChars += content.length;
                data.extractedSources.push(section.toLowerCase().replace(/\s+/g, '_'));
            }
        });
        
        // 3. Extract features from anywhere
        data.features = this.extractAllFeatures($);
        if (data.features.length > 0) {
            const featuresText = '\n\nKey Features:\n' + data.features.join('\n');
            data.description += featuresText;
            data.metrics.additionalContentChars += featuresText.length;
            data.extractedSources.push('features');
        }
        
        // 4. Extract specifications
        data.specifications = this.extractSpecifications($);
        if (Object.keys(data.specifications).length > 0) {
            data.extractedSources.push('specifications');
        }
        
        // Calculate metrics
        data.metrics.totalCharsExtracted = data.description.length;
        data.metrics.estimatedTotalChars = this.estimateTotalContent($);
        data.metrics.captureRate = Math.round(
            (data.metrics.totalCharsExtracted / data.metrics.estimatedTotalChars) * 100
        );
        
        // Quality assessment
        if (data.metrics.captureRate >= 80) data.quality = 'excellent';
        else if (data.metrics.captureRate >= 60) data.quality = 'good';
        else if (data.metrics.captureRate >= 40) data.quality = 'fair';
        else data.quality = 'poor';
        
        return data;
    }
    
    /**
     * Extract title
     */
    extractTitle($) {
        const selectors = [
            'h1.product__title',
            'h1[itemprop="name"]',
            '.product-single__title',
            '.product__name',
            'h1'
        ];
        
        for (const selector of selectors) {
            const title = $(selector).first().text().trim();
            if (title) return title;
        }
        return 'Unknown Product';
    }
    
    /**
     * Extract main description
     */
    extractMainDescription($) {
        const selectors = [
            '.product-single__description',
            '.product__description',
            '.product-description',
            '[data-product-description]',
            '.product-details__description',
            '.product-info__description',
            '[itemprop="description"]',
            '.rte:not(.rte--header)'
        ];
        
        for (const selector of selectors) {
            const $elem = $(selector).first();
            if ($elem.length) {
                const text = $elem.text().trim();
                if (text.length > 30) return text;
            }
        }
        return '';
    }
    
    /**
     * Extract ALL content sections comprehensively
     */
    extractAllContentSections($) {
        const sections = {};
        
        // Define content patterns to look for
        const contentPatterns = [
            // Tab content
            { selectors: ['.tab-content', '.tabs-content', '[data-tab-content]'], prefix: 'Tab' },
            { selectors: ['#tab-description', '#panel-description'], name: 'Description Tab' },
            { selectors: ['#tab-details', '#panel-details'], name: 'Details Tab' },
            { selectors: ['#tab-care', '#panel-care'], name: 'Care Instructions' },
            { selectors: ['#tab-shipping', '#panel-shipping'], name: 'Shipping Info' },
            { selectors: ['#tab-sizing', '#panel-sizing'], name: 'Sizing Guide' },
            
            // Accordion content
            { selectors: ['.accordion-content', '.accordion__content', '.collapsible__content'], prefix: 'Section' },
            
            // Specific content sections
            { selectors: ['.product-benefits', '.benefits'], name: 'Benefits' },
            { selectors: ['.how-to-use', '.usage-instructions', '.product-usage'], name: 'How to Use' },
            { selectors: ['.product-materials', '.materials', '.ingredients'], name: 'Materials' },
            { selectors: ['.sustainability-info', '.eco-info', '.environmental'], name: 'Sustainability' },
            { selectors: ['.product-story', '.brand-story', '.about-product'], name: 'Product Story' },
            { selectors: ['.size-guide', '.size-chart', '.sizing-info'], name: 'Size Guide' },
            { selectors: ['.care-instructions', '.product-care', '.maintenance'], name: 'Care Instructions' },
            { selectors: ['.shipping-info', '.delivery-info', '.shipping-details'], name: 'Shipping' },
            { selectors: ['.returns-info', '.return-policy'], name: 'Returns' },
            { selectors: ['.warranty-info', '.guarantee'], name: 'Warranty' },
            
            // FAQ sections
            { selectors: ['.product-faq', '.faq', '.questions-answers'], name: 'FAQ' },
            { selectors: ['.faq-item', '.qa-item'], prefix: 'Q&A' },
            
            // Reviews summary
            { selectors: ['.reviews-summary', '.review-highlights'], name: 'Review Highlights' },
            
            // Additional info
            { selectors: ['.additional-info', '.more-info', '.product-info'], name: 'Additional Info' },
            { selectors: ['.product-notes', '.special-notes'], name: 'Special Notes' }
        ];
        
        // Extract content from each pattern
        contentPatterns.forEach(pattern => {
            pattern.selectors.forEach(selector => {
                $(selector).each((index, elem) => {
                    const $elem = $(elem);
                    const text = $elem.text().trim();
                    
                    if (text && text.length > 20) {
                        // Determine section name
                        let sectionName = pattern.name;
                        if (!sectionName && pattern.prefix) {
                            sectionName = `${pattern.prefix} ${index + 1}`;
                        }
                        if (!sectionName) {
                            sectionName = `Content ${Object.keys(sections).length + 1}`;
                        }
                        
                        // Avoid duplicates
                        if (!Object.values(sections).some(content => content.includes(text.substring(0, 50)))) {
                            sections[sectionName] = text;
                        }
                    }
                });
            });
        });
        
        return { content: sections, found: Object.keys(sections).length > 0 };
    }
    
    /**
     * Extract ALL features from various locations
     */
    extractAllFeatures($) {
        const features = new Set();
        
        // Feature selectors
        const selectors = [
            '.product-features li',
            '.features-list li',
            '.product-benefits li',
            '.feature-list li',
            '.product__features li',
            '.benefits-list li',
            '[data-product-features] li',
            '.product-highlights li',
            // Also check description area for lists
            '.product-single__description ul li',
            '.product__description ul li',
            '.rte ul li',
            // Icon-based features
            '.feature-item',
            '.benefit-item',
            '.product-feature'
        ];
        
        selectors.forEach(selector => {
            $(selector).each((i, elem) => {
                const text = $(elem).text().trim();
                if (text && text.length > 5) {
                    features.add(text);
                }
            });
        });
        
        return Array.from(features);
    }
    
    /**
     * Extract specifications
     */
    extractSpecifications($) {
        const specs = {};
        
        // Spec table selectors
        const tableSelectors = [
            '.specs-table',
            '.specifications-table',
            '.product-specs table',
            '.technical-specs table',
            '[data-product-specs] table'
        ];
        
        tableSelectors.forEach(selector => {
            $(`${selector} tr`).each((i, row) => {
                const $row = $(row);
                const cells = $row.find('td');
                if (cells.length >= 2) {
                    const label = $(cells[0]).text().trim();
                    const value = $(cells[1]).text().trim();
                    if (label && value) {
                        specs[label] = value;
                    }
                }
            });
        });
        
        // Definition lists
        $('.product-specs dl, .specifications dl').each((i, dl) => {
            $(dl).find('dt').each((j, dt) => {
                const label = $(dt).text().trim();
                const value = $(dt).next('dd').text().trim();
                if (label && value) {
                    specs[label] = value;
                }
            });
        });
        
        return specs;
    }
    
    /**
     * Estimate total content
     */
    estimateTotalContent($) {
        // Get all text from product area
        const productSelectors = [
            '.product',
            '.product-single',
            '.product-container',
            '.product-wrapper',
            '#product-container',
            '[itemtype*="Product"]',
            'main'
        ];
        
        for (const selector of productSelectors) {
            const $area = $(selector).first();
            if ($area.length) {
                // Clone to avoid modifying original
                const $clone = $area.clone();
                $clone.find('script, style, noscript').remove();
                const text = $clone.text();
                if (text.length > 100) {
                    return text.length;
                }
            }
        }
        
        // Fallback
        return $('body').text().length * 0.4;
    }
}

module.exports = ComprehensiveShopifyExtractor;