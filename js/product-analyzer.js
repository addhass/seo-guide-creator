// Product Analyzer Module
// Handles competitor product description analysis

class ProductAnalyzer {
    constructor() {
        this.analyzeBtn = document.getElementById('analyzeProductsBtn');
        this.competitorInputs = document.querySelectorAll('input[name="competitor[]"]');
        this.initEventListeners();
        this.updateAnalyzeButtonVisibility();
    }

    initEventListeners() {
        // Show analyze button when competitors are added
        this.competitorInputs.forEach(input => {
            input.addEventListener('input', () => this.updateAnalyzeButtonVisibility());
        });

        // Handle analyze button click
        if (this.analyzeBtn) {
            this.analyzeBtn.addEventListener('click', () => this.analyzeCompetitorProducts());
        }

        // Listen for competitor additions
        document.addEventListener('competitorAdded', () => {
            this.competitorInputs = document.querySelectorAll('input[name="competitor[]"]');
            this.competitorInputs.forEach(input => {
                input.addEventListener('input', () => this.updateAnalyzeButtonVisibility());
            });
            this.updateAnalyzeButtonVisibility();
        });
    }

    updateAnalyzeButtonVisibility() {
        const hasCompetitors = Array.from(this.competitorInputs).some(input => input.value.trim() !== '');
        if (this.analyzeBtn) {
            this.analyzeBtn.style.display = hasCompetitors ? 'inline-flex' : 'none';
        }
    }

    async analyzeCompetitorProducts() {
        const competitors = Array.from(this.competitorInputs)
            .map(input => input.value.trim())
            .filter(url => url !== '');

        if (competitors.length === 0) {
            this.showMessage('Please enter at least one competitor URL', 'error');
            return;
        }

        // Show loading state
        this.analyzeBtn.disabled = true;
        const originalText = this.analyzeBtn.innerHTML;
        this.analyzeBtn.innerHTML = '<span class="spinner"></span> Analyzing...';

        try {
            // Create results popup
            const popup = this.createResultsPopup();
            
            // Analyze each competitor
            for (let i = 0; i < competitors.length; i++) {
                const competitor = competitors[i];
                const resultElement = popup.querySelector(`#result-${i}`);
                
                try {
                    resultElement.innerHTML = '<span class="spinner"></span> Analyzing...';
                    
                    const result = await this.analyzeCompetitor(competitor);
                    
                    if (result.success) {
                        resultElement.innerHTML = this.renderSuccessResult(result.data);
                    } else {
                        resultElement.innerHTML = this.renderErrorResult(result.data);
                    }
                } catch (error) {
                    resultElement.innerHTML = this.renderErrorResult({ error: error.message });
                }
            }
        } catch (error) {
            this.showMessage(`Analysis failed: ${error.message}`, 'error');
        } finally {
            // Reset button
            this.analyzeBtn.disabled = false;
            this.analyzeBtn.innerHTML = originalText;
        }
    }

    async analyzeCompetitor(domain) {
        // Extract domain from URL if needed
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        
        // Check if auth helper is available
        if (!window.authHelper || !window.authHelper.authenticatedFetch) {
            throw new Error('Authentication required. Please log in and configure your API keys in the dashboard.');
        }
        
        const response = await window.authHelper.authenticatedFetch(`${this.baseUrl}/analyze-competitor-products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ domain: cleanDomain })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            if (errorData.error && errorData.error.includes('API key')) {
                throw new Error(`${errorData.error} Please visit the dashboard to add your API keys.`);
            }
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        return await response.json();
    }

    createResultsPopup() {
        // Remove existing popup if any
        const existingPopup = document.getElementById('product-analysis-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        const competitors = Array.from(this.competitorInputs)
            .map(input => input.value.trim())
            .filter(url => url !== '');

        const popup = document.createElement('div');
        popup.id = 'product-analysis-popup';
        popup.className = 'popup-overlay';
        popup.innerHTML = `
            <div class="popup-content large-popup">
                <div class="popup-header">
                    <h2>Product Description Analysis Results</h2>
                    <button class="close-popup">&times;</button>
                </div>
                <div class="popup-body">
                    ${competitors.map((comp, i) => `
                        <div class="competitor-analysis-section">
                            <h3>${this.extractDomainName(comp)}</h3>
                            <div id="result-${i}" class="analysis-result">
                                <span class="spinner"></span> Starting analysis...
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="popup-footer">
                    <button class="btn btn-secondary close-popup">Close</button>
                    <button class="btn btn-primary" id="useInsightsBtn">Use These Insights</button>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        // Add event listeners
        popup.querySelectorAll('.close-popup').forEach(btn => {
            btn.addEventListener('click', () => popup.remove());
        });

        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.remove();
            }
        });

        document.getElementById('useInsightsBtn').addEventListener('click', () => {
            this.applyInsights();
            popup.remove();
        });

        return popup;
    }

    renderSuccessResult(data) {
        if (!data.analysis || data.error) {
            return this.renderErrorResult(data);
        }

        const analysis = data.analysis;
        
        return `
            <div class="analysis-success">
                <div class="analysis-summary">
                    <p><strong>✅ Successfully analyzed ${data.products?.length || 0} products</strong></p>
                    <p>PLP: <a href="${data.plpUrl}" target="_blank">${data.plpUrl}</a></p>
                </div>
                
                ${analysis.METRICS ? `
                <div class="analysis-section">
                    <h4>📊 Metrics</h4>
                    <ul>
                        <li>Average word count: ${analysis.METRICS.averageWordCount || 'N/A'}</li>
                        <li>Structure: ${analysis.METRICS.descriptionStructure || 'N/A'}</li>
                    </ul>
                </div>
                ` : ''}
                
                ${analysis['TONE & STYLE'] ? `
                <div class="analysis-section">
                    <h4>✍️ Tone & Style</h4>
                    <ul>
                        <li>Formality: ${analysis['TONE & STYLE'].formalityLevel || 'N/A'}</li>
                        <li>Key adjectives: ${analysis['TONE & STYLE'].keyAdjectives?.join(', ') || 'N/A'}</li>
                    </ul>
                </div>
                ` : ''}
                
                ${analysis.RECOMMENDATIONS ? `
                <div class="analysis-section">
                    <h4>💡 Recommendations</h4>
                    <ul>
                        ${analysis.RECOMMENDATIONS.keyTakeaways?.map(t => `<li>${t}</li>`).join('') || '<li>No specific recommendations</li>'}
                    </ul>
                </div>
                ` : ''}
                
                <details class="raw-data-details">
                    <summary>View raw data</summary>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </details>
            </div>
        `;
    }

    renderErrorResult(data) {
        return `
            <div class="analysis-error">
                <p><strong>❌ Analysis failed</strong></p>
                <p>${data.error || 'Unknown error occurred'}</p>
                ${data.plpUrl ? `<p>Attempted PLP: ${data.plpUrl}</p>` : ''}
            </div>
        `;
    }

    extractDomainName(url) {
        try {
            const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
            return domain.split('/')[0];
        } catch {
            return url;
        }
    }

    applyInsights() {
        // TODO: Apply insights to form fields
        this.showMessage('Insights saved! They will be incorporated into your guide generation.', 'success');
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // Find a suitable container
        const container = document.querySelector('.form-section') || document.body;
        container.insertBefore(messageDiv, container.firstChild);
        
        setTimeout(() => messageDiv.remove(), 5000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ProductAnalyzer();
    });
} else {
    new ProductAnalyzer();
}