// Geographic Location Spoofer
// Uses headers, IP hints, and other techniques to appear from different countries

class GeoSpoofer {
    constructor() {
        this.countryData = this.loadCountryData();
    }
    
    /**
     * Get geo-spoofing headers and parameters for a country
     * @param {string} countryCode - 2-letter country code (US, UK, DE, etc.)
     * @returns {Object} Headers and URL parameters for geo-spoofing
     */
    getGeoConfig(countryCode) {
        const country = countryCode.toUpperCase();
        const config = this.countryData[country];
        
        if (!config) {
            console.log(`⚠️ No geo config for ${country}, using default (US)`);
            return this.getGeoConfig('US');
        }
        
        console.log(`🌍 Geo-spoofing as ${config.name} (${country})`);
        
        return {
            headers: this.buildHeaders(config),
            urlParams: this.buildUrlParams(config),
            cookies: this.buildCookies(config),
            countryInfo: config
        };
    }
    
    /**
     * Build geo-spoofing headers
     */
    buildHeaders(config) {
        const headers = {
            // Language preferences
            'Accept-Language': config.languages.join(','),
            
            // Geographic hints
            'CF-IPCountry': config.code,           // Cloudflare country header
            'X-Country-Code': config.code,        // Generic country header
            'X-Forwarded-For': config.sampleIP,   // Fake IP from that country
            'X-Real-IP': config.sampleIP,
            
            // Time zone hints
            'X-Timezone': config.timezone,
            
            // Enhanced User-Agent with locale
            'User-Agent': this.buildUserAgent(config),
            
            // Currency/region hints
            'Accept-Currency': config.currency,
            'X-Currency': config.currency,
            
            // CDN/Cache hints
            'CF-RAY': this.generateCloudflareRay(config.code),
            
            // Additional regional headers
            'X-Original-Country': config.code,
            'X-Client-Country': config.code
        };
        
        return headers;
    }
    
    /**
     * Build URL parameters that indicate location
     */
    buildUrlParams(config) {
        return {
            country: config.code.toLowerCase(),
            region: config.code.toLowerCase(),
            currency: config.currency,
            lang: config.languages[0].split('-')[0], // e.g., 'en' from 'en-US'
            market: config.code.toLowerCase()
        };
    }
    
    /**
     * Build cookies that hint at location
     */
    buildCookies(config) {
        return {
            'country': config.code,
            'currency': config.currency,
            'language': config.languages[0],
            'region': config.code.toLowerCase(),
            'timezone': config.timezone,
            'market': config.code.toLowerCase()
        };
    }
    
    /**
     * Build region-appropriate User-Agent
     */
    buildUserAgent(config) {
        const baseUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        
        // Add locale hint to User-Agent
        const locale = config.languages[0];
        return `${baseUA} (${locale})`;
    }
    
    /**
     * Generate fake Cloudflare Ray ID for the country
     */
    generateCloudflareRay(countryCode) {
        const timestamp = Date.now().toString(16);
        const random = Math.random().toString(16).substring(2, 8);
        const airportCode = this.countryData[countryCode]?.airport || 'DFW';
        
        return `${timestamp}${random}-${airportCode}`;
    }
    
