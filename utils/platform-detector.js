// Platform Detection and URL Pattern Matcher
// Identifies e-commerce platforms and their URL structures

class PlatformDetector {
    constructor() {
        this.platforms = this.getPlatformDefinitions();
    }
    
    getPlatformDefinitions() {
        return {
            shopify: {
                name: 'Shopify',
                confidence: 0,
                indicators: {
                    // URL patterns
                    urlPatterns: {
                        plp: [
                            /\/collections$/,
                            /\/collections\/[\w-]+$/,
                            /\/collections\/all$/,
                            /\/products$/  // Some stores use this
                        ],
                        pdp: [
                            /\/products\/[\w-]+$/,
                            /\/collections\/[\w-]+\/products\/[\w-]+$/
                        ]
                    },
                    // HTML signatures - expanded for better detection
                    htmlSignatures: [
                        'Shopify.shop',
                        'cdn.shopify.com',
                        'shopify-section',
                        'shopify_page_type',
                        'window.Shopify',
                        'myshopify.com',
                        'shopify.com/s/files',
                        'shopify-analytics',
                        'shopify_features',
                        'ShopifyAnalytics',
                        'Shopify.theme',
                        'Shopify.currency',
                        'Shopify.country',
                        'Shopify.locale',
                        '/cdn/shop/',
                        'data-shopify'
                    ],
                    // Common paths
                    commonPaths: {
                        plp: [
                            '/collections',
                            '/collections/all', 
                            '/collections/all-products',
                            '/collections/frontpage',
                            '/collections/mens',
                            '/collections/womens',
                            '/collections/new-arrivals',
                            '/collections/best-sellers',
                            '/products'  // Some stores use this
                        ],
                        pdp: 'Dynamic - /products/{handle}'
                    }
                }
            },
            
            woocommerce: {
                name: 'WooCommerce',
                confidence: 0,
                indicators: {
                    urlPatterns: {
                        plp: [
                            /\/shop$/,
                            /\/shop\/page\/\d+$/,
                            /\/product-category\/[\w-]+$/
                        ],
                        pdp: [
                            /\/product\/[\w-]+$/,
                            /\/\?p=\d+$/  // WordPress post ID format
                        ]
                    },
                    htmlSignatures: [
                        'woocommerce',
                        'woocommerce-page',
                        'wp-content/plugins/woocommerce',
                        'wc-block-grid',
                        'class="woocommerce"'
                    ],
                    commonPaths: {
                        plp: ['/shop', '/product-category/*'],
                        pdp: '/product/{slug}'
                    }
                }
            },
            
            magento: {
                name: 'Magento',
                confidence: 0,
                indicators: {
                    urlPatterns: {
                        plp: [
                            /\.html$/,  // Category pages often end in .html
                            /\/catalog\/category\/view/
                        ],
                        pdp: [
                            /[\w-]+-\d+\.html$/,  // product-name-12345.html
                            /\/catalog\/product\/view\/id\/\d+/
                        ]
                    },
                    htmlSignatures: [
                        'Magento',
                        'mage/',
                        'Mage.Cookies',
                        'FORM_KEY',
                        'static/version'
                    ],
                    commonPaths: {
                        plp: ['/*.html', '/catalog/category/view'],
                        pdp: '/*-{id}.html'
                    }
                }
            },
            
            bigcommerce: {
                name: 'BigCommerce',
                confidence: 0,
                indicators: {
                    urlPatterns: {
                        plp: [
                            /\/categories\/[\w-]+$/,
                            /\/brands\/[\w-]+$/
                        ],
                        pdp: [
                            /\/[\w-]+-\d+$/,  // product-name-123
                            /\/products\/[\w-]+$/
                        ]
                    },
                    htmlSignatures: [
                        'bigcommerce',
                        'cdn11.bigcommerce.com',
                        'cornerstone-theme'
                    ],
                    commonPaths: {
                        plp: ['/categories/*', '/brands/*'],
                        pdp: '/products/* or /*-{id}'
                    }
                }
            },
            
            squarespace: {
                name: 'Squarespace Commerce',
                confidence: 0,
                indicators: {
                    urlPatterns: {
                        plp: [
                            /\/shop$/,
                            /\/store$/,
                            /\/products$/
                        ],
                        pdp: [
                            /\/shop\/p\/[\w-]+$/,
                            /\/store\/p\/[\w-]+$/
                        ]
                    },
                    htmlSignatures: [
                        'squarespace.com',
                        'Squarespace.afterBodyLoad',
                        'sqs-block-product'
                    ],
                    commonPaths: {
                        plp: ['/shop', '/store'],
                        pdp: '/shop/p/{product}'
                    }
                }
            },
            
            salesforce: {
                name: 'Salesforce Commerce Cloud',
                confidence: 0,
                indicators: {
                    urlPatterns: {
                        plp: [
                            /\/s\/[\w-]+$/,
                            /\/c\/[\w-]+$/,
                            /\/search\?/
                        ],
                        pdp: [
                            /\/p\/[\w-]+$/,
                            /\/product\/\d+$/
                        ]
                    },
                    htmlSignatures: [
                        'demandware.static',
                        'dwstatic',
                        'demandware',
                        'salesforce-commerce-cloud'
                    ],
                    commonPaths: {
                        plp: ['/s/*', '/c/*'],
                        pdp: '/p/* or /product/*'
                    }
                }
            },
            
            wix: {
                name: 'Wix eCommerce',
                confidence: 0,
                indicators: {
                    urlPatterns: {
                        plp: [
                            /\/product-page\/[\w-]+$/,
                            /\/shop$/
                        ],
                        pdp: [
                            /\/product-page\/[\w-]+\/[\w-]+$/
                        ]
                    },
                    htmlSignatures: [
                        'wix.com',
                        'wixstatic.com',
                        'static.wixstatic.com'
                    ],
                    commonPaths: {
                        plp: ['/shop', '/product-page/*'],
                        pdp: '/product-page/{collection}/{product}'
                    }
                }
            },
            
            prestashop: {
                name: 'PrestaShop',
                confidence: 0,
                indicators: {
                    urlPatterns: {
                        plp: [
                            /\/\d+-[\w-]+$/,  // /3-clothes
                            /\/[\w-]+\/\d+-[\w-]+$/  // /en/3-clothes
                        ],
                        pdp: [
                            /\/\d+-[\w-]+\.html$/,  // /1-product-name.html
                            /\/[\w-]+\/\d+-[\w-]+\.html$/  // /en/1-product-name.html
                        ]
                    },
                    htmlSignatures: [
                        'PrestaShop',
                        'prestashop',
                        'modules/ps_'
                    ],
                    commonPaths: {
                        plp: '/{id}-{category}',
                        pdp: '/{id}-{product}.html'
                    }
                }
            },
            
            opencart: {
                name: 'OpenCart',
                confidence: 0,
                indicators: {
                    urlPatterns: {
                        plp: [
                            /index\.php\?route=product\/category/,
                            /\/category&path=\d+/
                        ],
                        pdp: [
                            /index\.php\?route=product\/product/,
                            /\/product&product_id=\d+/
                        ]
                    },
                    htmlSignatures: [
                        'OpenCart',
                        'catalog/view/theme',
                        'route=product/product'
                    ],
                    commonPaths: {
                        plp: '/index.php?route=product/category&path={id}',
                        pdp: '/index.php?route=product/product&product_id={id}'
                    }
                }
            },
            
            shopware: {
                name: 'Shopware',
                confidence: 0,
                indicators: {
                    urlPatterns: {
                        plp: [
                            /\/[\w-]+\/([\w-]+\/)?$/,  // /en/clothing/
                            /\/listing\/[\w-]+$/
                        ],
                        pdp: [
                            /\/detail\/[\w-]+$/,
                            /\/[\w-]+-[\d]+$/  // /product-name-123
                        ]
                    },
                    htmlSignatures: [
                        'shopware',
                        'Shopware',
                        'sw-ajax-',
                        'is--shopware'
                    ],
                    commonPaths: {
                        plp: '/{category}/ or /listing/{category}',
                        pdp: '/detail/{id} or /{product-name}'
                    }
                }
            },
            
            ecwid: {
                name: 'Ecwid',
                confidence: 0,
                indicators: {
                    urlPatterns: {
                        plp: [
                            /#!\/c\/\d+\/[\w-]+/,  // #!/c/123/category-name
                            /#!\/~\/category\/id=\d+/
                        ],
                        pdp: [
                            /#!\/p\/\d+\/[\w-]+/,  // #!/p/123/product-name
                            /#!\/~\/product\/id=\d+/
                        ]
                    },
                    htmlSignatures: [
                        'ecwid.com',
                        'Ecwid',
                        'ec-store'
                    ],
                    commonPaths: {
                        plp: '#!/c/{id}/{category}',
                        pdp: '#!/p/{id}/{product}'
                    }
                }
            },
            
            custom: {
                name: 'Custom Platform',
                confidence: 0,
                indicators: {
                    urlPatterns: {
                        plp: [
                            /\/(shop|store|products?|catalog|browse|all)/i
                        ],
                        pdp: [
                            /\/(product|item|p)\//i,
                            /\/[\w-]+-p\d+/i  // Common pattern: name-p123
                        ]
                    },
                    htmlSignatures: [],
                    commonPaths: {
                        plp: ['/shop', '/products', '/catalog'],
                        pdp: 'Varies'
                    }
                }
            }
        };
    }
    
