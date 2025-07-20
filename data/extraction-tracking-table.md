# Extraction Performance Tracking Table

## Master Tracking Table

| Date | Run ID | Domains Tested | Success Rate | Avg Chars | Capture Rate | Quality | Shopify Detection | Shopify Avg | WooCommerce Detection | WooCommerce Avg | Key Changes | Notes |
|------|--------|----------------|--------------|-----------|--------------|---------|-------------------|-------------|----------------------|-----------------|-------------|-------|
| 2025-01-19 | 2025-07-19-001 | 4 | 75% | 808 | 39% | ⭐⭐⭐⭐ | 67% | 925 chars | 100% | 575 chars | Initial baseline | Missing 61% content in tabs |

## Detailed Metrics Table

| Metric | Current Value | Target | Gap | Priority |
|--------|---------------|--------|-----|----------|
| Overall Capture Rate | 39% | 80% | -41% | 🔴 HIGH |
| Average Description Length | 808 chars | 1000 chars | -192 chars | 🟡 MEDIUM |
| Shopify Detection Rate | 67% | 100% | -33% | 🟡 MEDIUM |
| WooCommerce Detection Rate | 100% | 95% | ✅ EXCEEDED | ✅ GOOD |
| Tab Content Extraction | 0% | 90% | -90% | 🔴 HIGH |
| Feature List Extraction | 25% | 80% | -55% | 🔴 HIGH |
| Quality Score | 4/5 | 4/5 | ✅ MET | ✅ GOOD |

## Content Source Coverage Table

| Content Type | Currently Capturing | Sites Missing This | Impact on SEO | Fix Difficulty |
|--------------|-------------------|-------------------|---------------|----------------|
| Main Description | 100% | 0% | Essential | ✅ Done |
| Tab Content | 0% | 75% | High - doubles content | 🟡 Medium |
| Feature Lists | 25% | 75% | High - keywords | 🟢 Easy |
| Specifications | 0% | 50% | Medium - technical terms | 🟡 Medium |
| Care Instructions | 0% | 25% | Low - some keywords | 🟢 Easy |
| Ingredients | 0% | 25% | Medium - product details | 🟢 Easy |
| Size Guides | 0% | 40% | Low - minimal text | 🟡 Medium |
| Shipping Info | 0% | 50% | Low - generic content | 🟢 Easy |

## Platform Comparison Table

| Platform | Domains Tested | Detection Success | Extraction Success | Avg Chars | Avg Words | Common Selectors | Main Issues |
|----------|----------------|-------------------|-------------------|-----------|-----------|------------------|-------------|
| Shopify | 3 | 67% (2/3) | 67% (2/3) | 925 | 134 | `.product-single__description`, `.rte` | Failed detection on some sites |
| WooCommerce | 1 | 100% (1/1) | 100% (1/1) | 575 | 88 | `#tab-description` | Lower content extraction |

## Historical Performance Trend

| Version | Date | Key Improvements | Capture Rate | Avg Length | Quality Change |
|---------|------|------------------|--------------|------------|----------------|
| v1.0.0 | 2025-01-19 | Initial implementation | 39% | 808 chars | Baseline |
| v1.1.0 | (Planned) | Add tab extraction | (Target: 70%) | (Target: 1200) | +30% content |
| v1.2.0 | (Planned) | Add feature lists | (Target: 80%) | (Target: 1400) | +10% content |

## Domain-Specific Results

| Domain | Platform | Detection | Extraction | Chars Extracted | Est. Total | Capture % | Quality | Missing Content |
|--------|----------|-----------|------------|-----------------|------------|-----------|---------|-----------------|
| allbirds.com | Shopify | ✅ | ✅ | 650 | 2500 | 26% | ⭐⭐⭐ | Tabs, features, specs |
| bombas.com | Shopify | ✅ | ✅ | 1200 | 2000 | 60% | ⭐⭐⭐⭐⭐ | Tabs, care info |
| beardbrand.com | WooCommerce | ✅ | ✅ | 575 | 1800 | 32% | ⭐⭐⭐ | Tabs, ingredients, usage |
| failedstore.com | Shopify | ❌ | ❌ | 0 | 0 | 0% | - | Everything (404 error) |

## Action Items Priority Table

| Priority | Action | Expected Impact | Effort | Timeline |
|----------|--------|-----------------|--------|----------|
| 🔴 HIGH | Extract tab/accordion content | +30-40% capture rate | Medium | Next sprint |
| 🔴 HIGH | Extract feature lists | +10-15% capture rate | Low | This week |
| 🟡 MEDIUM | Fix Shopify detection issues | +33% detection rate | Low | This week |
| 🟡 MEDIUM | Extract specifications | +5-10% capture rate | Medium | Next sprint |
| 🟢 LOW | Extract care/shipping info | +5% capture rate | Low | Future |

---
*Last Updated: 2025-01-19*  
*Next Review: After implementing tab extraction*