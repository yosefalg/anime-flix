
cache_js = '''// ============================================
// Anime Flix - Cache Manager
// ============================================

class CacheManager {
    constructor(config) {
        this.config = config;
        this.prefix = config.CACHE.prefix;
        this.duration = config.CACHE.duration;
        this.enabled = config.CACHE.enabled;
        this.maxItems = config.CACHE.maxItems;
    }
    
    // Generate cache key
    _key(key) {
        return `${this.prefix}${key}`;
    }
    
    // Check if cache is valid
    _isValid(item) {
        if (!item || !item.timestamp) return false;
        return (Date.now() - item.timestamp) < this.duration;
    }
    
    // Get item from cache
    get(key) {
        if (!this.enabled) return null;
        
        try {
            const data = localStorage.getItem(this._key(key));
            if (!data) return null;
            
            const item = JSON.parse(data);
            
            if (!this._isValid(item)) {
                this.remove(key);
                return null;
            }
            
            return item.data;
        } catch (e) {
            console.warn('Cache get error:', e);
            return null;
        }
    }
    
    // Set item in cache
    set(key, data) {
        if (!this.enabled) return;
        
        try {
            // Check cache size limit
            this._cleanupIfNeeded();
            
            const item = {
                data: data,
                timestamp: Date.now(),
                key: key
            };
            
            localStorage.setItem(this._key(key), JSON.stringify(item));
        } catch (e) {
            // If quota exceeded, clear old items and retry
            if (e.name === 'QuotaExceededError') {
                this._cleanup(0.5); // Remove 50% of items
                try {
                    localStorage.setItem(this._key(key), JSON.stringify({
                        data: data,
                        timestamp: Date.now(),
                        key: key
                    }));
                } catch (e2) {
                    console.warn('Cache set failed after cleanup:', e2);
                }
            } else {
                console.warn('Cache set error:', e);
            }
        }
    }
    
    // Remove item from cache
    remove(key) {
        try {
            localStorage.removeItem(this._key(key));
        } catch (e) {
            console.warn('Cache remove error:', e);
        }
    }
    
    // Clear all cache
    clear() {
        try {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keys.push(key);
                }
            }
            keys.forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.warn('Cache clear error:', e);
        }
    }
    
    // Get cache stats
    stats() {
        let count = 0;
        let size = 0;
        let valid = 0;
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    count++;
                    const item = localStorage.getItem(key);
                    size += item ? item.length * 2 : 0; // Approximate bytes
                    
                    try {
                        const parsed = JSON.parse(item);
                        if (this._isValid(parsed)) valid++;
                    } catch (e) {}
                }
            }
        } catch (e) {
            console.warn('Cache stats error:', e);
        }
        
        return { count, size, valid, expired: count - valid };
    }
    
    // Cleanup expired items
    _cleanupIfNeeded() {
        try {
            let count = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) count++;
            }
            
            if (count > this.maxItems) {
                this._cleanup(0.3); // Remove 30% of items
            }
        } catch (e) {}
    }
    
    // Remove percentage of oldest items
    _cleanup(percentage) {
        try {
            const items = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        items.push({ key, timestamp: data.timestamp || 0 });
                    } catch (e) {
                        items.push({ key, timestamp: 0 });
                    }
                }
            }
            
            // Sort by timestamp (oldest first)
            items.sort((a, b) => a.timestamp - b.timestamp);
            
            // Remove oldest percentage
            const removeCount = Math.floor(items.length * percentage);
            items.slice(0, removeCount).forEach(item => {
                localStorage.removeItem(item.key);
            });
        } catch (e) {
            console.warn('Cache cleanup error:', e);
        }
    }
}

// Create global instance
const AppCache = new CacheManager(CONFIG);
'''

with open("/mnt/agents/output/anime-flix/js/cache.js", "w", encoding="utf-8") as f:
    f.write(cache_js)

print("cache.js created!")
