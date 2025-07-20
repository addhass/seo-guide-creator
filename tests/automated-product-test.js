// Automated Product Description Analysis Test
// Tests the complete workflow without user input

const CompetitorProductAnalyzer = require('../utils/competitor-product-analyzer.js');

class AutomatedProductTest {
    constructor() {
        this.analyzer = new CompetitorProductAnalyzer();
        this.testCategories = [
            'running shoes',
            'organic t-shirts',
            'mens hair wax',
            'yoga mats',
            'wireless headphones',
            'coffee makers',
            'dog toys',
            'plant pots',
            'protein powder',
            'sunglasses'
        ];
    }

    // Simulate getting domains from SERP
    async simulateSERPDomains(category) {
        console.log(`\n🔍 Simulating SERP for "${category}"...`);
        
        // Common e-commerce domains that would appear in SERPs
        const domainPools = {
            'running shoes': [
                'nike.com',
                'adidas.com',
                'asics.com',
                'brooksrunning.com',
                'newbalance.com',
                'hoka.com',
                'saucony.com',
                'allbirds.com'
            ],
            'organic t-shirts': [
                'patagonia.com',
                'prana.com',
                'tentree.com',
                'outerknown.com',
                'kotn.com',
                'everlane.com',
                'organicbasics.com'
            ],
            'mens hair wax': [
                'themancompany.com',
                'bombayshavingcompany.com',
                'beardandblade.com.au',
                'manscaped.com',
                'dollarshaveclub.com'
            ],
            'yoga mats': [
                'manduka.com',
                'jadeyoga.com',
                'liforme.com',
                'gaiam.com',
                'lululemon.com'
            ],
            'wireless headphones': [
                'bose.com',
                'sony.com',
                'sennheiser.com',
                'jbl.com',
                'beats.com',
                'anker.com'
            ],
            'coffee makers': [
                'nespresso.com',
                'keurig.com',
                'breville.com',
                'delonghi.com',
                'cuisinart.com'
            ],
            'dog toys': [
                'chewy.com',
                'petco.com',
                'petsmart.com',
                'kongcompany.com',
                'barkbox.com'
            ],
            'plant pots': [
                'thesill.com',
                'bloomscape.com',
                'plantz.com',
                'pistilsnursery.com'
            ],
            'protein powder': [
                'myprotein.com',
                'optimumnutrition.com',
                'bodybuilding.com',
                'gnc.com',
                'vitacost.com'
            ],
            'sunglasses': [
                'ray-ban.com',
                'oakley.com',
                'warbyparker.com',
                'maui-jim.com',
                'sunglasshut.com'
            ]
        };

        // Default pool for categories not in our list
        const defaultPool = [
            'amazon.com',
            'walmart.com',
            'target.com',
            'ebay.com',
            'etsy.com',
            'wayfair.com',
            'overstock.com'
        ];

        const pool = domainPools[category] || defaultPool;
        
        // Simulate ranking by shuffling and taking top results
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const topResults = shuffled.slice(0, 5);
        
        console.log(`📊 Found ${topResults.length} domains in SERP:`);
        topResults.forEach((domain, i) => {
            console.log(`   ${i + 1}. ${domain}`);
        });
        
        return topResults;
    }

    // Select a domain for testing
    selectTestDomain(domains) {
        // Prefer non-marketplace domains for better product page structures
        const preferredDomains = domains.filter(d => 
            !['amazon.com', 'ebay.com', 'walmart.com', 'alibaba.com'].includes(d)
        );
        
        const domainList = preferredDomains.length > 0 ? preferredDomains : domains;
        const selected = domainList[Math.floor(Math.random() * domainList.length)];
        
        console.log(`\n✅ Selected domain for testing: ${selected}`);
        return selected;
    }

