// WooCommerce Platform Detector
// Identifies WordPress/WooCommerce stores using pattern analysis

class WooCommerceDetector {
    constructor() {
        this.platform = 'woocommerce';
        this.confidence = {
            very_high: 90,
            high: 70,
            medium: 50,
            low: 30,
            very_low: 10
        };
    }
    
    /**
     * Detect if a site is using WooCommerce
     * @param {string} html - HTML content of the page
     * @param {string} url - URL of the page
     * @returns {Object} Detection result with confidence score
     */
    detect(html, url) {
        console.log(`🔍 [WooCommerce Detector] Analyzing ${html.length} chars of HTML`);
        const startTime = Date.now();
        
        let score = 0;
        const indicators = {};
        
        // 1. WordPress Core Detection (Foundation)
        const wpIndicators = this.detectWordPress(html, url);
        score += wpIndicators.score;
        indicators.wordpress = wpIndicators;
        
        // 2. WooCommerce Specific Detection
        const wcIndicators = this.detectWooCommerce(html, url);
        score += wcIndicators.score;
        indicators.woocommerce = wcIndicators;
        
        // 3. URL Pattern Analysis
        const urlIndicators = this.analyzeUrlPatterns(url);
        score += urlIndicators.score;
        indicators.url_patterns = urlIndicators;
        
        // 4. Theme and Plugin Detection
        const themeIndicators = this.detectWooCommerceThemes(html);
        score += themeIndicators.score;
        indicators.themes = themeIndicators;
        
        // 5. E-commerce Functionality Detection
        const ecommerceIndicators = this.detectEcommerceFunctionality(html);
        score += ecommerceIndicators.score;
        indicators.ecommerce = ecommerceIndicators;
        
        // Calculate confidence level
        const confidence = this.calculateConfidence(score);
        const detectionTime = Date.now() - startTime;
        
        console.log(`⏱️  [WooCommerce Detector] Detection completed in ${detectionTime}ms (score: ${score})`);
        
        // Additional validation: require WordPress presence for WooCommerce
        const hasWordPressCore = indicators.wordpress.score > 20;
        const isValidWooCommerce = hasWordPressCore && score >= this.confidence.medium;
        
        return {
            platform: this.platform,
            isDetected: isValidWooCommerce,
            confidence: confidence.level,
            score: score,
            hasWordPress: hasWordPressCore,
            indicators,
            detectionTime,
            summary: this.generateSummary(indicators, confidence)
        };
    }
    
    /**
     * Detect WordPress core indicators
     */
    detectWordPress(html, url) {
        const indicators = {
            wp_content: false,
            wp_includes: false,
            wp_json_api: false,
            wp_generator: false,
            wp_admin: false,
            wp_login: false
        };
        
        let score = 0;
        
        // WordPress content directory
        if (/\/wp-content\//.test(html)) {
            indicators.wp_content = true;
            score += 15;
        }
        
        // WordPress includes directory
        if (/\/wp-includes\//.test(html)) {
            indicators.wp_includes = true;
            score += 15;
        }
        
        // WordPress REST API
        if (/\/wp-json\//.test(html) || /"apiUrl":"[^"]*\/wp-json\//.test(html)) {
            indicators.wp_json_api = true;
            score += 10;
        }
        
        // WordPress generator meta tag
        if (/<meta[^>]*name=["']generator["'][^>]*content=["'][^"']*WordPress[^"']*["']/i.test(html)) {
            indicators.wp_generator = true;
            score += 20;
        }
        
        // WordPress admin references
        if (/\/wp-admin\//.test(html)) {
            indicators.wp_admin = true;
            score += 5;
        }
        
        // WordPress login references
        if (/wp-login\.php/.test(html)) {
            indicators.wp_login = true;
            score += 5;
        }
        
        return { indicators, score };
    }
    
