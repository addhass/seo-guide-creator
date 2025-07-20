// Free Proxy Harvester and Tester
// Discovers, tests, and maintains working free proxies by country

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

class ProxyHarvester {
    constructor() {
        this.proxyCache = new Map();
        this.testResults = new Map();
        this.cacheFile = path.join(__dirname, '../data/proxy-cache.json');
        this.maxProxiesPerCountry = 20;
        this.testTimeout = 8000; // 8 second timeout
    }
    
    /**
     * Get working proxies for a specific country
     * @param {string} countryCode - 2-letter country code (US, UK, DE, etc.)
     * @returns {Array} Working proxy URLs
     */
    async getProxiesForCountry(countryCode) {
        console.log(`🔍 Getting proxies for ${countryCode}...`);
        
        // Check cache first
        const cached = await this.loadCache();
        const cacheKey = countryCode.toUpperCase();
        
        if (cached[cacheKey] && this.isCacheFresh(cached[cacheKey])) {
            console.log(`💾 Using cached proxies for ${countryCode} (${cached[cacheKey].proxies.length} available)`);
            return cached[cacheKey].proxies;
        }
        
        // Harvest fresh proxies
        console.log(`🌐 Harvesting fresh proxies for ${countryCode}...`);
        const freshProxies = await this.harvestProxies(countryCode);
        
        // Test proxies
        console.log(`🧪 Testing ${freshProxies.length} proxies...`);
        const workingProxies = await this.testProxies(freshProxies);
        
        // Cache results
        await this.cacheProxies(countryCode, workingProxies);
        
        console.log(`✅ Found ${workingProxies.length} working proxies for ${countryCode}`);
        return workingProxies;
    }
    
    /**
     * Harvest proxies from multiple free sources
     */
    async harvestProxies(countryCode) {
        const allProxies = new Set();
        
        // Source 1: ProxyScrape API
        try {
            await this.harvestFromProxyScrape(countryCode, allProxies);
        } catch (error) {
            console.log(`   ⚠️ ProxyScrape failed: ${error.message}`);
        }
        
        // Source 2: Free Proxy List API
        try {
            await this.harvestFromFreeProxyList(countryCode, allProxies);
        } catch (error) {
            console.log(`   ⚠️ FreeProxyList failed: ${error.message}`);
        }
        
        // Source 3: Proxy List Download
        try {
            await this.harvestFromProxyListDownload(countryCode, allProxies);
        } catch (error) {
            console.log(`   ⚠️ ProxyListDownload failed: ${error.message}`);
        }
        
        // Source 4: Hardcoded reliable free proxies (fallback)
        this.addFallbackProxies(countryCode, allProxies);
        
        return Array.from(allProxies).slice(0, 50); // Limit to 50 for testing
    }
    
    /**
     * Harvest from ProxyScrape API
     */
    async harvestFromProxyScrape(countryCode, proxies) {
        const url = `https://api.proxyscrape.com/v2/?request=get&protocol=http&timeout=10000&country=${countryCode}&format=textplain`;
        
        const response = await fetch(url, { timeout: 10000 });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const text = await response.text();
        const proxyList = text.trim().split('\n').filter(p => p.includes(':'));
        
        proxyList.forEach(proxy => {
            if (proxy.match(/^\d+\.\d+\.\d+\.\d+:\d+$/)) {
                proxies.add(`http://${proxy}`);
            }
        });
        
        console.log(`   📡 ProxyScrape: Found ${proxyList.length} proxies`);
    }
    
    /**
     * Harvest from Free Proxy List API
     */
    async harvestFromFreeProxyList(countryCode, proxies) {
        const url = `https://www.proxy-list.download/api/v1/get?type=http&country=${countryCode}`;
        
        const response = await fetch(url, { timeout: 10000 });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const text = await response.text();
        const proxyList = text.trim().split('\n').filter(p => p.includes(':'));
        
        proxyList.forEach(proxy => {
            if (proxy.match(/^\d+\.\d+\.\d+\.\d+:\d+$/)) {
                proxies.add(`http://${proxy}`);
            }
        });
        
        console.log(`   📡 FreeProxyList: Found ${proxyList.length} proxies`);
    }
    
    /**
     * Harvest from Proxy List Download
     */
    async harvestFromProxyListDownload(countryCode, proxies) {
        // They use different API format
        const url = `https://api.openproxy.space/list?country=${countryCode}&type=http`;
        
        try {
            const response = await fetch(url, { timeout: 10000 });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            if (data.data && Array.isArray(data.data)) {
                data.data.forEach(proxy => {
                    if (proxy.ip && proxy.port) {
                        proxies.add(`http://${proxy.ip}:${proxy.port}`);
                    }
                });
                console.log(`   📡 OpenProxy: Found ${data.data.length} proxies`);
            }
        } catch (error) {
            // Fallback to simpler format
            console.log(`   📡 OpenProxy: API format changed, skipping`);
        }
    }
    
