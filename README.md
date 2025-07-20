# Product Description Guide Builder

An AI-powered tool for generating customized SEO product description guides with automated competitor analysis.

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   ./start-server.sh
   ```

2. **Open the application:**
   - Open `product-guide-builder-modular.html` in your web browser
   - Or visit `file:///path/to/product-guide-builder-modular.html`

3. **Admin Mode:**
   - Add `?admin=true` to the URL to access test data auto-fill features

## 📁 Project Structure

```
/
├── product-guide-builder-modular.html  # Main application file
├── start-server.sh                     # Quick start script
├── README.md                           # This file
│
├── css/                                # Stylesheets
│   └── styles.css                      # Main application styles
│
├── js/                                 # JavaScript modules
│   ├── app.js                          # Main application controller
│   ├── form-handler.js                 # Form interactions
│   ├── competitor-analysis.js          # Competitor discovery
│   └── guide-generation.js             # Guide generation logic
│
├── server/                             # Backend server files
│   ├── cors-proxy-server.js            # Express proxy server
│   ├── API.txt                         # API credentials
│   ├── package.json                    # Node dependencies
│   ├── setup-cors-proxy.sh             # Server setup script
│   └── node_modules/                   # Installed packages
│
├── docs/                               # Documentation
│   ├── CLAUDE.md                       # Development guide
│   ├── PROJECT-PLAN.md                 # Project roadmap
│   ├── PROJECT-STATUS.md               # Current status
│   └── ...                             # Other docs
│
├── Examples/                           # Example files
│   ├── Wild Donkey - Keyword Strategy.tsv
│   └── [NEON] - Wild Donkey Guide.md
│
├── utils/                              # Utility files
│   ├── about-us-scraper.js             # Scraper utility
│   └── dataforseo-utils.js             # DataForSEO utilities
│
├── tests/                              # Test files
│   ├── test-about-us.html              # About Us test page
│   └── test-proxy-connection.html      # Proxy test page
│
└── backup/                             # Backup files
    └── product-guide-builder.html      # Original monolithic version
```

## 🔧 Features

- **AI-Powered Analysis**: Automated About Us page analysis using Claude AI
- **Competitor Discovery**: TSV-based keyword analysis with DataForSEO integration
- **Professional UI**: SurferSEO-inspired design with responsive layout
- **Guide Generation**: Complete SEO product description guides
- **Admin Mode**: Quick test data population for development

## 📚 Documentation

- See `docs/CLAUDE.md` for development guidelines
- Check `docs/PROJECT-STATUS.md` for current project status
- Review `docs/PROJECT-PLAN.md` for the development roadmap

## 🛠️ Development

The application is 85% complete with the following working:
- Complete form system
- About Us analysis
- Competitor discovery
- Guide generation infrastructure

Next priority: Complete the guide generation workflow for full MVP.