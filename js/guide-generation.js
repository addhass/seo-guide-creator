// Guide Generation Module
// Handles complete guide generation workflow

class GuideGeneration {
    constructor() {
        this.baseUrl = window.API_CONFIG ? window.API_CONFIG.API_BASE_URL : 'http://localhost:3001';
    }

    // Initialize guide generation
    init() {
        const generateGuideBtn = document.getElementById('generateGuideBtn');
        if (generateGuideBtn) {
            generateGuideBtn.addEventListener('click', async () => {
                await this.generateCompleteGuide();
            });
        }
    }

    // Main guide generation function
    async generateCompleteGuide() {
        const btn = document.getElementById('generateGuideBtn');
        const outputPanel = document.querySelector('.output-panel');
        
        // Show loading state
        btn.disabled = true;
        btn.classList.add('loading');
        btn.querySelector('.btn-icon').style.display = 'none';
        btn.querySelector('.btn-loading').style.display = 'flex';
        
        try {
            // Collect all form data
            const formData = this.collectFormData();
            
            // Validate required fields
            if (!this.validateFormData(formData)) {
                throw new Error('Please fill in all required fields before generating the guide.');
            }
            
            // Build comprehensive prompt
            const prompt = this.buildGuidePrompt(formData);
            
            // Call Claude API via proxy
            const response = await window.authHelper.authenticatedFetch(`${this.baseUrl}/claude-api`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 4000,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Guide generation failed: ${errorText}`);
            }

            const data = await response.json();
            
            if (!data.success || !data.data || !data.data.content || !data.data.content[0]) {
                throw new Error('Invalid response from Claude API');
            }
            
            const generatedGuide = data.data.content[0].text;
            
            // Display the guide
            this.displayGeneratedGuide(generatedGuide, outputPanel);
            
            console.log('✅ Guide generated successfully');
            
        } catch (error) {
            console.error('Guide generation error:', error);
            outputPanel.innerHTML = `
                <h2>Your Generated Guide</h2>
                <div style="padding: 2rem; background-color: #fee; border-left: 4px solid #f00; color: #900;">
                    <h3>Error Generating Guide</h3>
                    <p>${error.message}</p>
                    <p style="margin-top: 1rem; font-size: 0.875rem;">
                        Make sure the proxy server is running and all required fields are filled out.
                    </p>
                </div>
            `;
        } finally {
            // Reset button state
            btn.disabled = false;
            btn.classList.remove('loading');
            btn.querySelector('.btn-icon').style.display = 'inline';
            btn.querySelector('.btn-loading').style.display = 'none';
        }
    }

    // Collect all form data
    collectFormData() {
        return {
            // Brand Basics
            brandName: document.getElementById('brandName')?.value || '',
            website: document.getElementById('websiteUrl')?.value || '',
            aboutUrl: document.getElementById('aboutUrl')?.value || '',
            industry: document.getElementById('industry')?.value || '',
            customIndustry: document.getElementById('customIndustry')?.value || '',
            
            // Brand Identity
            usp: document.getElementById('usp')?.value || '',
            targetAudience: document.getElementById('targetAudience')?.value || '',
            brandVoice: Array.from(document.querySelectorAll('input[name="brandVoice"]:checked')).map(cb => cb.value),
            competitors: Array.from(document.querySelectorAll('input[name="competitor"]')).map(input => input.value).filter(val => val.trim()),
            
            // Product Information
            productCategories: document.getElementById('productCategories')?.value || '',
            exampleUrls: document.getElementById('exampleUrls')?.value || '',
            currentDescription: document.getElementById('currentDescription')?.value || '',
            
            // SEO Data
            keywordData: window.parsedKeywordData || [],
            geographicTarget: document.getElementById('geoTarget')?.value || ''
        };
    }

    // Validate required form data
    validateFormData(data) {
        const required = ['brandName', 'website', 'industry', 'usp', 'targetAudience', 'productCategories'];
        
        for (const field of required) {
            if (!data[field] || data[field].trim() === '') {
                alert(`Please fill in the required field: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return false;
            }
        }
        
        if (data.brandVoice.length === 0) {
            alert('Please select at least one brand voice characteristic');
            return false;
        }
        
        return true;
    }

