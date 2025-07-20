// Advanced Product Data Extractor for Shopify
// Uses multiple strategies to extract complete product descriptions

const cheerio = require('cheerio');

class ShopifyProductExtractor {
    constructor() {
        this.name = 'ShopifyProductExtractor';
    }
    
    /**
     * Extract comprehensive product data from Shopify PDP HTML
     * @param {string} html - Full HTML content
     * @param {string} url - Product URL
     * @returns {Object} Extracted product data
     */
    extract(html, url) {
        const $ = cheerio.load(html);
        const data = {
            url,
            title: '',
            description: '',
            fullDescription: '',
            shortDescription: '',
            features: [],
            specifications: {},
            price: '',
            images: [],
            metaDescription: '',
            extractionQuality: 'unknown'
        };
        
        // Extract title - multiple strategies
        data.title = this.extractTitle($);
        
        // Extract descriptions - comprehensive approach
        const descriptions = this.extractDescriptions($, html);
        data.description = descriptions.main;
        data.fullDescription = descriptions.full;
        data.shortDescription = descriptions.short;
        
        // Extract features/bullets
        data.features = this.extractFeatures($);
        
        // Extract price
        data.price = this.extractPrice($);
        
        // Extract images
        data.images = this.extractImages($);
        
        // Extract meta description
        data.metaDescription = $('meta[name="description"]').attr('content') || '';
        
        // Extract structured data if available
        this.extractStructuredData($, data);
        
        // Assess extraction quality
        data.extractionQuality = this.assessQuality(data);
        
        // Log extraction summary
        console.log(`📊 Extraction Summary for ${url}:`);
        console.log(`   Title: ${data.title ? '✅' : '❌'} ${data.title.substring(0, 50)}...`);
        console.log(`   Description: ${data.description.length} chars`);
        console.log(`   Features: ${data.features.length} items`);
        console.log(`   Quality: ${data.extractionQuality}`);
        
        return data;
    }
    
    /**
     * Extract title using multiple selectors
     */
    extractTitle($) {
        const selectors = [
            'h1.product__title',
            'h1.product-title',
            'h1[itemprop="name"]',
            '.product__info h1',
            '.product-single__title',
            'h1'
        ];
        
        for (const selector of selectors) {
            const title = $(selector).first().text().trim();
            if (title) return title;
        }
        
        return '';
    }
    
    /**
     * Extract descriptions using multiple strategies
     */
    extractDescriptions($, html) {
        const descriptions = {
            main: '',
            full: '',
            short: ''
        };
        
        // Strategy 1: Common Shopify selectors (updated with latest patterns)
        const descSelectors = [
            // Primary patterns
            '.product-single__description',
            '.product__description',
            '.product-description',
            '[data-product-description]',
            '.product-details__description',
            
            // Rich text editor (very common)
            '.product-single__description.rte',
            '.product-description.rte',
            '.rte',
            
            // Additional patterns
            '.product-details__content',
            '.product__details',
            '.product-info__description',
            '[itemprop="description"]',
            '.product__text',
            
            // Tab/accordion patterns
            '#product-description-tab-content',
            '.product-tabs__content',
            
            // Generic patterns
            '.product-details',
            '.description'
        ];
        
        for (const selector of descSelectors) {
            const element = $(selector).first();
            if (element.length) {
                // Get full HTML content
                descriptions.full = element.html() || '';
                
                // Get clean text preserving paragraphs
                const paragraphs = [];
                element.find('p, div, li').each((i, el) => {
                    const text = $(el).text().trim();
                    if (text && text.length > 10) {
                        paragraphs.push(text);
                    }
                });
                
                if (paragraphs.length > 0) {
                    descriptions.main = paragraphs.join('\n\n');
                } else {
                    descriptions.main = element.text().trim();
                }
                
                if (descriptions.main) break;
            }
        }
        
        // Strategy 2: Look for product tabs/accordions
        if (!descriptions.main) {
            const tabSelectors = [
                '.product-tabs .tab-content',
                '.accordion__content',
                '[data-product-description]'
            ];
            
            for (const selector of tabSelectors) {
                const content = $(selector).first().text().trim();
                if (content && content.length > 50) {
                    descriptions.main = content;
                    break;
                }
            }
        }
        
        // Strategy 3: JSON-LD structured data
        if (!descriptions.main) {
            $('script[type="application/ld+json"]').each((i, elem) => {
                try {
                    const content = $(elem).html();
                    const json = JSON.parse(content);
                    
                    // Handle both single objects and arrays
                    const products = Array.isArray(json) ? json : [json];
                    
                    for (const item of products) {
                        if (item['@type'] === 'Product' && item.description) {
                            descriptions.main = item.description;
                            return false; // break
                        }
                    }
                } catch (e) {
                    // Invalid JSON, continue
                }
            });
        }
        
        // Strategy 4: Shopify product JSON
        if (!descriptions.main) {
            const productJsonMatch = html.match(/var\s+product\s*=\s*({[\s\S]*?});/);
            if (productJsonMatch) {
                try {
                    const product = JSON.parse(productJsonMatch[1]);
                    if (product.description) {
                        descriptions.main = product.description.replace(/<[^>]*>/g, ' ').trim();
                    }
                } catch (e) {
                    // Invalid JSON
                }
            }
        }
        
        // Strategy 5: Look for product-specific content areas
        if (!descriptions.main) {
            // Look for paragraphs within product-related containers
            const productContainers = [
                '.product-info p',
                '.product-details p',
                '.product-content p',
                '[data-product-description] p',
                '.product__info p',
                '.product-single__info p',
                // Look for paragraphs near the product title
                'h1 + p',
                'h1 + div p',
                '.product__title + div p',
                // Common content areas
                'main p',
                '[role="main"] p'
            ];
            
            for (const selector of productContainers) {
                const paragraphs = [];
                $(selector).each((i, elem) => {
                    const text = $(elem).text().trim();
                    // More strict filtering for product descriptions
                    if (text.length > 50 && 
                        text.length < 2000 && // Not too long
                        !text.includes('Sign up') && 
                        !text.includes('Subscribe') &&
                        !text.includes('©') &&
                        !text.includes('Privacy') &&
                        !text.includes('Cookie') &&
                        !text.includes('Your cart') &&
                        !text.match(/^[\d\s\$\.\,]+$/) && // Not just prices/numbers
                        !text.match(/^\w+:$/) && // Not labels
                        text.split(' ').length > 8) { // At least 8 words
                        paragraphs.push(text);
                    }
                });
                
                if (paragraphs.length > 0) {
                    // Take up to 3 paragraphs, prioritizing longer ones
                    const sorted = paragraphs.sort((a, b) => b.length - a.length);
                    descriptions.main = sorted.slice(0, 3).join('\n\n');
                    console.log(`   Found ${paragraphs.length} product paragraphs in ${selector}`);
                    break;
                }
            }
        }
        
        // Create short description (first 200 chars or first paragraph)
        if (descriptions.main) {
            const firstPara = descriptions.main.split('\n')[0];
            descriptions.short = firstPara.length > 200 
                ? firstPara.substring(0, 200) + '...'
                : firstPara;
        }
        
        return descriptions;
    }
    
