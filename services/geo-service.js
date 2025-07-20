// Geographic Scraping Service
// Provides geo-spoofing capabilities to all platform modules

const GeoSpoofer = require('../utils/geo-spoofer');
const DataForSEOUtils = require('../utils/dataforseo-utils');

class GeoService {
    constructor() {
        this.geoSpoofer = new GeoSpoofer();
        this.dataForSEOUtils = new DataForSEOUtils();
        this.defaultCountry = 'US';
    }
    
    /**
     * Create a geo-aware HTTP client for any platform module
     * @param {string} countryCode - Target country (US, UK, DE, etc.)
     * @param {Object} options - Additional options
     */
    createGeoClient(countryCode = this.defaultCountry, options = {}) {
        const geoConfig = this.geoSpoofer.getGeoConfig(countryCode);
        
        return {
            // Enhanced fetch with geo-spoofing
            fetch: async (url, fetchOptions = {}) => {
                return this.geoSpoofer.geoFetch(url, countryCode, fetchOptions);
            },
            
            // Get geo headers for manual requests
            getHeaders: () => geoConfig.headers,
            
            // Get country info
            getCountryInfo: () => geoConfig.countryInfo,
            
            // Build geo-aware URLs
            buildGeoUrl: (baseUrl, params = {}) => {
                const url = new URL(baseUrl);
                
                // Add geo params
                Object.entries(geoConfig.urlParams).forEach(([key, value]) => {
                    if (!url.searchParams.has(key)) {
                        url.searchParams.set(key, value);
                    }
                });
                
                // Add custom params
                Object.entries(params).forEach(([key, value]) => {
                    url.searchParams.set(key, value);
                });
                
                return url.toString();
            }
        };
    }
    
    /**
     * Analyze geo-sensitivity of a site before scraping
     * @param {string} url - Site to analyze
     * @param {Array} countries - Countries to test
     */
    async analyzeGeoSensitivity(url, countries = ['US', 'UK', 'DE']) {
        return this.geoSpoofer.testGeoSensitivity(url, countries);
    }
    
    /**
     * Map form geo target to country codes for scraping
     * @param {string} formGeoTarget - Value from geoTarget form field
     * @returns {Array} Country codes for scraping
     */
    mapFormGeoTargetToCountries(formGeoTarget) {
        const geoTargetMap = {
            'UK': ['UK'],
            'US': ['US'],
            'AU': ['AU'],
            'CA': ['CA'],
            'EU': ['UK', 'DE', 'FR'], // European markets
            'Global': ['US', 'UK', 'DE'] // Major global markets
        };
        
        return geoTargetMap[formGeoTarget] || ['US']; // Default to US
    }
    
    /**
     * Get optimal scraping strategy for a geo-sensitive site
     * @param {string} url - Target URL
     * @param {string|Array} targetCountries - Countries to scrape from (or form geo target)
     */
    async getScrapingStrategy(url, targetCountries = ['US']) {
        // If targetCountries is a string (form geo target), convert it
        if (typeof targetCountries === 'string') {
            targetCountries = this.mapFormGeoTargetToCountries(targetCountries);
        }
        console.log(`🎯 Planning geo-scraping strategy for ${url}`);
        
        // First test if site is geo-sensitive
        const sensitivity = await this.analyzeGeoSensitivity(url, targetCountries);
        
        if (!sensitivity.isGeoSensitive) {
            console.log(`📍 Site not geo-sensitive, single scrape sufficient`);
            return {
                strategy: 'single',
                countries: [this.defaultCountry],
                isGeoSensitive: false
            };
        }
        
        console.log(`🌍 Site is geo-sensitive, multi-location scraping recommended`);
        return {
            strategy: 'multi-location',
            countries: targetCountries,
            isGeoSensitive: true,
            differences: sensitivity.differences
        };
    }
    