    /**
     * Add fallback proxies for common countries
     */
    addFallbackProxies(countryCode, proxies) {
        const fallbacks = {
            'US': [
                'http://proxy-server.ka-nabell.com:8888',
                'http://47.88.87.74:8080',
                'http://138.197.102.119:8080'
            ],
            'UK': [
                'http://195.154.255.118:8080',
                'http://51.79.50.22:9300'
            ],
            'DE': [
                'http://proxy.stilu.de:3128',
                'http://138.68.161.60:80'
            ],
            'FR': [
                'http://51.159.115.233:3128'
            ]
        };
        
        const countryFallbacks = fallbacks[countryCode.toUpperCase()] || [];
        countryFallbacks.forEach(proxy => proxies.add(proxy));
        
        if (countryFallbacks.length > 0) {
            console.log(`   📋 Added ${countryFallbacks.length} fallback proxies for ${countryCode}`);
        }
    }
    
    /**
     * Test proxies for speed and reliability
     */
    async testProxies(proxies) {
        console.log(`   🏃‍♂️ Testing ${proxies.length} proxies (${this.testTimeout/1000}s timeout each)...`);
        
        const testUrl = 'http://httpbin.org/ip'; // Simple IP echo service
        const workingProxies = [];
        const batchSize = 10; // Test 10 at a time to avoid overwhelming
        
        for (let i = 0; i < proxies.length; i += batchSize) {
            const batch = proxies.slice(i, i + batchSize);
            const batchPromises = batch.map(proxy => this.testSingleProxy(proxy, testUrl));
            
            const results = await Promise.allSettled(batchPromises);
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value.working) {
                    workingProxies.push(result.value);
                }
            });
            
            // Progress update
            const tested = Math.min(i + batchSize, proxies.length);
            console.log(`   📊 Tested ${tested}/${proxies.length} proxies (${workingProxies.length} working)`);
            
            // Small delay between batches
            if (i + batchSize < proxies.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Sort by speed (fastest first)
        workingProxies.sort((a, b) => a.responseTime - b.responseTime);
        
        return workingProxies.slice(0, this.maxProxiesPerCountry).map(p => ({
            url: p.proxy,
            responseTime: p.responseTime,
            country: p.country
        }));
    }
    
    /**
     * Test a single proxy
     */
    async testSingleProxy(proxy, testUrl) {
        const startTime = Date.now();
        
        try {
            // Use our existing proxy server to test the proxy
            const proxyTestUrl = `http://localhost:3001/test-proxy?proxy=${encodeURIComponent(proxy)}&target=${encodeURIComponent(testUrl)}`;
            
            const response = await fetch(proxyTestUrl, {
                timeout: this.testTimeout,
                method: 'GET'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const responseTime = Date.now() - startTime;
            
            // Verify we got IP info back
            if (data.success && data.data && data.data.origin) {
                return {
                    proxy,
                    working: true,
                    responseTime,
                    testIp: data.data.origin,
                    country: data.country || 'unknown'
                };
            } else {
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            return {
                proxy,
                working: false,
                error: error.message,
                responseTime: Date.now() - startTime
            };
        }
    }
    
    /**
     * Cache working proxies
     */
    async cacheProxies(countryCode, proxies) {
        try {
            const cache = await this.loadCache();
            
            cache[countryCode.toUpperCase()] = {
                proxies,
                timestamp: Date.now(),
                count: proxies.length
            };
            
            await fs.writeFile(this.cacheFile, JSON.stringify(cache, null, 2));
            console.log(`💾 Cached ${proxies.length} working proxies for ${countryCode}`);
        } catch (error) {
            console.error('Failed to cache proxies:', error.message);
        }
    }
    
    /**
     * Load proxy cache
     */
    async loadCache() {
        try {
            const data = await fs.readFile(this.cacheFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {}; // Empty cache if file doesn't exist
        }
    }
    
    /**
     * Check if cache is fresh (less than 1 hour old)
     */
    isCacheFresh(cacheEntry) {
        const maxAge = 60 * 60 * 1000; // 1 hour
        return (Date.now() - cacheEntry.timestamp) < maxAge;
    }
    
    /**
     * Get proxy statistics
     */
    async getStats() {
        const cache = await this.loadCache();
        
        const stats = {
            totalCountries: Object.keys(cache).length,
            totalProxies: 0,
            byCountry: {}
        };
        
        Object.entries(cache).forEach(([country, data]) => {
            stats.totalProxies += data.count;
            stats.byCountry[country] = {
                count: data.count,
                age: ((Date.now() - data.timestamp) / 1000 / 60).toFixed(0) + ' minutes'
            };
        });
        
        return stats;
    }
}

module.exports = ProxyHarvester;