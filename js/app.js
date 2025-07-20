// Main Application Entry Point
// Initializes all modules and coordinates the application

class ProductGuideApp {
    constructor() {
        this.modules = {};
        this.initialized = false;
    }

    // Initialize the application
    async init() {
        if (this.initialized) return;

        console.log('🚀 Initializing Product Description Guide Builder...');

        try {
            // Initialize modules
            await this.initializeModules();
            
            // Setup global event handlers
            this.setupGlobalEvents();
            
            // Setup cache busting
            this.setupCacheBusting();
            
            // Initialize header components
            this.initializeHeader();
            
            console.log('✅ Application initialized successfully');
            this.initialized = true;
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.showInitializationError(error);
        }
    }

    // Initialize all modules
    async initializeModules() {
        console.log('📦 Loading modules...');

        // Initialize Form Handler
        if (typeof FormHandler !== 'undefined') {
            this.modules.formHandler = new FormHandler();
            this.modules.formHandler.init();
            console.log('✅ Form Handler initialized');
        }

        // Initialize Competitor Analysis
        if (typeof CompetitorAnalysis !== 'undefined') {
            this.modules.competitorAnalysis = new CompetitorAnalysis();
            // Make it globally available for form handler
            window.competitorAnalysis = this.modules.competitorAnalysis;
            console.log('✅ Competitor Analysis initialized');
        }

        // Initialize Guide Generation
        if (typeof GuideGeneration !== 'undefined') {
            this.modules.guideGeneration = new GuideGeneration();
            this.modules.guideGeneration.init();
            // Make it globally available for form handler
            window.guideGeneration = this.modules.guideGeneration;
            console.log('✅ Guide Generation initialized');
        }

        console.log('📦 All modules loaded successfully');
    }

