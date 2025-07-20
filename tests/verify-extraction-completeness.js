#!/usr/bin/env node

// Verify if we're capturing ALL product description content

const cheerio = require('cheerio');

// Test case with known full content
const testHTML = `
<div class="product-page">
    <!-- Main description -->
    <div class="product-single__description rte">
        <p>This is the main product description that we should definitely capture.</p>
        <p>It has multiple paragraphs with important SEO content.</p>
    </div>
    
    <!-- Accordion/Tab content (often missed) -->
    <div class="product-tabs">
        <div class="tab-content" data-tab="details" style="display:none;">
            <h3>Product Details</h3>
            <p>HIDDEN CONTENT: Made from 100% organic cotton</p>
            <p>HIDDEN CONTENT: Machine washable at 30°C</p>
        </div>
        <div class="tab-content" data-tab="shipping">
            <p>HIDDEN CONTENT: Free shipping on orders over $50</p>
        </div>
    </div>
    
    <!-- Features list (sometimes in separate div) -->
    <div class="product-features">
        <h3>Key Features</h3>
        <ul>
            <li>FEATURE: Moisture-wicking technology</li>
            <li>FEATURE: UV protection</li>
            <li>FEATURE: Anti-odor properties</li>
        </ul>
    </div>
    
    <!-- Collapsible sections -->
    <div class="accordion">
        <div class="accordion__content collapsed">
            <p>COLLAPSED: Detailed care instructions here</p>
            <p>COLLAPSED: Warranty information</p>
        </div>
    </div>
    
    <!-- Meta/SEO description -->
    <meta name="description" content="META: This is the meta description">
    
    <!-- JSON-LD data -->
    <script type="application/ld+json">
    {
        "@type": "Product",
        "description": "JSON-LD: Complete product description from structured data"
    }
    </script>
</div>
`;

console.log('🔍 EXTRACTION COMPLETENESS VERIFICATION\n');
console.log('Testing what content we capture vs. what we miss:\n');

// Load test HTML
const $ = cheerio.load(testHTML);

// What our current extractor would get
const mainDescription = $('.product-single__description').text().trim();
console.log('✅ CAPTURED (Main Description):');
console.log(`   "${mainDescription}"`);
console.log(`   Length: ${mainDescription.length} characters\n`);

// What we might miss
console.log('❌ POTENTIALLY MISSED:\n');

// Hidden tab content
$('.tab-content').each((i, el) => {
    const tabContent = $(el).text().trim();
    if (tabContent.includes('HIDDEN')) {
        console.log(`   Tab ${i + 1}: "${tabContent}"`);
    }
});

// Feature lists
const features = $('.product-features').text().trim();
if (features) {
    console.log(`   Features: "${features}"`);
}

// Collapsed accordion content
$('.accordion__content').each((i, el) => {
    const accordionContent = $(el).text().trim();
    console.log(`   Accordion: "${accordionContent}"`);
});

// Calculate what percentage we're missing
const allText = $('body').text().replace(/\s+/g, ' ').trim();
const capturedLength = mainDescription.length;
const totalLength = allText.length;
const captureRate = ((capturedLength / totalLength) * 100).toFixed(1);

console.log(`\n📊 CAPTURE ANALYSIS:`);
console.log(`   Captured: ${capturedLength} characters`);
console.log(`   Total available: ${totalLength} characters`);
console.log(`   Capture rate: ${captureRate}%`);
console.log(`   Missing: ${100 - captureRate}% of content`);

console.log('\n💡 RECOMMENDATIONS TO IMPROVE EXTRACTION:\n');
console.log('1. Add tab/accordion content extraction:');
console.log('   - Look for .tab-content, .accordion__content');
console.log('   - Check data-tab, data-toggle attributes');
console.log('\n2. Include feature lists and specs:');
console.log('   - .product-features, .product-specs');
console.log('   - ul/li structures within product area');
console.log('\n3. Merge multiple content sources:');
console.log('   - Main description + tabs + features');
console.log('   - JSON-LD as fallback/supplement');
console.log('\n4. Handle dynamic content:');
console.log('   - Note when content might be hidden');
console.log('   - Flag for manual review if needed');

console.log('\n✅ Verification complete!');