    /**
     * Detect WooCommerce specific indicators
     */
    detectWooCommerce(html, url) {
        const indicators = {
            wc_classes: false,
            wc_scripts: false,
            wc_stylesheets: false,
            wc_ajax: false,
            wc_cart: false,
            wc_checkout: false,
            wc_account: false,
            wc_shop: false,
            wc_product: false,
            wc_version: false,
            wc_body_class: false
        };
        
        let score = 0;
        
        // WooCommerce CSS classes and body classes (must be WC-specific)
        const wcClasses = [
            'woocommerce',
            'woocommerce-page',
            'woocommerce-active',
            'wc-block',
            'woocommerce-cart',
            'woocommerce-checkout',
            'woocommerce-account',
            'woocommerce-product-gallery',
            'woocommerce-order-received',
            'shop_table',
            'woocommerce-review',
            'woocommerce-tabs'
        ];
        
        const foundClasses = wcClasses.filter(cls => 
            new RegExp(`class=["'][^"']*\\b${cls}\\b[^"']*["']`, 'i').test(html)
        );
        
        if (foundClasses.length > 0) {
            indicators.wc_classes = foundClasses;
            score += Math.min(foundClasses.length * 5, 25); // Max 25 points
        }
        
        // WooCommerce JavaScript files
        const wcScriptPatterns = [
            /\/wp-content\/plugins\/woocommerce\/assets\/js\//,
            /woocommerce[._-]/i,
            /wc[._-]/,
            /jquery-blockui/,
            /add-to-cart\.min\.js/,
            /js-cookie/,
            /woocommerce\.min\.js/
        ];
        
        const foundScripts = wcScriptPatterns.filter(pattern => pattern.test(html));
        if (foundScripts.length > 0) {
            indicators.wc_scripts = foundScripts.length;
            score += Math.min(foundScripts.length * 4, 20); // Max 20 points
        }
        
        // WooCommerce AJAX
        if (/wc_ajax/.test(html) || /woocommerce_ajax/.test(html)) {
            indicators.wc_ajax = true;
            score += 10;
        }
        
        // WooCommerce cart functionality
        if (/add[_-]to[_-]cart/i.test(html) || /"add_to_cart"/.test(html)) {
            indicators.wc_cart = true;
            score += 15;
        }
        
        // WooCommerce checkout page
        if (/woocommerce[_-]checkout/i.test(html) || /checkout[_-]form/i.test(html)) {
            indicators.wc_checkout = true;
            score += 10;
        }
        
        // WooCommerce account pages
        if (/woocommerce[_-]account/i.test(html) || /my[_-]account/i.test(html)) {
            indicators.wc_account = true;
            score += 8;
        }
        
        // Shop page indicators (WooCommerce specific)
        if (/class=["'][^"']*woocommerce[^"']*shop[^"']*["']/i.test(html) || 
            (/\/shop/.test(url) && indicators.wp_content)) {
            indicators.wc_shop = true;
            score += 10;
        }
        
        // Product page indicators (WooCommerce specific)
        if (/class=["'][^"']*woocommerce[^"']*product[^"']*["']/i.test(html) || 
            (/\/product\//.test(url) && indicators.wp_content)) {
            indicators.wc_product = true;
            score += 10;
        }
        
        // WooCommerce CSS stylesheets
        const wcStylesheets = [
            /woocommerce-layout\.css/,
            /woocommerce-smallscreen\.css/,
            /woocommerce\.css/,
            /\/wp-content\/plugins\/woocommerce\/assets\/css\//
        ];
        
        const foundStyles = wcStylesheets.filter(pattern => pattern.test(html));
        if (foundStyles.length > 0) {
            indicators.wc_stylesheets = foundStyles.length;
            score += Math.min(foundStyles.length * 5, 20); // Max 20 points
        }
        
        // WooCommerce body class detection
        if (/<body[^>]*class=["'][^"']*woocommerce[^"']*["']/i.test(html)) {
            indicators.wc_body_class = true;
            score += 25; // High confidence indicator
        }
        
        // WooCommerce version
        const versionMatch = html.match(/WooCommerce[^"]*?(\d+\.\d+\.\d+)/i);
        if (versionMatch) {
            indicators.wc_version = versionMatch[1];
            score += 20;
        }
        
        return { indicators, score };
    }
    
    /**
     * Analyze URL patterns for WooCommerce
     */
    analyzeUrlPatterns(url) {
        const indicators = {
            shop_path: false,
            product_path: false,
            cart_path: false,
            checkout_path: false,
            account_path: false,
            category_path: false
        };
        
        let score = 0;
        
        // Common WooCommerce URL patterns
        const patterns = [
            { pattern: /\/shop\/?/, indicator: 'shop_path', score: 15 },
            { pattern: /\/product\//, indicator: 'product_path', score: 20 },
            { pattern: /\/cart\/?/, indicator: 'cart_path', score: 10 },
            { pattern: /\/checkout\/?/, indicator: 'checkout_path', score: 10 },
            { pattern: /\/my-account\/?/, indicator: 'account_path', score: 10 },
            { pattern: /\/product-category\//, indicator: 'category_path', score: 15 }
        ];
        
        patterns.forEach(({ pattern, indicator, score: points }) => {
            if (pattern.test(url)) {
                indicators[indicator] = true;
                score += points;
            }
        });
        
        return { indicators, score };
    }
    
    /**
     * Detect WooCommerce themes and plugins
     */
    detectWooCommerceThemes(html) {
        const indicators = {
            storefront: false,
            astra: false,
            oceanwp: false,
            divi: false,
            avada: false,
            theme_name: null
        };
        
        let score = 0;
        
        // Popular WooCommerce themes (only score if WordPress detected)
        const themes = [
            { name: 'storefront', pattern: /storefront/i, score: 15 },
            { name: 'astra', pattern: /astra/i, score: 5 },
            { name: 'oceanwp', pattern: /oceanwp/i, score: 5 },
            { name: 'divi', pattern: /divi/i, score: 3 },
            { name: 'avada', pattern: /avada/i, score: 3 }
        ];
        
        // Only score themes if WordPress is present
        const hasWordPress = /\/wp-content\//.test(html) || /<meta[^>]*WordPress[^>]*>/i.test(html);
        
        themes.forEach(theme => {
            if (theme.pattern.test(html)) {
                indicators[theme.name] = true;
                indicators.theme_name = theme.name;
                // Only add theme score if WordPress detected
                if (hasWordPress) {
                    score += theme.score;
                }
            }
        });
        
        // Generic WooCommerce theme indicators
        if (/woocommerce[_-]theme/i.test(html)) {
            score += 10;
        }
        
        return { indicators, score };
    }
    
    /**
     * Detect e-commerce functionality
     */
    detectEcommerceFunctionality(html) {
        const indicators = {
            pricing: false,
            currency: false,
            product_gallery: false,
            reviews: false,
            variations: false,
            stock_status: false
        };
        
        let score = 0;
        
        // Price indicators
        if (/class=["'][^"']*price[^"']*["']/i.test(html) || /\$\d+|\£\d+|€\d+/.test(html)) {
            indicators.pricing = true;
            score += 10;
        }
        
        // Currency symbols
        if (/currency|woocommerce_currency/.test(html)) {
            indicators.currency = true;
            score += 8;
        }
        
        // Product gallery
        if (/woocommerce[_-]product[_-]gallery/i.test(html) || /product[_-]images/i.test(html)) {
            indicators.product_gallery = true;
            score += 10;
        }
        
        // Reviews
        if (/woocommerce[_-]reviews/i.test(html) || /product[_-]reviews/i.test(html)) {
            indicators.reviews = true;
            score += 8;
        }
        
        // Product variations
        if (/variation|variable[_-]product/i.test(html)) {
            indicators.variations = true;
            score += 8;
        }
        
        // Stock status
        if (/in[_-]stock|out[_-]of[_-]stock|stock[_-]status/i.test(html)) {
            indicators.stock_status = true;
            score += 8;
        }
        
        return { indicators, score };
    }
    
    /**
     * Calculate confidence level based on score
     */
    calculateConfidence(score) {
        if (score >= this.confidence.very_high) {
            return { level: 'very_high', percentage: Math.min(95, 85 + (score - 90) * 0.5) };
        } else if (score >= this.confidence.high) {
            return { level: 'high', percentage: 70 + (score - 70) * 0.75 };
        } else if (score >= this.confidence.medium) {
            return { level: 'medium', percentage: 50 + (score - 50) * 1 };
        } else if (score >= this.confidence.low) {
            return { level: 'low', percentage: 30 + (score - 30) * 1 };
        } else {
            return { level: 'very_low', percentage: Math.max(5, score * 2) };
        }
    }
    
    /**
     * Generate human-readable summary
     */
    generateSummary(indicators, confidence) {
        const summary = [];
        
        if (indicators.wordpress.indicators.wp_generator) {
            summary.push('WordPress detected via generator meta');
        }
        
        if (indicators.woocommerce.indicators.wc_version) {
            summary.push(`WooCommerce v${indicators.woocommerce.indicators.wc_version} detected`);
        }
        
        if (indicators.woocommerce.indicators.wc_classes && Array.isArray(indicators.woocommerce.indicators.wc_classes)) {
            summary.push(`WooCommerce CSS classes: ${indicators.woocommerce.indicators.wc_classes.slice(0, 3).join(', ')}`);
        }
        
        if (indicators.woocommerce.indicators.wc_body_class) {
            summary.push('WooCommerce body class detected');
        }
        
        if (indicators.woocommerce.indicators.wc_stylesheets) {
            summary.push(`${indicators.woocommerce.indicators.wc_stylesheets} WooCommerce stylesheets found`);
        }
        
        if (indicators.themes.indicators.theme_name) {
            summary.push(`Theme: ${indicators.themes.indicators.theme_name}`);
        }
        
        if (indicators.url_patterns.indicators.shop_path) {
            summary.push('Shop URL structure detected');
        }
        
        if (indicators.url_patterns.indicators.product_path) {
            summary.push('Product URL structure detected');
        }
        
        return summary.length > 0 ? summary : ['Basic e-commerce indicators found'];
    }
}

module.exports = WooCommerceDetector;