    // Detect platform from HTML and URL
    detectPlatform(url, html = '') {
        const results = {};
        
        // Check each platform
        for (const [key, platform] of Object.entries(this.platforms)) {
            let score = 0;
            const matches = [];
            
            // Check HTML signatures (case-insensitive)
            if (html && platform.indicators.htmlSignatures) {
                const htmlLower = html.toLowerCase();
                for (const signature of platform.indicators.htmlSignatures) {
                    if (htmlLower.includes(signature.toLowerCase())) {
                        score += 10;
                        matches.push(`HTML: ${signature}`);
                    }
                }
            }
            
            // Check URL patterns
            if (url) {
                // Check PLP patterns
                for (const pattern of platform.indicators.urlPatterns.plp) {
                    if (pattern.test(url)) {
                        score += 5;
                        matches.push(`PLP URL pattern: ${pattern}`);
                    }
                }
                
                // Check PDP patterns
                for (const pattern of platform.indicators.urlPatterns.pdp) {
                    if (pattern.test(url)) {
                        score += 5;
                        matches.push(`PDP URL pattern: ${pattern}`);
                    }
                }
            }
            
            if (score > 0) {
                results[key] = {
                    platform: platform.name,
                    score,
                    matches,
                    confidence: score >= 20 ? 'high' : score >= 10 ? 'medium' : 'low'
                };
            }
        }
        
        // Sort by score and return best match
        const sorted = Object.entries(results).sort((a, b) => b[1].score - a[1].score);
        
        if (sorted.length > 0) {
            const [platformKey, result] = sorted[0];
            console.log(`🎯 Detected platform: ${result.platform} (${result.confidence} confidence)`);
            console.log(`   Matches: ${result.matches.join(', ')}`);
            return {
                detected: platformKey,
                ...result,
                allMatches: results
            };
        }
        
        return {
            detected: 'custom',
            platform: 'Custom/Unknown',
            confidence: 'low',
            allMatches: results
        };
    }
    
