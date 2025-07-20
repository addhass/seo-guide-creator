// Guide Formatter
// Formats the complete SEO content guide in markdown and JSON

class GuideFormatter {
    constructor() {
        this.version = '1.0';
    }
    
    /**
     * Format complete guide from all components
     * @param {Object} data - All guide data
     * @returns {Object} Formatted guide in multiple formats
     */
    async formatGuide(data) {
        console.log('📦 Formatting comprehensive guide...');
        
        const guide = {
            markdown: '',
            data: data,
            summary: this.createSummary(data)
        };
        
        // Build markdown guide
        guide.markdown = this.buildMarkdown(data);
        
        return guide;
    }
    
    /**
     * Create executive summary
     */
    createSummary(data) {
        return {
            brand: data.brandInfo.name,
            industry: data.brandInfo.industry,
            totalOpportunity: data.opportunities.totalSearchVolume,
            keywordCount: data.opportunities.keywords.length,
            templatesProvided: data.templates.length,
            competitorsAnalyzed: data.competitorData.length,
            contentGaps: data.opportunities.contentGaps.length,
            estimatedPages: data.opportunities.priorityPages.length,
            generatedDate: new Date().toISOString()
        };
    }
    
    /**
     * Build complete markdown guide
     */
    buildMarkdown(data) {
        const sections = [];
        
        // Header
        sections.push(this.buildHeader(data));
        
        // Executive Summary
        sections.push(this.buildExecutiveSummary(data));
        
        // Competitive Analysis
        sections.push(this.buildCompetitiveAnalysis(data));
        
        // Keyword Opportunities
        sections.push(this.buildKeywordOpportunities(data));
        
        // Content Templates
        sections.push(this.buildContentTemplates(data));
        
        // Content Gaps
        sections.push(this.buildContentGaps(data));
        
        // Implementation Roadmap
        sections.push(this.buildRoadmap(data));
        
        // Appendix
        sections.push(this.buildAppendix(data));
        
        return sections.join('\n\n');
    }
    
    /**
     * Build header section
     */
    buildHeader(data) {
        const header = `# 🚀 ${data.brandInfo.name} - SEO Content Creation Guide

**Industry:** ${data.brandInfo.industry}  
**Target Market:** ${data.brandInfo.targetMarket}  
**Generated:** ${new Date().toLocaleDateString()}  
**Total Search Opportunity:** ${data.opportunities.totalSearchVolume.toLocaleString()} monthly searches

---`;
        
        return header;
    }
    
    /**
     * Build executive summary
     */
    buildExecutiveSummary(data) {
        const summary = `## 📈 Executive Summary

This comprehensive SEO content guide provides ${data.brandInfo.name} with a data-driven strategy to capture **${data.opportunities.totalSearchVolume.toLocaleString()} monthly searches** across ${data.opportunities.keywords.length} high-value keywords.

### Key Findings:
- **${data.competitorData.length} competitors analyzed** with average description length of ${data.patterns.metrics.avgWords} words
- **${data.patterns.winningFormulas.length} winning content formulas** identified
- **${data.opportunities.contentGaps.length} content gaps** discovered
- **${data.templates.length} ready-to-use templates** created

### Quick Wins:
${data.opportunities.priorityPages.slice(0, 3).map((page, i) => 
    `${i + 1}. Create ${page.pageType.replace(/-/g, ' ')} for "${page.primaryKeyword.keyword}" (${page.totalOpportunity.toLocaleString()} searches/month)`
).join('\n')}

### Estimated Impact:
- **Traffic Potential:** ${Math.round(data.opportunities.totalSearchVolume * 0.03).toLocaleString()} visitors/month (at 3% CTR)
- **Content Investment:** ${data.templates.length} pages × ${Math.round(data.patterns.metrics.avgWords / 100) * 100} words average
- **Timeline:** 30-60 days for full implementation`;
        
        return summary;
    }
    
