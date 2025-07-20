// WooCommerce Product Extractor
// Specialized extraction logic for WooCommerce product descriptions

class WooCommerceProductExtractor {
    constructor() {
        this.platform = 'woocommerce';
    }

    /**
     * Extract product data from a WooCommerce product page
     * @param {string} html - HTML content of the product page
     * @param {string} url - URL of the product page
     * @returns {Object} Extracted product data
     */
    extractProduct(html, url) {
        console.log(`📝 [WooCommerce] Extracting product from ${url}`);
        
        const product = {
            url,
            title: '',
            description: '',
            shortDescription: '',
            features: [],
            price: '',
            quality: 'unknown',
            platform: this.platform
        };

        // Extract title
        product.title = this.extractTitle(html);
        
        // Extract short description
        product.shortDescription = this.extractShortDescription(html);
        
        // Extract main/long description
        product.description = this.extractMainDescription(html);
        
        // Extract price
        product.price = this.extractPrice(html);
        
        // Extract features if structured
        product.features = this.extractFeatures(html);
        
        // Assess quality
        product.quality = this.assessQuality(product);
        
        // Use short description if main is empty
        if (!product.description && product.shortDescription) {
            product.description = product.shortDescription;
        }
        
        console.log(`   Title: ${product.title ? '✅' : '❌'} ${product.title.substring(0, 50)}${product.title.length > 50 ? '...' : ''}`);
        console.log(`   Description: ${product.description.length} chars`);
        console.log(`   Quality: ${product.quality}`);
        
        return product;
    }

    /**
     * Extract product title
     */
    extractTitle(html) {
        // Try WooCommerce product title first
        let titleMatch = html.match(/<h1[^>]*class=["'][^"']*product_title[^"']*["'][^>]*>([^<]+)<\/h1>/i);
        
        // Try entry-title
        if (!titleMatch) {
            titleMatch = html.match(/<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>([^<]+)<\/h1>/i);
        }
        
        // Generic h1
        if (!titleMatch) {
            titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        }
        
        return titleMatch ? this.cleanText(titleMatch[1]) : '';
    }

    /**
     * Extract short description (product excerpt)
     */
    extractShortDescription(html) {
        // Primary pattern: woocommerce-product-details__short-description
        let match = html.match(/<div[^>]*class=["'][^"']*woocommerce-product-details__short-description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        
        if (match) {
            return this.cleanDescription(match[1]);
        }
        
        // Try product summary area
        const summaryMatch = html.match(/<div[^>]*class=["'][^"']*summary[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        if (summaryMatch) {
            // Extract just the description part, not the whole summary
            const shortDescMatch = summaryMatch[1].match(/<div[^>]*>([\s\S]*?)<form/i);
            if (shortDescMatch) {
                return this.cleanDescription(shortDescMatch[1]);
            }
        }
        
        return '';
    }

    /**
     * Extract main/long description from tabs
     */
    extractMainDescription(html) {
        // Primary pattern: tab-description or panel-description
        let match = html.match(/<div[^>]*(?:id=["']tab-description["']|id=["']panel-description["'])[^>]*>([\s\S]*?)<\/div>(?=\s*<\/div>|\s*<div[^>]*(?:id=["']tab-|class=["'][^"']*tab))/i);
        
        if (match) {
            return this.cleanDescription(match[1]);
        }
        
        // Alternative: woocommerce-Tabs-panel--description
        match = html.match(/<div[^>]*class=["'][^"']*woocommerce-Tabs-panel--description[^"']*["'][^>]*>([\s\S]*?)<\/div>(?=\s*<\/div>|\s*<div[^>]*class=["'][^"']*woocommerce-Tabs-panel)/i);
        
        if (match) {
            return this.cleanDescription(match[1]);
        }
        
        // Look for description heading followed by content
        match = html.match(/<h2[^>]*>(?:Description|Product Description)<\/h2>\s*<div[^>]*>([\s\S]*?)<\/div>/i);
        
        if (match) {
            return this.cleanDescription(match[1]);
        }
        
        return '';
    }

    /**
     * Extract price
     */
    extractPrice(html) {
        // WooCommerce price patterns
        const pricePatterns = [
            /<span[^>]*class=["'][^"']*woocommerce-Price-amount[^"']*["'][^>]*>([^<]+)<\/span>/i,
            /<p[^>]*class=["'][^"']*price[^"']*["'][^>]*>.*?<span[^>]*>([^<]+)<\/span>/i,
            /<ins[^>]*>.*?<span[^>]*class=["'][^"']*amount[^"']*["'][^>]*>([^<]+)<\/span>/i
        ];
        
        for (const pattern of pricePatterns) {
            const match = html.match(pattern);
            if (match) {
                return this.cleanText(match[1]);
            }
        }
        
        return '';
    }

    /**
     * Extract structured features from description
     */
    extractFeatures(html) {
        const features = [];
        
        // Look for feature lists in description area
        const descriptionArea = html.match(/<div[^>]*(?:id=["']tab-description["']|class=["'][^"']*woocommerce-Tabs-panel--description)[^>]*>([\s\S]*?)<\/div>/i);
        
        if (descriptionArea) {
            const content = descriptionArea[1];
            
            // Extract list items
            const listMatches = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
            if (listMatches) {
                listMatches.forEach(li => {
                    const text = this.cleanText(li.replace(/<[^>]+>/g, ''));
                    if (text && text.length > 5 && text.length < 200) {
                        features.push(text);
                    }
                });
            }
        }
        
        return features;
    }

    /**
     * Clean and format description text
     */
    cleanDescription(html) {
        return html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<\/p>/gi, ' ')
            .replace(/<\/li>/gi, '. ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/\.+/g, '.')
            .trim();
    }

    /**
     * Clean text content
     */
    cleanText(text) {
        return text
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Assess quality of extracted data
     */
    assessQuality(product) {
        let score = 0;
        
        if (product.title) score += 25;
        if (product.description.length > 100) score += 25;
        if (product.description.length > 300) score += 25;
        if (product.features.length > 0) score += 15;
        if (product.price) score += 10;
        
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'fair';
        if (score >= 30) return 'poor';
        return 'very_poor';
    }

    /**
     * Extract product links from a WooCommerce shop/category page
     */
    extractProductLinks(html, baseUrl) {
        const links = new Set();
        
        // WooCommerce product link patterns
        const patterns = [
            // Product links with /product/ in URL
            /<a[^>]+href=["']([^"']*\/product\/[^"']+)["']/gi,
            // Links within product list items
            /<li[^>]+class=["'][^"']*product[^"']*["'][^>]*>[\s\S]*?<a[^>]+href=["']([^"']+)["']/gi,
            // WooCommerce loop product links
            /<a[^>]+class=["'][^"']*woocommerce-LoopProduct-link[^"']*["'][^>]*href=["']([^"']+)["']/gi,
            // Product permalinks
            /<a[^>]+rel=["']permalink["'][^>]*href=["']([^"']+)["']/gi
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                let url = match[1];
                
                // Make URL absolute
                if (!url.startsWith('http')) {
                    if (url.startsWith('/')) {
                        const base = new URL(baseUrl);
                        url = `${base.protocol}//${base.host}${url}`;
                    } else {
                        continue;
                    }
                }
                
                // Only include product URLs
                if (url.includes('/product/') || url.match(/\/[^\/]+\/?$/)) {
                    links.add(url);
                }
            }
        });
        
        return Array.from(links);
    }
}

module.exports = WooCommerceProductExtractor;