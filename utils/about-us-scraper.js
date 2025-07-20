// Enhanced About Us Content Analyzer
// This replaces the broken implementation in the HTML file

class AboutUsAnalyzer {
    constructor(apiKey) {
        this.claudeApiKey = apiKey;
        this.apiEndpoint = 'https://api.anthropic.com/v1/messages';
    }

    // Method 1: Using Claude's built-in web browsing (BEST OPTION)
    async analyzeWithClaudeBrowsing(aboutUsUrl) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.claudeApiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 500,
                    messages: [{
                        role: 'user',
                        content: `Please visit this About Us page: ${aboutUsUrl}

Extract and analyze the content to create:
1. A concise USP (Unique Selling Proposition) in 1-2 sentences
2. Target audience description (demographics, interests)  
3. Brand voice characteristics (professional, friendly, premium, etc.)
4. Key competitors mentioned or implied

Format your response as JSON:
{
    "usp": "string",
    "targetAudience": "string", 
    "brandVoice": ["array", "of", "characteristics"],
    "competitors": ["array", "of", "competitors"]
}`
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Claude API error: ${response.status}`);
            }

            const data = await response.json();
            return JSON.parse(data.content[0].text);
        } catch (error) {
            console.error('Claude browsing analysis failed:', error);
            throw error;
        }
    }

    // Method 2: Proxy service for web scraping (FALLBACK)
    async analyzeWithProxy(aboutUsUrl) {
        try {
            // Using a CORS proxy service
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(aboutUsUrl)}`;
            
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`Proxy fetch failed: ${response.status}`);
            }
            
            const data = await response.json();
            const htmlContent = data.contents;
            
            // Extract meaningful content
            const cleanText = this.extractAboutUsContent(htmlContent);
            
            // Analyze with Claude
            return await this.analyzeContentWithClaude(cleanText);
        } catch (error) {
            console.error('Proxy analysis failed:', error);
            throw error;
        }
    }

    // Method 3: User provides content manually (ULTIMATE FALLBACK)
    async analyzeProvidedContent(content) {
        return await this.analyzeContentWithClaude(content);
    }

    // Smart content extraction from HTML
    extractAboutUsContent(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Remove unwanted elements
        const unwantedSelectors = [
            'nav', 'header', 'footer', 'script', 'style', 
            '.navigation', '#nav', '.menu', '.cookie', 
            '.ads', '.advertisement', '.social-media'
        ];
        
        unwantedSelectors.forEach(selector => {
            const elements = doc.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        // Look for About Us specific content
        const aboutSelectors = [
            '[class*="about"]', '[id*="about"]',
            'main', '.content', '#content', 
            '.story', '.mission', '.vision',
            'h1, h2, h3', 'p'
        ];

        let content = '';
        aboutSelectors.forEach(selector => {
            const elements = doc.querySelectorAll(selector);
            elements.forEach(el => {
                if (el.textContent.trim().length > 20) {
                    content += el.textContent.trim() + '\n';
                }
            });
        });

        // Fallback to body content if nothing found
        if (content.length < 100) {
            content = doc.body.textContent || '';
        }

        // Clean and limit content
        return content
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 3000); // Limit to prevent token overflow
    }

    // Analyze extracted content with Claude
    async analyzeContentWithClaude(content) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.claudeApiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 500,
                    messages: [{
                        role: 'user',
                        content: `Analyze this About Us content and extract brand information:

${content}

Please create:
1. A compelling USP (Unique Selling Proposition) in 1-2 sentences
2. Target audience description (demographics, psychographics)
3. Brand voice characteristics (select from: professional, friendly, luxurious, playful, authentic, technical, nostalgic)
4. Any mentioned or implied competitors

Format as JSON:
{
    "usp": "What makes this brand uniquely valuable",
    "targetAudience": "Who their ideal customer is",
    "brandVoice": ["characteristic1", "characteristic2"],
    "competitors": ["competitor1", "competitor2"]
}`
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Claude API error: ${response.status}`);
            }

            const data = await response.json();
            return JSON.parse(data.content[0].text);
        } catch (error) {
            console.error('Claude content analysis failed:', error);
            throw error;
        }
    }

    // Main method with fallback chain
    async analyze(aboutUsUrl) {
        try {
            // Try Claude browsing first (if available)
            return await this.analyzeWithClaudeBrowsing(aboutUsUrl);
        } catch (error) {
            console.log('Claude browsing failed, trying proxy...');
            
            try {
                // Fallback to proxy method
                return await this.analyzeWithProxy(aboutUsUrl);
            } catch (proxyError) {
                console.log('Proxy failed, manual input required');
                
                // Final fallback: Ask user to paste content
                const userContent = prompt(
                    'Unable to automatically fetch the page. Please copy and paste the About Us content:'
                );
                
                if (userContent) {
                    return await this.analyzeProvidedContent(userContent);
                } else {
                    throw new Error('No content provided for analysis');
                }
            }
        }
    }
}

// Export for use in main HTML file
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AboutUsAnalyzer;
}