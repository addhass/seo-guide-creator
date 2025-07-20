// Enhanced Product Extractor for Shopify
// Captures ALL content including tabs, accordions, and features

const cheerio = require('cheerio');

class EnhancedShopifyExtractor {
    constructor() {
        this.name = 'EnhancedShopifyExtractor';
        this.version = '1.1.0';
    }
    
    /**
     * Extract comprehensive product data including hidden content
     */
    extract(html, url) {
        const $ = cheerio.load(html);
        const data = {
            url,
            title: '',
            description: '',
            tabContent: {},
            features: [],
            specifications: {},
            totalContent: '',
            extractedSources: [],
            missedSources: [],
            metrics: {
                mainDescriptionChars: 0,
                tabContentChars: 0,
                featureListChars: 0,
                totalCharsExtracted: 0,
                estimatedTotalChars: 0,
                captureRate: 0
            }
        };
        
        // Extract title
        data.title = this.extractTitle($);
        
        // 1. Extract main description (existing method)
        const mainDesc = this.extractMainDescription($);
        data.description = mainDesc.text;
        data.metrics.mainDescriptionChars = mainDesc.text.length;
        if (mainDesc.found) data.extractedSources.push('main_description');
        
        // 2. Extract tab content (NEW!)
        const tabContent = this.extractTabContent($);
        data.tabContent = tabContent.content;
        data.metrics.tabContentChars = tabContent.totalChars;
        if (tabContent.found) {
            data.extractedSources.push('tab_content');
            // Add tab content to main description
            Object.values(tabContent.content).forEach(content => {
                if (content) data.description += '\n\n' + content;
            });
        }
        
        // 3. Extract accordion content (NEW!)
        const accordionContent = this.extractAccordionContent($);
        if (accordionContent.found) {
            data.extractedSources.push('accordion_content');
            data.description += '\n\n' + accordionContent.text;
            data.metrics.tabContentChars += accordionContent.text.length;
        }
        
        // 4. Extract feature lists (NEW!)
        const features = this.extractFeatures($);
        data.features = features.items;
        data.metrics.featureListChars = features.totalChars;
        if (features.found) {
            data.extractedSources.push('feature_lists');
            // Add features to description for SEO
            if (features.items.length > 0) {
                data.description += '\n\nKey Features:\n' + features.items.join('\n');
            }
        }
        
        // 5. Extract specifications (NEW!)
        const specs = this.extractSpecifications($);
        if (specs.found) {
            data.specifications = specs.data;
            data.extractedSources.push('specifications');
        }
        
        // Calculate totals
        data.metrics.totalCharsExtracted = data.description.length;
        data.metrics.estimatedTotalChars = this.estimateTotalContent($);
        data.metrics.captureRate = Math.round(
            (data.metrics.totalCharsExtracted / data.metrics.estimatedTotalChars) * 100
        );
        
        // Determine what we missed
        data.missedSources = this.identifyMissedContent($, data.extractedSources);
        
        // Set quality based on capture rate
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
            '.rte:not(.rte--header)',
            '.product-details__description',
            '[itemprop="description"]'
        ];
        
        for (const selector of selectors) {
            const element = $(selector).first();
            if (element.length && element.text().trim().length > 50) {
                return {
                    text: element.text().trim(),
                    found: true
                };
            }
        }
        
