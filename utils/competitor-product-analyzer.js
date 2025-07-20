// Competitor Product Analyzer
// Uses AI to find and analyze competitor product descriptions

const ScrapingPatternsKB = require('./scraping-patterns-kb.js');
const PlatformDetector = require('./platform-detector.js');

class CompetitorProductAnalyzer {
    constructor(proxyUrl = 'http://localhost:3001') {
        this.proxyUrl = proxyUrl;
        this.rateLimiter = new Map();
        this.RATE_LIMIT_WINDOW = 60000; // 1 minute
        this.MAX_REQUESTS_PER_DOMAIN = 10; // Max 10 requests per minute per domain
        this.MIN_DELAY = 3000; // Minimum 3 seconds between requests
        this.MAX_DELAY = 5000; // Maximum 5 seconds between requests
        this.knowledgeBase = new ScrapingPatternsKB();
        this.platformDetector = new PlatformDetector();
    }

    // Safely parse JSON from Claude's response
    parseClaudeJSON(text) {
        try {
            // First try direct parsing
            return JSON.parse(text);
        } catch (e) {
            // If that fails, try to extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (e2) {
                    console.error('Failed to parse JSON:', e2);
                    console.log('Raw text:', text.substring(0, 200));
                    return null;
                }
            }
            return null;
        }
    }
    
    // Check rate limits
    checkRateLimit(domain) {
        const now = Date.now();
        const domainKey = new URL(domain.includes('://') ? domain : `https://${domain}`).hostname;
        
        if (!this.rateLimiter.has(domainKey)) {
            this.rateLimiter.set(domainKey, { count: 0, resetTime: now + this.RATE_LIMIT_WINDOW });
        }
        
        const limits = this.rateLimiter.get(domainKey);
        
        if (now > limits.resetTime) {
            // Reset window
            limits.count = 0;
            limits.resetTime = now + this.RATE_LIMIT_WINDOW;
        }
        
        if (limits.count >= this.MAX_REQUESTS_PER_DOMAIN) {
            const waitTime = limits.resetTime - now;
            console.log(`⏳ Rate limit reached for ${domainKey}. Wait ${Math.ceil(waitTime/1000)}s`);
            return { allowed: false, waitTime };
        }
        
        limits.count++;
        return { allowed: true, remaining: this.MAX_REQUESTS_PER_DOMAIN - limits.count };
    }
    
    // Respectful delay between requests
    async respectfulDelay() {
        const delay = Math.random() * (this.MAX_DELAY - this.MIN_DELAY) + this.MIN_DELAY;
        console.log(`⏱️ Waiting ${(delay/1000).toFixed(1)}s before next request...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Check robots.txt compliance
    async checkRobotsTxt(domain) {
        const robotsUrl = `${domain.includes('://') ? domain.split('/')[0] + '//' + domain.split('/')[2] : 'https://' + domain}/robots.txt`;
        console.log(`🤖 Checking robots.txt at ${robotsUrl}`);
        
        try {
            const response = await fetch(`${this.proxyUrl}/fetch-page?url=${encodeURIComponent(robotsUrl)}`);
            const data = await response.json();
            
            if (data.success && data.content) {
                // Basic robots.txt parsing - look for Disallow rules
                const lines = data.content.split('\n');
                const disallowed = [];
                let currentUserAgent = '*';
                
                for (const line of lines) {
                    if (line.toLowerCase().includes('user-agent:')) {
                        currentUserAgent = line.split(':')[1].trim();
                    }
                    if (line.toLowerCase().includes('disallow:') && (currentUserAgent === '*' || currentUserAgent.toLowerCase().includes('bot'))) {
                        const path = line.split(':')[1].trim();
                        if (path) disallowed.push(path);
                    }
                }
                
                return { allowed: true, disallowed };
            }
        } catch (error) {
            console.log('Could not fetch robots.txt, proceeding with caution');
        }
        
        return { allowed: true, disallowed: [] };
    }

    // Main analysis function
    async analyzeCompetitor(domain) {
        console.log(`🔍 Starting product analysis for ${domain}`);
        this.currentPlatform = null; // Store platform info for response
        
        try {
            // Check robots.txt first
            const robotsCheck = await this.checkRobotsTxt(domain);
            console.log(`🤖 Robots.txt check:`, robotsCheck);
            
            // Step 1: Find PLP (this will set this.currentPlatform)
            const plpUrl = await this.findPLP(domain);
            if (!plpUrl) {
                throw new Error('Could not find Product Listing Page');
            }
            
            // Step 2: Extract product URLs
            const productUrls = await this.extractProductUrls(plpUrl);
            if (!productUrls || productUrls.length === 0) {
                throw new Error('No products found on PLP');
            }
            
            // Step 3: Scrape descriptions
            const descriptions = await this.scrapeDescriptions(productUrls.slice(0, 3));
            
            // Check if we actually got any products
            if (!descriptions || descriptions.length === 0) {
                throw new Error('Failed to extract product descriptions');
            }
            
            // Step 4: Analyze descriptions
            const analysis = await this.analyzeDescriptions(descriptions, domain);
            
            // Get platform info for response
            const platformInfo = this.currentPlatform ? {
                platform: this.platformDetector.platforms[this.currentPlatform]?.name || this.currentPlatform,
                platformKey: this.currentPlatform,
                confidence: 'high'
            } : null;
            
            // NOW record success - we have successfully found PLP and extracted products!
            const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
            
            // Record the platform in knowledge base
            if (this.currentPlatform) {
                const domainPattern = this.knowledgeBase.getDomainPattern(cleanDomain);
                domainPattern.platform = this.currentPlatform;
                await this.knowledgeBase.savePatterns();
            }
            
            await this.knowledgeBase.recordSuccess(cleanDomain, 'plp', {
                url: plpUrl,
                platform: this.currentPlatform,
                productCount: descriptions.length,
                timestamp: new Date().toISOString()
            });
            console.log(`📚 Recorded successful analysis for ${cleanDomain} (Platform: ${this.currentPlatform || 'unknown'})`);
            
            return {
                success: true,
                domain,
                platform: platformInfo?.platform,
                platformDetails: platformInfo,
                plpUrl,
                products: descriptions,
                analysis
            };
            
        } catch (error) {
            console.error(`❌ Analysis failed for ${domain}:`, error);
            
            // Clean up any bad entries that might have been recorded
            const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
            try {
                // Clean up the domain's patterns
                await this.knowledgeBase.cleanupDomain(domain);
                
                // Record the failure for learning
                await this.knowledgeBase.recordFailure(cleanDomain, 'analysis', {
                    error: error.message,
                    timestamp: new Date().toISOString(),
                    stage: 'complete_analysis'
                });
                
                console.log(`🧹 Cleaned up and recorded failure for ${cleanDomain}`);
            } catch (cleanupError) {
                console.error('Failed to clean up knowledge base:', cleanupError);
            }
            
            return {
                success: false,
                domain,
                error: error.message
            };
        }
    }

    // Find Product Listing Page - Pattern-first approach
    async findPLP(domain) {
        console.log(`🔎 Finding PLP for ${domain}`);
        
        // Clean domain
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const baseUrl = `https://${cleanDomain}`;
        
        // Check if we already know the platform from knowledge base
        const domainPattern = this.knowledgeBase.getDomainPattern(cleanDomain);
        let detectedPlatform = domainPattern.platform;
        
        if (detectedPlatform) {
            console.log(`📦 Using known platform from KB: ${detectedPlatform}`);
            this.currentPlatform = detectedPlatform;
        } else {
            // Try to detect platform from homepage
            try {
                const homepageResponse = await fetch(`${this.proxyUrl}/fetch-page?url=${encodeURIComponent(baseUrl)}`);
                const homepageData = await homepageResponse.json();
                if (homepageData.success) {
                    const platformResult = this.platformDetector.detectPlatform(baseUrl, homepageData.content);
                    detectedPlatform = platformResult.detected;
                    this.currentPlatform = detectedPlatform; // Store for later use
                    console.log(`🏪 Detected platform: ${platformResult.platform} (${platformResult.confidence} confidence)`);
                    // Debug: show what signatures were found
                    if (platformResult.matches && platformResult.matches.length > 0) {
                        console.log(`   Found signatures: ${platformResult.matches.join(', ')}`);
                    }
                }
            } catch (error) {
                console.log('Could not detect platform:', error.message);
            }
        }
        
        // Try known patterns first
        const knownPatterns = await this.knowledgeBase.tryKnownPatterns(domain, 'plp');
        console.log(`📚 Using ${knownPatterns.source} patterns`);
        
        // Get paths based on detected platform or known patterns
        let pathsToTry = [];
        
        if (detectedPlatform && detectedPlatform !== 'custom') {
            // Use platform-specific paths
            pathsToTry = this.platformDetector.getPlpPaths(detectedPlatform);
            console.log(`🎯 Using ${detectedPlatform} platform paths:`, pathsToTry);
        } else if (knownPatterns.pattern?.paths) {
            // Use known patterns
            pathsToTry = knownPatterns.pattern.paths;
        } else {
            // Fallback to generic paths - prioritize Shopify patterns
            pathsToTry = [
                '/collections',
                '/collections/all',
                '/collections/all-products',
                '/collections/frontpage',
                '/collections/mens',
                '/collections/womens',
                '/collections/new-arrivals',
                '/collections/best-sellers',
                '/shop',
                '/products',
                '/catalog',
                '/all-products',
                '/shop-all',
                '/browse'
            ];
        }
        
        // Try paths from patterns
        for (const path of pathsToTry) {
            const url = `${baseUrl}${path}`;
            console.log(`Checking ${url}`);
            
            try {
                // Check rate limit
                const rateCheck = this.checkRateLimit(cleanDomain);
                if (!rateCheck.allowed) {
                    console.log(`⏳ Waiting ${Math.ceil(rateCheck.waitTime/1000)}s for rate limit...`);
                    await new Promise(resolve => setTimeout(resolve, rateCheck.waitTime));
                }
                
                // Fetch page
                const response = await fetch(`${this.proxyUrl}/fetch-page?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                
                // Add delay after request
                await this.respectfulDelay();
                
                if (!data.success) continue;
                
                // Use final URL if redirected
                const actualUrl = data.finalUrl || url;
                if (data.redirected) {
                    console.log(`🔄 Following redirect to: ${actualUrl}`);
                }
                
                // Ask Claude if this is a PLP
                const isPlp = await this.checkIfPLP(data.content, actualUrl);
                
                if (isPlp.isPLP && isPlp.confidence > 7) {
                    console.log(`✅ Found PLP at ${actualUrl} (confidence: ${isPlp.confidence}/10)`);
                    
                    // Detect URL type to confirm pattern
                    try {
                        const urlType = this.platformDetector.detectUrlType(actualUrl, detectedPlatform);
                        console.log(`📐 URL type: ${urlType.type}, Platform: ${urlType.platform || 'unknown'}`);
                    } catch (e) {
                        console.log(`📐 Could not detect URL pattern: ${e.message}`);
                    }
                    
                    // Don't record success yet - wait until we actually extract products!
                    // We'll record success in the main analyzeCompetitor function
                    return actualUrl; // Return the ACTUAL URL after redirects!
                } else if (url.includes('/collections') && !url.includes('/collections/')) {
                    // This might be a collections listing page - try to find a specific collection
                    console.log(`🔍 Collections listing page detected, looking for specific collections...`);
                    const collectionLinks = await this.findCollectionLinks(data.content, baseUrl);
                    if (collectionLinks.length > 0) {
                        console.log(`📂 Found ${collectionLinks.length} collections, checking first one: ${collectionLinks[0]}`);
                        // Try the first collection
                        const collectionUrl = collectionLinks[0];
                        const collectionResponse = await fetch(`${this.proxyUrl}/fetch-page?url=${encodeURIComponent(collectionUrl)}`);
                        const collectionData = await collectionResponse.json();
                        if (collectionData.success) {
                            const collectionPlp = await this.checkIfPLP(collectionData.content, collectionUrl);
                            if (collectionPlp.isPLP && collectionPlp.confidence > 7) {
                                console.log(`✅ Found PLP in collection at ${collectionUrl} (confidence: ${collectionPlp.confidence}/10)`);
                                return collectionUrl;
                            }
                        }
                    }
                }
            } catch (error) {
                console.log(`Failed to check ${url}:`, error.message);
            }
        }
        
        // If no paths work, record failure and try homepage analysis
        await this.knowledgeBase.recordFailure(cleanDomain, 'plp', {
            attemptedPaths: pathsToTry
        });
        return await this.findPLPFromHomepage(baseUrl);
    }

    // Check if a page is a PLP using Claude
    async checkIfPLP(pageContent, url) {
        const prompt = `Analyze this webpage content and determine if it's a Product Listing Page (PLP).

URL: ${url}
Content preview: ${pageContent.substring(0, 3000)}

A PLP typically:
- Shows multiple products in a grid or list
- Has product images, names, and prices
- Contains links to individual product pages
- May have filters, sorting options

Knowledge Base Hints:
${this.knowledgeBase.getAIHints(url).join('\\n')}

Return JSON only:
{
  "isPLP": true/false,
  "confidence": 1-10,
  "indicators": ["list of indicators found"],
  "productCount": estimated number of products
}`;

        try {
            const response = await fetch(`${this.proxyUrl}/claude-api`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 500
                })
            });

            const data = await response.json();
            if (data.success && data.data?.content?.[0]?.text) {
                try {
                    // Extract JSON from Claude's response
                    const text = data.data.content[0].text;
                    // Find JSON by looking for { and }
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    console.log('Raw response:', data.data.content[0].text.substring(0, 200));
                }
            }
        } catch (error) {
            console.error('Claude API error:', error);
        }

        return { isPLP: false, confidence: 0 };
    }

    // Find PLP from homepage
    async findPLPFromHomepage(baseUrl) {
        console.log(`🏠 Analyzing homepage for PLP links`);
        
        try {
            const response = await fetch(`${this.proxyUrl}/fetch-page?url=${encodeURIComponent(baseUrl)}`);
            const data = await response.json();
            
            if (!data.success) return null;
            
            const prompt = `Find the main "Shop" or "Products" link from this homepage content.

Homepage content: ${data.content.substring(0, 5000)}

Look for navigation links like:
- Shop, Shop All, View All Products
- Products, All Products, Browse
- Collections, Catalog

Return JSON only:
{
  "found": true/false,
  "plpPath": "/path/to/products",
  "linkText": "actual link text",
  "confidence": 1-10
}`;

            const response2 = await fetch(`${this.proxyUrl}/claude-api`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 300
                })
            });

            const result = await response2.json();
            if (result.success && result.data?.content?.[0]?.text) {
                const plpInfo = this.parseClaudeJSON(result.data.content[0].text);
                if (plpInfo && plpInfo.found && plpInfo.plpPath) {
                    return `${baseUrl}${plpInfo.plpPath}`;
                }
            }
        } catch (error) {
            console.error('Homepage analysis error:', error);
        }
        
        return null;
    }

    // Extract product URLs from PLP
    async extractProductUrls(plpUrl) {
        console.log(`📦 Extracting product URLs from ${plpUrl}`);
        
        try {
            // Use raw HTML endpoint for better extraction
            const response = await fetch(`${this.proxyUrl}/fetch-raw-page?url=${encodeURIComponent(plpUrl)}`);
            const data = await response.json();
            
            if (!data.success) return [];
            
            // Extract only the relevant part of HTML to avoid payload size issues
            const relevantHtml = this.extractRelevantHtml(data.content);
            console.log(`📐 Extracted ${relevantHtml.length} chars from ${data.content.length} chars (${((relevantHtml.length/data.content.length)*100).toFixed(1)}% of original)`);
            
            const prompt = `Extract product URLs from this simplified HTML.

PLP URL: ${plpUrl}

I've pre-filtered the HTML to show only links. Your job is to identify which are actual product links.

HTML Content:
${relevantHtml}

Instructions:
1. Look at the links in <div class="product-item"> sections
2. Identify patterns that indicate product pages:
   - URLs with /products/, /p/, /item/
   - URLs that end with product-like slugs (e.g., /espresso-machine-name)
   - For this site (${new URL(plpUrl).hostname}), look for patterns
3. The debug section shows a sample of all links found - use this to understand the site's URL structure
4. Return the FULL URLs (starting with https://)
5. If a link is relative (starts with /), prepend ${new URL(plpUrl).origin}

Return JSON only:
{
  "productUrls": ["full_url1", "full_url2", ...],
  "totalFound": number,
  "pattern": "detected pattern like /products/{slug}",
  "debug": "explanation of how you identified product URLs"
}`;

            const response2 = await fetch(`${this.proxyUrl}/claude-api`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 2000
                })
            });

            const result = await response2.json();
            if (result.success && result.data?.content?.[0]?.text) {
                const responseText = result.data.content[0].text;
                console.log('🔍 Claude response preview:', responseText.substring(0, 200));
                
                const productData = this.parseClaudeJSON(responseText);
                if (productData && productData.productUrls) {
                    console.log(`✅ Extracted ${productData.productUrls.length} product URLs`);
                    if (productData.debug) {
                        console.log(`🔍 Debug: ${productData.debug}`);
                    }
                    return productData.productUrls;
                } else {
                    console.log('❌ Could not parse product URLs from Claude response');
                    console.log('Raw response:', responseText);
                    return [];
                }
            }
        } catch (error) {
            console.error('Product extraction error:', error);
        }
        
        return [];
    }

    // Scrape descriptions from product pages
    async scrapeDescriptions(productUrls) {
        console.log(`📝 Scraping ${productUrls.length} product descriptions`);
        
        const descriptions = [];
        
        for (let i = 0; i < productUrls.length; i++) {
            const url = productUrls[i];
            console.log(`Scraping product ${i + 1}/${productUrls.length}: ${url}`);
            
            try {
                // Check rate limit before each product request
                const domain = new URL(url).hostname;
                const rateCheck = this.checkRateLimit(domain);
                if (!rateCheck.allowed) {
                    console.log(`⏳ Rate limit reached. Waiting ${Math.ceil(rateCheck.waitTime/1000)}s...`);
                    await new Promise(resolve => setTimeout(resolve, rateCheck.waitTime));
                }
                
                const response = await fetch(`${this.proxyUrl}/fetch-page?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                
                if (!data.success) continue;
                
                const prompt = `Extract the product information from this product page.

URL: ${url}
Content: ${data.content}

Extract:
1. Product name/title
2. Main description (full paragraph text)
3. Bullet points/features (if any)
4. Technical specifications (if any)
5. Material/care information (if any)

Return JSON only:
{
  "productName": "name",
  "mainDescription": "full description text",
  "features": ["feature1", "feature2"],
  "specifications": {"key": "value"},
  "additionalInfo": "any other relevant info",
  "descriptionWordCount": number,
  "descriptionCharCount": number
}`;

                const response2 = await fetch(`${this.proxyUrl}/claude-api`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [{ role: 'user', content: prompt }],
                        model: 'claude-3-5-sonnet-20241022',
                        max_tokens: 2000
                    })
                });

                const result = await response2.json();
                if (result.success && result.data?.content?.[0]?.text) {
                    const productInfo = this.parseClaudeJSON(result.data.content[0].text);
                    if (productInfo) {
                        descriptions.push({
                            url,
                            ...productInfo
                        });
                    } else {
                        console.error(`Failed to parse product info for ${url}`);
                    }
                }
                
                // Respectful delay with rate limiting
                await this.respectfulDelay();
                
            } catch (error) {
                console.error(`Failed to scrape ${url}:`, error);
            }
        }
        
        return descriptions;
    }

    // Analyze descriptions for patterns and insights
    async analyzeDescriptions(descriptions, domain) {
        console.log(`🔬 Analyzing descriptions for ${domain}`);
        
        if (!descriptions || descriptions.length === 0) {
            return { error: 'No descriptions to analyze' };
        }
        
        const prompt = `Analyze these product descriptions from ${domain} and provide actionable insights.

Products analyzed:
${descriptions.map((d, i) => `
Product ${i + 1}: ${d.productName}
Description: ${d.mainDescription}
Features: ${d.features?.join(', ') || 'None'}
Word count: ${d.descriptionWordCount}
`).join('\n')}

Provide comprehensive analysis:

1. METRICS:
   - Average word count
   - Average character count
   - Description structure (paragraphs vs bullets)

2. TONE & STYLE:
   - Formality level (casual/professional/technical)
   - Emotional appeals used
   - Key adjectives and power words

3. CONTENT PATTERNS:
   - Common description elements
   - Information hierarchy
   - Unique selling points emphasized

4. SEO OBSERVATIONS:
   - Keyword usage patterns
   - Product feature emphasis
   - Technical detail level

5. BEST PRACTICES OBSERVED:
   - What this competitor does well
   - Effective techniques used

6. RECOMMENDATIONS:
   - Key takeaways for writing similar descriptions
   - Suggested word count range
   - Tone and style guidelines

Return as detailed JSON with all sections.`;

        try {
            const response = await fetch(`${this.proxyUrl}/claude-api`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 3000
                })
            });

            const result = await response.json();
            if (result.success && result.data?.content?.[0]?.text) {
                return JSON.parse(result.data.content[0].text);
            }
        } catch (error) {
            console.error('Analysis error:', error);
        }
        
        return { error: 'Analysis failed' };
    }
    
    // Extract relevant HTML sections for product extraction
    extractRelevantHtml(html) {
        // More aggressive cleaning
        let cleaned = html
            // Remove all script tags and content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            // Remove all style tags and content
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            // Remove all svg elements
            .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
            // Remove all comments
            .replace(/<!--[\s\S]*?-->/g, '')
            // Remove inline styles
            .replace(/style="[^"]*"/gi, '')
            // Remove data attributes
            .replace(/data-[^=]*="[^"]*"/gi, '')
            // Remove empty attributes
            .replace(/[a-zA-Z-]+=""/gi, '')
            // Collapse multiple spaces
            .replace(/\s+/g, ' ');
        
        // Extract all links first
        const allLinks = [];
        const linkRegex = /<a[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi;
        let linkMatch;
        while ((linkMatch = linkRegex.exec(cleaned)) !== null) {
            allLinks.push({
                href: linkMatch[1],
                text: linkMatch[2].trim(),
                full: linkMatch[0]
            });
        }
        
        console.log(`🔗 Found ${allLinks.length} total links in page`);
        
        // Filter for product links - be more inclusive for Shopify
        const productLinks = allLinks.filter(link => {
            const href = link.href.toLowerCase();
            const text = link.text.toLowerCase();
            
            // Shopify-specific product URL patterns
            const isProductUrl = (
                href.includes('/products/') || // Shopify standard
                href.includes('/collections/') && href.includes('/products/') || // Collection product
                href.includes('/p/') ||
                href.includes('/item/')
            );
            
            // Also include links that might be products based on context
            const mightBeProduct = (
                !href.includes('/pages/') &&
                !href.includes('/blogs/') &&
                !href.includes('/policies/') &&
                !href.includes('/account') &&
                !href.includes('/cart') &&
                !href.includes('/search') &&
                !href.includes('#') &&
                !href.startsWith('mailto:') &&
                !href.startsWith('tel:') &&
                !href.startsWith('javascript:') &&
                href.startsWith('/') && // Relative URLs
                href.split('/').length >= 2 && // Has path segments
                text.length > 0 // Has text
            );
            
            return isProductUrl || (mightBeProduct && allLinks.length < 100);
        });
        
        console.log(`🛍️ Filtered to ${productLinks.length} potential product links`);
        
        // Build a minimal HTML structure with just the product links
        const minimalHtml = `
            <div class="products">
                ${productLinks.map(link => `
                    <div class="product-item">
                        ${link.full}
                    </div>
                `).join('')}
            </div>
            
            <!-- Debug info -->
            <div class="all-links-sample">
                ${allLinks.slice(0, 10).map(link => `
                    <p>Link: ${link.href} | Text: ${link.text}</p>
                `).join('')}
            </div>
        `;
        
        return minimalHtml;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CompetitorProductAnalyzer;
}