    /**
     * Perform geo-aware batch scraping
     * @param {Array} urls - URLs to scrape
     * @param {string|Array} countries - Countries to scrape from (or form geo target)
     * @param {Function} scrapeFunction - Platform-specific scraping function
     */
    async batchGeoScrape(urls, countries, scrapeFunction) {
        // If countries is a string (form geo target), convert it
        if (typeof countries === 'string') {
            countries = this.mapFormGeoTargetToCountries(countries);
        }
        console.log(`🌐 Starting geo-aware batch scrape`);
        console.log(`   URLs: ${urls.length}`);
        console.log(`   Countries: ${countries.join(', ')}`);
        
        const results = [];
        
        for (const url of urls) {
            console.log(`\n📡 Scraping: ${url}`);
            
            const urlResults = {
                url,
                countries: {},
                summary: {}
            };
            
            for (const country of countries) {
                try {
                    console.log(`   🌍 From ${country}...`);
                    
                    const geoClient = this.createGeoClient(country);
                    const result = await scrapeFunction(url, geoClient);
                    
                    urlResults.countries[country] = {
                        success: true,
                        data: result,
                        country: geoClient.getCountryInfo()
                    };
                    
                    console.log(`   ✅ ${country}: Success`);
                    
                } catch (error) {
                    console.log(`   ❌ ${country}: ${error.message}`);
                    urlResults.countries[country] = {
                        success: false,
                        error: error.message
                    };
                }
                
                // Rate limiting between countries
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Analyze differences between countries
            urlResults.summary = this.analyzeCountryDifferences(urlResults.countries);
            results.push(urlResults);
            
            // Rate limiting between URLs
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        return results;
    }
    
    /**
     * Analyze differences in scraped data between countries
     */
    analyzeCountryDifferences(countryResults) {
        const successful = Object.entries(countryResults)
            .filter(([_, result]) => result.success);
        
        if (successful.length < 2) {
            return { differences: 'insufficient_data' };
        }
        
        const differences = [];
        
        // Compare prices
        const prices = successful.map(([country, result]) => ({
            country,
            price: result.data?.price
        })).filter(p => p.price);
        
        if (prices.length > 1) {
            const uniquePrices = [...new Set(prices.map(p => p.price))];
            if (uniquePrices.length > 1) {
                differences.push('price_differences');
            }
        }
        
        // Compare content lengths
        const contentLengths = successful.map(([country, result]) => ({
            country,
            length: result.data?.description?.length || 0
        }));
        
        const lengths = contentLengths.map(c => c.length);
        const variance = Math.max(...lengths) - Math.min(...lengths);
        
        if (variance > 100) { // 100 char difference
            differences.push('content_differences');
        }
        
        // Compare product availability
        const availability = successful.map(([country, result]) => ({
            country,
            available: !!result.data?.title
        }));
        
        const availabilityStates = [...new Set(availability.map(a => a.available))];
        if (availabilityStates.length > 1) {
            differences.push('availability_differences');
        }
        
        return {
            differences,
            isGeoDifferent: differences.length > 0,
            successfulCountries: successful.length,
            analysis: {
                prices: prices.length > 0 ? prices : 'none_detected',
                contentLengthRange: `${Math.min(...lengths)}-${Math.max(...lengths)} chars`
            }
        };
    }
    
    /**
     * Get DataForSEO location and language codes for a form geo target
     * @param {string} formGeoTarget - Value from geoTarget form field
     * @returns {Object} DataForSEO location and language configuration
     */
    getDataForSEOConfig(formGeoTarget) {
        const geoTargetConfigs = {
            'UK': { location_code: 2826, language_code: 'en', country_name: 'United Kingdom' },
            'US': { location_code: 2840, language_code: 'en', country_name: 'United States' },
            'AU': { location_code: 2036, language_code: 'en', country_name: 'Australia' },
            'CA': { location_code: 2124, language_code: 'en', country_name: 'Canada' },
            'EU': { location_code: 2826, language_code: 'en', country_name: 'United Kingdom' }, // UK as EU proxy
            'Global': { location_code: 2840, language_code: 'en', country_name: 'United States' } // US as global proxy
        };
        
        return geoTargetConfigs[formGeoTarget] || geoTargetConfigs['US'];
    }
    
    /**
     * Get comprehensive geo configuration for competitor analysis
     * @param {string} formGeoTarget - Value from geoTarget form field
     * @returns {Object} Complete geo configuration for analysis
     */
    getCompetitorAnalysisConfig(formGeoTarget) {
        const dataForSEOConfig = this.getDataForSEOConfig(formGeoTarget);
        const scrapingCountries = this.mapFormGeoTargetToCountries(formGeoTarget);
        
        return {
            // For DataForSEO SERP analysis
            serp: {
                location_code: dataForSEOConfig.location_code,
                language_code: dataForSEOConfig.language_code,
                country_name: dataForSEOConfig.country_name
            },
            // For geo-aware scraping
            scraping: {
                countries: scrapingCountries,
                primary_country: scrapingCountries[0]
            },
            // Form context
            form_target: formGeoTarget
        };
    }
    
    /**
     * Get available countries for geo-scraping
     */
    getAvailableCountries() {
        return Object.keys(this.geoSpoofer.countryData);
    }
    
    /**
     * Test geo service functionality
     */
    async testService() {
        console.log('🧪 Testing Geo Service...');
        
        const testUrl = 'https://allbirds.com';
        const geoClient = this.createGeoClient('UK');
        
        try {
            const response = await geoClient.fetch(testUrl);
            console.log(`✅ Geo fetch test: ${response.status}`);
            
            const strategy = await this.getScrapingStrategy(testUrl, ['US', 'UK']);
            console.log(`✅ Strategy test: ${strategy.strategy}`);
            
            return true;
        } catch (error) {
            console.error(`❌ Geo service test failed: ${error.message}`);
            return false;
        }
    }
}

module.exports = GeoService;