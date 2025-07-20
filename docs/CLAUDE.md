# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Product Description Guide Builder** - a web application that generates customized SEO product description guides using AI. The tool features automated brand analysis through About Us page scraping and generates tailored guidance for writing product descriptions.

## Architecture

### Hybrid Architecture (Frontend + Proxy Server)
- **product-guide-builder-modular.html**: Main web application with modular architecture
- **server/cors-proxy-server.js**: Node.js/Express proxy server for CORS-free API access
- **server/package.json**: Dependencies for proxy server
- Runs on localhost:3001 (proxy) + file system (HTML)

### Key Components
1. **Form System**: 4-section progressive form for collecting brand data
2. **About Us Analysis**: Automated brand research using Claude AI
3. **DataForSEO Competitor Discovery**: Advanced TSV-based competitor analysis
4. **CORS Proxy Server**: Enables cross-origin requests and API calls
5. **Claude API Integration**: Full working implementation for brand analysis
6. **Interactive Competitor Selection**: Popup with clickable links and automatic population
7. **SurferSEO-inspired Design**: Professional UI with coral/orange primary colors (#FF5B49)
8. **Responsive Layout**: Split-screen desktop, stacked mobile design

## Development Commands

### Quick Start
- **Start server**: `./start-server.sh` from root directory
- **Open app**: Open `product-guide-builder-modular.html` in web browser
- **Admin mode**: Add `?admin=true` to URL for test data

### Proxy Server Commands
- **Setup**: `cd server && npm install`
- **Start proxy**: `cd server && npm start`
- **Stop proxy**: `pkill -f "cors-proxy-server.js"`
- **Test proxy**: Visit `http://localhost:3001/health`

### Frontend Commands
- **Run locally**: Open `product-guide-builder-modular.html` in web browser
- **Test About Us feature**: Requires proxy server to be running
- **Test**: Manual testing in browser (no automated test framework)
- **Deploy**: Copy HTML file + deploy server/ directory to cloud platform

## File Structure (Organized)

```
/
├── product-guide-builder-modular.html  # Main application file
├── start-server.sh                     # Quick start script
├── README.md                           # Project overview
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
│   └── setup-cors-proxy.sh             # Server setup script
│
├── docs/                               # Documentation
│   ├── CLAUDE.md                       # This file
│   ├── PROJECT-PLAN.md                 # Development plan
│   └── PROJECT-STATUS.md               # Current status
│
├── Examples/                           # Example files
├── utils/                              # Utility files
├── tests/                              # Test files
└── backup/                             # Original monolithic version
```

## API Integration

### Claude API
- **Model**: claude-3-5-sonnet-20241022 (current, working)
- **API Key**: Stored in `server/API.txt` and hardcoded in proxy server
- **Endpoints**: 
  - `/claude-api` (POST) - Proxied Claude API calls
  - `/fetch-page` (GET) - About Us page scraping
- **Features**: About Us analysis, brand research, USP generation
- **Security**: API key handled server-side in proxy

### About Us Analysis Workflow
1. User enters About Us URL
2. Proxy server fetches page content (bypasses CORS)
3. Smart content extraction focuses on relevant text
4. Claude AI analyzes content for USP, target audience, brand voice
5. Results automatically populate form fields

### DataForSEO Competitor Discovery Workflow
1. User uploads TSV file with keyword strategy
2. System analyzes TSV and extracts top 30 keywords by search volume
3. DataForSEO API fetches SERP data for each keyword (sequential processing)
4. System extracts and deduplicates competitor domains
5. Interactive popup displays competitors with clickable links
6. User selects relevant competitors
7. System automatically populates competitor form fields

## Form Sections

1. **Brand Basics**: Name, website, industry selection
2. **Brand Identity**: USP, target audience, brand voice, competitors
3. **Product Information**: Categories, example URLs, current descriptions
4. **SEO Data**: CSV upload, geographic targeting

## Key Features

### Auto-Detection
- Country detection from domain TLD (.co.uk → UK, .com → US, etc.)
- Subfolder detection (/uk/, /us/, etc.)

### Smart Interactions
- Dynamic "Other" industry field
- Competitor input expansion (up to 10)
- Character counters on textareas
- Real-time form validation

### CSV Processing
- Accepts keyword strategy CSV files
- Live preview of parsed data
- Expected columns: Category, URL, Primary Keyword, Search Volume

## Development Notes

### Adding New Features
- Code is modularized into separate JS files in `js/` directory
- CSS is in `css/styles.css` with variables defined in `:root`
- JavaScript uses vanilla ES6+ (no frameworks)
- Server code is in `server/` directory

### Testing Changes
- Open file directly in browser
- Use browser developer tools for debugging
- No compilation or build step required

### Styling Guidelines
- Follow SurferSEO color palette (defined in CSS variables)
- Use existing form patterns for consistency
- Maintain responsive design principles

## Important Implementation Details

### Current Working Features
- **About Us Analysis**: Fully functional end-to-end workflow
- **DataForSEO Competitor Discovery**: Advanced TSV-based competitor analysis with 21 real competitors
- **Interactive Competitor Selection**: Popup with clickable links and automatic form population
- **Form validation**: HTML5 + custom JavaScript with real-time feedback
- **CORS handling**: Complete solution via proxy server
- **Error handling**: Comprehensive fallback systems
- **Cache-busting**: Always loads fresh version
- **Admin mode**: Wild Donkey test data auto-fill
- **Multi-brand tested**: Verified with Wild Donkey and ASOS

### Architecture Notes
- **Hybrid approach**: Frontend (HTML) + Backend (Node.js proxy)
- **API security**: All sensitive keys handled server-side
- **State management**: Client-side using vanilla JavaScript
- **File processing**: CSV uploads processed client-side
- **Content extraction**: Smart About Us page parsing algorithm

### Next Development Priorities
1. **Main guide generation** - Implement complete guide creation workflow (**NEXT PRIORITY**)
2. **Export functionality** - Add download options (Markdown, PDF)
3. **Cloud deployment** - Move proxy server to production environment
4. **Save/load configurations** - User preference management

### Removed Features (Replaced by Better Solutions)
- **Direct competitor discovery**: Replaced by TSV-based keyword analysis
- **Batch DataForSEO requests**: Replaced by sequential processing for reliability