// Schema for tracking extraction statistics over time

const ExtractionStatsSchema = {
    // Unique test run ID
    testRunId: 'string', // e.g., '2025-01-19-001'
    timestamp: 'ISO 8601 string',
    version: 'string', // e.g., '1.0.0'
    
    // Overall summary
    summary: {
        totalDomainsTested: 'number',
        successfulExtractions: 'number',
        failedExtractions: 'number',
        averageCharsExtracted: 'number',
        averageWordsExtracted: 'number',
        averageCaptureRate: 'number', // percentage of total content captured
        overallQuality: 'string' // excellent, good, fair, poor
    },
    
    // Platform-specific stats
    platforms: {
        shopify: {
            domainsTestedCount: 'number',
            detectionAccuracy: 'number', // percentage
            extractionSuccessRate: 'number', // percentage
            averageCharsExtracted: 'number',
            averageWordsExtracted: 'number',
            averageQualityScore: 'number', // 1-5
            commonFailureReasons: ['array of strings']
        },
        woocommerce: {
            // Same structure as shopify
        }
    },
    
    // Detailed results per domain
    domainResults: [
        {
            domain: 'string',
            platform: 'shopify|woocommerce',
            detectionSuccess: 'boolean',
            extractionSuccess: 'boolean',
            productsExtracted: 'number',
            
            // Extraction metrics
            metrics: {
                mainDescriptionChars: 'number',
                tabContentChars: 'number',
                featureListChars: 'number',
                totalCharsExtracted: 'number',
                totalWordsExtracted: 'number',
                estimatedTotalChars: 'number', // what we think is available
                captureRate: 'number', // percentage
                qualityScore: 'number', // 1-5
                qualityLabel: 'string' // excellent, good, fair, poor
            },
            
            // What we captured vs missed
            contentSources: {
                captured: [
                    'main_description',
                    'product_title',
                    'meta_description'
                ],
                missed: [
                    'tab_content',
                    'accordion_content',
                    'feature_lists',
                    'specifications'
                ]
            },
            
            // Specific selectors that worked
            workingSelectors: ['array of CSS selectors'],
            
            // Errors or issues
            issues: ['array of issue descriptions'],
            
            // Example product extracted
            sampleProduct: {
                title: 'string',
                descriptionLength: 'number',
                extractedFrom: 'string' // URL
            }
        }
    ],
    
    // Comparison with previous runs
    comparison: {
        previousRunId: 'string',
        improvements: {
            captureRateChange: 'number', // +/- percentage
            qualityScoreChange: 'number', // +/- score
            newSelectorsAdded: 'number',
            issuesResolved: 'number'
        },
        regressions: {
            domainsNowFailing: ['array of domains'],
            selectorsNoLongerWorking: ['array of selectors']
        }
    },
    
    // Recommendations for next iteration
    recommendations: [
        {
            priority: 'high|medium|low',
            type: 'selector|logic|performance',
            description: 'string',
            affectedDomains: ['array of domains']
        }
    ]
};

module.exports = ExtractionStatsSchema;