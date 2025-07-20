// SEO Content Guide Generator
// Transforms competitor analysis into actionable content creation guides

const ContentPatternAnalyzer = require('./content-pattern-analyzer');
const KeywordOpportunityMapper = require('./keyword-opportunity-mapper');
const TemplateGenerator = require('./template-generator');
const GuideFormatter = require('./guide-formatter');
const fs = require('fs').promises;
const path = require('path');

class GuideGenerator {
    constructor() {
        this.patternAnalyzer = new ContentPatternAnalyzer();
        this.keywordMapper = new KeywordOpportunityMapper();
        this.templateGenerator = new TemplateGenerator();
        this.formatter = new GuideFormatter();
    }
    
    /**
     * Generate comprehensive SEO content guide from competitor data
     * @param {Object} competitorData - Analyzed competitor product data
     * @param {Object} brandInfo - Target brand information
     * @param {Object} serpData - SERP and keyword data from DataForSEO
     * @returns {Object} Complete content guide
     */
    async generateGuide(competitorData, brandInfo, serpData) {
        console.log('🎯 Generating SEO Content Guide...');
        
        try {
            // Step 1: Analyze content patterns from competitors
            const patterns = await this.patternAnalyzer.analyze(competitorData);
            console.log(`✅ Identified ${patterns.winningFormulas.length} winning content patterns`);
            
            // Step 2: Map keyword opportunities
            const opportunities = await this.keywordMapper.mapOpportunities(
                patterns,
                { ...serpData, brandInfo },
                brandInfo
            );
            console.log(`✅ Found ${opportunities.totalSearchVolume.toLocaleString()} monthly searches`);
            
            // Step 3: Generate content templates
            const templates = await this.templateGenerator.createTemplates(
                patterns,
                opportunities,
                brandInfo
            );
            console.log(`✅ Created ${templates.length} content templates`);
            
            // Step 4: Format complete guide
            const guide = await this.formatter.formatGuide({
                brandInfo,
                patterns,
                opportunities,
                templates,
                competitorData,
                generatedDate: new Date().toISOString()
            });
            
            // Save guide
            await this.saveGuide(guide, brandInfo);
            
            return {
                success: true,
                guide,
                summary: {
                    totalOpportunities: opportunities.keywords.length,
                    totalSearchVolume: opportunities.totalSearchVolume,
                    templatesCreated: templates.length,
                    competitorsAnalyzed: competitorData.length,
                    avgDescriptionLength: patterns.metrics.avgLength
                }
            };
            
        } catch (error) {
            console.error('❌ Guide generation failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Save guide to file system
     */
    async saveGuide(guide, brandInfo) {
        const guidesPath = path.join(__dirname, '../../generated-guides');
        await fs.mkdir(guidesPath, { recursive: true });
        
        const filename = `${brandInfo.name.replace(/\s+/g, '-')}-SEO-Guide-${new Date().toISOString().split('T')[0]}.md`;
        const filepath = path.join(guidesPath, filename);
        
        await fs.writeFile(filepath, guide.markdown);
        console.log(`📄 Guide saved: ${filepath}`);
        
        // Also save JSON version for programmatic access
        const jsonPath = filepath.replace('.md', '.json');
        await fs.writeFile(jsonPath, JSON.stringify(guide.data, null, 2));
        
        return { markdown: filepath, json: jsonPath };
    }
    
    /**
     * Generate guide from form submission
     */
    async generateFromForm(formData) {
        // This integrates with existing form workflow
        const { keyword, geoTarget, competitors } = formData;
        
        console.log(`🚀 Starting guide generation for "${keyword}" in ${geoTarget}`);
        
        // Use existing competitor analysis
        const competitorData = competitors.map(comp => ({
            domain: comp.domain,
            products: comp.products,
            platform: comp.platform,
            extractionMetrics: comp.extractionMetrics
        }));
        
        // Generate brand info from form
        const brandInfo = {
            name: formData.brandName || keyword.split(' ')[0],
            industry: keyword,
            targetMarket: geoTarget,
            currentProducts: formData.currentProducts || []
        };
        
        // Use SERP data
        const serpData = {
            keyword,
            searchVolume: formData.searchVolume,
            relatedKeywords: formData.relatedKeywords || [],
            competitorRankings: formData.rankings || []
        };
        
        return await this.generateGuide(competitorData, brandInfo, serpData);
    }
}

module.exports = GuideGenerator;