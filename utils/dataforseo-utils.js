// DataForSEO API Utilities - Location and Language Helper
// Generated from DataForSEO Labs API

const fs = require('fs');
const path = require('path');

class DataForSEOUtils {
    constructor() {
        this.referenceData = null;
        this.loadReferenceData();
    }

    loadReferenceData() {
        try {
            const filePath = path.join(__dirname, 'dataforseo-locations-languages.json');
            if (fs.existsSync(filePath)) {
                this.referenceData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                console.log(`📚 Loaded ${this.referenceData.metadata.total_locations} locations and ${this.referenceData.metadata.total_languages} languages`);
            } else {
                console.warn('⚠️  Reference data not found. Run get-dataforseo-locations.js first.');
            }
        } catch (error) {
            console.error('❌ Error loading reference data:', error.message);
        }
    }

    // Get location code by country name or ISO code
    getLocationCode(countryNameOrISO) {
        if (!this.referenceData) return null;
        
        const searchTerm = countryNameOrISO.toLowerCase();
        
        // Check popular locations first for common requests
        const popularMatch = Object.entries(this.referenceData.popular_locations).find(([code, loc]) => {
            if (!loc) return false;
            return loc.name.toLowerCase().includes(searchTerm) || 
                   loc.country_iso_code.toLowerCase() === searchTerm;
        });
        
        if (popularMatch) {
            return parseInt(popularMatch[0]);
        }
        
        // Search all locations
        const allMatch = Object.entries(this.referenceData.all_locations).find(([code, loc]) => {
            return loc.name.toLowerCase().includes(searchTerm) || 
                   loc.country_iso_code.toLowerCase() === searchTerm;
        });
        
        return allMatch ? parseInt(allMatch[0]) : null;
    }

    // Get language code by language name
    getLanguageCode(languageName) {
        if (!this.referenceData) return null;
        
        const searchTerm = languageName.toLowerCase();
        
        // Check popular languages first
        const popularMatch = Object.entries(this.referenceData.popular_languages).find(([code, lang]) => {
            if (!lang) return false;
            return lang.name.toLowerCase().includes(searchTerm) || code === searchTerm;
        });
        
        if (popularMatch) {
            return popularMatch[0];
        }
        
        // Search all languages
        const allMatch = Object.entries(this.referenceData.all_languages).find(([code, lang]) => {
            return lang.name.toLowerCase().includes(searchTerm) || code === searchTerm;
        });
        
        return allMatch ? allMatch[0] : null;
    }

    // Get available languages for a location
    getAvailableLanguages(locationCode) {
        if (!this.referenceData) return [];
        
        const location = this.referenceData.all_locations[locationCode];
        return location ? location.languages : [];
    }

    // Get location info by code
    getLocationInfo(locationCode) {
        if (!this.referenceData) return null;
        return this.referenceData.all_locations[locationCode] || null;
    }

    // Get language info by code
    getLanguageInfo(languageCode) {
        if (!this.referenceData) return null;
        return this.referenceData.all_languages[languageCode] || null;
    }

    // Get popular regions for easier selection
    getPopularRegions() {
        if (!this.referenceData) return {};
        return this.referenceData.popular_locations;
    }

    // Get popular languages for easier selection
    getPopularLanguages() {
        if (!this.referenceData) return {};
        return this.referenceData.popular_languages;
    }

    // Validate location/language combination
    isValidCombination(locationCode, languageCode) {
        const availableLanguages = this.getAvailableLanguages(locationCode);
        return availableLanguages.includes(languageCode);
    }

    // Get default combinations for common countries
    getDefaultCombinations() {
        return {
            'UK': { location_code: 2826, language_code: 'en' },
            'US': { location_code: 2840, language_code: 'en' },
            'Australia': { location_code: 2036, language_code: 'en' },
            'Canada': { location_code: 2124, language_code: 'en' },
            'Germany': { location_code: 2276, language_code: 'de' },
            'France': { location_code: 2250, language_code: 'fr' },
            'Spain': { location_code: 2724, language_code: 'es' },
            'Italy': { location_code: 2380, language_code: 'it' },
            'Netherlands': { location_code: 2528, language_code: 'nl' },
            'Sweden': { location_code: 2752, language_code: 'sv' }
        };
    }

    // Smart resolver - takes friendly names and returns codes
    resolveLocationAndLanguage(locationInput, languageInput = 'English') {
        const locationCode = typeof locationInput === 'number' ? 
            locationInput : this.getLocationCode(locationInput);
        const languageCode = typeof languageInput === 'string' && languageInput.length <= 3 ? 
            languageInput : this.getLanguageCode(languageInput);

        if (!locationCode || !languageCode) {
            throw new Error(`Invalid location (${locationInput}) or language (${languageInput})`);
        }

        if (!this.isValidCombination(locationCode, languageCode)) {
            const available = this.getAvailableLanguages(locationCode);
            throw new Error(`Language ${languageCode} not available for location ${locationCode}. Available: ${available.join(', ')}`);
        }

        return { location_code: locationCode, language_code: languageCode };
    }
}

module.exports = DataForSEOUtils;

// Example usage for testing
if (require.main === module) {
    const utils = new DataForSEOUtils();
    
    console.log('\n🧪 Testing DataForSEO Utils...\n');
    
    try {
        console.log('UK Code:', utils.getLocationCode('United Kingdom'));
        console.log('English Code:', utils.getLanguageCode('English'));
        console.log('Valid UK+EN:', utils.isValidCombination(2826, 'en'));
        console.log('Resolve UK+English:', utils.resolveLocationAndLanguage('UK', 'English'));
        console.log('Default combinations:', utils.getDefaultCombinations());
    } catch (error) {
        console.error('Test error:', error.message);
    }
}