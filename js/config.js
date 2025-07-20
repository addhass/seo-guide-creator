// Configuration for API endpoints
const config = {
    // API is deployed at: https://seo-guide-creator-api.vercel.app
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3001'
        : 'https://seo-guide-creator-api.vercel.app'
};

window.API_CONFIG = config;