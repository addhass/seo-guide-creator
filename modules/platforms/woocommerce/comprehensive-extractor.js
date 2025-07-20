// Comprehensive Product Extractor for WooCommerce
// Captures ALL product-related content for complete SEO analysis

const cheerio = require('cheerio');

class ComprehensiveWooCommerceExtractor {
    constructor() {
        this.name = 'ComprehensiveWooCommerceExtractor';
        this.version = '2.0.0';
        this.platform = 'woocommerce';
    }
    
    /**
     * Extract ALL product content comprehensively
     */
    extract(html, url) {
        const $ = cheerio.load(html);
        const data = {
            url,
            platform: this.platform,
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
        
        // 1. Short description (product summary)
        const shortDesc = this.extractShortDescription($);
        if (shortDesc) {
            data.description = shortDesc;
            data.metrics.mainDescriptionChars = shortDesc.length;
            data.extractedSources.push('short_description');
        }
        
        // 2. Main description from tabs
        const mainDesc = this.extractMainDescription($);
        if (mainDesc) {
            if (data.description) {
                data.description += '\n\n' + mainDesc;
            } else {
                data.description = mainDesc;
            }
            data.metrics.mainDescriptionChars += mainDesc.length;
            data.extractedSources.push('main_description');
        }
        
        // 3. Extract ALL content sections
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
        
        // 4. Extract features from anywhere
        data.features = this.extractAllFeatures($);
        if (data.features.length > 0) {
            const featuresText = '\n\nKey Features:\n' + data.features.join('\n');
            data.description += featuresText;
            data.metrics.additionalContentChars += featuresText.length;
            data.extractedSources.push('features');
        }
        
        // 5. Extract specifications and attributes
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
        
        // Extract price for completeness
        data.price = this.extractPrice($);
        
        return data;
    }
    
    /**
     * Extract title
     */
    extractTitle($) {
        const selectors = [
            'h1.product_title',
            'h1.entry-title',
            '.product_title',
            'h1[itemprop="name"]',
            '.summary h1',
            'h1'
        ];
        
        for (const selector of selectors) {
            const title = $(selector).first().text().trim();
            if (title) return title;
        }
        return 'Unknown Product';
    }
    
    /**
     * Extract short description
     */
    extractShortDescription($) {
        const selectors = [
            '.woocommerce-product-details__short-description',
            '.product-short-description',
            '.summary .short-description',
            '.entry-summary > div:first-of-type',
            '[itemprop="description"]'
        ];
        
        for (const selector of selectors) {
            const $elem = $(selector).first();
            if ($elem.length) {
                const text = $elem.text().trim();
                if (text.length > 20) return text;
            }
        }
        return '';
    }
    
    /**
     * Extract main description from tabs
     */
    extractMainDescription($) {
        const selectors = [
            '#tab-description',
            '#panel-description', 
            '.woocommerce-Tabs-panel--description',
            '.woocommerce-tabs .description_tab',
            '.tab-content-description',
            '#description',
            '.product-description'
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
            // WooCommerce tabs
            { selectors: ['#tab-additional_information', '#panel-additional_information'], name: 'Additional Information' },
            { selectors: ['#tab-specification', '#panel-specification'], name: 'Specifications' },
            { selectors: ['#tab-reviews', '.woocommerce-Reviews'], name: 'Reviews', skipText: true },
            
            // Custom tabs (common patterns)
            { selectors: ['#tab-ingredients', '.tab-ingredients'], name: 'Ingredients' },
            { selectors: ['#tab-nutrition', '.tab-nutrition'], name: 'Nutrition' },
            { selectors: ['#tab-sizing', '.tab-sizing', '.size-guide'], name: 'Size Guide' },
            { selectors: ['#tab-shipping', '.tab-shipping'], name: 'Shipping' },
            { selectors: ['#tab-warranty', '.tab-warranty'], name: 'Warranty' },
            { selectors: ['#tab-care', '.tab-care', '.care-instructions'], name: 'Care Instructions' },
            
            // Content sections outside tabs
            { selectors: ['.product-features', '.features'], name: 'Features' },
            { selectors: ['.product-benefits', '.benefits'], name: 'Benefits' },
            { selectors: ['.how-to-use', '.usage-instructions'], name: 'How to Use' },
            { selectors: ['.product-materials', '.materials'], name: 'Materials' },
            { selectors: ['.sustainability-info', '.eco-friendly'], name: 'Sustainability' },
            { selectors: ['.product-story', '.brand-story'], name: 'Product Story' },
            
            // FAQ sections
            { selectors: ['.product-faq', '.faq', '.faqs'], name: 'FAQ' },
            { selectors: ['.questions-answers', '.q-and-a'], name: 'Q&A' },
            
            // Additional info
            { selectors: ['.warranty-info', '.guarantee'], name: 'Warranty Info' },
            { selectors: ['.return-policy', '.returns'], name: 'Return Policy' },
            { selectors: ['.delivery-info', '.shipping-info'], name: 'Delivery' }
        ];
        
        // Extract content from each pattern
        contentPatterns.forEach(pattern => {
            if (pattern.skipText) return; // Skip reviews section text
            
            pattern.selectors.forEach(selector => {
                const $elem = $(selector);
                if ($elem.length) {
                    const text = $elem.text().trim();
                    
                    if (text && text.length > 20) {
                        // Avoid duplicates
                        if (!Object.values(sections).some(content => content.includes(text.substring(0, 50)))) {
                            sections[pattern.name] = text;
                        }
                    }
                }
            });
        });
        
        // Extract accordion content
        this.extractAccordionContent($, sections);
        
        // Extract custom tabs
        this.extractCustomTabs($, sections);
        
        return { content: sections, found: Object.keys(sections).length > 0 };
    }
    
    /**
     * Extract accordion content
     */
    extractAccordionContent($, sections) {
        // Common accordion patterns
        const accordionSelectors = [
            '.accordion-content',
            '.collapsible-content',
            '.toggle-content',
            '.expand-content'
        ];
        
        accordionSelectors.forEach(selector => {
            $(selector).each((index, elem) => {
                const $elem = $(elem);
                const text = $elem.text().trim();
                
                if (text && text.length > 20) {
                    // Try to get accordion title
                    const $title = $elem.prev('.accordion-title, .collapsible-title, .toggle-title');
                    const title = $title.length ? $title.text().trim() : `Accordion ${index + 1}`;
                    
                    if (!Object.values(sections).some(content => content.includes(text.substring(0, 50)))) {
                        sections[title] = text;
                    }
                }
            });
        });
    }
    
    /**
     * Extract custom tabs
     */
    extractCustomTabs($, sections) {
        // Find all tab panels
        $('.woocommerce-tabs .panel, .tab-content, [role="tabpanel"]').each((index, elem) => {
            const $elem = $(elem);
            const id = $elem.attr('id');
            
            // Skip if already captured
            if (id && Object.keys(sections).some(key => key.toLowerCase().includes(id.replace('tab-', '').replace('panel-', '')))) {
                return;
            }
            
            const text = $elem.text().trim();
            if (text && text.length > 20) {
                // Try to get tab name
                let tabName = 'Custom Tab ' + (index + 1);
                if (id) {
                    tabName = id.replace('tab-', '').replace('panel-', '').replace(/-/g, ' ');
                    tabName = tabName.charAt(0).toUpperCase() + tabName.slice(1);
                }
                
                if (!Object.values(sections).some(content => content.includes(text.substring(0, 50)))) {
                    sections[tabName] = text;
                }
            }
        });
    }
    
    /**
     * Extract ALL features from various locations
     */
    extractAllFeatures($) {
        const features = new Set();
        
        // Feature selectors
        const selectors = [
            // In description areas
            '#tab-description li',
            '.woocommerce-product-details__short-description li',
            '.product-description li',
            
            // Feature sections
            '.product-features li',
            '.features-list li',
            '.product-benefits li',
            '.feature-list li',
            '.product-highlights li',
            
            // Icon-based features
            '.feature-item',
            '.benefit-item',
            '.product-feature',
            
            // Bullet points anywhere
            '.summary ul li',
            '.entry-content ul li'
        ];
        
        selectors.forEach(selector => {
            $(selector).each((i, elem) => {
                const text = $(elem).text().trim();
                if (text && text.length > 5 && text.length < 200) {
                    features.add(text);
                }
            });
        });
        
        return Array.from(features);
    }
    
    /**
     * Extract specifications and attributes
     */
    extractSpecifications($) {
        const specs = {};
        
        // WooCommerce attributes table
        $('.woocommerce-product-attributes tr, .shop_attributes tr').each((i, row) => {
            const $row = $(row);
            const label = $row.find('th, .label').text().trim();
            const value = $row.find('td, .value').text().trim();
            
            if (label && value) {
                specs[label] = value;
            }
        });
        
        // Additional information tab
        $('#tab-additional_information table tr').each((i, row) => {
            const $row = $(row);
            const label = $row.find('th').text().trim();
            const value = $row.find('td').text().trim();
            
            if (label && value && !specs[label]) {
                specs[label] = value;
            }
        });
        
        // Custom specification patterns
        $('.specifications dt, .product-specs dt').each((i, dt) => {
            const label = $(dt).text().trim();
            const value = $(dt).next('dd').text().trim();
            
            if (label && value) {
                specs[label] = value;
            }
        });
        
        return specs;
    }
    
    /**
     * Extract price
     */
    extractPrice($) {
        const selectors = [
            '.woocommerce-Price-amount',
            'span.amount',
            '.price ins .amount',
            '.price > .amount',
            'p.price',
            '.summary .price'
        ];
        
        for (const selector of selectors) {
            const price = $(selector).first().text().trim();
            if (price) return price;
        }
        return '';
    }
    
    /**
     * Estimate total content
     */
    estimateTotalContent($) {
        // Get all text from product area
        const productSelectors = [
            '.product',
            '.single-product',
            '.product-container',
            '#product-container',
            '.type-product',
            'article.product',
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
    
    /**
     * Legacy method for compatibility
     */
    extractProduct(html, url) {
        return this.extract(html, url);
    }
}

module.exports = ComprehensiveWooCommerceExtractor;