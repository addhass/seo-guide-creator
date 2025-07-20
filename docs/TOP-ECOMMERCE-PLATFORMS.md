# Top E-commerce Platforms Research

## 🏆 Top 10 E-commerce Platforms (by market share)

### 1. **Shopify** (10%+ market share)
- **PLP Patterns**: `/collections`, `/collections/{name}`, `/products`
- **PDP Patterns**: `/products/{handle}`, `/collections/{collection}/products/{handle}`
- **Identifiers**: `Shopify.shop`, `cdn.shopify.com`
- **Special Notes**: Very consistent structure, easy to detect

### 2. **WooCommerce** (7%+ market share)
- **PLP Patterns**: `/shop`, `/product-category/{category}`
- **PDP Patterns**: `/product/{slug}`, `/?p={id}`
- **Identifiers**: `woocommerce`, `wp-content/plugins/woocommerce`
- **Special Notes**: WordPress-based, variable structures

### 3. **Shopify Plus** (Enterprise Shopify)
- **Same as Shopify** but may have custom domains/structures
- **Additional**: Multi-currency, multi-language paths like `/en-us/collections`

### 4. **Magento/Adobe Commerce** (3%+ market share)
- **PLP Patterns**: `/{category}.html`, `/catalog/category/view/id/{id}`
- **PDP Patterns**: `/{product-name}.html`, `/catalog/product/view/id/{id}`
- **Identifiers**: `Magento`, `mage/`, `static/version`
- **Special Notes**: Often uses .html extensions

### 5. **BigCommerce** (1.5%+ market share)
- **PLP Patterns**: `/categories/{name}`, `/brands/{name}`
- **PDP Patterns**: `/{product-name}/`, `/products/{name}`
- **Identifiers**: `bigcommerce.com`, `cdn11.bigcommerce.com`

### 6. **Salesforce Commerce Cloud** (Demandware)
- **PLP Patterns**: `/s/{category}`, `/c/{category-id}`
- **PDP Patterns**: `/p/{product-id}`, `/product/{id}`
- **Identifiers**: `demandware.static`, `dwstatic`
- **Special Notes**: Often uses /s/ for search, /p/ for products

### 7. **Wix eCommerce**
- **PLP Patterns**: `/product-page/{collection}`, `/shop`
- **PDP Patterns**: `/product-page/{collection}/{product}`
- **Identifiers**: `wix.com`, `wixstatic.com`

### 8. **Squarespace Commerce**
- **PLP Patterns**: `/shop`, `/store`, `/products`
- **PDP Patterns**: `/shop/p/{product}`, `/store/p/{product}`
- **Identifiers**: `squarespace.com`, `sqsp.net`

### 9. **PrestaShop**
- **PLP Patterns**: `/{lang}/{category}`, `/{id}-{category-name}`
- **PDP Patterns**: `/{lang}/{id}-{product-name}.html`
- **Identifiers**: `PrestaShop`, `prestashop.com`
- **Special Notes**: Multi-language support common

### 10. **OpenCart**
- **PLP Patterns**: `/index.php?route=product/category&path={id}`
- **PDP Patterns**: `/index.php?route=product/product&product_id={id}`
- **Identifiers**: `OpenCart`, `catalog/view/theme`
- **Special Notes**: Often uses query parameters

## 🌟 Emerging/Regional Platforms

### Shopware (Popular in Europe)
- **PLP**: `/en/{category}`, `/{category}/`
- **PDP**: `/{product-name}/`, `/detail/{id}`

### Ecwid
- **PLP**: `#!/c/{category-id}/{category-name}`
- **PDP**: `#!/p/{product-id}/{product-name}`
- **Special**: Uses hash-based routing

### Volusion
- **PLP**: `/category/{name}-c{id}.htm`
- **PDP**: `/p/{product-name}-p{id}.htm`

### 3dcart/Shift4Shop
- **PLP**: `/{category-name}_c_{id}.html`
- **PDP**: `/{product-name}_p_{id}.html`

## 📊 Platform Detection Strategy

1. **Homepage Analysis First**
   - Check meta tags, scripts, comments
   - Look for platform signatures
   - Detect from loaded resources

2. **URL Pattern Matching**
   - Try most common patterns first
   - Use platform-specific paths
   - Validate with content check

3. **Fallback Detection**
   - HTML structure analysis
   - Common class/ID patterns
   - JavaScript variable names

## 🎯 Implementation Priority

1. **High Priority** (80% of market)
   - Shopify
   - WooCommerce
   - Magento
   - BigCommerce

2. **Medium Priority** (15% of market)
   - Salesforce Commerce
   - Wix
   - Squarespace
   - PrestaShop

3. **Low Priority** (5% of market)
   - OpenCart
   - Regional platforms
   - Custom solutions