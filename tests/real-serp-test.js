// Real SERP Product Description Analysis Test
// Uses DataForSEO to get real domains and test the complete workflow

const CompetitorProductAnalyzer = require('../utils/competitor-product-analyzer.js');
const fs = require('fs').promises;

class RealSERPTest {
    constructor() {
        this.analyzer = new CompetitorProductAnalyzer();
        this.apiKey = null;
        this.proxyUrl = 'http://localhost:3001';
        this.testQueries = [
            'buy running shoes online',
            'organic cotton t-shirts',
            'mens hair styling wax',
            'premium yoga mats',
            'wireless noise cancelling headphones',
            'espresso coffee makers',
            'interactive dog toys',
            'ceramic plant pots',
            'whey protein powder',
            'polarized sunglasses'
        ];
    }

    // Load API key from server config
    async loadAPIKey() {
        try {
            const apiContent = await fs.readFile('./server/API.txt', 'utf8');
            const lines = apiContent.split('\n');
            
            for (const line of lines) {
                if (line.includes('DATAFORSEO_API_KEY')) {
                    this.apiKey = line.split('=')[1].trim();
                    console.log('✅ DataForSEO API key loaded');
                    return true;
                }
            }
        } catch (error) {
            console.error('❌ Failed to load API key:', error.message);
        }
        return false;
    }

