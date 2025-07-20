// Extraction Statistics Tracker
// Records and tracks extraction performance over time

const fs = require('fs');
const path = require('path');

class ExtractionStatsTracker {
    constructor() {
        this.statsFile = path.join(__dirname, '../data/extraction-stats-history.json');
        this.currentRun = {
            testRunId: this.generateRunId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            summary: {},
            platforms: {
                shopify: {},
                woocommerce: {}
            },
            domainResults: []
        };
        
        // Load historical data
        this.history = this.loadHistory();
    }
    
    generateRunId() {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const runNumber = this.getNextRunNumber(dateStr);
        return `${dateStr}-${String(runNumber).padStart(3, '0')}`;
    }
    
    getNextRunNumber(dateStr) {
        if (!this.history || this.history.length === 0) return 1;
        
        const runsToday = this.history.filter(run => 
            run.testRunId.startsWith(dateStr)
        );
        
        return runsToday.length + 1;
    }
    
    loadHistory() {
        try {
            if (fs.existsSync(this.statsFile)) {
                return JSON.parse(fs.readFileSync(this.statsFile, 'utf8'));
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
        return [];
    }
    
    /**
     * Record extraction result for a domain
     */
    recordDomainResult(result) {
        const domainStat = {
            domain: result.domain,
            platform: result.platform,
            detectionSuccess: result.detectionSuccess || false,
            extractionSuccess: result.success || false,
            productsExtracted: result.productsExtracted || 0,
            
            metrics: {
                mainDescriptionChars: result.descriptionLength || 0,
                tabContentChars: 0, // TODO: implement tab detection
                featureListChars: 0, // TODO: implement feature detection
                totalCharsExtracted: result.descriptionLength || 0,
                totalWordsExtracted: result.wordCount || 0,
                estimatedTotalChars: result.estimatedTotal || result.descriptionLength || 0,
                captureRate: this.calculateCaptureRate(result),
                qualityScore: this.calculateQualityScore(result),
                qualityLabel: result.quality || 'unknown'
            },
            
            contentSources: {
                captured: result.capturedSources || ['main_description'],
                missed: result.missedSources || ['unknown']
            },
            
            workingSelectors: result.workingSelectors || [],
            issues: result.issues || [],
            
            sampleProduct: result.sampleProduct || null
        };
        
        this.currentRun.domainResults.push(domainStat);
        return domainStat;
    }
    
    calculateCaptureRate(result) {
        if (!result.estimatedTotal || result.estimatedTotal === 0) {
            return result.descriptionLength > 600 ? 75 : 50; // Estimate
        }
        return Math.round((result.descriptionLength / result.estimatedTotal) * 100);
    }
    
    calculateQualityScore(result) {
        let score = 0;
        
        // Length-based scoring
        if (result.descriptionLength >= 1200) score += 2;
        else if (result.descriptionLength >= 800) score += 1.5;
        else if (result.descriptionLength >= 600) score += 1;
        else if (result.descriptionLength >= 400) score += 0.5;
        
        // Success-based scoring
        if (result.success) score += 1;
        if (result.detectionSuccess) score += 0.5;
        
        // Quality label bonus
        if (result.quality === 'excellent') score += 1.5;
        else if (result.quality === 'good') score += 1;
        else if (result.quality === 'fair') score += 0.5;
        
        return Math.min(Math.round(score), 5);
    }
    
    /**
     * Calculate summary statistics
     */
    calculateSummary() {
        const results = this.currentRun.domainResults;
        const successful = results.filter(r => r.extractionSuccess);
        
        this.currentRun.summary = {
            totalDomainsTested: results.length,
            successfulExtractions: successful.length,
            failedExtractions: results.length - successful.length,
            averageCharsExtracted: this.average(successful.map(r => r.metrics.totalCharsExtracted)),
            averageWordsExtracted: this.average(successful.map(r => r.metrics.totalWordsExtracted)),
            averageCaptureRate: this.average(successful.map(r => r.metrics.captureRate)),
            overallQuality: this.getOverallQuality(successful)
        };
        
        // Platform-specific stats
        ['shopify', 'woocommerce'].forEach(platform => {
            const platformResults = results.filter(r => r.platform === platform);
            const platformSuccess = platformResults.filter(r => r.extractionSuccess);
            
            this.currentRun.platforms[platform] = {
                domainsTestedCount: platformResults.length,
                detectionAccuracy: this.percentage(
                    platformResults.filter(r => r.detectionSuccess).length,
                    platformResults.length
                ),
                extractionSuccessRate: this.percentage(
                    platformSuccess.length,
                    platformResults.length
                ),
                averageCharsExtracted: this.average(platformSuccess.map(r => r.metrics.totalCharsExtracted)),
                averageWordsExtracted: this.average(platformSuccess.map(r => r.metrics.totalWordsExtracted)),
                averageQualityScore: this.average(platformSuccess.map(r => r.metrics.qualityScore)),
                commonFailureReasons: this.getCommonIssues(platformResults)
            };
        });
    }
    
    /**
     * Compare with previous run
     */
    compareWithPrevious() {
        if (this.history.length === 0) return;
        
        const previousRun = this.history[this.history.length - 1];
        
        this.currentRun.comparison = {
            previousRunId: previousRun.testRunId,
            improvements: {
                captureRateChange: this.currentRun.summary.averageCaptureRate - 
                    (previousRun.summary.averageCaptureRate || 0),
                qualityScoreChange: this.average(
                    this.currentRun.domainResults.map(r => r.metrics.qualityScore)
                ) - this.average(
                    previousRun.domainResults.map(r => r.metrics.qualityScore || 0)
                ),
                newSelectorsAdded: 0, // TODO: track selector changes
                issuesResolved: 0 // TODO: track issue resolution
            },
            regressions: {
                domainsNowFailing: this.findRegressions(previousRun),
                selectorsNoLongerWorking: [] // TODO: implement
            }
        };
    }
    
    /**
     * Generate recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        const results = this.currentRun.domainResults;
        
        // Check for low capture rates
        const lowCaptureRates = results.filter(r => 
            r.metrics.captureRate < 50 && r.extractionSuccess
        );
        
        if (lowCaptureRates.length > 0) {
            recommendations.push({
                priority: 'high',
                type: 'selector',
                description: 'Add tab and accordion content extraction',
                affectedDomains: lowCaptureRates.map(r => r.domain)
            });
        }
        
        // Check for missing feature lists
        const missingFeatures = results.filter(r =>
            r.contentSources.missed.includes('feature_lists')
        );
        
        if (missingFeatures.length > 3) {
            recommendations.push({
                priority: 'medium',
                type: 'selector',
                description: 'Implement feature list extraction',
                affectedDomains: missingFeatures.map(r => r.domain).slice(0, 5)
            });
        }
        
        this.currentRun.recommendations = recommendations;
    }
    
    /**
     * Save current run and generate report
     */
    saveRun() {
        this.calculateSummary();
        this.compareWithPrevious();
        this.generateRecommendations();
        
        // Add to history
        this.history.push(this.currentRun);
        
        // Save to file
        fs.writeFileSync(
            this.statsFile,
            JSON.stringify(this.history, null, 2)
        );
        
        console.log(`\n📊 Stats saved: ${this.currentRun.testRunId}`);
        
        return this.currentRun;
    }
    
    /**
     * Generate progress report
     */
    generateProgressReport() {
        if (this.history.length < 2) {
            return "Not enough data for progress tracking yet.";
        }
        
        const recent = this.history.slice(-5); // Last 5 runs
        const report = [];
        
        report.push('📈 EXTRACTION PROGRESS REPORT');
        report.push('=' .repeat(50));
        
        // Capture rate trend
        const captureRates = recent.map(r => ({
            run: r.testRunId,
            rate: r.summary.averageCaptureRate
        }));
        
        report.push('\nCapture Rate Trend:');
        captureRates.forEach(r => {
            const bar = '█'.repeat(Math.round(r.rate / 5));
            report.push(`${r.run}: ${bar} ${r.rate}%`);
        });
        
        // Quality score trend
        report.push('\nQuality Score Trend:');
        recent.forEach(r => {
            const avgQuality = this.average(
                r.domainResults.map(d => d.metrics.qualityScore)
            );
            const stars = '⭐'.repeat(Math.round(avgQuality));
            report.push(`${r.testRunId}: ${stars} (${avgQuality.toFixed(1)}/5)`);
        });
        
        // Latest improvements
        const latest = this.currentRun;
        if (latest.comparison && latest.comparison.improvements) {
            report.push('\nLatest Changes:');
            report.push(`Capture Rate: ${latest.comparison.improvements.captureRateChange > 0 ? '+' : ''}${latest.comparison.improvements.captureRateChange.toFixed(1)}%`);
            report.push(`Quality Score: ${latest.comparison.improvements.qualityScoreChange > 0 ? '+' : ''}${latest.comparison.improvements.qualityScoreChange.toFixed(1)}`);
        }
        
        return report.join('\n');
    }
    
    // Utility methods
    average(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }
    
    percentage(part, whole) {
        if (whole === 0) return 0;
        return Math.round((part / whole) * 100);
    }
    
    getOverallQuality(results) {
        const avgScore = this.average(results.map(r => r.metrics.qualityScore));
        if (avgScore >= 4) return 'excellent';
        if (avgScore >= 3) return 'good';
        if (avgScore >= 2) return 'fair';
        return 'poor';
    }
    
    getCommonIssues(results) {
        const issues = results.flatMap(r => r.issues);
        const issueCounts = {};
        
        issues.forEach(issue => {
            issueCounts[issue] = (issueCounts[issue] || 0) + 1;
        });
        
        return Object.entries(issueCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([issue]) => issue);
    }
    
    findRegressions(previousRun) {
        const previousSuccess = previousRun.domainResults
            .filter(r => r.extractionSuccess)
            .map(r => r.domain);
            
        const currentFailed = this.currentRun.domainResults
            .filter(r => !r.extractionSuccess)
            .map(r => r.domain);
            
        return previousSuccess.filter(domain => currentFailed.includes(domain));
    }
}

module.exports = ExtractionStatsTracker;