    // Build comprehensive guide prompt
    buildGuidePrompt(data) {
        const industry = data.industry === 'other' ? data.customIndustry : data.industry;
        const competitorList = data.competitors.filter(c => c.trim()).join(', ') || 'No specific competitors mentioned';
        const keywordSummary = data.keywordData.length > 0 ? 
            data.keywordData.slice(0, 15).map(row => {
                const keyword = row['Keyword'] || row['Primary Keyword'] || 'Unknown';
                const volume = row['Search Volume (MSV)'] || row['Search Volume'] || '0';
                const intent = row['Search Intent'] || '';
                return `${keyword} (${volume} searches${intent ? ', ' + intent : ''})`;
            }).join(', ') : 'No comprehensive keyword strategy provided';
        
        return `Create a comprehensive SEO Product Description Guide following the exact structure and professional format of the Wild Donkey guide example.

BRAND INFORMATION:
- Brand Name: ${data.brandName}
- Website: ${data.website}
- Industry: ${industry}
- USP: ${data.usp}
- Target Audience: ${data.targetAudience}
- Brand Voice: ${data.brandVoice.join(', ')}
- Main Competitors: ${competitorList}
- Product Categories: ${data.productCategories}
- Geographic Target: ${data.geographicTarget}
- Keyword Strategy: ${keywordSummary}

STRUCTURE REQUIREMENTS:
Follow this exact structure with proper markdown headers:

# [Brand Name] Content Creation Guide {#brand-content-creation-guide}

## SEO-Optimised Content Strategy for Collections & Key Pages {#seo-optimised-content-strategy}

[Table of Contents - auto-generated from headers]

## Introduction {#introduction}
- Welcome message tailored to the brand
- Guide overview and scope

### About This Guide {#about-this-guide}
- What the guide covers
- Expected outcomes

### Understanding Traffic Potential {#understanding-traffic-potential}
- Realistic traffic expectations table (use provided keyword data)
- Important caveats about ranking and competition

### [Brand Name]'s Brand Voice {#brand-voice}
- Brand personality based on provided USP and voice characteristics
- Key messaging pillars (4-5 points)
- Tone and style guidelines

## Part 1: Understanding Your Content Strategy {#part-1-understanding-content-strategy}

### Why These Pages Matter {#why-these-pages-matter}
- Current opportunities
- Strategic priorities based on industry

### Strategic Collection Structure {#strategic-collection-structure}
- Recommended page structure for the industry
- SEO benefits
- User experience considerations

### Breaking Down the Real Opportunity {#breaking-down-opportunity}
- Traffic potential table for main product categories
- Key insights and priorities

## Part 2: Collection Page Framework {#part-2-collection-page-framework}

### Understanding E-commerce Collection Page Best Practices {#understanding-best-practices}
- Industry-specific research findings
- Competitor analysis methodology
- Content length recommendations

### The Perfect Collection Page Structure for [Brand Name] {#perfect-structure}
- Recommended implementation phases
- Content structure guidelines
- SEO integration best practices

## Part 3: Your Key Pages - Detailed Briefs {#part-3-detailed-briefs}

Create detailed briefs for each main product category mentioned, including:
- Meta Data (Title, Description, URL, H1, H2)
- Target Keywords with search volumes
- Content Focus and angles
- Unique selling points to highlight

## Part 4: Writing Guidelines for E-commerce {#part-4-writing-guidelines}

### SEO Best Practices for ${data.geographicTarget || 'Your Market'} {#seo-best-practices}
- Keyword integration strategies
- Content examples specific to the brand
- Technical SEO considerations

## Part 5: Implementation Checklist {#part-5-implementation-checklist}

### Pre-Launch Checklist for Each Page {#pre-launch-checklist}
- Technical SEO requirements
- Platform-specific considerations
- Brand consistency checks

### Post-Launch Actions {#post-launch-actions}
- Marketing and promotion strategies
- Performance monitoring

### Ongoing Optimisation {#ongoing-optimisation}
- Monthly and quarterly tasks
- Continuous improvement strategies

QUALITY REQUIREMENTS:
1. Professional, actionable content throughout
2. Industry-specific insights and recommendations
3. Realistic traffic projections based on keyword data
4. Comprehensive but practical implementation guidance
5. Maintain the sophisticated, consultative tone of the example
6. Include specific, measurable recommendations
7. Provide clear next steps and actionable advice

Generate a complete, professional guide that matches the quality and depth of the Wild Donkey example but customized entirely for ${data.brandName} in the ${industry} industry.`;
    }

    // Display the generated guide
    displayGeneratedGuide(guide, outputPanel) {
        outputPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2>Your Generated Guide</h2>
                <div style="display: flex; gap: 0.75rem;">
                    <button id="copyGuideBtn" style="padding: 0.5rem 1rem; background: var(--success-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
                        📋 Copy to Clipboard
                    </button>
                    <button id="downloadGuideBtn" style="padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
                        📥 Download Markdown
                    </button>
                </div>
            </div>
            <div id="guideContent" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 2rem; font-family: Georgia, serif; line-height: 1.6; max-height: 70vh; overflow-y: auto;">
                ${this.markdownToHtml(guide)}
            </div>
        `;
        
        // Add event listeners for copy and download buttons
        document.getElementById('copyGuideBtn').addEventListener('click', () => this.copyToClipboard(guide));
        document.getElementById('downloadGuideBtn').addEventListener('click', () => this.downloadMarkdown(guide));
    }

    // Simple markdown to HTML converter
    markdownToHtml(markdown) {
        return markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 style="color: var(--primary-color); margin-top: 2rem; margin-bottom: 1rem;">$1</h2>')
            .replace(/^### (.*$)/gim, '<h3 style="color: var(--secondary-color); margin-top: 1.5rem; margin-bottom: 0.75rem;">$1</h3>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.*)$/gim, '<p>$1</p>')
            .replace(/<p><li>/g, '<ul><li>')
            .replace(/<\/li><\/p>/g, '</li></ul>')
            .replace(/<p><h/g, '<h')
            .replace(/<\/h([1-6])><\/p>/g, '</h$1>');
    }

    // Copy to clipboard function
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('copyGuideBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Copied!';
            btn.style.backgroundColor = '#10B981';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.backgroundColor = 'var(--success-color)';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy to clipboard');
        });
    }

    // Download as markdown
    downloadMarkdown(content) {
        const brandName = document.getElementById('brandName')?.value || 'Brand';
        const filename = `${brandName.replace(/[^a-z0-9]/gi, '_')}_Content_Guide.md`;
        
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        const btn = document.getElementById('downloadGuideBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Downloaded!';
        btn.style.backgroundColor = '#10B981';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = 'var(--primary-color)';
        }, 2000);
    }
}

// Export for use in main application
window.GuideGeneration = GuideGeneration;