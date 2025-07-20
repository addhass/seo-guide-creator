// Authentication Helper for API Requests
// Adds authentication headers to all API requests

// Get the current user's auth token
async function getAuthToken() {
    if (!window.supabaseClient || !window.supabaseClient.auth) {
        console.warn('Supabase not initialized');
        return null;
    }
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
}

// Add auth headers to fetch options
async function addAuthHeaders(options = {}) {
    const token = await getAuthToken();
    
    if (!token) {
        console.warn('No auth token available');
        return options;
    }
    
    return {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    };
}

// Wrapper for authenticated fetch requests
async function authenticatedFetch(url, options = {}) {
    const authOptions = await addAuthHeaders(options);
    return fetch(url, authOptions);
}

// Export for use in other modules
window.authHelper = {
    getAuthToken,
    addAuthHeaders,
    authenticatedFetch
};