    // Get URL type (PLP or PDP)
    detectUrlType(url, platformKey = null) {
        // If platform is known, check its patterns first
        if (platformKey && this.platforms[platformKey]) {
            const platform = this.platforms[platformKey];
            
            // Check PLP patterns
            for (const pattern of platform.indicators.urlPatterns.plp) {
                if (pattern.test(url)) {
                    return {
                        type: 'plp',
                        pattern: pattern.toString(),
                        platform: platform.name
                    };
                }
            }
            
            // Check PDP patterns
            for (const pattern of platform.indicators.urlPatterns.pdp) {
                if (pattern.test(url)) {
                    return {
                        type: 'pdp',
                        pattern: pattern.toString(),
                        platform: platform.name
                    };
                }
            }
        }
        
        // Check all platforms
        for (const [key, platform] of Object.entries(this.platforms)) {
            // PLP
            for (const pattern of platform.indicators.urlPatterns.plp) {
                if (pattern.test(url)) {
                    return {
                        type: 'plp',
                        pattern: pattern.toString(),
                        platform: platform.name,
                        confidence: 'medium'
                    };
                }
            }
            
            // PDP
            for (const pattern of platform.indicators.urlPatterns.pdp) {
                if (pattern.test(url)) {
                    return {
                        type: 'pdp',
                        pattern: pattern.toString(),
                        platform: platform.name,
                        confidence: 'medium'
                    };
                }
            }
        }
        
        return {
            type: 'unknown',
            pattern: null,
            platform: null
        };
    }
    
    // Get recommended PLP paths for a platform
    getPlpPaths(platformKey) {
        // For Shopify, use comprehensive collection paths
        if (platformKey === 'shopify') {
            return [
                '/collections',
                '/collections/all',
                '/collections/all-products', 
                '/collections/frontpage',
                '/products',
                '/shop'
            ];
        }
        const platform = this.platforms[platformKey] || this.platforms.custom;
        return platform.indicators.commonPaths.plp;
    }
    
    // Generate platform report
    generateReport() {
        const report = {
            platforms: {},
            urlPatterns: {
                plp: [],
                pdp: []
            }
        };
        
        for (const [key, platform] of Object.entries(this.platforms)) {
            report.platforms[key] = {
                name: platform.name,
                plpPaths: platform.indicators.commonPaths.plp,
                pdpFormat: platform.indicators.commonPaths.pdp,
                signatures: platform.indicators.htmlSignatures.length
            };
            
            // Collect all patterns
            report.urlPatterns.plp.push(...platform.indicators.urlPatterns.plp.map(p => ({
                platform: platform.name,
                pattern: p.toString()
            })));
            
            report.urlPatterns.pdp.push(...platform.indicators.urlPatterns.pdp.map(p => ({
                platform: platform.name,
                pattern: p.toString()
            })));
        }
        
        return report;
    }
}

module.exports = PlatformDetector;