    /**
     * Build competitive analysis section
     */
    buildCompetitiveAnalysis(data) {
        const analysis = [`## 🏆 Competitive Analysis

### Content Patterns Discovered:`];
        
        // Add winning formulas
        if (data.patterns.winningFormulas.length > 0) {
            analysis.push('\n#### Winning Formulas:');
            data.patterns.winningFormulas.forEach(formula => {
                analysis.push(`- **${formula.name}** (${formula.frequency}): ${formula.description}`);
            });
        }
        
        // Add structural patterns
        analysis.push('\n#### Common Content Elements:');
        const structures = data.patterns.contentStructures.frequency;
        Object.entries(structures)
            .filter(([_, data]) => data.percentage > 40)
            .sort((a, b) => b[1].percentage - a[1].percentage)
            .forEach(([element, data]) => {
                analysis.push(`- ${element}: ${data.percentage}% of competitors`);
            });
        
        // Add metrics
        analysis.push(`\n#### Content Metrics:
- Average Length: ${data.patterns.metrics.avgLength} characters (${data.patterns.metrics.avgWords} words)
- Average Sentences: ${data.patterns.metrics.avgSentences}
- Length Distribution:
  - Short (<100 words): ${data.patterns.metrics.lengthDistribution.short} products
  - Medium (100-300 words): ${data.patterns.metrics.lengthDistribution.medium} products
  - Long (>300 words): ${data.patterns.metrics.lengthDistribution.long} products`);
        
        // Add emotional triggers
        if (Object.keys(data.patterns.commonElements.emotionalTriggers).length > 0) {
            analysis.push('\n#### Emotional Triggers Used:');
            Object.entries(data.patterns.commonElements.emotionalTriggers).forEach(([trigger, info]) => {
                analysis.push(`- **${trigger}** (${info.frequency}): ${info.examples.join(', ')}`);
            });
        }
        
        return analysis.join('\n');
    }
    
    /**
     * Build keyword opportunities section
     */
    buildKeywordOpportunities(data) {
        const opportunities = [`## 🎯 Keyword Opportunities

### Total Opportunity: ${data.opportunities.totalSearchVolume.toLocaleString()} monthly searches
`];
        
        // Add category breakdown
        opportunities.push('### Opportunities by Content Type:');
        Object.entries(data.opportunities.categories)
            .filter(([_, cat]) => cat.count > 0)
            .sort((a, b) => b[1].totalVolume - a[1].totalVolume)
            .forEach(([type, category]) => {
                opportunities.push(`\n#### ${type.replace(/-/g, ' ').toUpperCase()}
- Keywords: ${category.count}
- Total Volume: ${category.totalVolume.toLocaleString()}
- Average Volume: ${category.avgVolume.toLocaleString()}`);
                
                // Show top 3 keywords
                if (category.keywords.length > 0) {
                    opportunities.push('\nTop Keywords:');
                    category.keywords.slice(0, 3).forEach((kw, i) => {
                        opportunities.push(`${i + 1}. "${kw.keyword}" - ${kw.searchVolume.toLocaleString()} searches (${kw.difficulty} difficulty)`);
                    });
                }
            });
        
        // Add priority pages
        opportunities.push('\n### 🏯 Priority Pages to Create:');
        data.opportunities.priorityPages.slice(0, 5).forEach((page, i) => {
            opportunities.push(`\n#### ${i + 1}. ${page.pageType.replace(/-/g, ' ').toUpperCase()}
- **Primary Keyword:** "${page.primaryKeyword.keyword}" (${page.primaryKeyword.searchVolume.toLocaleString()} searches)
- **Supporting Keywords:** ${page.supportingKeywords.length}
- **Total Opportunity:** ${page.totalOpportunity.toLocaleString()} searches/month
- **Estimated Traffic:** ${page.estimatedTraffic.toLocaleString()} visitors/month
- **Priority:** ${page.priority.toUpperCase()}`);
        });
        
        return opportunities.join('\n');
    }
    
    /**
     * Build content templates section
     */
    buildContentTemplates(data) {
        const templates = [`## 📝 Content Templates

Ready-to-use templates based on competitor analysis and keyword opportunities.`];
        
        data.templates.forEach((template, index) => {
            templates.push(`\n### Template ${index + 1}: ${template.title}`);
            templates.push(`**Target Keyword:** "${template.targetKeyword}"  
**Search Volume:** ${template.searchVolume.toLocaleString()} searches/month  
**Priority:** ${template.priority.toUpperCase()}\n`);
            
            // Add outline
            if (template.outline) {
                templates.push(`#### Content Outline (${template.outline.totalWords} words, ${template.outline.estimatedReadTime} read):`);
                template.outline.sections.forEach(section => {
                    templates.push(`${section.order}. **${section.name}** (${section.wordCount} words - ${section.percentage})${section.required ? ' *[Required]*' : ''}`);
                    if (section.keyPoints.length > 0) {
                        section.keyPoints.forEach(point => {
                            templates.push(`   - ${point}`);
                        });
                    }
                });
            }
            
            // Add examples
            if (template.examples && Object.keys(template.examples).length > 0) {
                templates.push('\n#### Example Content:');
                Object.entries(template.examples).forEach(([type, examples]) => {
                    if (examples.length > 0) {
                        templates.push(`\n**${type.charAt(0).toUpperCase() + type.slice(1)}:**`);
                        examples.forEach(example => {
                            templates.push(`- ${example}`);
                        });
                    }
                });
            }
            
            // Add optimization tips
            if (template.optimizationTips && template.optimizationTips.length > 0) {
                templates.push('\n#### 💡 Optimization Tips:');
                template.optimizationTips.forEach(tip => {
                    templates.push(`- **${tip.category}:** ${tip.tip} [${tip.priority}]`);
                });
            }
            
            templates.push('\n---');
        });
        
        return templates.join('\n');
    }
    