    /**
     * Apply geo-spoofing to a fetch request
     * @param {string} url - Target URL
     * @param {string} countryCode - Country to spoof
     * @param {Object} options - Additional fetch options
     */
    async geoFetch(url, countryCode, options = {}) {
        const geoConfig = this.getGeoConfig(countryCode);
        
        // Add country-specific URL parameters
        const urlObj = new URL(url);
        Object.entries(geoConfig.urlParams).forEach(([key, value]) => {
            // Only add if not already present
            if (!urlObj.searchParams.has(key)) {
                urlObj.searchParams.set(key, value);
            }
        });
        
        // Merge headers
        const headers = {
            ...geoConfig.headers,
            ...options.headers
        };
        
        // Build cookie string
        const cookieString = Object.entries(geoConfig.cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');
        
        if (cookieString) {
            headers['Cookie'] = cookieString;
        }
        
        console.log(`🌐 Fetching ${urlObj.toString()} as ${geoConfig.countryInfo.name}`);
        
        return fetch(urlObj.toString(), {
            ...options,
            headers
        });
    }
    
    /**
     * Test if a site shows different content for different countries
     * @param {string} url - URL to test
     * @param {Array} countries - Countries to test ['US', 'UK', 'DE']
     */
    async testGeoSensitivity(url, countries = ['US', 'UK', 'DE']) {
        console.log(`🧪 Testing geo-sensitivity for ${url}`);
        
        const results = {};
        
        for (const country of countries) {
            try {
                console.log(`\n📍 Testing from ${country}...`);
                
                const response = await this.geoFetch(url, country);
                const content = await response.text();
                
                results[country] = {
                    success: true,
                    status: response.status,
                    contentLength: content.length,
                    contentHash: this.hashContent(content),
                    currency: this.extractCurrency(content),
                    language: this.extractLanguage(content),
                    prices: this.extractPrices(content)
                };
                
                console.log(`   Status: ${response.status}`);
                console.log(`   Content: ${content.length} chars`);
                console.log(`   Currency: ${results[country].currency || 'none detected'}`);
                
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                results[country] = {
                    success: false,
                    error: error.message
                };
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Analyze differences
        return this.analyzeGeoResults(results, url);
    }
    
    /**
     * Analyze geo test results for differences
     */
    analyzeGeoResults(results, url) {
        const analysis = {
            url,
            isGeoSensitive: false,
            differences: [],
            summary: {}
        };
        
        const successfulResults = Object.entries(results).filter(([_, r]) => r.success);
        
        if (successfulResults.length < 2) {
            analysis.summary.note = 'Not enough successful requests to compare';
            return analysis;
        }
        
        // Compare content hashes
        const hashes = successfulResults.map(([country, r]) => ({ country, hash: r.contentHash }));
        const uniqueHashes = [...new Set(hashes.map(h => h.hash))];
        
        if (uniqueHashes.length > 1) {
            analysis.isGeoSensitive = true;
            analysis.differences.push('Content differs between countries');
        }
        
        // Compare currencies
        const currencies = successfulResults.map(([country, r]) => ({ country, currency: r.currency }));
        const uniqueCurrencies = [...new Set(currencies.map(c => c.currency).filter(Boolean))];
        
        if (uniqueCurrencies.length > 1) {
            analysis.isGeoSensitive = true;
            analysis.differences.push('Different currencies detected');
        }
        
        // Compare content lengths (rough indicator)
        const lengths = successfulResults.map(([country, r]) => r.contentLength);
        const lengthVariance = Math.max(...lengths) - Math.min(...lengths);
        
        if (lengthVariance > 1000) { // 1KB difference
            analysis.isGeoSensitive = true;
            analysis.differences.push('Significant content length differences');
        }
        
        analysis.summary = {
            countriesTested: successfulResults.length,
            uniqueContentHashes: uniqueHashes.length,
            currencies: uniqueCurrencies,
            contentLengthRange: `${Math.min(...lengths)}-${Math.max(...lengths)} chars`
        };
        
        return analysis;
    }
    
    /**
     * Simple content hash for comparison
     */
    hashContent(content) {
        // Simple hash - in production use crypto.createHash
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }
    
    /**
     * Extract currency symbols/codes from content
     */
    extractCurrency(content) {
        const currencyMatches = content.match(/[$£€¥₹]\d+|USD|GBP|EUR|JPY|INR/gi);
        return currencyMatches ? currencyMatches[0] : null;
    }
    
    /**
     * Extract language indicators
     */
    extractLanguage(content) {
        const langMatch = content.match(/lang=["']([^"']+)["']/i);
        return langMatch ? langMatch[1] : null;
    }
    
    /**
     * Extract price patterns
     */
    extractPrices(content) {
        const priceMatches = content.match(/[$£€¥₹]\d+(?:\.\d{2})?/g);
        return priceMatches ? priceMatches.slice(0, 5) : []; // First 5 prices
    }
    
    /**
     * Load country configuration data
     */
    loadCountryData() {
        return {
            'US': {
                name: 'United States',
                code: 'US',
                currency: 'USD',
                languages: ['en-US', 'en'],
                timezone: 'America/New_York',
                sampleIP: '8.8.8.8',
                airport: 'DFW'
            },
            'UK': {
                name: 'United Kingdom',
                code: 'GB',
                currency: 'GBP',
                languages: ['en-GB', 'en'],
                timezone: 'Europe/London',
                sampleIP: '8.8.4.4',
                airport: 'LHR'
            },
            'DE': {
                name: 'Germany',
                code: 'DE',
                currency: 'EUR',
                languages: ['de-DE', 'de', 'en'],
                timezone: 'Europe/Berlin',
                sampleIP: '1.1.1.1',
                airport: 'FRA'
            },
            'FR': {
                name: 'France',
                code: 'FR',
                currency: 'EUR',
                languages: ['fr-FR', 'fr', 'en'],
                timezone: 'Europe/Paris',
                sampleIP: '9.9.9.9',
                airport: 'CDG'
            },
            'CA': {
                name: 'Canada',
                code: 'CA',
                currency: 'CAD',
                languages: ['en-CA', 'fr-CA', 'en'],
                timezone: 'America/Toronto',
                sampleIP: '1.2.3.4',
                airport: 'YYZ'
            },
            'AU': {
                name: 'Australia',
                code: 'AU',
                currency: 'AUD',
                languages: ['en-AU', 'en'],
                timezone: 'Australia/Sydney',
                sampleIP: '5.6.7.8',
                airport: 'SYD'
            },
            'JP': {
                name: 'Japan',
                code: 'JP',
                currency: 'JPY',
                languages: ['ja-JP', 'ja', 'en'],
                timezone: 'Asia/Tokyo',
                sampleIP: '2.2.2.2',
                airport: 'NRT'
            }
        };
    }
}

module.exports = GeoSpoofer;