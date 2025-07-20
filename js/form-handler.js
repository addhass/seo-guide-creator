// Form Handler Module
// Handles form interactions, validation, and data processing

class FormHandler {
    constructor() {
        this.baseUrl = window.API_CONFIG ? window.API_CONFIG.API_BASE_URL : 'http://localhost:3001';
        this.competitorCount = 3;
    }

    // Initialize form handler
    init() {
        this.setupFormEvents();
        this.setupCharacterCounters();
        this.setupAboutUsGeneration();
        this.setupCompetitorInputs();
        this.setupCSVHandling();
        this.setupAdminMode();
    }

    // Setup form events
    setupFormEvents() {
        // Industry dropdown handler
        const industrySelect = document.getElementById('industry');
        const otherIndustryGroup = document.getElementById('otherIndustryGroup');
        
        if (industrySelect && otherIndustryGroup) {
            industrySelect.addEventListener('change', function() {
                if (this.value === 'other') {
                    otherIndustryGroup.style.display = 'block';
                    document.getElementById('otherIndustry').required = true;
                } else {
                    otherIndustryGroup.style.display = 'none';
                    document.getElementById('otherIndustry').required = false;
                }
            });
        }

        // Auto-detect country from website URL
        const websiteInput = document.getElementById('websiteUrl');
        const geoTargetSelect = document.getElementById('geoTarget');
        
        if (websiteInput && geoTargetSelect) {
            websiteInput.addEventListener('blur', function() {
                const url = this.value.toLowerCase();
                if (url.includes('.co.uk') || url.includes('/uk/')) {
                    geoTargetSelect.value = 'UK';
                } else if (url.includes('.com.au') || url.includes('/au/')) {
                    geoTargetSelect.value = 'AU';
                } else if (url.includes('.ca') || url.includes('/ca/')) {
                    geoTargetSelect.value = 'CA';
                } else if (url.includes('.eu') || url.includes('/eu/')) {
                    geoTargetSelect.value = 'EU';
                } else if (url.includes('.com')) {
                    geoTargetSelect.value = 'US';
                }
            });
        }

        // Form validation
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }
    }

    // Setup character counters
    setupCharacterCounters() {
        const textareas = [
            { id: 'usp', counterId: 'uspCount', max: 500 },
            { id: 'targetAudience', counterId: 'targetAudienceCount', max: 300 },
            { id: 'productCategories', counterId: 'productCategoriesCount', max: 500 },
            { id: 'exampleUrls', counterId: 'exampleUrlsCount', max: 1000 },
            { id: 'currentDescription', counterId: 'currentDescriptionCount', max: 1000 }
        ];

        textareas.forEach(({ id, counterId, max }) => {
            const textarea = document.getElementById(id);
            const counter = document.getElementById(counterId);
            
            if (textarea && counter) {
                textarea.addEventListener('input', function() {
                    const length = this.value.length;
                    counter.textContent = length;
                    
                    // Change color based on usage
                    if (length > max * 0.9) {
                        counter.style.color = '#ef4444';
                    } else if (length > max * 0.7) {
                        counter.style.color = '#f59e0b';
                    } else {
                        counter.style.color = '#6b7280';
                    }
                });
            }
        });
    }

    // Setup About Us generation
    setupAboutUsGeneration() {
        const generateUspBtn = document.getElementById('generateUspBtn');
        const testProxyBtn = document.getElementById('testProxyBtn');
        
        if (generateUspBtn) {
            generateUspBtn.addEventListener('click', this.generateFromAboutUs.bind(this));
        }
        
        if (testProxyBtn) {
            testProxyBtn.addEventListener('click', this.testProxyConnection.bind(this));
        }
    }

    // Setup competitor inputs
    setupCompetitorInputs() {
        const addCompetitorBtn = document.getElementById('addCompetitorBtn');
        const competitorInputs = document.getElementById('competitorInputs');
        
        if (addCompetitorBtn && competitorInputs) {
            addCompetitorBtn.addEventListener('click', () => {
                this.addCompetitorInput();
            });
        }

        // Setup find competitors button
        const findCompetitorsBtn = document.getElementById('findCompetitorsBtn');
        if (findCompetitorsBtn) {
            findCompetitorsBtn.addEventListener('click', async () => {
                if (window.competitorAnalysis) {
                    await window.competitorAnalysis.findCompetitors();
                }
            });
        }
    }

    // Add competitor input
    addCompetitorInput() {
        const competitorInputs = document.getElementById('competitorInputs');
        const addCompetitorBtn = document.getElementById('addCompetitorBtn');
        
        if (this.competitorCount < 10) {
            this.competitorCount++;
            const newGroup = document.createElement('div');
            newGroup.className = 'competitor-input-group';
            newGroup.innerHTML = `
                <span class="competitor-number">${this.competitorCount}.</span>
                <input 
                    type="url" 
                    name="competitor[]" 
                    class="form-input" 
                    placeholder="https://competitor.com or https://competitor.com/country"
                >
            `;
            competitorInputs.appendChild(newGroup);
            
            // Add validation to new input
            const newInput = newGroup.querySelector('.form-input');
            newInput.addEventListener('blur', function() {
                if (this.value) {
                    this.style.borderColor = 'var(--success-color)';
                }
            });
            newInput.addEventListener('focus', function() {
                this.style.borderColor = '';
            });
            
            // Hide button if we reach 10
            if (this.competitorCount >= 10) {
                addCompetitorBtn.style.display = 'none';
            }
            
            // Dispatch event for other modules
            document.dispatchEvent(new CustomEvent('competitorAdded'));
        }
    }

    // Setup CSV handling
    setupCSVHandling() {
        const csvInput = document.getElementById('keywordCsv');
        const csvPreview = document.getElementById('csvPreview');
        const csvContent = document.getElementById('csvContent');
        const csvSummary = document.getElementById('csvSummary');
        
        if (csvInput) {
            csvInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    this.processCSVFile(file, csvPreview, csvContent, csvSummary);
                }
            });
        }
    }

    // Process CSV file
    processCSVFile(file, previewDiv, contentDiv, summaryDiv) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const lines = content.split('\n');
            
            if (lines.length < 2) {
                alert('CSV file appears to be empty or invalid');
                return;
            }
            
            // Detect separator (comma or tab)
            const separator = lines[0].includes('\t') ? '\t' : ',';
            const headers = lines[0].split(separator);
            
            // Parse data
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const row = lines[i].split(separator);
                    const rowData = {};
                    headers.forEach((header, index) => {
                        rowData[header.trim()] = row[index]?.trim() || '';
                    });
                    data.push(rowData);
                }
            }
            
            // Store data globally for later use
            window.parsedKeywordData = data;
            window.originalTsvData = content; // Store original content for server processing
            
            // Display preview
            this.displayCSVPreview(data, headers, previewDiv, contentDiv, summaryDiv);
        };
        
        reader.readAsText(file);
    }

    // Display CSV preview
    displayCSVPreview(data, headers, previewDiv, contentDiv, summaryDiv) {
        previewDiv.style.display = 'block';
        
        // Create table
        let tableHtml = '<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">';
        tableHtml += '<thead><tr>';
        headers.forEach(header => {
            tableHtml += `<th style="border: 1px solid #e5e7eb; padding: 8px; background: #f9fafb; text-align: left;">${header}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        
        // Show first 10 rows
        data.slice(0, 10).forEach(row => {
            tableHtml += '<tr>';
            headers.forEach(header => {
                tableHtml += `<td style="border: 1px solid #e5e7eb; padding: 8px;">${row[header] || ''}</td>`;
            });
            tableHtml += '</tr>';
        });
        
        if (data.length > 10) {
            tableHtml += `<tr><td colspan="${headers.length}" style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-style: italic;">... and ${data.length - 10} more rows</td></tr>`;
        }
        
        tableHtml += '</tbody></table>';
        contentDiv.innerHTML = tableHtml;
        
        // Generate summary
        const totalKeywords = data.length;
        const avgSearchVolume = this.calculateAverageSearchVolume(data);
        const topKeywords = this.getTopKeywords(data, 5);
        
        summaryDiv.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <strong style="color: var(--primary-color);">📊 Total Keywords:</strong> ${totalKeywords}
                </div>
                <div>
                    <strong style="color: var(--success-color);">🔍 Avg Search Volume:</strong> ${avgSearchVolume}/month
                </div>
                <div>
                    <strong style="color: var(--secondary-color);">🎯 Top Keyword:</strong> ${topKeywords[0]?.keyword || 'N/A'}
                </div>
            </div>
            <div style="margin-top: 1rem; font-size: 0.75rem; color: var(--muted-text);">
                <strong>Ready for competitor analysis:</strong> Upload complete. Use "Find Competitors" to analyze SERP data.
            </div>
        `;
    }

    // Calculate average search volume
    calculateAverageSearchVolume(data) {
        const volumes = data.map(row => {
            const volume = parseInt(row['Search Volume (MSV)'] || row['Search Volume'] || 0);
            return isNaN(volume) ? 0 : volume;
        });
        
        const total = volumes.reduce((sum, vol) => sum + vol, 0);
        return volumes.length > 0 ? Math.round(total / volumes.length).toLocaleString() : 'N/A';
    }

    // Get top keywords by search volume
    getTopKeywords(data, count) {
        return data
            .map(row => ({
                keyword: row['Keyword'] || row['Primary Keyword'] || '',
                volume: parseInt(row['Search Volume (MSV)'] || row['Search Volume'] || 0)
            }))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, count);
    }

    // Setup admin mode
    setupAdminMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const isAdminMode = urlParams.get('adminmode') === 'yes' || 
                           urlParams.get('admin') === 'true' || 
                           urlParams.get('test') === 'true';
        
        if (isAdminMode) {
            console.log('🔧 Admin mode activated');
            this.fillTestData();
        }
    }

    // Fill test data for Wild Donkey
    fillTestData() {
        const testData = {
            brandName: 'Wild Donkey',
            websiteUrl: 'https://wilddonkeycompany.com',
            aboutUrl: 'https://wilddonkeycompany.com/pages/about-us',
            industry: 'fashion-apparel',
            // Skip brand identity fields - don't auto-populate these
            // usp: '',
            // targetAudience: '',
            // productCategories: '',
            // exampleUrls: '',
            // currentDescription: '',
            geoTarget: 'US'
        };
        
        // Fill form fields
        Object.entries(testData).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.value = value;
            }
        });
        
        // Set brand voice checkboxes
        const brandVoices = ['sophisticated', 'authentic', 'storytelling'];
        brandVoices.forEach(voice => {
            const checkbox = document.querySelector(`input[name="brandVoice"][value="${voice}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
        
        // Don't auto-fill competitors - let user use Find Competitors button
        
        console.log('✅ Test data filled for Wild Donkey');
    }

    // Generate from About Us
    async generateFromAboutUs() {
        const aboutUrl = document.getElementById('aboutUrl')?.value;
        const generateBtn = document.getElementById('generateUspBtn');
        
        if (!aboutUrl) {
            alert('Please enter your About Us page URL first');
            return;
        }
        
        // Show loading state
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<span class="spinner"></span> Analyzing...';
        generateBtn.disabled = true;
        
        try {
            // Fetch page content via proxy
            const response = await window.authHelper.authenticatedFetch(`${this.baseUrl}/fetch-page?url=${encodeURIComponent(aboutUrl)}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch About Us page');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to analyze About Us page');
            }
            
            // Generate analysis via Claude
            const analysisResponse = await window.authHelper.authenticatedFetch(`${this.baseUrl}/claude-api`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 500,
                    messages: [{
                        role: 'user',
                        content: `Analyze this About Us page content and extract key brand information:

${data.content}

Please provide:
1. A concise Unique Selling Proposition (USP) in 1-2 sentences
2. Target audience description
3. Brand voice characteristics (choose 2-3 from: professional, casual, friendly, sophisticated, playful, authoritative, authentic, innovative, traditional, luxury, budget-friendly, technical, storytelling)

Format your response as:
USP: [your USP here]
TARGET AUDIENCE: [your target audience here]
BRAND VOICE: [comma-separated characteristics]`
                    }]
                })
            });
            
            if (!analysisResponse.ok) {
                throw new Error('Failed to analyze brand information');
            }
            
            const analysisData = await analysisResponse.json();
            
            if (analysisData.success && analysisData.data?.content?.[0]?.text) {
                this.parseAndFillAnalysis(analysisData.data.content[0].text);
                alert('✅ Brand information generated successfully!');
            } else {
                throw new Error('Invalid response from analysis service');
            }
            
        } catch (error) {
            console.error('About Us generation error:', error);
            alert(`Failed to generate from About Us: ${error.message}`);
        } finally {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }
    }

    // Parse and fill analysis results
    parseAndFillAnalysis(analysisText) {
        const uspMatch = analysisText.match(/USP:\s*(.+)/i);
        const targetAudienceMatch = analysisText.match(/TARGET AUDIENCE:\s*(.+)/i);
        const brandVoiceMatch = analysisText.match(/BRAND VOICE:\s*(.+)/i);
        
        if (uspMatch) {
            const uspField = document.getElementById('usp');
            if (uspField) {
                uspField.value = uspMatch[1].trim();
            }
        }
        
        if (targetAudienceMatch) {
            const targetAudienceField = document.getElementById('targetAudience');
            if (targetAudienceField) {
                targetAudienceField.value = targetAudienceMatch[1].trim();
            }
        }
        
        if (brandVoiceMatch) {
            const voices = brandVoiceMatch[1].split(',').map(v => v.trim().toLowerCase());
            voices.forEach(voice => {
                const checkbox = document.querySelector(`input[name="brandVoice"][value="${voice}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    }

    // Test proxy connection
    async testProxyConnection() {
        const testBtn = document.getElementById('testProxyBtn');
        const originalText = testBtn.innerHTML;
        testBtn.innerHTML = '<span class="spinner"></span> Testing...';
        testBtn.disabled = true;
        
        try {
            const response = await window.authHelper.authenticatedFetch(`${this.baseUrl}/health`);
            
            if (response.ok) {
                alert('✅ Proxy server is working correctly!');
            } else {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
        } catch (error) {
            console.error('Proxy test error:', error);
            alert(`❌ Proxy server connection failed: ${error.message}\n\nMake sure to run: npm start`);
        } finally {
            testBtn.innerHTML = originalText;
            testBtn.disabled = false;
        }
    }

    // Handle form submit
    handleFormSubmit(event) {
        event.preventDefault();
        console.log('Form submitted - handling via guide generation');
        
        // Trigger guide generation instead of form submission
        if (window.guideGeneration) {
            window.guideGeneration.generateCompleteGuide();
        }
    }
}

// Export for use in main application
window.FormHandler = FormHandler;