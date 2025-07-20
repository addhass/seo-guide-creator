// Competitor Analysis Module
// Handles competitor discovery, analysis, and website scraping

class CompetitorAnalysis {
    constructor() {
        this.baseUrl = 'http://localhost:3001';
    }

    // Main competitor discovery function
    async findCompetitors() {
        const btn = document.getElementById('findCompetitorsBtn');
        
        // Check if we have keyword data uploaded
        if (!window.parsedKeywordData || window.parsedKeywordData.length === 0) {
            // For demo mode, create mock keyword data
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('admin') === 'true') {
                console.log('🎯 Admin mode: Keywords already loaded');
                // Keywords are already loaded by admin mode initialization
            } else {
                alert('Please upload your keyword strategy file (TSV/CSV) first to discover competitors.');
                return;
            }
        }
        
        // Show loading state
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span> Analyzing keywords...';
        btn.disabled = true;
        
        try {
            console.log('🔍 Starting advanced competitor discovery...');
            
            // Step 1: Analyze TSV data to get top 30 keywords by search volume
            const tsvData = window.originalTsvData;
            
            if (!tsvData) {
                // Fallback to existing approach
                console.log('📋 No TSV data found, using parsed keyword data approach');
                const keywords = this.getTop30NonBrandKeywords();
                
                if (keywords.length === 0) {
                    throw new Error('No keywords found. Please upload a keyword file (CSV/TSV) first.');
                }
                
                console.log(`📊 Found ${keywords.length} keywords from parsed data`);
                // Call the real API with the keywords
                await this.fetchRealCompetitorData(keywords);
                return;
            }
            
            // Step 2: Send TSV data to proxy server for analysis
            const keywordAnalysisResponse = await fetch(`${this.baseUrl}/analyze-keywords-tsv`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tsvData: tsvData
                })
            });
            
            if (!keywordAnalysisResponse.ok) {
                throw new Error(`Keyword analysis failed: ${keywordAnalysisResponse.status}`);
            }
            
            const keywordData = await keywordAnalysisResponse.json();
            console.log(`✅ Keyword analysis complete: ${keywordData.top30Keywords.length} keywords selected`);
            
            // Step 3: Get SERP data for top keywords
            btn.innerHTML = '<span class="spinner"></span> Fetching competitor data...';
            
            const top10Keywords = keywordData.top30Keywords.slice(0, 10);
            console.log(`🔍 Fetching SERP data for top ${top10Keywords.length} keywords...`);
            
            const serpResponse = await fetch(`${this.baseUrl}/get-serp-competitors-sequential`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    keywords: top10Keywords,
                    location: document.getElementById('geoTarget')?.value || 'United Kingdom'
                })
            });
            
            if (!serpResponse.ok) {
                throw new Error(`SERP analysis failed: ${serpResponse.status}`);
            }
            
            const serpData = await serpResponse.json();
            
            if (serpData.success && serpData.uniqueDomains && serpData.uniqueDomains.length > 0) {
                console.log(`✅ Found ${serpData.uniqueDomains.length} unique competitors`);
                
                // Show competitor selection popup
                this.showCompetitorSelectionPopup(serpData.uniqueDomains);
                
            } else {
                throw new Error('No competitors found in SERP data');
            }
            
        } catch (error) {
            console.error('❌ Competitor discovery failed:', error);
            
            alert(`Competitor discovery failed: ${error.message}`);
        } finally {
            // Reset button
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    // Show competitor selection popup
    showCompetitorSelectionPopup(domains) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 70vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        `;
        
        modalContent.innerHTML = `
            <h3 style="margin-top: 0; color: var(--primary-color);">🎯 Select Competitors</h3>
            <p style="color: var(--muted-text); margin-bottom: 1.5rem;">
                Found ${domains.length} competitors from your keyword analysis. Select which ones to add to your form:
            </p>
            
            <div style="max-height: 400px; overflow-y: auto; margin-bottom: 1.5rem;">
                ${domains.map((domain, index) => `
                    <div style="display: flex; align-items: center; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; transition: all 0.2s;">
                        <input type="checkbox" id="comp_${index}" style="margin-right: 12px; transform: scale(1.1);">
                        <div style="flex: 1; display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; flex-direction: column;">
                                <a href="https://${domain}" target="_blank" rel="noopener noreferrer" style="color: #1f2937; text-decoration: none; border-bottom: 1px solid #e5e7eb; transition: all 0.2s;">
                                    ${domain} <span style="font-size: 12px; color: #6b7280;">↗</span>
                                </a>
                            </div>
                            <div style="margin-left: 12px;">
                                <span style="background: ${index < 10 ? '#dbeafe' : '#f3f4f6'}; color: ${index < 10 ? '#1e40af' : '#6b7280'}; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
                                    Rank ${index + 1}
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: space-between; align-items: center;">
                <div style="font-size: 14px; color: #6b7280;">
                    <span id="selectedCount">0</span> competitors selected
                </div>
                <div style="display: flex; gap: 8px;">
                    <button id="cancelCompetitors" style="padding: 8px 16px; background: #f3f4f6; color: #374151; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Cancel</button>
                    <button id="analyzeWebsites" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">🔍 Analyze Websites</button>
                    <button id="selectAllCompetitors" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Select All</button>
                    <button id="clearAllCompetitors" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Clear All</button>
                    <button id="confirmCompetitors" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">✓ Add Selected</button>
                </div>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Add event listeners
        this.setupCompetitorModalEvents(modal, domains);
    }

    // Setup event listeners for competitor modal
    setupCompetitorModalEvents(modal, domains) {
        // Function to update selected count
        function updateSelectedCount() {
            const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
            const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
            document.getElementById('selectedCount').textContent = selectedCount;
        }
        
        // Add change listeners to checkboxes
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateSelectedCount);
        });
        
        // Initial count
        updateSelectedCount();
        
        // Event listeners
        document.getElementById('cancelCompetitors').onclick = () => modal.remove();
        
        document.getElementById('selectAllCompetitors').onclick = () => {
            domains.forEach((_, index) => {
                document.getElementById(`comp_${index}`).checked = true;
            });
            updateSelectedCount();
        };
        
        document.getElementById('clearAllCompetitors').onclick = () => {
            domains.forEach((_, index) => {
                document.getElementById(`comp_${index}`).checked = false;
            });
            updateSelectedCount();
        };
        
        // Analyze Websites button functionality
        document.getElementById('analyzeWebsites').onclick = async () => {
            await this.analyzeCompetitorWebsites(domains.slice(0, 5));
        };
        
        document.getElementById('confirmCompetitors').onclick = async () => {
            const selectedCompetitors = [];
            domains.forEach((domain, index) => {
                const checkbox = document.getElementById(`comp_${index}`);
                if (checkbox && checkbox.checked) {
                    selectedCompetitors.push(domain);
                }
            });
            
            if (selectedCompetitors.length === 0) {
                alert('Please select at least one competitor.');
                return;
            }
            
            // Add to form
            await this.populateCompetitorFields(selectedCompetitors);
            
            // Show success message
            console.log(`✅ Added ${selectedCompetitors.length} competitors:`, selectedCompetitors);
            
            // Close modal
            modal.remove();
        };
        
        // Close modal when clicking outside
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    }

    // Competitor website analysis
    async analyzeCompetitorWebsites(domains) {
        console.log('🔍 Starting competitor website analysis...');
        
        // Create analysis modal
        const analysisModal = document.createElement('div');
        analysisModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1001;
        `;
        
        const analysisContent = document.createElement('div');
        analysisContent.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 12px;
            max-width: 800px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        analysisContent.innerHTML = `
            <h3 style="margin-top: 0; color: var(--primary-color);">🔍 Competitor Website Analysis</h3>
            <p style="color: var(--muted-text); margin-bottom: 1.5rem;">
                Analyzing competitor websites to understand their platform, structure, and product organization...
            </p>
            <div id="analysisResults" style="space-y: 1rem;">
                <!-- Analysis results will appear here -->
            </div>
            <div style="margin-top: 2rem; display: flex; justify-content: flex-end;">
                <button id="closeAnalysis" style="padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Close Analysis
                </button>
            </div>
        `;
        
        analysisModal.appendChild(analysisContent);
        document.body.appendChild(analysisModal);
        
        const resultsDiv = document.getElementById('analysisResults');
        
        // Get brand context from current form data
        const brandContext = {
            brandName: document.getElementById('brandName')?.value || '',
            industry: document.getElementById('industry')?.value || '',
            website: document.getElementById('websiteUrl')?.value || ''
        };
        
        const brandContextText = `Brand: ${brandContext.brandName}, Industry: ${brandContext.industry}, Website: ${brandContext.website}`;
        
        // Analyze each competitor
        for (let i = 0; i < Math.min(domains.length, 5); i++) {
            const domain = domains[i];
            const competitorUrl = `https://${domain}`;
            
            // Add loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.id = `analysis-${i}`;
            loadingDiv.style.cssText = `
                padding: 1rem;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 1rem;
            `;
            loadingDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 20px; height: 20px; border: 2px solid #f3f4f6; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <span style="font-weight: 500;">${domain}</span>
                    <span style="color: #6b7280; font-size: 0.875rem;">Analyzing...</span>
                </div>
            `;
            resultsDiv.appendChild(loadingDiv);
            
            try {
                console.log(`🔍 Analyzing: ${competitorUrl}`);
                
                const response = await fetch(`${this.baseUrl}/analyze-competitor-website`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        competitorUrl: competitorUrl,
                        brandContext: brandContextText
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Analysis failed: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success && data.analysis) {
                    this.displayAnalysisResults(loadingDiv, domain, data.analysis);
                } else {
                    throw new Error('Invalid analysis response');
                }
                
            } catch (error) {
                console.error(`❌ Failed to analyze ${domain}:`, error);
                this.displayAnalysisError(loadingDiv, domain, error);
            }
            
            // Respectful delay between requests (3-5 seconds)
            const delay = 3000 + Math.random() * 2000;
            console.log(`⏱️  Waiting ${Math.round(delay/1000)} seconds before next request...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Add close button functionality
        document.getElementById('closeAnalysis').onclick = () => {
            document.body.removeChild(analysisModal);
        };
        
        // Close modal when clicking outside
        analysisModal.onclick = (e) => {
            if (e.target === analysisModal) {
                document.body.removeChild(analysisModal);
            }
        };
        
        console.log('✅ Competitor website analysis complete');
    }

    // Display analysis results
    displayAnalysisResults(loadingDiv, domain, analysis) {
        loadingDiv.innerHTML = `
            <div style="border-left: 4px solid #10b981; padding-left: 1rem;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem;">
                    <h4 style="margin: 0; color: var(--secondary-color);">${domain}</h4>
                    <span style="background: ${analysis.platformConfidence === 'high' ? '#dcfce7' : analysis.platformConfidence === 'medium' ? '#fef3c7' : '#fee2e2'}; 
                                 color: ${analysis.platformConfidence === 'high' ? '#166534' : analysis.platformConfidence === 'medium' ? '#92400e' : '#991b1b'}; 
                                 padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
                        ${analysis.platform} (${analysis.platformConfidence} confidence)
                    </span>
                </div>
                
                <div style="grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem; display: grid;">
                    <div>
                        <h5 style="margin: 0 0 0.5rem 0; color: var(--muted-text); font-size: 0.875rem;">Brand Analysis</h5>
                        <p style="margin: 0; font-size: 0.875rem;">
                            <strong>Industry:</strong> ${analysis.brandAnalysis?.industry || 'Unknown'}<br>
                            <strong>Price Point:</strong> ${analysis.brandAnalysis?.pricePoint || 'Unknown'}<br>
                            <strong>Voice:</strong> ${analysis.brandAnalysis?.brandVoice || 'Unknown'}
                        </p>
                    </div>
                    <div>
                        <h5 style="margin: 0 0 0.5rem 0; color: var(--muted-text); font-size: 0.875rem;">URL Patterns</h5>
                        <p style="margin: 0; font-size: 0.875rem;">
                            ${analysis.productUrlPatterns?.slice(0, 3).join(', ') || 'None detected'}
                        </p>
                    </div>
                </div>
                
                ${analysis.scrapingStrategy?.sampleProductUrls?.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <h5 style="margin: 0 0 0.5rem 0; color: var(--muted-text); font-size: 0.875rem;">Sample Product URLs</h5>
                    <div style="font-size: 0.875rem;">
                        ${analysis.scrapingStrategy.sampleProductUrls.slice(0, 3).map(url => `
                            <a href="${url}" target="_blank" style="color: #3b82f6; text-decoration: none; display: block; margin-bottom: 2px;">
                                ${url} ↗
                            </a>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${analysis.competitorInsights?.uniqueSellingPoints?.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <h5 style="margin: 0 0 0.5rem 0; color: var(--muted-text); font-size: 0.875rem;">Key Insights</h5>
                    <p style="margin: 0; font-size: 0.875rem;">
                        ${analysis.competitorInsights.uniqueSellingPoints.slice(0, 2).join(', ')}
                    </p>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Display analysis error
    displayAnalysisError(loadingDiv, domain, error) {
        const isRateLimit = error.message.includes('Rate limit') || error.message.includes('429');
        const errorColor = isRateLimit ? '#f59e0b' : '#ef4444';
        const errorBg = isRateLimit ? '#fef3c7' : '#fee2e2';
        const errorText = isRateLimit ? '#92400e' : '#991b1b';
        
        loadingDiv.innerHTML = `
            <div style="border-left: 4px solid ${errorColor}; padding-left: 1rem;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <h4 style="margin: 0; color: var(--secondary-color);">${domain}</h4>
                    <span style="background: ${errorBg}; color: ${errorText}; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
                        ${isRateLimit ? 'Rate Limited' : 'Analysis Failed'}
                    </span>
                </div>
                <p style="margin: 0.5rem 0 0 0; color: var(--muted-text); font-size: 0.875rem;">
                    ${isRateLimit ? 'Server is applying rate limiting for ethical crawling' : error.message}
                </p>
            </div>
        `;
    }

    // Populate competitor fields
    async populateCompetitorFields(competitors) {
        console.log(`🔄 Starting to populate ${competitors.length} competitors...`);
        
        // Ensure we have enough competitor inputs
        let competitorCount = document.querySelectorAll('.competitor-input-group').length;
        const addCompetitorBtn = document.getElementById('addCompetitorBtn');
        
        while (competitorCount < competitors.length && competitorCount < 10) {
            if (addCompetitorBtn) {
                addCompetitorBtn.click();
                competitorCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        // Populate the fields
        for (let i = 0; i < Math.min(competitors.length, 10); i++) {
            const competitor = competitors[i];
            const competitorUrl = competitor.startsWith('http') ? competitor : `https://${competitor}`;
            
            // Find the input field
            const inputs = document.querySelectorAll('input[name="competitor[]"]');
            if (inputs[i]) {
                inputs[i].value = competitorUrl;
                inputs[i].style.borderColor = 'var(--success-color)';
                console.log(`✅ Populated competitor ${i + 1}: ${competitorUrl}`);
                
                // Trigger change event
                const changeEvent = new Event('change', { bubbles: true });
                inputs[i].dispatchEvent(changeEvent);
            }
            
            // Small delay between each competitor to ensure proper processing
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log(`🎉 Finished populating ${Math.min(competitors.length, 10)} competitors`);
    }

    // Get top keywords for fallback
    getTop30NonBrandKeywords() {
        if (!window.parsedKeywordData || window.parsedKeywordData.length === 0) {
            return [];
        }
        
        const brandName = document.getElementById('brandName')?.value?.toLowerCase() || '';
        
        return window.parsedKeywordData
            .filter(row => {
                const keyword = (row['Keyword'] || row['Primary Keyword'] || '').toLowerCase();
                return keyword && keyword.length > 0 && !keyword.includes(brandName);
            })
            .sort((a, b) => {
                const volumeA = parseInt(a['Search Volume (MSV)'] || a['Search Volume'] || 0);
                const volumeB = parseInt(b['Search Volume (MSV)'] || b['Search Volume'] || 0);
                return volumeB - volumeA;
            })
            .slice(0, 30)
            .map(row => ({
                keyword: row['Keyword'] || row['Primary Keyword'] || '',
                searchVolume: parseInt(row['Search Volume (MSV)'] || row['Search Volume'] || 0)
            }));
    }

    // Fetch real competitor data from DataForSEO
    async fetchRealCompetitorData(keywords) {
        console.log(`🔍 Fetching real competitor data for ${keywords.length} keywords...`);
        
        const btn = document.getElementById('findCompetitorsBtn');
        btn.innerHTML = '<span class="spinner"></span> Fetching competitor data...';
        
        try {
            const response = await fetch(`${this.baseUrl}/get-serp-competitors-sequential`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    keywords: keywords.slice(0, 10), // Use top 10 keywords
                    location: document.getElementById('geoTarget')?.value || 'United Kingdom'
                })
            });
            
            if (!response.ok) {
                throw new Error(`SERP analysis failed: ${response.status}`);
            }
            
            const serpData = await response.json();
            
            if (serpData.success && serpData.uniqueDomains && serpData.uniqueDomains.length > 0) {
                console.log(`✅ Found ${serpData.uniqueDomains.length} unique competitors`);
                this.showCompetitorSelectionPopup(serpData.uniqueDomains);
            } else {
                throw new Error('No competitors found in SERP data');
            }
            
        } catch (error) {
            console.error('❌ Failed to fetch real competitor data:', error);
            throw error;
        }
    }
}

// Export for use in main application
window.CompetitorAnalysis = CompetitorAnalysis;