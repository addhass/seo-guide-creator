// Script to clear bad knowledge base entries
const fs = require('fs').promises;
const path = require('path');

async function clearBadEntries() {
    try {
        // Check if knowledge base exists
        const kbPath = path.join(__dirname, 'knowledge-base.json');
        
        try {
            const content = await fs.readFile(kbPath, 'utf8');
            const kb = JSON.parse(content);
            
            console.log('Current knowledge base:', JSON.stringify(kb, null, 2));
            
            // Clear any entries that don't have proper patterns
            if (kb.domains) {
                for (const domain in kb.domains) {
                    const entry = kb.domains[domain];
                    if (entry.confirmed && entry.confirmed.plp) {
                        // Check if it's a path string instead of a proper pattern object
                        if (typeof entry.confirmed.plp === 'string') {
                            console.log(`❌ Removing bad entry for ${domain} - PLP is string not object`);
                            delete kb.domains[domain];
                        }
                    }
                }
            }
            
            // Save cleaned KB
            await fs.writeFile(kbPath, JSON.stringify(kb, null, 2));
            console.log('✅ Knowledge base cleaned');
            
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log('No knowledge base file found - starting fresh');
            } else {
                throw err;
            }
        }
        
    } catch (error) {
        console.error('Error clearing KB:', error);
    }
}

// Run if called directly
if (require.main === module) {
    clearBadEntries();
}

module.exports = clearBadEntries;