    // Run the complete test
    async runTest() {
        console.log('🚀 Starting Automated Product Description Analysis Test');
        console.log('=' .repeat(60));
        
        // Select random category
        const category = this.testCategories[Math.floor(Math.random() * this.testCategories.length)];
        console.log(`\n📦 Test Category: "${category}"`);
        
        try {
            // Step 1: Simulate SERP and get domains
            const serpDomains = await this.simulateSERPDomains(category);
            
            // Step 2: Select a domain for testing
            const testDomain = this.selectTestDomain(serpDomains);
            
            // Step 3: Analyze the domain
            console.log(`\n🔬 Starting analysis of ${testDomain}...`);
            console.log('-'.repeat(40));
            
            const startTime = Date.now();
            const result = await this.analyzer.analyzeCompetitor(testDomain);
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            
            // Step 4: Generate test report
            this.generateTestReport(category, testDomain, result, duration);
            
        } catch (error) {
            console.error('\n❌ Test failed:', error.message);
            console.error(error.stack);
        }
    }

    // Generate detailed test report
    generateTestReport(category, domain, result, duration) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST REPORT');
        console.log('='.repeat(60));
        
        console.log(`\n📋 Test Summary:`);
        console.log(`   Category: ${category}`);
        console.log(`   Domain: ${domain}`);
        console.log(`   Duration: ${duration}s`);
        console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        if (result.success) {
            console.log(`\n🔍 Analysis Results:`);
            console.log(`   PLP Found: ${result.plpUrl || 'N/A'}`);
            console.log(`   Products Analyzed: ${result.products?.length || 0}`);
            
            if (result.products && result.products.length > 0) {
                console.log(`\n📝 Product Descriptions Found:`);
                result.products.forEach((product, i) => {
                    console.log(`\n   ${i + 1}. ${product.productName || 'Unknown Product'}`);
                    console.log(`      URL: ${product.url}`);
                    console.log(`      Word Count: ${product.descriptionWordCount || 'N/A'}`);
                    console.log(`      Has Features: ${product.features && product.features.length > 0 ? 'Yes' : 'No'}`);
                });
            }
            
            if (result.analysis) {
                console.log(`\n💡 Key Insights:`);
                
                if (result.analysis.METRICS) {
                    console.log(`\n   Metrics:`);
                    console.log(`   - Avg Word Count: ${result.analysis.METRICS.averageWordCount || 'N/A'}`);
                    console.log(`   - Structure: ${result.analysis.METRICS.descriptionStructure || 'N/A'}`);
                }
                
                if (result.analysis['TONE & STYLE']) {
                    console.log(`\n   Tone & Style:`);
                    console.log(`   - Formality: ${result.analysis['TONE & STYLE'].formalityLevel || 'N/A'}`);
                    console.log(`   - Key Words: ${result.analysis['TONE & STYLE'].keyAdjectives?.join(', ') || 'N/A'}`);
                }
                
                if (result.analysis.RECOMMENDATIONS) {
                    console.log(`\n   Recommendations:`);
                    const recs = result.analysis.RECOMMENDATIONS.keyTakeaways || [];
                    recs.forEach(rec => console.log(`   - ${rec}`));
                }
            }
        } else {
            console.log(`\n❌ Error Details:`);
            console.log(`   ${result.error}`);
            if (result.plpUrl) {
                console.log(`   Attempted PLP: ${result.plpUrl}`);
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ Test Complete!');
        console.log('='.repeat(60));
        
        // Save report to file
        this.saveTestReport(category, domain, result, duration);
    }

    // Save test report to file
    async saveTestReport(category, domain, result, duration) {
        const fs = require('fs').promises;
        const path = require('path');
        
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const filename = `test-report-${domain.replace(/\./g, '-')}-${timestamp}.json`;
        const filepath = path.join(__dirname, 'reports', filename);
        
        const report = {
            timestamp: new Date().toISOString(),
            test: {
                category,
                domain,
                duration: `${duration}s`
            },
            result,
            summary: {
                success: result.success,
                productsFound: result.products?.length || 0,
                hasAnalysis: !!result.analysis,
                plpFound: !!result.plpUrl
            }
        };
        
        try {
            // Create reports directory if it doesn't exist
            await fs.mkdir(path.join(__dirname, 'reports'), { recursive: true });
            await fs.writeFile(filepath, JSON.stringify(report, null, 2));
            console.log(`\n📁 Report saved: ${filename}`);
        } catch (error) {
            console.error('Failed to save report:', error.message);
        }
    }
}

// Run the test
if (require.main === module) {
    const test = new AutomatedProductTest();
    test.runTest().catch(console.error);
}

module.exports = AutomatedProductTest;