    // Get real SERP data from DataForSEO
    async getRealSERPData(query) {
        console.log(`\n🔍 Getting real SERP data for: "${query}"`);
        
        const payload = [{
            keyword: query,
            location_code: 2840, // US
            language_code: "en",
            device: "desktop",
            os: "windows",
            depth: 20
        }];

        try {
            const response = await fetch(`${this.proxyUrl}/dataforseo-serp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ payload })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.data?.tasks?.[0]?.result?.[0]?.items) {
                const items = data.data.tasks[0].result[0].items;
                const organicResults = items.filter(item => 
                    item.type === 'organic' && 
                    item.domain &&
                    !item.domain.includes('amazon.com') && // Skip marketplaces for better testing
                    !item.domain.includes('ebay.com') &&
                    !item.domain.includes('walmart.com')
                );
                
                console.log(`📊 Found ${organicResults.length} organic results`);
                
                return organicResults.map(item => ({
                    domain: item.domain,
                    url: item.url,
                    title: item.title,
                    position: item.rank_absolute
                }));
            }
        } catch (error) {
            console.error('❌ SERP fetch failed:', error.message);
        }
        
        return [];
    }

    // Select a suitable domain for testing
    selectTestDomain(serpResults) {
        if (serpResults.length === 0) {
            throw new Error('No suitable domains found in SERP');
        }

        // Prefer domains that are likely e-commerce sites
        const ecommerceKeywords = ['shop', 'store', 'buy', 'products', 'collection'];
        
        // Score domains based on likelihood of being e-commerce
        const scoredDomains = serpResults.map(result => {
            let score = 10 - result.position; // Higher position = higher score
            
            // Check if URL or title contains e-commerce keywords
            const urlLower = result.url.toLowerCase();
            const titleLower = result.title.toLowerCase();
            
            ecommerceKeywords.forEach(keyword => {
                if (urlLower.includes(keyword)) score += 2;
                if (titleLower.includes(keyword)) score += 1;
            });
            
            return { ...result, score };
        });

        // Sort by score and pick from top 3
        scoredDomains.sort((a, b) => b.score - a.score);
        const topCandidates = scoredDomains.slice(0, 3);
        const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
        
        console.log(`\n✅ Selected domain: ${selected.domain}`);
        console.log(`   Position: #${selected.position}`);
        console.log(`   Title: ${selected.title}`);
        console.log(`   Score: ${selected.score}`);
        
        return selected.domain;
    }

    // Run the complete real-world test
    async runRealWorldTest() {
        console.log('🚀 Starting Real-World Product Description Analysis Test');
        console.log('=' .repeat(70));
        
        // Load API key
        if (!await this.loadAPIKey()) {
            console.error('Cannot proceed without API key');
            return;
        }

        // Select random query
        const query = this.testQueries[Math.floor(Math.random() * this.testQueries.length)];
        console.log(`\n🎯 Test Query: "${query}"`);
        
        try {
            // Step 1: Get real SERP data
            const serpResults = await this.getRealSERPData(query);
            
            if (serpResults.length === 0) {
                throw new Error('No suitable domains found in SERP results');
            }

            // Display SERP results
            console.log(`\n📋 Top domains from SERP:`);
            serpResults.slice(0, 10).forEach(result => {
                console.log(`   #${result.position}: ${result.domain} - ${result.title}`);
            });
            
            // Step 2: Select domain for testing
            const testDomain = this.selectTestDomain(serpResults);
            
            // Step 3: Check knowledge base before analysis
            console.log(`\n📚 Checking knowledge base for ${testDomain}...`);
            const kbData = await this.checkKnowledgeBase(testDomain);
            
            // Step 4: Run product analysis
            console.log(`\n🔬 Analyzing products on ${testDomain}...`);
            console.log('-'.repeat(50));
            
            const startTime = Date.now();
            const result = await this.analyzer.analyzeCompetitor(testDomain);
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            
            // Step 5: Check knowledge base after analysis
            console.log(`\n📚 Checking knowledge base updates...`);
            const kbDataAfter = await this.checkKnowledgeBase(testDomain);
            
            // Step 6: Generate comprehensive report
            await this.generateComprehensiveReport({
                query,
                domain: testDomain,
                serpResults,
                analysisResult: result,
                duration,
                kbBefore: kbData,
                kbAfter: kbDataAfter
            });
            
        } catch (error) {
            console.error('\n❌ Test failed:', error.message);
            console.error(error.stack);
        }
    }

    // Check knowledge base for domain patterns
    async checkKnowledgeBase(domain) {
        try {
            const kbPath = './utils/knowledge-base.json';
            const kbContent = await fs.readFile(kbPath, 'utf8');
            const kb = JSON.parse(kbContent);
            
            const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
            
            if (kb.domains && kb.domains[cleanDomain]) {
                console.log(`   ✅ Domain found in KB`);
                console.log(`   Platform: ${kb.domains[cleanDomain].platform || 'unknown'}`);
                console.log(`   Successes: ${kb.domains[cleanDomain].successes || 0}`);
                console.log(`   Failures: ${kb.domains[cleanDomain].failures || 0}`);
                return kb.domains[cleanDomain];
            } else {
                console.log(`   ℹ️ Domain not in knowledge base`);
                return null;
            }
        } catch (error) {
            console.log(`   ⚠️ Knowledge base not found or error: ${error.message}`);
            return null;
        }
    }

    // Generate comprehensive test report
    async generateComprehensiveReport(data) {
        const { query, domain, serpResults, analysisResult, duration, kbBefore, kbAfter } = data;
        
        console.log('\n' + '='.repeat(70));
        console.log('📊 COMPREHENSIVE TEST REPORT');
        console.log('='.repeat(70));
        
        // Test Summary
        console.log(`\n📋 Test Summary:`);
        console.log(`   Query: "${query}"`);
        console.log(`   Domain: ${domain}`);
        console.log(`   Duration: ${duration}s`);
        console.log(`   Status: ${analysisResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        // SERP Analysis
        console.log(`\n🔍 SERP Analysis:`);
        console.log(`   Total organic results: ${serpResults.length}`);
        console.log(`   Domain position: #${serpResults.find(r => r.domain === domain)?.position || 'N/A'}`);
        
        // Knowledge Base Changes
        console.log(`\n📚 Knowledge Base Updates:`);
        if (!kbBefore && kbAfter) {
            console.log(`   ✅ NEW: Domain added to knowledge base`);
            console.log(`   Platform detected: ${kbAfter.platform || 'unknown'}`);
        } else if (kbBefore && kbAfter) {
            console.log(`   📈 UPDATED: Pattern learning improved`);
            console.log(`   Successes: ${kbBefore.successes || 0} → ${kbAfter.successes || 0}`);
            console.log(`   Failures: ${kbBefore.failures || 0} → ${kbAfter.failures || 0}`);
        }
        
        // Analysis Results
        if (analysisResult.success) {
            console.log(`\n✅ Analysis Results:`);
            console.log(`   PLP Found: ${analysisResult.plpUrl || 'N/A'}`);
            console.log(`   Products Analyzed: ${analysisResult.products?.length || 0}`);
            
            if (analysisResult.products && analysisResult.products.length > 0) {
                console.log(`\n📝 Product Descriptions:`);
                analysisResult.products.forEach((product, i) => {
                    console.log(`\n   ${i + 1}. ${product.productName || 'Unknown'}`);
                    console.log(`      URL: ${product.url}`);
                    console.log(`      Description: ${product.descriptionWordCount || 0} words`);
                    if (product.mainDescription) {
                        console.log(`      Preview: ${product.mainDescription.substring(0, 100)}...`);
                    }
                });
            }
            
            // Analysis Insights
            if (analysisResult.analysis) {
                console.log(`\n💡 Analysis Insights:`);
                
                if (analysisResult.analysis.METRICS) {
                    const metrics = analysisResult.analysis.METRICS;
                    console.log(`\n   Content Metrics:`);
                    console.log(`   - Average word count: ${metrics.averageWordCount || 'N/A'}`);
                    console.log(`   - Structure type: ${metrics.descriptionStructure || 'N/A'}`);
                }
                
                if (analysisResult.analysis['TONE & STYLE']) {
                    const tone = analysisResult.analysis['TONE & STYLE'];
                    console.log(`\n   Tone & Style:`);
                    console.log(`   - Formality: ${tone.formalityLevel || 'N/A'}`);
                    console.log(`   - Emotional appeals: ${tone.emotionalAppeals || 'N/A'}`);
                    console.log(`   - Key words: ${tone.keyAdjectives?.slice(0, 5).join(', ') || 'N/A'}`);
                }
                
                if (analysisResult.analysis['BEST PRACTICES OBSERVED']) {
                    console.log(`\n   Best Practices:`);
                    const practices = analysisResult.analysis['BEST PRACTICES OBSERVED'];
                    if (Array.isArray(practices)) {
                        practices.slice(0, 3).forEach(practice => {
                            console.log(`   - ${practice}`);
                        });
                    }
                }
                
                if (analysisResult.analysis.RECOMMENDATIONS) {
                    console.log(`\n   Recommendations for Content Creation:`);
                    const recs = analysisResult.analysis.RECOMMENDATIONS;
                    if (recs.keyTakeaways) {
                        recs.keyTakeaways.slice(0, 3).forEach(rec => {
                            console.log(`   - ${rec}`);
                        });
                    }
                    if (recs.suggestedWordCount) {
                        console.log(`   - Target word count: ${recs.suggestedWordCount}`);
                    }
                }
            }
        } else {
            console.log(`\n❌ Analysis Failed:`);
            console.log(`   Error: ${analysisResult.error}`);
            if (analysisResult.plpUrl) {
                console.log(`   Attempted PLP: ${analysisResult.plpUrl}`);
            }
        }
        
        // Save detailed report
        await this.saveDetailedReport(data);
        
        console.log('\n' + '='.repeat(70));
        console.log('✅ Real-World Test Complete!');
        console.log('='.repeat(70));
    }

    // Save detailed report with all data
    async saveDetailedReport(data) {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const filename = `real-test-${data.domain.replace(/\./g, '-')}-${timestamp}.json`;
        const filepath = `./tests/reports/${filename}`;
        
        const report = {
            timestamp: new Date().toISOString(),
            test: {
                type: 'real-world-serp',
                query: data.query,
                domain: data.domain,
                duration: data.duration
            },
            serp: {
                totalResults: data.serpResults.length,
                topDomains: data.serpResults.slice(0, 10).map(r => ({
                    position: r.position,
                    domain: r.domain,
                    title: r.title
                }))
            },
            knowledgeBase: {
                before: data.kbBefore,
                after: data.kbAfter,
                learned: !data.kbBefore && data.kbAfter
            },
            analysis: data.analysisResult,
            summary: {
                success: data.analysisResult.success,
                productsFound: data.analysisResult.products?.length || 0,
                plpFound: !!data.analysisResult.plpUrl,
                hasInsights: !!data.analysisResult.analysis,
                patternLearned: !data.kbBefore && data.kbAfter
            }
        };
        
        try {
            await fs.mkdir('./tests/reports', { recursive: true });
            await fs.writeFile(filepath, JSON.stringify(report, null, 2));
            console.log(`\n📁 Detailed report saved: ${filename}`);
        } catch (error) {
            console.error('Failed to save report:', error.message);
        }
    }
}

// Run the test if called directly
if (require.main === module) {
    const test = new RealSERPTest();
    test.runRealWorldTest().catch(console.error);
}

module.exports = RealSERPTest;