    /**
     * Build content gaps section
     */
    buildContentGaps(data) {
        if (!data.opportunities.contentGaps || data.opportunities.contentGaps.length === 0) {
            return '';
        }
        
        const gaps = [`## 🕳️ Content Gaps Analysis

Critical content missing from your current strategy:`];
        
        data.opportunities.contentGaps.forEach((gap, i) => {
            gaps.push(`\n### ${i + 1}. ${gap.type.replace(/-/g, ' ').toUpperCase()}
**Priority:** ${gap.priority.toUpperCase()}  
**Opportunity:** ${gap.opportunity}`);
            
            if (gap.keywords && gap.keywords.length > 0) {
                gaps.push(`\n**Related Keywords (${gap.keywords.reduce((sum, kw) => sum + kw.searchVolume, 0).toLocaleString()} total searches):**`);
                gap.keywords.slice(0, 5).forEach(kw => {
                    gaps.push(`- "${kw.keyword}" - ${kw.searchVolume.toLocaleString()} searches`);
                });
            }
        });
        
        return gaps.join('\n');
    }
    
    /**
     * Build implementation roadmap
     */
    buildRoadmap(data) {
        const roadmap = [`## 🗺️ Implementation Roadmap

### Phase 1: Quick Wins (Week 1-2)
Focus on high-volume, low-difficulty keywords with existing product pages.`];
        
        // Week 1-2: Update existing pages
        const quickWins = data.opportunities.keywords
            .filter(kw => kw.priority === 'critical' && kw.difficulty === 'low')
            .slice(0, 5);
        
        if (quickWins.length > 0) {
            roadmap.push('\n**Week 1-2 Tasks:**');
            quickWins.forEach((kw, i) => {
                roadmap.push(`${i + 1}. Optimize for "${kw.keyword}" (${kw.searchVolume.toLocaleString()} searches)`);
            });
        }
        
        // Week 3-4: Create new pages
        roadmap.push('\n### Phase 2: New Content Creation (Week 3-4)\nCreate high-priority pages targeting content gaps.');
        roadmap.push('\n**Week 3-4 Tasks:**');
        data.opportunities.priorityPages.slice(0, 3).forEach((page, i) => {
            roadmap.push(`${i + 1}. Create ${page.pageType.replace(/-/g, ' ')} for "${page.primaryKeyword.keyword}"`);
        });
        
        // Week 5-6: Content enhancement
        roadmap.push('\n### Phase 3: Content Enhancement (Week 5-6)\nAdd missing elements identified in competitive analysis.');
        roadmap.push('\n**Week 5-6 Tasks:**');
        if (data.opportunities.contentGaps.length > 0) {
            data.opportunities.contentGaps
                .filter(gap => gap.priority === 'high')
                .forEach((gap, i) => {
                    roadmap.push(`${i + 1}. Implement ${gap.type.replace(/-/g, ' ')}`);
                });
        }
        
        // Ongoing
        roadmap.push('\n### Phase 4: Optimization & Monitoring (Ongoing)\n- Track keyword rankings weekly\n- Monitor competitor content updates\n- A/B test content variations\n- Update content quarterly based on performance');
        
        return roadmap.join('\n');
    }
    
    /**
     * Build appendix
     */
    buildAppendix(data) {
        const appendix = [`## 📚 Appendix

### Methodology
This guide was generated using:
- **Competitor Analysis:** ${data.competitorData.length} competitor sites analyzed
- **Content Extraction:** ${data.competitorData.reduce((sum, c) => sum + (c.products?.length || 0), 0)} product descriptions analyzed
- **Pattern Recognition:** AI-powered analysis of content structures and formulas
- **Keyword Research:** DataForSEO API for search volume and competition data`];
        
        // Add glossary
        appendix.push(`\n### Glossary
- **CTR**: Click-Through Rate - percentage of searchers who click your result
- **Search Volume**: Monthly search frequency for a keyword
- **Content Gap**: Topics competitors cover that you don't
- **LSI Keywords**: Latically Semantic Indexing - related terms that help search engines understand context`);
        
        // Add next steps
        appendix.push(`\n### Next Steps
1. Review this guide with your content team
2. Prioritize templates based on your resources
3. Begin with Phase 1 quick wins
4. Track performance metrics weekly
5. Iterate based on results`);
        
        // Add footer
        appendix.push(`\n---\n
🤖 Generated by SEO Product Description Guide Builder  
Version ${this.version} | ${new Date().toISOString()}`);
        
        return appendix.join('\n');
    }
}

module.exports = GuideFormatter;