// Supabase Client Configuration
// This will be loaded as a module in the browser

// Supabase project configuration
const SUPABASE_URL = 'https://jdqdfejuesqbcxjwbcwl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcWRmZWp1ZXNxYmN4andiY3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjQyNjgsImV4cCI6MjA2ODYwMDI2OH0._co76nJaxBJDKN25wpbbTMJE5QEY3wsQ-1H9MvrMXGs';

// Initialize Supabase client
let supabase;

// Dynamic import for browser compatibility
async function initSupabase() {
    if (typeof window !== 'undefined' && window.supabase) {
        // Using CDN version
        const { createClient } = window.supabase;
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        // Using npm module (for future bundled version)
        const { createClient } = await import('@supabase/supabase-js');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabase;
}

// Authentication functions
const auth = {
    async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        return { data, error };
    },

    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    async getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    async resetPassword(email) {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        return { data, error };
    },

    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    }
};

// API Key Management functions
const apiKeys = {
    async save(service, apiKey) {
        const user = await auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Encrypt the API key before storing
        const encryptedKey = await encryptApiKey(apiKey);
        const keyHint = apiKey.slice(-4);

        const { data, error } = await supabase
            .from('api_keys')
            .upsert({
                user_id: user.id,
                service: service,
                encrypted_key: encryptedKey,
                key_hint: keyHint,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,service'
            });

        return { data, error };
    },

    async get(service) {
        const user = await auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('api_keys')
            .select('encrypted_key, key_hint')
            .eq('user_id', user.id)
            .eq('service', service)
            .single();

        if (data && data.encrypted_key) {
            // Decrypt the key
            const decryptedKey = await decryptApiKey(data.encrypted_key);
            return { data: { ...data, decrypted_key: decryptedKey }, error };
        }

        return { data, error };
    },

    async getAll() {
        const user = await auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('api_keys')
            .select('service, key_hint, created_at')
            .eq('user_id', user.id);

        return { data, error };
    },

    async delete(service) {
        const user = await auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('api_keys')
            .delete()
            .eq('user_id', user.id)
            .eq('service', service);

        return { error };
    },

    async test(service) {
        // Test the API key by making a simple request
        const { data, error } = await apiKeys.get(service);
        if (error) return { success: false, error };

        // Call our backend to test the key
        try {
            const response = await fetch(`${window.API_CONFIG.API_BASE_URL}/test-api-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    service,
                    apiKey: data.decrypted_key
                })
            });

            const result = await response.json();
            return { success: result.valid, error: result.error };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
};

// Simple encryption functions (to be enhanced with proper crypto)
async function encryptApiKey(apiKey) {
    // For MVP, we'll use base64 encoding
    // In production, use proper AES encryption
    return btoa(apiKey);
}

async function decryptApiKey(encryptedKey) {
    // For MVP, simple base64 decoding
    // In production, use proper AES decryption
    return atob(encryptedKey);
}

// Export for use in other modules
window.supabaseClient = {
    init: initSupabase,
    auth,
    apiKeys
};