        return { text: '', found: false };
    }
    
    /**
     * Extract tab content (NEW METHOD!)
     */
    extractTabContent($) {
        const content = {};
        let totalChars = 0;
        let found = false;
        
        // Common tab patterns
        const tabPatterns = [
            // Pattern 1: data-tabs with panels
            {
                tabs: '[data-tabs] [data-tab]',
                panels: '[data-tab-panel]',
                linkAttr: 'data-tab',
                panelAttr: 'data-tab-panel'
            },
            // Pattern 2: Classic tabs
            {
                tabs: '.tabs li a, .product-tabs a',
                panels: '.tab-content, .tabs-content',
                linkAttr: 'href',
                panelAttr: 'id'
            },
            // Pattern 3: Accordion tabs
            {
                tabs: '.accordion__title, .collapsible__trigger',
                panels: '.accordion__content, .collapsible__content',
                linkAttr: 'data-target',
                panelAttr: 'id'
            }
        ];
        
        // Try each pattern
        for (const pattern of tabPatterns) {
            $(pattern.tabs).each((i, tab) => {
                const $tab = $(tab);
                const tabText = $tab.text().trim();
                const tabId = $tab.attr(pattern.linkAttr) || $tab.attr('href') || '';
                
                // Find corresponding panel
                let $panel;
                if (tabId.startsWith('#')) {
                    $panel = $(tabId);
                } else if (pattern.panelAttr) {
                    $panel = $(`[${pattern.panelAttr}="${tabId}"]`);
                } else {
                    $panel = $tab.next(pattern.panels);
                }
                
                if ($panel && $panel.length) {
                    const panelText = $panel.text().trim();
                    if (panelText.length > 20) {
                        content[tabText] = panelText;
                        totalChars += panelText.length;
                        found = true;
                    }
                }
            });
            
            if (found) break;
        }
        
        // Also check for description-specific tabs
        const descTabs = [
            '#tab-description',
            '[data-tab="description"]',
            '.tab-description',
            '#product-description-tab'
        ];
        
        descTabs.forEach(selector => {
            const $tab = $(selector);
            if ($tab.length && $tab.text().trim().length > 50) {
                content['Description'] = $tab.text().trim();
                totalChars += content['Description'].length;
                found = true;
            }
        });
        
        return { content, totalChars, found };
    }
    
    /**
     * Extract accordion content (NEW METHOD!)
     */
    extractAccordionContent($) {
        let text = '';
        let found = false;
        
        // Common accordion selectors
        const accordionSelectors = [
            '.accordion-item',
            '.collapsible-content',
            '[data-accordion-item]',
            '.product-accordion',
            '.faq-item'
        ];
        
        accordionSelectors.forEach(selector => {
            $(selector).each((i, item) => {
                const $item = $(item);
                const title = $item.find('.accordion-title, .collapsible-trigger, [data-accordion-trigger]').text().trim();
                const content = $item.find('.accordion-content, .collapsible-content, [data-accordion-content]').text().trim();
                
                if (title && content && content.length > 20) {
                    text += `${title}:\n${content}\n\n`;
                    found = true;
                }
            });
        });
        
        return { text: text.trim(), found };
    }
    
    /**
     * Extract feature lists (ENHANCED!)
     */
    extractFeatures($) {
        const features = [];
        let totalChars = 0;
        
        // Feature list selectors
        const selectors = [
            '.product-features li',
            '.features-list li',
            '.product-benefits li',
            '[data-product-features] li',
            '.product__features li',
            '.feature-list li',
            // Also check for icon-based features
            '.feature-icon + *',
            '.product-feature-item'
        ];
        
        selectors.forEach(selector => {
            $(selector).each((i, elem) => {
                const text = $(elem).text().trim();
                if (text && text.length > 5 && !features.includes(text)) {
                    features.push(text);
                    totalChars += text.length;
                }
            });
        });
        
        // Also extract from description bullets
        $('.product-single__description ul li, .rte ul li').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text && text.length > 5 && !features.includes(text)) {
                features.push(text);
                totalChars += text.length;
            }
        });
        
        return {
            items: features,
            totalChars,
            found: features.length > 0
        };
    }
    
    /**
     * Extract specifications
     */
    extractSpecifications($) {
        const specs = {};
        let found = false;
        
        // Look for spec tables
        $('.specs-table tr, .product-specs tr, [data-product-specs] tr').each((i, row) => {
            const $row = $(row);
            const label = $row.find('td:first-child, th').text().trim();
            const value = $row.find('td:last-child').text().trim();
            
            if (label && value) {
                specs[label] = value;
                found = true;
            }
        });
        
        // Also check definition lists
        $('.product-specs dl, .specifications dl').each((i, dl) => {
            $(dl).find('dt').each((j, dt) => {
                const label = $(dt).text().trim();
                const value = $(dt).next('dd').text().trim();
                if (label && value) {
                    specs[label] = value;
                    found = true;
                }
            });
        });
        
        return { data: specs, found };
    }
    
    /**
     * Estimate total content available
     */
    estimateTotalContent($) {
        // Get all text in product area
        const productArea = $('.product, .product-single, #product-container, main[itemtype*="Product"]').first();
        
        if (productArea.length) {
            // Remove scripts and styles
            productArea.find('script, style, noscript').remove();
            return productArea.text().length;
        }
        
        // Fallback: estimate based on visible elements
        return $('body').text().length * 0.3; // Assume 30% is product content
    }
    
    /**
     * Identify what content we missed
     */
    identifyMissedContent($, extractedSources) {
        const missed = [];
        
        // Check for content we didn't extract
        const checks = [
            { selector: '.size-guide, .size-chart', name: 'size_guide' },
            { selector: '.care-instructions, .product-care', name: 'care_instructions' },
            { selector: '.shipping-info, .delivery-info', name: 'shipping_info' },
            { selector: '.ingredients, .materials', name: 'ingredients' },
            { selector: '.reviews, .product-reviews', name: 'reviews' }
        ];
        
        checks.forEach(check => {
            if ($(check.selector).length > 0 && !extractedSources.includes(check.name)) {
                missed.push(check.name);
            }
        });
        
        return missed;
    }
}

module.exports = EnhancedShopifyExtractor;