    // Setup global event handlers
    setupGlobalEvents() {
        // Handle errors gracefully
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });

        // Handle visibility changes (for cleanup)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📱 Application hidden - pausing operations');
                this.pauseOperations();
            } else {
                console.log('📱 Application visible - resuming operations');
                this.resumeOperations();
            }
        });
    }

    // Setup cache busting
    setupCacheBusting() {
        // Add cache-busting meta tags
        const meta = document.createElement('meta');
        meta.httpEquiv = 'cache-control';
        meta.content = 'no-cache, no-store, must-revalidate';
        document.head.appendChild(meta);

        const meta2 = document.createElement('meta');
        meta2.httpEquiv = 'pragma';
        meta2.content = 'no-cache';
        document.head.appendChild(meta2);

        const meta3 = document.createElement('meta');
        meta3.httpEquiv = 'expires';
        meta3.content = '0';
        document.head.appendChild(meta3);

        // Add timestamp to prevent browser caching
        const timestamp = Date.now();
        console.log(`🔄 Cache busting active: ${timestamp}`);
    }

    // Show initialization error
    showInitializationError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee2e2;
            color: #991b1b;
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid #fecaca;
            max-width: 300px;
            z-index: 9999;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        `;
        
        errorDiv.innerHTML = `
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem;">⚠️ Initialization Error</h4>
            <p style="margin: 0; font-size: 0.875rem;">${error.message}</p>
            <button onclick="this.parentElement.remove()" style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                Close
            </button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
    }

    // Handle global errors
    handleGlobalError(error) {
        // Log error for debugging
        console.error('Handling global error:', error);
        
        // Show user-friendly error message
        const errorMessage = error.message || 'An unexpected error occurred';
        
        // Create error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #fef3c7;
            color: #92400e;
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid #fcd34d;
            max-width: 400px;
            z-index: 9999;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: start; gap: 0.5rem;">
                <span style="font-size: 1.25rem;">⚠️</span>
                <div>
                    <h4 style="margin: 0 0 0.25rem 0; font-size: 0.875rem; font-weight: 600;">Something went wrong</h4>
                    <p style="margin: 0; font-size: 0.75rem;">${errorMessage}</p>
                </div>
                <button onclick="this.closest('div').remove()" style="margin-left: auto; padding: 0.25rem; background: none; border: none; cursor: pointer; font-size: 1rem;">✕</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Pause operations when app is hidden
    pauseOperations() {
        // Could pause timers, cancel ongoing requests, etc.
        // For now, just log the event
        console.log('⏸️ Operations paused');
    }

    // Resume operations when app is visible
    resumeOperations() {
        // Could resume timers, retry failed requests, etc.
        // For now, just log the event
        console.log('▶️ Operations resumed');
    }

    // Get module instance
    getModule(name) {
        return this.modules[name];
    }

    // Check if module is available
    hasModule(name) {
        return name in this.modules;
    }

    // Initialize header components
    initializeHeader() {
        console.log('🎯 Initializing header components...');
        
        // Update last updated time
        const lastUpdatedEl = document.getElementById('lastUpdated');
        if (lastUpdatedEl) {
            const now = new Date();
            const formatDate = now.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            lastUpdatedEl.textContent = `Last updated: ${formatDate}`;
        }
        
        // Check proxy status
        this.checkProxyStatus();
        
        // Setup admin mode
        this.setupAdminMode();
        
        console.log('✅ Header components initialized');
    }
    
    // Check proxy server status
    async checkProxyStatus() {
        const proxyStatusDot = document.getElementById('proxyStatusDot');
        const proxyStatusText = document.getElementById('proxyStatusText');
        
        try {
            const response = await fetch('http://localhost:3001/health', {
                method: 'GET',
                mode: 'cors'
            });
            
            if (response.ok) {
                proxyStatusDot.style.backgroundColor = '#00D4AA';
                proxyStatusText.textContent = 'Proxy: Connected';
                console.log('✅ Proxy server is connected');
            } else {
                throw new Error('Proxy not responding');
            }
        } catch (error) {
            proxyStatusDot.style.backgroundColor = '#FF5B49';
            proxyStatusText.textContent = 'Proxy: Disconnected';
            console.error('❌ Proxy server not available:', error);
        }
    }
    
    // Setup admin mode functionality
    setupAdminMode() {
        // Check for admin mode in URL
        const urlParams = new URLSearchParams(window.location.search);
        const isAdminMode = urlParams.get('admin') === 'true';
        
        if (isAdminMode) {
            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel) {
                adminPanel.style.display = 'block';
                console.log('🔧 Admin mode activated');
                
                // Auto-load sample keyword data for demo
                this.loadSampleKeywordData();
            }
            
            // Show admin test link
            const adminLink = document.getElementById('adminTestLink');
            if (adminLink) {
                adminLink.style.display = 'block';
            }
            
            // Setup auto-fill button
            const autoFillBtn = document.getElementById('autoFillBtn');
            if (autoFillBtn) {
                autoFillBtn.addEventListener('click', () => this.autoFillWildDonkeyData());
            }
        }
    }
    
    // Load keyword data for demo
    loadSampleKeywordData() {
        console.log('📊 Loading keyword data...');
        
        // Keyword TSV data
        const sampleTsvData = `Keyword\tSearch Volume\tKeyword Difficulty\tCPC\tCompetition
sustainable shoes\t14800\t45\t2.50\t0.8
eco friendly footwear\t8100\t40\t2.20\t0.7
ethical sneakers\t4400\t35\t1.90\t0.6
vegan shoes\t6600\t38\t2.10\t0.7
recycled shoes\t2400\t30\t1.80\t0.5`;
        
        // Parse the TSV data
        const lines = sampleTsvData.split('\n');
        const headers = lines[0].split('\t');
        const parsedData = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split('\t');
            const row = {};
            headers.forEach((header, index) => {
                // Keep original header names for compatibility
                row[header] = values[index];
            });
            parsedData.push(row);
        }
        
        // Set the data globally so Find Competitors can use it
        window.parsedKeywordData = parsedData;
        window.originalTsvData = sampleTsvData;
        
        console.log('✅ Keyword data loaded:', parsedData.length, 'keywords');
        this.showNotification('Keywords loaded successfully!', 'success');
    }
    
    // Auto-fill Wild Donkey test data
    autoFillWildDonkeyData() {
        console.log('🦓 Auto-filling Wild Donkey test data...');
        
        // Brand Basics
        const brandName = document.getElementById('brandName');
        if (brandName) brandName.value = 'Wild Donkey';
        
        const websiteUrl = document.getElementById('websiteUrl');
        if (websiteUrl) websiteUrl.value = 'https://wilddonkeycompany.com';
        
        const aboutUrl = document.getElementById('aboutUrl');
        if (aboutUrl) aboutUrl.value = 'https://wilddonkeycompany.com/pages/about-us';
        
        const industry = document.getElementById('industry');
        if (industry) industry.value = 'fashion-apparel';
        
        // Trigger change event to update any dependent fields
        if (industry) {
            const event = new Event('change', { bubbles: true });
            industry.dispatchEvent(event);
        }
        
        // Show success notification
        this.showNotification('✅ Wild Donkey test data loaded successfully!', 'success');
    }
    
    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#D1FAE5' : '#FEF3C7'};
            color: ${type === 'success' ? '#065F46' : '#92400E'};
            padding: 1rem 1.5rem;
            border-radius: 8px;
            border: 1px solid ${type === 'success' ? '#6EE7B7' : '#FCD34D'};
            max-width: 300px;
            z-index: 9999;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; padding: 0.25rem; background: none; border: none; cursor: pointer; font-size: 1rem;">✕</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    // Destroy the application
    destroy() {
        console.log('🔄 Destroying application...');
        
        // Clean up modules
        Object.values(this.modules).forEach(module => {
            if (module.destroy && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        this.modules = {};
        this.initialized = false;
        
        console.log('✅ Application destroyed');
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM loaded, initializing application...');
    
    // Create global app instance
    window.app = new ProductGuideApp();
    
    // Initialize the application
    await window.app.init();
    
    // Add development helpers
    if (window.location.search.includes('debug=true')) {
        console.log('🐛 Debug mode enabled');
        window.debug = {
            app: window.app,
            modules: window.app.modules,
            formData: () => window.app.modules.formHandler?.collectFormData(),
            competitorAnalysis: () => window.competitorAnalysis,
            guideGeneration: () => window.guideGeneration
        };
        console.log('🔧 Debug tools available at window.debug');
    }
});

// Export for global access
window.ProductGuideApp = ProductGuideApp;