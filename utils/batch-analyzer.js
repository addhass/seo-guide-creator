// Batch Domain Analyzer
// Processes multiple domains with fault tolerance

const ShopifyPlatform = require('../modules/platforms/shopify');
const fs = require('fs').promises;
const path = require('path');

class BatchAnalyzer {
    constructor(options = {}) {
        this.maxDomains = options.maxDomains || 10;
        this.minSuccessful = options.minSuccessful || 5; // Aim for at least 5 good analyses
        this.timeout = options.timeout || 30000; // 30 second timeout per domain
        this.platforms = {
            shopify: new ShopifyPlatform(options.proxyUrl || 'http://localhost:3001')
        };
        this.results = [];
        this.issues = [];
    }
    
    /**
     * Analyze a batch of domains
     * @param {Array} domains - Array of domain strings
     * @returns {Object} Batch analysis results
     */
    async analyzeBatch(domains) {
        console.log(`\n🚀 Starting batch analysis of ${domains.length} domains`);
        console.log(`   Goal: Analyze up to ${this.maxDomains} domains`);
        console.log(`   Minimum target: ${this.minSuccessful} successful analyses\n`);
        
        const startTime = Date.now();
        let successful = 0;
        let failed = 0;
        let skipped = 0;
        
        // Process domains one by one
        for (let i = 0; i < Math.min(domains.length, this.maxDomains); i++) {
            const domain = domains[i];
            console.log(`\n📍 [${i + 1}/${Math.min(domains.length, this.maxDomains)}] Processing: ${domain}`);
            
            try {
                const result = await this.analyzeDomain(domain);
                
                if (result.success) {
                    successful++;
                    console.log(`   ✅ Success: Found ${result.productCount} products`);
                    this.results.push(result);
                } else {
                    failed++;
                    console.log(`   ⚠️  Failed: ${result.error}`);
                    this.issues.push({
                        domain,
                        issue: result.error,
                        timestamp: new Date().toISOString()
                    });
                }
                
                // Check if we've reached our minimum goal
                if (successful >= this.minSuccessful) {
                    console.log(`\n🎯 Reached minimum target of ${this.minSuccessful} successful analyses`);
                    if (i < domains.length - 1) {
                        skipped = domains.length - i - 1;
                        console.log(`   Skipping remaining ${skipped} domains to save time`);
                        break;
                    }
                }
                
            } catch (error) {
                failed++;
                console.log(`   💥 Exception: ${error.message}`);
                this.issues.push({
                    domain,
                    issue: `Exception: ${error.message}`,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Rate limiting between domains
            if (i < domains.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        // Generate summary
        const summary = {
            totalDomains: domains.length,
            processed: successful + failed,
            successful,
            failed,
            skipped,
            duration: `${duration}s`,
            successRate: successful > 0 ? ((successful / (successful + failed)) * 100).toFixed(1) + '%' : '0%',
            results: this.results,
            issues: this.issues
        };
        
        // Save issues to backlog
        if (this.issues.length > 0) {
            await this.saveIssuesToBacklog();
        }
        
        this.printSummary(summary);
        return summary;
    }
    
    /**
     * Analyze a single domain with timeout protection
     */
    async analyzeDomain(domain) {
        // Wrap in timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Analysis timeout')), this.timeout);
        });
        
        const analysisPromise = this.performAnalysis(domain);
        
        try {
            const result = await Promise.race([analysisPromise, timeoutPromise]);
            return result;
        } catch (error) {
            if (error.message === 'Analysis timeout') {
                console.log(`   ⏱️  Timeout after ${this.timeout / 1000}s`);
            }
            return {
                success: false,
                domain,
                error: error.message
            };
        }
    }
    
    /**
     * Perform the actual analysis
     */
    async performAnalysis(domain) {
        // First, detect platform by fetching homepage
        const homepageUrl = `https://${domain}`;
        const response = await fetch(`http://localhost:3001/fetch-raw-page?url=${encodeURIComponent(homepageUrl)}`);
        const data = await response.json();
        
        if (!data.success) {
            return {
                success: false,
                domain,
                error: `Failed to fetch homepage: ${data.error || 'Unknown error'}`
            };
        }
        
        // For now, assume Shopify (later we'll add platform detection)
        const result = await this.platforms.shopify.analyze(domain, data.content);
        
        if (result.success) {
            return {
                success: true,
                domain,
                platform: 'shopify',
                productCount: result.summary.productsFound,
                productsAnalyzed: result.summary.productsAnalyzed,
                plpUrl: result.plp.url,
                products: result.products.map(p => ({
                    title: p.title,
                    descriptionLength: p.description?.length || 0,
                    quality: p.extractionQuality
                }))
            };
        } else {
            return {
                success: false,
                domain,
                error: result.error,
                platform: result.detection?.detected ? 'shopify' : 'unknown'
            };
        }
    }
    
    /**
     * Save issues to backlog for future review
     */
    async saveIssuesToBacklog() {
        const backlogPath = path.join(__dirname, '../data/batch-issues.json');
        
        try {
            let existing = { issues: [] };
            try {
                const data = await fs.readFile(backlogPath, 'utf8');
                existing = JSON.parse(data);
            } catch (e) {
                // File doesn't exist yet
            }
            
            // Add new issues
            existing.issues = existing.issues.concat(this.issues);
            existing.lastUpdated = new Date().toISOString();
            
            await fs.writeFile(backlogPath, JSON.stringify(existing, null, 2));
            console.log(`\n📋 Saved ${this.issues.length} issues to backlog`);
        } catch (error) {
            console.error('Failed to save issues:', error.message);
        }
    }
    
    /**
     * Print summary of batch analysis
     */
    printSummary(summary) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 BATCH ANALYSIS SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`\n📈 Overall Results:`);
        console.log(`   Total domains provided: ${summary.totalDomains}`);
        console.log(`   Domains processed: ${summary.processed}`);
        console.log(`   ✅ Successful: ${summary.successful}`);
        console.log(`   ❌ Failed: ${summary.failed}`);
        console.log(`   ⏭️  Skipped: ${summary.skipped}`);
        console.log(`   Success rate: ${summary.successRate}`);
        console.log(`   Total time: ${summary.duration}`);
        
        if (summary.successful > 0) {
            console.log(`\n✅ Successfully analyzed domains:`);
            summary.results.forEach(result => {
                console.log(`   - ${result.domain}: ${result.productCount} products found`);
            });
        }
        
        if (summary.failed > 0) {
            console.log(`\n⚠️  Domains with issues (saved to backlog):`);
            summary.issues.forEach(issue => {
                console.log(`   - ${issue.domain}: ${issue.issue}`);
            });
        }
        
        console.log('\n💡 Strategy: Focus on domains that work well, note issues for later review');
    }
}

module.exports = BatchAnalyzer;