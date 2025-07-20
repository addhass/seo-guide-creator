// DataForSEO Utilities
// Handles location and language resolution for API calls

class DataForSEOUtils {
    constructor() {
        // Location codes from DataForSEO
        this.locationCodes = {
            'United States': 2840,
            'United Kingdom': 2826,
            'Canada': 2124,
            'Australia': 2036,
            'Germany': 2276,
            'France': 2250,
            'Spain': 2724,
            'Italy': 2380,
            'Netherlands': 2528,
            'Belgium': 2056,
            'Switzerland': 2756,
            'Austria': 2040,
            'Ireland': 2372,
            'New Zealand': 2554,
            'Singapore': 2702,
            'India': 2356,
            'Japan': 2392,
            'China': 2156,
            'Brazil': 2076,
            'Mexico': 2484
        };
        
        // Language codes
        this.languageCodes = {
            'English': 'en',
            'Spanish': 'es',
            'French': 'fr',
            'German': 'de',
            'Italian': 'it',
            'Portuguese': 'pt',
            'Dutch': 'nl',
            'Russian': 'ru',
            'Japanese': 'ja',
            'Chinese': 'zh',
            'Korean': 'ko',
            'Arabic': 'ar',
            'Hindi': 'hi'
        };
    }
    
    resolveLocationAndLanguage(location, language) {
        // Default to US/English if not specified
        const locationCode = this.locationCodes[location] || 2840; // US
        const languageCode = this.languageCodes[language] || 'en';
        
        console.log(`📍 Resolved location: ${location} → ${locationCode}`);
        console.log(`🗣️ Resolved language: ${language} → ${languageCode}`);
        
        return {
            location_code: locationCode,
            language_code: languageCode
        };
    }
    
    // Get location code by country name
    getLocationCode(country) {
        return this.locationCodes[country] || null;
    }
    
    // Get language code by language name
    getLanguageCode(language) {
        return this.languageCodes[language] || null;
    }
    
    // Get all available locations
    getAvailableLocations() {
        return Object.keys(this.locationCodes);
    }
    
    // Get all available languages
    getAvailableLanguages() {
        return Object.keys(this.languageCodes);
    }
}

module.exports = DataForSEOUtils;