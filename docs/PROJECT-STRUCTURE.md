# Project Structure

## 📁 Current File Organization (Organized)

```
Product Description Guide/
├── 📄 product-guide-builder-modular.html   # Main application file
├── 📄 start-server.sh                      # Quick start script
├── 📄 README.md                            # Project overview
│
├── 📁 css/                                 # Stylesheets
│   └── 📄 styles.css                      # Main stylesheet
│
├── 📁 js/                                  # JavaScript modules
│   ├── 📄 app.js                          # Main application entry point
│   ├── 📄 form-handler.js                 # Form interactions & validation
│   ├── 📄 competitor-analysis.js          # Competitor discovery & analysis
│   └── 📄 guide-generation.js             # Guide generation workflow
│
├── 📁 server/                              # Backend server files
│   ├── 📄 cors-proxy-server.js            # Node.js/Express proxy server
│   ├── 📄 API.txt                         # API credentials (secure)
│   ├── 📄 package.json                    # Node.js dependencies
│   ├── 📄 package-lock.json               # Dependency lock file
│   ├── 📄 setup-cors-proxy.sh             # Server setup script
│   ├── 📄 start-proxy.sh                  # Server start script
│   └── 📁 node_modules/                   # Installed packages
│
├── 📁 docs/                                # Documentation
│   ├── 📄 CLAUDE.md                       # Development guidelines
│   ├── 📄 PROJECT-PLAN.md                 # Development plan
│   ├── 📄 PROJECT-STATUS.md               # Current status
│   ├── 📄 PROJECT-STRUCTURE.md            # This file
│   ├── 📄 ROADMAP.md                      # Project roadmap
│   ├── 📄 CORS-SETUP.md                   # CORS setup instructions
│   ├── 📄 dataforseo-api-reference.txt    # API documentation
│   └── 📄 product-guide-builder-prompt.md # Original requirements
│
├── 📁 Examples/                            # Example files
│   ├── 📄 Wild Donkey - Keyword Strategy - RAW Keyword Data.tsv
│   └── 📄 [NEON] - Wild Donkey Content Creation Guide.md
│
├── 📁 utils/                               # Utility files
│   ├── 📄 about-us-scraper.js             # Standalone scraper utility
│   ├── 📄 dataforseo-utils.js             # DataForSEO utility functions
│   └── 📄 dataforseo-locations-languages.json # Location/language data
│
├── 📁 tests/                               # Test files
│   ├── 📄 test-about-us.html              # About Us test page
│   └── 📄 test-proxy-connection.html      # Proxy connection test
│
└── 📁 backup/                              # Backup files
    └── 📄 product-guide-builder.html      # Original monolithic version
```

## 🏗️ Architecture Overview

### **Hybrid Architecture**
- **Frontend**: HTML + Modular JavaScript
- **Backend**: Node.js Express proxy server
- **AI Integration**: Claude API via secure proxy
- **Data Processing**: Client-side CSV/TSV parsing
- **Competitor Analysis**: DataForSEO API integration

### **Key Components**

#### **Frontend (Modular)**
- **product-guide-builder-modular.html**: Clean HTML structure
- **css/styles.css**: Comprehensive styling
- **js/app.js**: Application initialization and coordination
- **js/form-handler.js**: Form interactions, validation, CSV processing
- **js/competitor-analysis.js**: Competitor discovery and website analysis
- **js/guide-generation.js**: Complete guide generation workflow

#### **Backend**
- **server/cors-proxy-server.js**: Express server handling:
  - CORS bypassing for About Us analysis
  - Claude API proxying with security
  - DataForSEO API integration
  - Advanced stealth crawling capabilities
  - Rate limiting and ethical crawling

#### **Configuration**
- **server/package.json**: Node.js dependencies
- **server/API.txt**: Secure credential storage
- **server/setup-cors-proxy.sh**: One-click setup script
- **start-server.sh**: Quick start script in root folder

## 🔄 Development Workflow

### **Development Commands**
```bash
# Quick start from root directory
./start-server.sh

# Or manually from server directory
cd server
npm install  # First time only
npm start

# Test proxy health
curl http://localhost:3001/health
```

### **File Usage**
- **Development**: Use `product-guide-builder-modular.html`
- **Legacy**: `backup/product-guide-builder.html` maintained for reference
- **Production**: Deploy HTML file and server/ directory

## 🧩 Module System

### **Module Loading Order**
1. `form-handler.js` - Form interactions
2. `competitor-analysis.js` - Competitor features
3. `guide-generation.js` - Guide creation
4. `app.js` - Application initialization

### **Module Dependencies**
- **app.js** coordinates all modules
- **form-handler.js** is independent
- **competitor-analysis.js** depends on form data
- **guide-generation.js** depends on form data

### **Global Objects**
- `window.app` - Main application instance
- `window.competitorAnalysis` - Competitor analysis module
- `window.guideGeneration` - Guide generation module

## 📊 Data Flow

### **Form Processing**
1. User fills form sections
2. CSV/TSV file uploaded and parsed
3. Form validation on submission
4. Data collected for guide generation

### **Competitor Analysis**
1. TSV keyword analysis (extract top 30 by volume)
2. Sequential SERP data fetching via DataForSEO
3. Domain extraction and deduplication
4. Interactive competitor selection popup
5. Website analysis with AI-powered insights
6. Automatic form population

### **Guide Generation**
1. Collect all form data
2. Validate required fields
3. Build comprehensive prompt
4. Call Claude API via proxy
5. Process and display markdown guide
6. Export functionality (clipboard, download)

## 🔧 Advanced Features

### **Stealth Crawling**
- Rotating user agents (browsers + SEO bots)
- Realistic headers and fingerprinting
- Rate limiting (10 requests/minute/domain)
- robots.txt compliance
- Random delays (3-5 seconds)

### **AI Integration**
- About Us page analysis
- Competitor website analysis
- Platform detection
- URL pattern discovery
- Brand analysis and insights

### **Performance Optimization**
- Modular JavaScript loading
- CSS separation for caching
- Efficient DOM manipulation
- Sequential API processing
- Memory-conscious data handling

## 🚀 Production Deployment

### **Requirements**
- Node.js 16+ for proxy server
- Modern web browser for frontend
- Claude API access
- DataForSEO API access

### **Files to Deploy**
- `product-guide-builder-modular.html`
- `css/` directory
- `js/` directory
- `server/` directory (entire folder)
- Update `server/API.txt` with production credentials

### **Environment Setup**
1. Deploy proxy server to cloud platform
2. Update API endpoints in JavaScript modules
3. Configure CORS for production domain
4. Set up SSL/TLS certificates

## 📈 Future Enhancements

### **Phase 2: Product Description Scraping**
- Automated product URL discovery
- Description extraction and analysis
- Length and style analysis
- Content recommendations

### **Phase 3: Advanced Features**
- PDF export functionality
- Save/load configurations
- Advanced competitor insights
- Multi-language support

### **Phase 4: Production Polish**
- User authentication
- Database integration
- Advanced analytics
- Performance monitoring

## 🔒 Security Considerations

### **API Security**
- All API keys server-side only
- CORS protection
- Rate limiting enforcement
- Input validation and sanitization

### **Ethical Crawling**
- robots.txt compliance
- Respectful delays
- Educational use only
- No aggressive scraping

### **Data Protection**
- No persistent storage of user data
- Temporary processing only
- No logging of sensitive information
- Secure credential handling