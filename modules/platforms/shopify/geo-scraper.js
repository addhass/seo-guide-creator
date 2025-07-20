// Geo-Aware Shopify Scraper
// Integrates Shopify scraping with geo-spoofing service

const ShopifyScraper = require('./scraper');
const GeoService = require('../../../services/geo-service');

class GeoShopifyScraper {
    constructor(proxyUrl = 'http://localhost:3001') {
        this.proxyUrl = proxyUrl;
        this.geoService = new GeoService();
        this.platform = 'shopify';
    }
    
    /**
     * Analyze a Shopify site across multiple countries
     * @param {string} domain - Shopify domain to analyze
     * @param {string|Array} countries - Countries to test from ['US', 'UK', 'DE'] or form geo target
     */
    async analyzeMultiGeo(domain, countries = ['US', 'UK', 'DE']) {
        // If countries is a string (form geo target), convert it
        if (typeof countries === 'string') {
            countries = this.geoService.mapFormGeoTargetToCountries(countries);
        }
        console.log(`🌍 [Geo-Shopify] Multi-geo analysis for ${domain}`);
        console.log(`   Countries: ${countries.join(', ')}`);
        
        const results = {
            domain,
            countries: {},
            analysis: {},
            timestamp: new Date().toISOString()
        };
        
        // First test geo-sensitivity
        const baseUrl = `https://${domain.replace(/^https?:\/\//, '')}`;
        const sensitivity = await this.geoService.analyzeGeoSensitivity(baseUrl, countries);
        
        console.log(`   Geo-sensitive: ${sensitivity.isGeoSensitive ? '✅ YES' : '❌ NO'}`);
        results.analysis.geoSensitive = sensitivity.isGeoSensitive;
        results.analysis.differences = sensitivity.differences;
        
        // Scrape from each country
        for (const country of countries) {
            console.log(`\n📍 Scraping from ${country}...`);
            
            try {
                const geoClient = this.geoService.createGeoClient(country);
                const scraper = new ShopifyScraper(this.proxyUrl, geoClient);
                
                // Find PLP
                const plpResult = await scraper.findPlp(domain);
                
                if (!plpResult.success) {
                    results.countries[country] = {
                        success: false,
                        error: 'No PLP found',
                        country: geoClient.getCountryInfo()
                    };
                    continue;
                }
                
                console.log(`   PLP found: ${plpResult.url}`);
                
                // Extract product URLs
                const productUrls = await scraper.extractProductUrls(plpResult.url);
                
                if (!productUrls.success || productUrls.urls.length === 0) {
                    results.countries[country] = {
                        success: false,
                        error: 'No products found',
                        plp: plpResult,
                        country: geoClient.getCountryInfo()
                    };
                    continue;
                }
                
                console.log(`   Products found: ${productUrls.urls.length}`);
                
                // Extract data from first few products
                const sampleProducts = productUrls.urls.slice(0, 3);
                const productData = [];
                
                for (const productUrl of sampleProducts) {
                    try {
                        const product = await scraper.extractProductData(productUrl);
                        if (product.success) {
                            productData.push(product);
                        }
                    } catch (error) {
                        console.log(`   ⚠️ Product extraction failed: ${error.message}`);
                    }
                }
                
                results.countries[country] = {
                    success: true,
                    plp: plpResult,
                    productCount: productUrls.urls.length,
                    sampleProducts: productData,
                    country: geoClient.getCountryInfo()
                };
                
                console.log(`   ✅ ${country}: ${productData.length} products extracted`);
                
            } catch (error) {
                console.log(`   ❌ ${country}: ${error.message}`);
                results.countries[country] = {
                    success: false,
                    error: error.message
                };
            }
            
            // Rate limiting between countries
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Analyze differences between countries
        results.analysis.comparison = this.compareCountryResults(results.countries);
        
        return results;
    }
    
    /**
     * Compare scraped data between countries to identify geo-differences
     */
    compareCountryResults(countryResults) {
        const successful = Object.entries(countryResults)
            .filter(([_, result]) => result.success);
        
        if (successful.length < 2) {
            return { note: 'Need at least 2 successful countries to compare' };
        }
        
        const comparison = {
            differences: [],
            similarities: [],
            analysis: {}
        };
        
        // Compare PLP URLs
        const plpUrls = successful.map(([country, result]) => ({
            country,
            url: result.plp?.url
        }));
        
        const uniquePlpUrls = [...new Set(plpUrls.map(p => p.url))];
        if (uniquePlpUrls.length > 1) {
            comparison.differences.push('Different PLP URLs across countries');
            comparison.analysis.plpUrls = plpUrls;
        } else {
            comparison.similarities.push('Same PLP URL across countries');
        }
        
        // Compare product counts
        const productCounts = successful.map(([country, result]) => ({
            country,
            count: result.productCount
        }));
        
        const counts = productCounts.map(p => p.count);
        const countVariance = Math.max(...counts) - Math.min(...counts);
        
        if (countVariance > 5) { // More than 5 product difference
            comparison.differences.push('Different product counts across countries');
            comparison.analysis.productCounts = productCounts;
        } else {
            comparison.similarities.push('Similar product counts across countries');
        }
        
        // Compare sample product data
        const sampleComparison = this.compareSampleProducts(successful);
        if (sampleComparison.hasDifferences) {
            comparison.differences.push('Product data differs between countries');
            comparison.analysis.productDifferences = sampleComparison.differences;
        } else {
            comparison.similarities.push('Product data consistent across countries');
        }
        
        comparison.summary = {
            totalDifferences: comparison.differences.length,
            isGeoDifferent: comparison.differences.length > 0,
            countriesCompared: successful.length
        };
        
        return comparison;
    }
    
    /**
     * Compare sample products between countries
     */
    compareSampleProducts(successfulResults) {
        const comparison = {
            hasDifferences: false,
            differences: []
        };
        
        // Get first product from each country for comparison
        const firstProducts = successfulResults.map(([country, result]) => ({
            country,
            product: result.sampleProducts?.[0]
        })).filter(p => p.product);
        
        if (firstProducts.length < 2) {
            return comparison;
        }
        
        // Compare prices
        const prices = firstProducts.map(p => ({
            country: p.country,
            price: p.product.price
        })).filter(p => p.price);
        
        if (prices.length > 1) {
            const uniquePrices = [...new Set(prices.map(p => p.price))];
            if (uniquePrices.length > 1) {
                comparison.hasDifferences = true;
                comparison.differences.push({
                    type: 'price',
                    data: prices
                });
            }
        }
        
        // Compare description lengths
        const descriptions = firstProducts.map(p => ({
            country: p.country,
            length: p.product.description?.length || 0
        }));
        
        const lengths = descriptions.map(d => d.length);
        const lengthVariance = Math.max(...lengths) - Math.min(...lengths);
        
        if (lengthVariance > 100) { // 100 char difference
            comparison.hasDifferences = true;
            comparison.differences.push({
                type: 'description_length',
                data: descriptions
            });
        }
        
        return comparison;
    }
    
    /**
     * Quick geo test - just check if site shows different content from different countries
     */
    async quickGeoTest(domain, countries = ['US', 'UK']) {
        // If countries is a string (form geo target), convert it
        if (typeof countries === 'string') {
            countries = this.geoService.mapFormGeoTargetToCountries(countries);
        }
        console.log(`⚡ [Geo-Shopify] Quick geo test for ${domain}`);
        
        const baseUrl = `https://${domain.replace(/^https?:\/\//, '')}`;
        const sensitivity = await this.geoService.analyzeGeoSensitivity(baseUrl, countries);
        
        return {
            domain,
            isGeoSensitive: sensitivity.isGeoSensitive,
            differences: sensitivity.differences,
            recommendation: sensitivity.isGeoSensitive 
                ? 'Use multi-geo scraping for complete analysis'
                : 'Single-location scraping sufficient'
        };
    }
}

module.exports = GeoShopifyScraper;