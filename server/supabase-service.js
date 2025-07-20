// Supabase Service for Server
// Handles fetching user API keys from the database

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jdqdfejuesqbcxjwbcwl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY not set. User API key fetching will not work.');
}

// Initialize Supabase client with service role key (for server-side operations)
const supabase = SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
}) : null;

// Simple decryption function (matches client-side)
function decryptApiKey(encryptedKey) {
    try {
        return Buffer.from(encryptedKey, 'base64').toString('utf-8');
    } catch (e) {
        console.error('Decryption error:', e);
        return encryptedKey; // Return as-is if decoding fails
    }
}

// Get user's API keys from database
async function getUserApiKeys(userId) {
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    try {
        const { data, error } = await supabase
            .from('api_keys')
            .select('service, encrypted_key')
            .eq('user_id', userId);

        if (error) throw error;

        // Convert array to object with decrypted keys
        const keys = {};
        for (const row of data || []) {
            keys[row.service] = decryptApiKey(row.encrypted_key);
        }

        return keys;
    } catch (error) {
        console.error('Error fetching API keys:', error);
        throw error;
    }
}

// Verify JWT token and get user ID
async function verifyUser(authHeader) {
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No authorization token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        // Verify the JWT token
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            throw new Error('Invalid or expired token');
        }

        return user;
    } catch (error) {
        console.error('Error verifying user:', error);
        throw error;
    }
}

// Middleware to authenticate requests and attach user API keys
async function authenticateRequest(req, res, next) {
    try {
        // Get authorization header
        const authHeader = req.headers.authorization;
        console.log('Auth header received:', authHeader ? 'Yes' : 'No');
        
        // For test endpoint, skip authentication
        if (req.path === '/test-api-key') {
            return next();
        }
        
        // Verify user
        const user = await verifyUser(authHeader);
        console.log('User verified:', user?.email);
        
        // Fetch user's API keys
        const apiKeys = await getUserApiKeys(user.id);
        console.log('API keys fetched:', Object.keys(apiKeys || {}));
        
        // Attach to request
        req.user = user;
        req.apiKeys = apiKeys;
        
        next();
    } catch (error) {
        // For now, allow requests to pass through without auth
        // This maintains backward compatibility
        console.warn('Authentication failed:', error.message);
        console.log('Auth error details:', error.stack);
        req.apiKeys = {}; // Empty keys object
        next();
    }
}

module.exports = {
    getUserApiKeys,
    verifyUser,
    authenticateRequest,
    supabase
};