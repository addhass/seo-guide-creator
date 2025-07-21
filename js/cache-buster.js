// Global Cache Buster Script
// This script ensures all links and resources bypass aggressive caching

(function() {
    'use strict';
    
    // Generate unique cache buster based on timestamp
    const CACHE_BUSTER = Date.now();
    const VERSION = '2.9'; // Increment this with each release
    
    // Log cache buster info
    console.log(`🔄 Cache Buster Active: v${VERSION} - ${CACHE_BUSTER}`);
    
    // Function to add cache buster to URL
    function addCacheBuster(url) {
        if (!url || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
            // Skip external URLs
            if (!url.includes(window.location.hostname) && !url.includes('github.io')) {
                return url;
            }
        }
        
        // Skip if already has cache buster
        if (url.includes('cb=') || url.includes('v=') || url.includes('t=')) {
            return url;
        }
        
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}cb=${CACHE_BUSTER}`;
    }
    
    // Update all links on the page
    function updateLinks() {
        // Update anchor tags
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (href.endsWith('.html') || href.endsWith('.js') || href.endsWith('.css'))) {
                link.setAttribute('href', addCacheBuster(href));
            }
        });
        
        // Update form actions
        const forms = document.querySelectorAll('form[action]');
        forms.forEach(form => {
            const action = form.getAttribute('action');
            if (action) {
                form.setAttribute('action', addCacheBuster(action));
            }
        });
    }
    
    // Override window.location methods to add cache buster
    const originalAssign = window.location.assign;
    window.location.assign = function(url) {
        originalAssign.call(window.location, addCacheBuster(url));
    };
    
    const originalReplace = window.location.replace;
    window.location.replace = function(url) {
        originalReplace.call(window.location, addCacheBuster(url));
    };
    
    // Override window.location.href setter
    const locationDescriptor = Object.getOwnPropertyDescriptor(window.location, 'href');
    if (locationDescriptor) {
        Object.defineProperty(window.location, 'href', {
            get: locationDescriptor.get,
            set: function(url) {
                locationDescriptor.set.call(window.location, addCacheBuster(url));
            }
        });
    }
    
    // Force reload if page was loaded from cache
    if (window.performance && performance.navigation.type === 2) {
        console.log('⚠️ Page loaded from cache, forcing reload...');
        window.location.reload(true);
    }
    
    // Add cache-busting headers via meta tags
    function addCacheHeaders() {
        const metaTags = [
            { 'http-equiv': 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
            { 'http-equiv': 'Pragma', content: 'no-cache' },
            { 'http-equiv': 'Expires', content: '0' },
            { name: 'cache-version', content: `${VERSION}-${CACHE_BUSTER}` }
        ];
        
        metaTags.forEach(tag => {
            const meta = document.createElement('meta');
            Object.keys(tag).forEach(key => {
                meta.setAttribute(key, tag[key]);
            });
            document.head.appendChild(meta);
        });
    }
    
    // Clear service workers and caches
    async function clearCaches() {
        // Unregister service workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                registration.unregister();
            }
        }
        
        // Clear all caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            addCacheHeaders();
            updateLinks();
            clearCaches();
        });
    } else {
        addCacheHeaders();
        updateLinks();
        clearCaches();
    }
    
    // Also update links added dynamically
    const observer = new MutationObserver(() => {
        updateLinks();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Export for use in other scripts
    window.cacheBuster = {
        version: VERSION,
        timestamp: CACHE_BUSTER,
        addCacheBuster: addCacheBuster
    };
})();