    /**
     * Extract product features/bullets
     */
    extractFeatures($) {
        const features = [];
        
        // Common feature selectors
        const featureSelectors = [
            '.product-features li',
            '.product__features li',
            '.features-list li',
            '.product-bullets li',
            'ul.product__list li',
            '[data-product-features] li'
        ];
        
        for (const selector of featureSelectors) {
            $(selector).each((i, elem) => {
                const text = $(elem).text().trim();
                if (text && text.length > 5) {
                    features.push(text);
                }
            });
            
            if (features.length > 0) break;
        }
        
        // Alternative: Look for any UL near description
        if (features.length === 0) {
            $('.product__description ul li, .product-description ul li').each((i, elem) => {
                const text = $(elem).text().trim();
                if (text && text.length > 5) {
                    features.push(text);
                }
            });
        }
        
        return features;
    }
    
    /**
     * Extract price information
     */
    extractPrice($) {
        const priceSelectors = [
            '[itemprop="price"]',
            '.product__price',
            '.price--main',
            '.product-price',
            'span.price',
            '.money'
        ];
        
        for (const selector of priceSelectors) {
            const price = $(selector).first().text().trim();
            if (price && price.match(/[\d.,]+/)) {
                return price;
            }
        }
        
        return '';
    }
    
    /**
     * Extract product images
     */
    extractImages($) {
        const images = [];
        const seen = new Set();
        
        // Product image selectors
        const imageSelectors = [
            '.product__main-photos img',
            '.product__photo img',
            '.product-images img',
            '.product-single__photos img',
            '[data-product-images] img',
            '.product__media img'
        ];
        
        for (const selector of imageSelectors) {
            $(selector).each((i, elem) => {
                const src = $(elem).attr('src') || $(elem).attr('data-src');
                if (src && !seen.has(src)) {
                    seen.add(src);
                    images.push({
                        src: src.startsWith('//') ? 'https:' + src : src,
                        alt: $(elem).attr('alt') || ''
                    });
                }
            });
            
            if (images.length > 0) break;
        }
        
        return images.slice(0, 10); // Limit to 10 images
    }
    
    /**
     * Extract structured data
     */
    extractStructuredData($, data) {
        $('script[type="application/ld+json"]').each((i, elem) => {
            try {
                const json = JSON.parse($(elem).html());
                if (json['@type'] === 'Product') {
                    // Supplement missing data
                    if (!data.title && json.name) data.title = json.name;
                    if (!data.description && json.description) {
                        data.description = json.description;
                    }
                    if (!data.price && json.offers && json.offers.price) {
                        data.price = `${json.offers.priceCurrency || '$'}${json.offers.price}`;
                    }
                    
                    // Add specifications if available
                    if (json.additionalProperty) {
                        json.additionalProperty.forEach(prop => {
                            data.specifications[prop.name] = prop.value;
                        });
                    }
                }
            } catch (e) {
                // Invalid JSON, continue
            }
        });
    }
    
    /**
     * Assess extraction quality
     */
    assessQuality(data) {
        let score = 0;
        let total = 0;
        
        // Check required fields
        const checks = [
            { field: 'title', weight: 20 },
            { field: 'description', weight: 30, minLength: 50 },
            { field: 'price', weight: 15 },
            { field: 'features', weight: 20, minLength: 1 },
            { field: 'images', weight: 15, minLength: 1 }
        ];
        
        checks.forEach(check => {
            total += check.weight;
            if (check.minLength !== undefined) {
                if (Array.isArray(data[check.field])) {
                    if (data[check.field].length >= check.minLength) score += check.weight;
                } else if (data[check.field] && data[check.field].length >= check.minLength) {
                    score += check.weight;
                }
            } else if (data[check.field]) {
                score += check.weight;
            }
        });
        
        const percentage = (score / total) * 100;
        
        if (percentage >= 80) return 'excellent';
        if (percentage >= 60) return 'good';
        if (percentage >= 40) return 'fair';
        return 'poor';
    }
}

module.exports = ShopifyProductExtractor;