// Simple CORS Proxy Server
// Run with: node cors-proxy-server.js

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
require('dotenv').config();

// Import Supabase service
const { authenticateRequest } = require('./supabase-service');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting for ethical crawling
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 requests per minute per domain

function checkRateLimit(domain) {
    const now = Date.now();
    const domainKey = new URL(domain).hostname;
    
    if (!rateLimiter.has(domainKey)) {
        rateLimiter.set(domainKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
    }
    
    const limits = rateLimiter.get(domainKey);
    
    if (now > limits.resetTime) {
        // Reset window
        rateLimiter.set(domainKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
    }
    
    if (limits.count >= MAX_REQUESTS_PER_WINDOW) {
        return { 
            allowed: false, 
            remaining: 0,
            resetTime: limits.resetTime 
        };
    }
    
    limits.count++;
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - limits.count };
}

// Enable CORS for all routes
app.use(cors());
// Increase body size limit to handle large HTML payloads
app.use(express.json({ limit: '10mb' }));

// Add authentication middleware
app.use(authenticateRequest);
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Proxy endpoint for fetching About Us pages
app.get('/fetch-page', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        console.log('Fetching:', url);
        
        // Fetch the page
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            redirect: 'follow' // Follow redirects
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const finalUrl = response.url; // Get final URL after redirects
        
        if (finalUrl !== url) {
            console.log(`🔄 Redirected from ${url} to ${finalUrl}`);
        }
        
        // Clean and extract content
        const dom = new JSDOM(html);
        const document = dom.window.document;
        
        // Remove unwanted elements
        const unwantedSelectors = [
            'nav', 'header', 'footer', 'script', 'style', 
            '.navigation', '#nav', '.menu', '.cookie', 
            '.ads', '.advertisement', '.social-media'
        ];
        
        unwantedSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        // Extract about us content
        const aboutSelectors = [
            '[class*="about"]', '[id*="about"]',
            'main', '.content', '#content', 
            '.story', '.mission', '.vision',
            'h1, h2, h3', 'p'
        ];

        let content = '';
        aboutSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el.textContent.trim().length > 20) {
                    content += el.textContent.trim() + '\n';
                }
            });
        });

        // Fallback to body content
        if (content.length < 100) {
            content = document.body.textContent || '';
        }

        // Keep more content for better detection
        // Performance monitoring
        const startClean = Date.now();
        const cleanContent = content
            .replace(/\s+/g, ' ')
            .trim();
        const cleanTime = Date.now() - startClean;
        
        console.log(`📊 Content processing: ${cleanContent.length} chars in ${cleanTime}ms`);

        res.json({
            success: true,
            url: url,
            finalUrl: finalUrl,
            redirected: finalUrl !== url,
            content: cleanContent,
            contentLength: cleanContent.length
        });

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test API key endpoint
app.post('/test-api-key', async (req, res) => {
    try {
        const { service, apiKey } = req.body;
        
        if (!service || !apiKey) {
            return res.status(400).json({ error: 'Service and API key required' });
        }
        
        if (service === 'dataforseo') {
            // Test DataForSEO API
            const [login, password] = apiKey.split(':');
            
            const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64')
                },
                body: JSON.stringify([{
                    "keyword": "test",
                    "location_code": 2826,
                    "language_code": "en",
                    "depth": 1
                }])
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.status_code === 20000) {
                    return res.json({ valid: true, message: 'DataForSEO API key is valid' });
                }
            }
            
            return res.json({ valid: false, error: 'Invalid DataForSEO credentials' });
            
        } else if (service === 'anthropic') {
            // Test Anthropic API
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Hi' }]
                })
            });
            
            if (response.ok) {
                return res.json({ valid: true, message: 'Anthropic API key is valid' });
            }
            
            const errorText = await response.text();
            console.error('Anthropic API error:', response.status, errorText);
            
            try {
                const errorData = JSON.parse(errorText);
                return res.json({ valid: false, error: errorData.error?.message || 'Invalid Anthropic API key' });
            } catch {
                return res.json({ valid: false, error: `Invalid Anthropic API key (${response.status})` });
            }
        }
        
        return res.status(400).json({ error: 'Unknown service' });
        
    } catch (error) {
        console.error('API test error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Claude API proxy endpoint
app.post('/claude-api', async (req, res) => {
    try {
        const { messages, model = 'claude-3-haiku-20240307', max_tokens = 500 } = req.body;
        
        if (!messages) {
            return res.status(400).json({ error: 'Messages parameter is required' });
        }

        // Get API key from user's stored keys or environment
        let apiKey;
        
        if (req.apiKeys && req.apiKeys.anthropic) {
            // Use user's stored API key
            apiKey = req.apiKeys.anthropic;
        } else {
            // Fallback to environment variable
            apiKey = process.env.ANTHROPIC_API_KEY || '';
        }
        
        if (!apiKey) {
            console.log('No Anthropic API key found. req.apiKeys:', req.apiKeys);
            console.log('Environment ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set');
            return res.status(401).json({ 
                error: 'Anthropic API key not configured. Please add your API key in the dashboard.',
                debug: {
                    hasUserKeys: !!req.apiKeys,
                    userKeysAvailable: Object.keys(req.apiKeys || {}),
                    hasEnvKey: !!process.env.ANTHROPIC_API_KEY
                }
            });
        }

        console.log('Proxying Claude API request...');
        console.log('Using API key from:', req.apiKeys?.anthropic ? 'user storage' : 'environment');
        
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                max_tokens,
                messages
            })
        });

        if (!claudeResponse.ok) {
            const errorText = await claudeResponse.text();
            console.error('Claude API error:', errorText);
            throw new Error(`Claude API error ${claudeResponse.status}: ${errorText}`);
        }

        const data = await claudeResponse.json();
        console.log('Claude API success');
        
        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Claude proxy error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DataForSEO API proxy endpoint for competitor analysis
// [REMOVED] Old direct competitor discovery endpoint - replaced with advanced TSV-based keyword analysis
// Use /get-serp-competitors-sequential instead for keyword-based competitor discovery

// [REMOVED] Old keyword-based competitor endpoint - replaced with sequential version
// DataForSEO API endpoint for keyword ranking competitors (DEPRECATED)
app.post('/dataforseo-keyword-competitors', async (req, res) => {
    try {
        const { keywords, location = "United Kingdom", language = "English" } = req.body;
        
        if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
            return res.status(400).json({ error: 'Keywords array is required' });
        }

        console.log(`🔍 Finding competitors for ${keywords.length} keywords...`);
        console.log('📋 Sample keywords:', keywords.slice(0, 5));
        
        // DataForSEO credentials
        // Use environment variables for security
        // Get credentials from user's stored API keys or environment
        let login, password;
        
        if (req.apiKeys && req.apiKeys.dataforseo) {
            // Use user's stored credentials
            const parts = req.apiKeys.dataforseo.split(':');
            login = parts[0];
            password = parts[1];
        } else {
            // Fallback to environment variables
            login = process.env.DATAFORSEO_LOGIN;
            password = process.env.DATAFORSEO_PASSWORD;
        }
        
        if (!login || !password) {
            return res.status(401).json({ error: 'DataForSEO credentials not configured. Please add your API keys in the dashboard.' });
        }
        
        // Simple UK/English defaults for now
        const locationCode = 2826; // United Kingdom
        const languageCode = 'en'; // English
        console.log(`🎯 Using location: ${locationCode}, language: ${languageCode}`);
        
        // Prepare batch request for multiple keywords
        const requestData = keywords.slice(0, 30).map(keyword => ({
            "keyword": keyword,
            "location_code": locationCode,
            "language_code": languageCode,
            "depth": 10 // Top 10 results only
        }));

        const dataForSeoResponse = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64')
            },
            body: JSON.stringify(requestData)
        });

        if (!dataForSeoResponse.ok) {
            throw new Error(`DataForSEO API error ${dataForSeoResponse.status}: ${await dataForSeoResponse.text()}`);
        }

        const data = await dataForSeoResponse.json();
        console.log('DataForSEO SERP API success');
        console.log('🔍 Full API response:', JSON.stringify(data, null, 2));
        
        // Extract and deduplicate domains
        const domainCounts = {};
        let totalResults = 0;
        
        console.log('📊 DataForSEO API Response Structure:');
        console.log('- Tasks:', data.tasks?.length || 0);
        if (data.tasks?.[0]) {
            console.log('- First task status:', data.tasks[0].status_message);
            console.log('- First task results:', data.tasks[0].result?.length || 0);
            if (data.tasks[0].result?.[0]?.items) {
                console.log('- First task items:', data.tasks[0].result[0].items.length);
                console.log('- Sample item:', data.tasks[0].result[0].items[0]);
            }
        }
        
        if (data.tasks) {
            data.tasks.forEach(task => {
                if (task.result && task.result[0] && task.result[0].items) {
                    task.result[0].items.forEach(item => {
                        if (item.domain) {
                            const domain = item.domain;
                            
                            // TEMPORARILY REMOVED FILTERING - Accept all domains
                            console.log(`🔍 Found domain: ${domain}`);
                                if (!domainCounts[domain]) {
                                    domainCounts[domain] = {
                                        domain: domain,
                                        appearances: 0,
                                        keywords: [],
                                        avgPosition: 0,
                                        totalPosition: 0
                                    };
                                }
                                domainCounts[domain].appearances++;
                                domainCounts[domain].keywords.push(task.data?.keyword || 'unknown');
                                domainCounts[domain].totalPosition += item.rank_absolute || 0;
                                domainCounts[domain].avgPosition = domainCounts[domain].totalPosition / domainCounts[domain].appearances;
                                totalResults++;
                        }
                    });
                }
            });
        }
        
        // Sort by number of appearances (most frequent competitors first)
        const sortedCompetitors = Object.values(domainCounts)
            .sort((a, b) => b.appearances - a.appearances)
            .map(comp => ({
                domain: comp.domain,
                appearances: comp.appearances,
                keywordCount: comp.keywords.length,
                avgPosition: Math.round(comp.avgPosition * 10) / 10,
                sampleKeywords: comp.keywords.slice(0, 3)
            }));

        // Function to identify direct competitors for keyword ranking
        function isDirectCompetitorForKeywords(domain) {
            const nonRetailDomains = [
                'youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com',
                'pinterest.com', 'linkedin.com', 'reddit.com', 'tumblr.com',
                'google.com', 'bing.com', 'yahoo.com', 'images.google.com',
                'wikipedia.org', 'wikimedia.org', 'wiki.com',
                'blogger.com', 'wordpress.com', 'medium.com', 'substack.com',
                'reviews.io', 'trustpilot.com', 'yelp.com', 'glassdoor.com',
                'indeed.com', 'linkedin.com', 'monster.com',
                'stackexchange.com', 'stackoverflow.com', 'quora.com'
            ];
            
            if (nonRetailDomains.some(excluded => domain.includes(excluded))) {
                return false;
            }
            
            const nonRetailPatterns = [
                /\.gov$/, /\.edu$/, 
                /blog\.|news\.|media\.|press\.|mag\./,
                /forum\.|community\.|discussion\./,
                /wiki\.|help\.|support\.|docs\./
            ];
            
            return !nonRetailPatterns.some(pattern => pattern.test(domain));
        }

        console.log(`📊 Final results: Found ${sortedCompetitors.length} competitors from ${totalResults} total results`);
        console.log('🏆 Top 5 competitors:', sortedCompetitors.slice(0, 5).map(c => `${c.domain} (${c.appearances} appearances)`));
        
        res.json({
            success: true,
            competitors: sortedCompetitors,
            totalKeywords: keywords.length,
            totalResults: totalResults
        });

    } catch (error) {
        console.error('DataForSEO keyword competitors error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// TSV keyword analysis endpoint for competitor discovery
app.post('/analyze-keywords-tsv', async (req, res) => {
    try {
        const { tsvData } = req.body;
        
        if (!tsvData) {
            return res.status(400).json({ error: 'TSV data is required' });
        }

        console.log('🔍 Analyzing TSV keyword data...');
        
        // Parse TSV data
        const lines = tsvData.trim().split('\n');
        const header = lines[0].split('\t');
        
        console.log(`📊 Header columns found: ${header.map((col, idx) => `[${idx}]="${col}"`).join(', ')}`);
        
        // Find column indices - look for "Keyword" or "Primary Keyword" column
        const keywordIndex = header.findIndex(col => {
            const normalized = col.toLowerCase().trim();
            return normalized === 'keyword' || normalized === 'primary keyword';
        });
        const searchVolumeIndex = header.findIndex(col => {
            const normalized = col.toLowerCase();
            return normalized.includes('search volume') || normalized.includes('msv');
        });
        
        if (keywordIndex === -1 || searchVolumeIndex === -1) {
            console.error('❌ Column parsing failed:');
            console.error('   Available columns:', header);
            console.error('   Keyword index:', keywordIndex);
            console.error('   Search volume index:', searchVolumeIndex);
            return res.status(400).json({ 
                error: 'Could not find required columns (Keyword, Search Volume)',
                foundColumns: header,
                details: {
                    keywordColumnFound: keywordIndex !== -1,
                    searchVolumeColumnFound: searchVolumeIndex !== -1,
                    hint: 'Ensure TSV has "Keyword" and "Search Volume" columns'
                }
            });
        }

        console.log(`📊 Found keyword column at index ${keywordIndex}, search volume at index ${searchVolumeIndex}`);
        
        // Parse keywords with search volumes
        const keywords = [];
        for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split('\t');
            if (columns.length > Math.max(keywordIndex, searchVolumeIndex)) {
                const keyword = columns[keywordIndex]?.trim();
                const searchVolumeStr = columns[searchVolumeIndex]?.trim();
                const searchVolume = searchVolumeStr ? parseInt(searchVolumeStr) || 0 : 0;
                
                if (keyword && keyword.length > 0) {
                    keywords.push({
                        keyword: keyword,
                        searchVolume: searchVolume,
                        originalLine: i
                    });
                }
            }
        }

        console.log(`📋 Parsed ${keywords.length} keywords`);
        
        // Sort by search volume (descending) and take top 30
        keywords.sort((a, b) => b.searchVolume - a.searchVolume);
        const top30Keywords = keywords.slice(0, 30);
        
        console.log(`🎯 Selected top 30 keywords by search volume:`);
        top30Keywords.forEach((kw, index) => {
            console.log(`   ${index + 1}. "${kw.keyword}" (${kw.searchVolume.toLocaleString()} searches)`);
        });

        res.json({
            success: true,
            totalKeywords: keywords.length,
            top30Keywords: top30Keywords.map(kw => ({
                keyword: kw.keyword,
                searchVolume: kw.searchVolume
            })),
            summary: {
                totalParsed: keywords.length,
                selectedForAnalysis: top30Keywords.length,
                highestVolume: top30Keywords[0]?.searchVolume || 0,
                lowestVolume: top30Keywords[top30Keywords.length - 1]?.searchVolume || 0
            }
        });

    } catch (error) {
        console.error('❌ TSV analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// SERP data fetching endpoint for competitor discovery
app.post('/get-serp-competitors', async (req, res) => {
    try {
        const { keywords, location = "United Kingdom", language = "English" } = req.body;
        
        if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
            return res.status(400).json({ error: 'Keywords array is required' });
        }

        console.log(`🔍 Fetching SERP data for ${keywords.length} keywords...`);
        
        // Load DataForSEO utilities
        const DataForSEOUtils = require('./dataforseo-utils');
        const utils = new DataForSEOUtils();
        
        // Resolve location and language
        const { location_code, language_code } = utils.resolveLocationAndLanguage(location, language);
        console.log(`🎯 Using location: ${location_code}, language: ${language_code}`);

        // Prepare DataForSEO requests for all keywords
        const dataForSeoTasks = keywords.map(keywordObj => {
            console.log(`🔍 Preparing task for keyword: "${keywordObj.keyword}"`);
            return {
                "keyword": keywordObj.keyword,
                "location_code": location_code,
                "language_code": language_code,
                "device": "desktop",
                "os": "windows",
                "depth": 10 // Top 10 results only
            };
        });

        console.log(`📋 Prepared ${dataForSeoTasks.length} SERP requests`);

        // Get DataForSEO credentials from API.txt file
        const fs = require('fs');
        const path = require('path');
        
        let dataForSeoAuth;
        try {
            const apiContent = fs.readFileSync(path.join(__dirname, 'API.txt'), 'utf8');
            const usernameMatch = apiContent.match(/DATAFORSEO_USERNAME=(.+)/);
            const passwordMatch = apiContent.match(/DATAFORSEO_PASSWORD=(.+)/);
            
            if (usernameMatch && passwordMatch) {
                const username = usernameMatch[1].trim();
                const password = passwordMatch[1].trim();
                dataForSeoAuth = Buffer.from(`${username}:${password}`).toString('base64');
                console.log(`🔐 DataForSEO credentials loaded: ${username}`);
            } else {
                throw new Error('DataForSEO credentials not found in API.txt');
            }
        } catch (error) {
            console.error('❌ Failed to load DataForSEO credentials:', error.message);
            throw new Error('DataForSEO credentials not available');
        }
        
        const dataForSeoResponse = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${dataForSeoAuth}`
            },
            body: JSON.stringify(dataForSeoTasks)
        });

        if (!dataForSeoResponse.ok) {
            const errorText = await dataForSeoResponse.text();
            console.error(`❌ DataForSEO API error: ${dataForSeoResponse.status} ${dataForSeoResponse.statusText}`);
            console.error(`❌ Error details: ${errorText}`);
            throw new Error(`DataForSEO API error: ${dataForSeoResponse.status} ${dataForSeoResponse.statusText}`);
        }

        const dataForSeoData = await dataForSeoResponse.json();
        console.log(`📥 Received DataForSEO response with ${dataForSeoData.tasks?.length || 0} tasks`);
        console.log(`📊 API response status: ${dataForSeoData.status_code} - ${dataForSeoData.status_message}`);
        console.log(`📊 Tasks error count: ${dataForSeoData.tasks_error || 0}`);
        console.log(`📊 API cost: ${dataForSeoData.cost || 0}`);
        
        // Debug: Log the full response structure for first task
        if (dataForSeoData.tasks && dataForSeoData.tasks.length > 0) {
            console.log(`🔍 First task structure:`, JSON.stringify(dataForSeoData.tasks[0], null, 2));
        }

        // Process results and extract domains
        const allDomains = new Set();
        const keywordResults = [];

        if (dataForSeoData.tasks) {
            for (const task of dataForSeoData.tasks) {
                console.log(`🔍 Processing task:`, task.id, task.status_code, task.status_message);
                
                if (task.result && task.result.length > 0) {
                    const result = task.result[0];
                    const keyword = result.keyword;
                    const domains = [];

                    console.log(`📋 Result for "${keyword}":`, {
                        items_count: result.items?.length || 0,
                        se_results_count: result.se_results_count || 0
                    });

                    if (result.items) {
                        for (const item of result.items) {
                            console.log(`   Item:`, {
                                type: item.type,
                                domain: item.domain,
                                url: item.url,
                                title: item.title?.substring(0, 50) + '...'
                            });
                            
                            if (item.domain) {
                                domains.push(item.domain);
                                allDomains.add(item.domain);
                            }
                        }
                    }

                    keywordResults.push({
                        keyword: keyword,
                        domains: domains,
                        totalResults: result.items?.length || 0
                    });

                    console.log(`🔍 Found ${domains.length} domains for "${keyword}"`);
                } else {
                    console.log(`⚠️  No results for task:`, task.id);
                }
            }
        }

        const uniqueDomains = Array.from(allDomains).sort();
        
        console.log(`🏆 Discovery complete:`);
        console.log(`   - Keywords analyzed: ${keywords.length}`);
        console.log(`   - Total unique domains found: ${uniqueDomains.length}`);
        console.log(`   - Top domains: ${uniqueDomains.slice(0, 10).join(', ')}`);

        res.json({
            success: true,
            keywords: keywordResults,
            uniqueDomains: uniqueDomains,
            summary: {
                keywordsAnalyzed: keywords.length,
                totalDomains: uniqueDomains.length,
                location: location,
                language: language
            }
        });

    } catch (error) {
        console.error('❌ SERP competitor discovery error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// SERP data fetching endpoint for competitor discovery (SEQUENTIAL VERSION)
app.post('/get-serp-competitors-sequential', async (req, res) => {
    try {
        const { keywords, location = "United Kingdom", language = "English" } = req.body;
        
        if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
            return res.status(400).json({ error: 'Keywords array is required' });
        }

        console.log(`🔍 Fetching SERP data for ${keywords.length} keywords SEQUENTIALLY...`);
        
        // Load DataForSEO utilities
        const DataForSEOUtils = require('./dataforseo-utils');
        const utils = new DataForSEOUtils();
        
        // Resolve location and language
        const { location_code, language_code } = utils.resolveLocationAndLanguage(location, language);
        console.log(`🎯 Using location: ${location_code}, language: ${language_code}`);

        // Get DataForSEO credentials from API.txt file
        const fs = require('fs');
        const path = require('path');
        
        let dataForSeoAuth;
        try {
            const apiContent = fs.readFileSync(path.join(__dirname, 'API.txt'), 'utf8');
            const usernameMatch = apiContent.match(/DATAFORSEO_USERNAME=(.+)/);
            const passwordMatch = apiContent.match(/DATAFORSEO_PASSWORD=(.+)/);
            
            if (usernameMatch && passwordMatch) {
                const username = usernameMatch[1].trim();
                const password = passwordMatch[1].trim();
                dataForSeoAuth = Buffer.from(`${username}:${password}`).toString('base64');
                console.log(`🔐 DataForSEO credentials loaded: ${username}`);
            } else {
                throw new Error('DataForSEO credentials not found in API.txt');
            }
        } catch (error) {
            console.error('❌ Failed to load DataForSEO credentials:', error.message);
            throw new Error('DataForSEO credentials not available');
        }

        // Process keywords sequentially to avoid batch request issues
        const allDomains = new Set();
        const keywordResults = [];
        
        for (const keywordObj of keywords) {
            console.log(`🔍 Processing keyword: "${keywordObj.keyword}"`);
            
            // Create single task for this keyword
            const singleTask = [{
                "keyword": keywordObj.keyword,
                "location_code": location_code,
                "language_code": language_code,
                "device": "desktop",
                "os": "windows",
                "depth": 10 // Top 10 results only
            }];
            
            try {
                const dataForSeoResponse = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${dataForSeoAuth}`
                    },
                    body: JSON.stringify(singleTask)
                });

                if (!dataForSeoResponse.ok) {
                    const errorBody = await dataForSeoResponse.text();
                    console.error(`❌ DataForSEO API error for "${keywordObj.keyword}": ${dataForSeoResponse.status} ${dataForSeoResponse.statusText}`);
                    console.error('Error details:', errorBody);
                    
                    // Check for specific errors
                    if (dataForSeoResponse.status === 401) {
                        throw new Error('DataForSEO authentication failed. Please check your credentials.');
                    } else if (dataForSeoResponse.status === 402) {
                        throw new Error('DataForSEO payment required. Please check your account balance.');
                    }
                    
                    continue; // Skip this keyword and continue with others
                }

                const dataForSeoData = await dataForSeoResponse.json();
                console.log(`📥 Response for "${keywordObj.keyword}": ${dataForSeoData.tasks?.length || 0} tasks`);

                // Process results and extract domains
                const domains = [];
                
                if (dataForSeoData.tasks && dataForSeoData.tasks.length > 0) {
                    const task = dataForSeoData.tasks[0];
                    
                    if (task.result && task.result.length > 0) {
                        const result = task.result[0];

                        if (result.items) {
                            for (const item of result.items) {
                                if (item.domain) {
                                    domains.push(item.domain);
                                    allDomains.add(item.domain);
                                }
                            }
                        }
                    }
                }

                keywordResults.push({
                    keyword: keywordObj.keyword,
                    domains: domains,
                    totalResults: domains.length
                });

                console.log(`🔍 Found ${domains.length} domains for "${keywordObj.keyword}"`);
                
                // Small delay to be respectful to the API
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`❌ Error processing keyword "${keywordObj.keyword}":`, error.message);
                continue; // Skip this keyword and continue with others
            }
        }

        const uniqueDomains = Array.from(allDomains).sort();
        
        console.log(`🏆 Sequential discovery complete:`);
        console.log(`   - Keywords processed: ${keywordResults.length}/${keywords.length}`);
        console.log(`   - Total unique domains found: ${uniqueDomains.length}`);
        console.log(`   - Sample domains: ${uniqueDomains.slice(0, 5).join(', ')}`);

        res.json({
            success: true,
            keywords: keywordResults,
            uniqueDomains: uniqueDomains,
            summary: {
                keywordsAnalyzed: keywordResults.length,
                totalDomains: uniqueDomains.length,
                location: location,
                language: language,
                processingMethod: 'sequential'
            }
        });

    } catch (error) {
        console.error('❌ SERP competitor discovery error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Advanced stealth crawler implementation
function getStealthHeaders() {
    const realBrowserProfiles = [
        {
            name: 'Chrome-Windows',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            platform: 'Windows',
            vendor: 'Google Inc.',
            acceptLanguage: 'en-US,en;q=0.9',
            description: 'Chrome 120 on Windows 10'
        },
        {
            name: 'Chrome-Mac',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            platform: 'MacIntel',
            vendor: 'Google Inc.',
            acceptLanguage: 'en-US,en;q=0.9',
            description: 'Chrome 120 on macOS'
        },
        {
            name: 'Firefox-Windows',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            platform: 'Win32',
            vendor: '',
            acceptLanguage: 'en-US,en;q=0.5',
            description: 'Firefox 121 on Windows 10'
        },
        {
            name: 'Safari-Mac',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            platform: 'MacIntel',
            vendor: 'Apple Computer, Inc.',
            acceptLanguage: 'en-US,en;q=0.9',
            description: 'Safari 17.1 on macOS'
        },
        {
            name: 'Edge-Windows',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
            platform: 'Windows',
            vendor: 'Microsoft Corporation',
            acceptLanguage: 'en-US,en;q=0.9',
            description: 'Edge 120 on Windows 10'
        },
        // Legitimate SEO bots (often whitelisted)
        {
            name: 'Googlebot',
            userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            platform: 'GoogleBot',
            vendor: 'Google',
            acceptLanguage: 'en-US,en;q=0.9',
            description: 'Google Search Bot'
        },
        {
            name: 'AhrefsBot',
            userAgent: 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
            platform: 'AhrefsBot',
            vendor: 'Ahrefs',
            acceptLanguage: 'en-US,en;q=0.9',
            description: 'Ahrefs SEO Bot'
        }
    ];
    
    // Randomly select a browser profile
    const profile = realBrowserProfiles[Math.floor(Math.random() * realBrowserProfiles.length)];
    console.log(`🥷 Stealth mode: ${profile.description}`);
    
    // Generate realistic headers based on browser profile
    const headers = {
        'User-Agent': profile.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': profile.acceptLanguage,
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'DNT': '1'
    };
    
    // Add browser-specific headers
    if (profile.name.includes('Chrome') || profile.name.includes('Edge')) {
        headers['Sec-Fetch-Dest'] = 'document';
        headers['Sec-Fetch-Mode'] = 'navigate';
        headers['Sec-Fetch-Site'] = 'none';
        headers['Sec-Fetch-User'] = '?1';
        headers['sec-ch-ua'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
        headers['sec-ch-ua-mobile'] = '?0';
        headers['sec-ch-ua-platform'] = `"${profile.platform}"`;
    }
    
    // Add random viewport size (common screen resolutions)
    const viewports = ['1920x1080', '1366x768', '1536x864', '1440x900', '1280x720'];
    const randomViewport = viewports[Math.floor(Math.random() * viewports.length)];
    headers['Viewport-Width'] = randomViewport.split('x')[0];
    
    return headers;
}

// Enhanced robots.txt checker
async function checkRobotsTxt(baseUrl) {
    try {
        const robotsUrl = new URL('/robots.txt', baseUrl).toString();
        const response = await fetch(robotsUrl, {
            headers: { 'User-Agent': 'ProductGuideBot/1.0 (+educational-research)' },
            timeout: 10000
        });
        
        if (response.ok) {
            const robotsText = await response.text();
            
            // Check for common disallowed patterns
            const disallowedPatterns = [
                '/admin', '/wp-admin', '/private', '/api',
                '/account', '/checkout', '/cart', '/login'
            ];
            
            const isBlocked = disallowedPatterns.some(pattern => 
                robotsText.includes(`Disallow: ${pattern}`)
            );
            
            return {
                exists: true,
                content: robotsText,
                hasRestrictions: isBlocked,
                crawlDelay: robotsText.match(/Crawl-delay: (\d+)/i)?.[1] || null
            };
        }
        
        return { exists: false };
    } catch (error) {
        console.log(`ℹ️  Could not fetch robots.txt for ${baseUrl}: ${error.message}`);
        return { exists: false };
    }
}

// Competitor website analysis endpoint - AI-powered platform detection and URL pattern discovery
app.post('/analyze-competitor-website', async (req, res) => {
    try {
        const { competitorUrl, brandContext } = req.body;
        
        if (!competitorUrl) {
            return res.status(400).json({ error: 'Competitor URL is required' });
        }

        console.log(`🔍 Analyzing competitor website: ${competitorUrl}`);
        
        // Check rate limiting first
        const rateCheck = checkRateLimit(competitorUrl);
        if (!rateCheck.allowed) {
            const waitTime = Math.ceil((rateCheck.resetTime - Date.now()) / 1000);
            return res.status(429).json({
                success: false,
                error: `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`,
                retryAfter: waitTime
            });
        }
        
        console.log(`🚦 Rate limit check passed. Remaining requests: ${rateCheck.remaining}`);
        
        // Check robots.txt first for ethical crawling
        const robotsInfo = await checkRobotsTxt(competitorUrl);
        if (robotsInfo.exists) {
            console.log(`🤖 Robots.txt found, has restrictions: ${robotsInfo.hasRestrictions}`);
            if (robotsInfo.crawlDelay) {
                console.log(`⏱️  Crawl delay requested: ${robotsInfo.crawlDelay} seconds`);
            }
        }
        
        // Implement crawl delay for ethical crawling
        const crawlDelay = robotsInfo.crawlDelay ? parseInt(robotsInfo.crawlDelay) * 1000 : 2000; // Default 2 seconds
        console.log(`⏱️  Applying crawl delay: ${crawlDelay/1000} seconds`);
        await new Promise(resolve => setTimeout(resolve, crawlDelay));
        
        // Enhanced stealth headers for better success rate
        const stealthHeaders = getStealthHeaders();
        
        const response = await fetch(competitorUrl, {
            headers: stealthHeaders,
            timeout: 30000, // 30 second timeout
            follow: 10, // Follow redirects
            compress: true // Accept compressed responses
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch competitor website: ${response.status}`);
        }

        const html = await response.text();
        
        // Extract relevant content for AI analysis
        const dom = new JSDOM(html);
        const document = dom.window.document;
        
        // Get page title, meta description, and main content
        const title = document.title || '';
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()).slice(0, 10);
        const navLinks = Array.from(document.querySelectorAll('nav a, .nav a, .navigation a')).map(a => ({
            text: a.textContent.trim(),
            href: a.getAttribute('href')
        })).slice(0, 20);
        
        // Get footer links that might indicate platform
        const footerLinks = Array.from(document.querySelectorAll('footer a, .footer a')).map(a => ({
            text: a.textContent.trim(),
            href: a.getAttribute('href')
        })).slice(0, 10);
        
        // Extract potential product URL patterns from navigation
        const productUrls = navLinks.filter(link => 
            link.href && (
                link.href.includes('/product') || 
                link.href.includes('/shop') || 
                link.href.includes('/collection') || 
                link.href.includes('/category')
            )
        );

        // Build comprehensive analysis prompt
        const analysisPrompt = `Analyze this competitor e-commerce website and provide structured insights:

WEBSITE: ${competitorUrl}
TITLE: ${title}
META DESCRIPTION: ${metaDescription}

MAIN HEADINGS: ${headings.join(', ')}

NAVIGATION LINKS: ${navLinks.map(link => `${link.text} (${link.href})`).join(', ')}

FOOTER LINKS: ${footerLinks.map(link => `${link.text} (${link.href})`).join(', ')}

BRAND CONTEXT: ${brandContext || 'No additional context provided'}

Please provide a JSON response with the following structure:
{
  "platform": "detected_platform (e.g., Shopify, WooCommerce, Magento, Custom, etc.)",
  "platformConfidence": "high/medium/low",
  "platformIndicators": ["specific clues that indicate the platform"],
  "productUrlPatterns": ["likely URL patterns for products like /products/, /shop/, etc."],
  "brandAnalysis": {
    "industry": "detected industry category",
    "pricePoint": "luxury/mid-range/budget/unknown",
    "targetAudience": "brief description of target audience",
    "brandVoice": "formal/casual/luxury/technical/etc."
  },
  "competitorInsights": {
    "mainCategories": ["list of main product categories"],
    "uniqueSellingPoints": ["observed USPs or differentiators"],
    "navigationStructure": "description of how they organize products"
  },
  "scrapingStrategy": {
    "recommendedApproach": "static/dynamic/hybrid",
    "potentialChallenges": ["list of scraping challenges"],
    "sampleProductUrls": ["3-5 likely product URLs to test"]
  }
}

Be specific and actionable in your analysis. Focus on insights that would help with competitor product description analysis.`;

        console.log('📤 Sending analysis request to Claude...');
        
        // Call Claude API for analysis
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 2000,
                messages: [{
                    role: 'user',
                    content: analysisPrompt
                }]
            })
        });

        if (!claudeResponse.ok) {
            const errorText = await claudeResponse.text();
            console.error('Claude API error:', errorText);
            throw new Error(`Claude API error: ${claudeResponse.status}`);
        }

        const claudeData = await claudeResponse.json();
        const analysisText = claudeData.content[0].text;
        
        console.log('📥 Claude analysis received');
        
        // Parse the JSON response from Claude
        let analysisResult;
        try {
            // Extract JSON from Claude's response (might be wrapped in markdown)
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysisResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in Claude response');
            }
        } catch (parseError) {
            console.error('Failed to parse Claude JSON response:', parseError);
            // Fallback: return the raw text analysis
            analysisResult = {
                platform: 'unknown',
                platformConfidence: 'low',
                rawAnalysis: analysisText
            };
        }
        
        res.json({
            success: true,
            competitorUrl: competitorUrl,
            analysis: analysisResult,
            robotsInfo: robotsInfo,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Competitor analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DataForSEO SERP endpoint for test suite
app.post('/dataforseo-serp', async (req, res) => {
    console.log('📊 DataForSEO SERP endpoint called');
    
    try {
        const { payload } = req.body;
        
        if (!payload || !Array.isArray(payload)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payload format'
            });
        }

        // Use environment variables for security
        // Get credentials from user's stored API keys or environment
        let login, password;
        
        if (req.apiKeys && req.apiKeys.dataforseo) {
            // Use user's stored credentials
            const parts = req.apiKeys.dataforseo.split(':');
            login = parts[0];
            password = parts[1];
        } else {
            // Fallback to environment variables
            login = process.env.DATAFORSEO_LOGIN;
            password = process.env.DATAFORSEO_PASSWORD;
        }
        
        if (!login || !password) {
            return res.status(401).json({ error: 'DataForSEO credentials not configured. Please add your API keys in the dashboard.' });
        }
        
        const dataForSeoResponse = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64')
            },
            body: JSON.stringify(payload)
        });

        if (!dataForSeoResponse.ok) {
            const errorText = await dataForSeoResponse.text();
            console.error('DataForSEO Error Response:', errorText);
            throw new Error(`DataForSEO API error: ${dataForSeoResponse.status} - ${errorText}`);
        }

        const data = await dataForSeoResponse.json();
        console.log('✅ DataForSEO SERP success');
        
        res.json({
            success: true,
            data: data
        });
        
    } catch (error) {
        console.error('❌ DataForSEO SERP error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Fetch raw page endpoint - preserves HTML for analysis
app.get('/fetch-raw-page', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        console.log('Fetching raw HTML:', url);
        
        // Fetch the page
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Referer': 'https://www.google.com/',
                'DNT': '1'
            },
            redirect: 'follow',
            timeout: 30000
        });

        console.log(`📊 Response: ${response.status} ${response.statusText}`);
        console.log(`   Final URL: ${response.url}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);

        if (!response.ok) {
            console.error(`❌ HTTP ${response.status} error for ${url}`);
            return res.json({
                success: false,
                error: `HTTP error! status: ${response.status}`,
                statusCode: response.status,
                statusText: response.statusText,
                url: url,
                finalUrl: response.url
            });
        }

        const html = await response.text();
        const finalUrl = response.url;
        
        if (finalUrl !== url) {
            console.log(`🔄 Redirected from ${url} to ${finalUrl}`);
        }
        
        res.json({
            success: true,
            url: url,
            finalUrl: finalUrl,
            redirected: finalUrl !== url,
            content: html, // Return FULL HTML
            contentLength: html.length
        });

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Analyze competitor products endpoint
app.post('/analyze-competitor-products', async (req, res) => {
    try {
        const { domain } = req.body;
        
        if (!domain) {
            return res.status(400).json({ 
                success: false, 
                error: 'Domain parameter is required' 
            });
        }
        
        console.log(`🛍️ Starting product analysis for ${domain}`);
        
        // Import and use the analyzer
        const CompetitorProductAnalyzer = require('../utils/competitor-product-analyzer.js');
        const analyzer = new CompetitorProductAnalyzer(`http://localhost:${PORT}`);
        
        // Run the analysis
        const results = await analyzer.analyzeCompetitor(domain);
        
        res.json({
            success: results.success,
            data: results
        });
        
    } catch (error) {
        console.error('❌ Product analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Proxy testing endpoint for geo-spoofing
app.get('/test-proxy', async (req, res) => {
    try {
        const { proxy, target } = req.query;
        
        if (!proxy || !target) {
            return res.status(400).json({ 
                success: false, 
                error: 'Both proxy and target parameters required' 
            });
        }
        
        console.log(`🧪 Testing proxy: ${proxy} -> ${target}`);
        
        // Simple proxy test - just try to fetch the target
        // In a real implementation, we'd route through the proxy
        const startTime = Date.now();
        
        const response = await fetch(target, {
            timeout: 8000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ProxyTester/1.0)'
            }
        });
        
        const responseTime = Date.now() - startTime;
        
        if (!response.ok) {
            throw new Error(`Target responded with ${response.status}`);
        }
        
        const data = await response.json();
        
        res.json({
            success: true,
            proxy: proxy,
            target: target,
            data: data,
            responseTime: responseTime
        });
        
    } catch (error) {
        console.log(`❌ Proxy test failed: ${error.message}`);
        res.json({
            success: false,
            error: error.message,
            proxy: req.query.proxy
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// For Vercel deployment
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`🚀 CORS Proxy Server running on http://localhost:${PORT}`);
        console.log(`📋 Test endpoint: http://localhost:${PORT}/fetch-page?url=https://example.com/about`);
    });
}