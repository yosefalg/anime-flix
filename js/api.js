
api_js = '''// ============================================
// Anime Flix - API Manager with Fallback
// ============================================

class APIManager {
    constructor(config, cache) {
        this.config = config;
        this.cache = cache;
        this.apis = config.APIS;
        this.currentApiIndex = 0;
        this.lastRequestTime = {};
    }
    
    // Rate limit helper
    async _rateLimit(apiName) {
        const api = this.apis.find(a => a.name === apiName);
        if (!api || !api.rateLimit) return;
        
        const now = Date.now();
        const lastTime = this.lastRequestTime[apiName] || 0;
        const delay = api.rateLimit - (now - lastTime);
        
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastRequestTime[apiName] = Date.now();
    }
    
    // Fetch with timeout and retry
    async _fetch(url, options = {}, retries = 3) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            clearTimeout(timeout);
            
            if (retries > 0 && error.name !== 'AbortError') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this._fetch(url, options, retries - 1);
            }
            
            throw error;
        }
    }
    
    // Try multiple APIs with fallback
    async _fetchWithFallback(endpoint, cacheKey, transformFn = null) {
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached) {
            console.log(`[Cache] Hit: ${cacheKey}`);
            return cached;
        }
        
        // Sort APIs by priority
        const sortedApis = [...this.apis].sort((a, b) => a.priority - b.priority);
        
        let lastError = null;
        
        for (const api of sortedApis) {
            try {
                await this._rateLimit(api.name);
                
                const url = `${api.baseURL}${endpoint}`;
                console.log(`[API] Trying ${api.name}: ${url}`);
                
                const data = await this._fetch(url);
                
                // Transform data if needed
                const result = transformFn ? transformFn(data, api.name) : data;
                
                // Cache successful response
                this.cache.set(cacheKey, result);
                
                console.log(`[API] Success: ${api.name}`);
                return result;
                
            } catch (error) {
                console.warn(`[API] Failed ${api.name}:`, error.message);
                lastError = error;
                continue;
            }
        }
        
        throw new Error(`All APIs failed. Last error: ${lastError?.message}`);
    }
    
    // ==================== JIKAN API METHODS ====================
    
    // Get top anime
    async getTopAnime(page = 1, limit = 24) {
        const cacheKey = `top_${page}_${limit}`;
        return this._fetchWithFallback(
            `/top/anime?page=${page}&limit=${limit}`,
            cacheKey,
            (data) => ({
                data: data.data.map(item => this._transformJikanAnime(item)),
                pagination: data.pagination
            })
        );
    }
    
    // Get seasonal anime
    async getSeasonalAnime(year = null, season = null, page = 1) {
        const now = new Date();
        const currentYear = year || now.getFullYear();
        const currentSeason = season || this._getCurrentSeason();
        
        const cacheKey = `seasonal_${currentYear}_${currentSeason}_${page}`;
        return this._fetchWithFallback(
            `/seasons/${currentYear}/${currentSeason}?page=${page}&limit=24`,
            cacheKey,
            (data) => ({
                data: data.data.map(item => this._transformJikanAnime(item)),
                pagination: data.pagination
            })
        );
    }
    
    // Get upcoming anime
    async getUpcomingAnime(page = 1) {
        const cacheKey = `upcoming_${page}`;
        return this._fetchWithFallback(
            `/seasons/upcoming?page=${page}&limit=24`,
            cacheKey,
            (data) => ({
                data: data.data.map(item => this._transformJikanAnime(item)),
                pagination: data.pagination
            })
        );
    }
    
    // Search anime
    async searchAnime(query, page = 1, type = null) {
        const cacheKey = `search_${query}_${page}_${type}`;
        let endpoint = `/anime?q=${encodeURIComponent(query)}&page=${page}&limit=24`;
        
        if (type && type !== 'all') {
            endpoint += `&type=${type.toUpperCase()}`;
        }
        
        return this._fetchWithFallback(
            endpoint,
            cacheKey,
            (data) => ({
                data: data.data.map(item => this._transformJikanAnime(item)),
                pagination: data.pagination
            })
        );
    }
    
    // Get anime details
    async getAnimeDetails(id) {
        const cacheKey = `anime_${id}`;
        return this._fetchWithFallback(
            `/anime/${id}/full`,
            cacheKey,
            (data) => this._transformJikanAnimeFull(data.data)
        );
    }
    
    // Get anime episodes
    async getEpisodes(id, page = 1) {
        const cacheKey = `episodes_${id}_${page}`;
        return this._fetchWithFallback(
            `/anime/${id}/episodes?page=${page}`,
            cacheKey,
            (data) => data.data || []
        );
    }
    
    // Get anime characters
    async getCharacters(id) {
        const cacheKey = `characters_${id}`;
        return this._fetchWithFallback(
            `/anime/${id}/characters`,
            cacheKey,
            (data) => (data.data || []).map(char => ({
                id: char.character?.mal_id,
                name: char.character?.name,
                image: char.character?.images?.jpg?.image_url,
                role: char.role
            }))
        );
    }
    
    // Get anime by genre
    async getAnimeByGenre(genreId, page = 1) {
        const cacheKey = `genre_${genreId}_${page}`;
        return this._fetchWithFallback(
            `/anime?genres=${genreId}&page=${page}&limit=24`,
            cacheKey,
            (data) => ({
                data: data.data.map(item => this._transformJikanAnime(item)),
                pagination: data.pagination
            })
        );
    }
    
    // Get anime movies
    async getMovies(page = 1) {
        const cacheKey = `movies_${page}`;
        return this._fetchWithFallback(
            `/anime?type=movie&page=${page}&limit=24&order_by=score&sort=desc`,
            cacheKey,
            (data) => ({
                data: data.data.map(item => this._transformJikanAnime(item)),
                pagination: data.pagination
            })
        );
    }
    
    // ==================== DATA TRANSFORMERS ====================
    
    _transformJikanAnime(item) {
        if (!item) return null;
        
        const genres = item.genres?.map(g => this._translateGenre(g.name)) || [];
        const themes = item.themes?.map(t => this._translateGenre(t.name)) || [];
        const demographics = item.demographics?.map(d => this._translateGenre(d.name)) || [];
        
        return {
            id: item.mal_id,
            title: item.title,
            title_english: item.title_english || item.title,
            title_japanese: item.title_japanese,
            image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || CONFIG.UI.imagePlaceholder,
            thumbnail: item.images?.jpg?.image_url || CONFIG.UI.imagePlaceholder,
            score: item.score || 0,
            scored_by: item.scored_by || 0,
            rank: item.rank || 0,
            popularity: item.popularity || 0,
            type: this._translateType(item.type),
            status: this._translateStatus(item.status),
            episodes: item.episodes || '?',
            duration: item.duration || 'غير معروف',
            rating: item.rating || 'غير معروف',
            synopsis: item.synopsis || 'لا يوجد وصف متاح.',
            year: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : 'غير معروف'),
            season: item.season || 'غير معروف',
            genres: [...genres, ...themes, ...demographics],
            studios: item.studios?.map(s => s.name) || [],
            trailer: item.trailer?.youtube_id ? `https://www.youtube.com/embed/${item.trailer.youtube_id}` : null,
            trailer_thumbnail: item.trailer?.images?.maximum_image_url || null,
            source: 'jikan',
            url: item.url
        };
    }
    
    _transformJikanAnimeFull(item) {
        const base = this._transformJikanAnime(item);
        if (!base) return null;
        
        return {
            ...base,
            background: item.background || '',
            relations: item.relations || [],
            external: item.external || [],
            streaming: item.streaming || []
        };
    }
    
    _translateGenre(name) {
        return CONFIG.TRANSLATIONS[name] || name;
    }
    
    _translateStatus(status) {
        return CONFIG.STATUS[status] || status;
    }
    
    _translateType(type) {
        return CONFIG.TYPES[type] || type;
    }
    
    _getCurrentSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 1 && month <= 3) return 'winter';
        if (month >= 4 && month <= 6) return 'spring';
        if (month >= 7 && month <= 9) return 'summer';
        return 'fall';
    }
    
    // ==================== SMART SEARCH ====================
    
    // Search by description (fuzzy matching)
    async smartSearch(description, page = 1) {
        // First try normal search with keywords
        const keywords = description
            .toLowerCase()
            .replace(/أنمي عن|anime about|looking for|search for/g, '')
            .trim()
            .split(/\s+/)
            .slice(0, 5)
            .join(' ');
        
        try {
            return await this.searchAnime(keywords, page);
        } catch (error) {
            console.warn('Smart search failed:', error);
            return { data: [], pagination: { has_next_page: false } };
        }
    }
    
    // Get random anime
    async getRandomAnime() {
        const cacheKey = 'random_anime';
        return this._fetchWithFallback(
            '/random/anime',
            cacheKey,
            (data) => this._transformJikanAnime(data.data)
        );
    }
    
    // Get recommendations
    async getRecommendations(id) {
        const cacheKey = `recommendations_${id}`;
        return this._fetchWithFallback(
            `/anime/${id}/recommendations`,
            cacheKey,
            (data) => (data.data || []).slice(0, 10).map(rec => ({
                id: rec.entry?.mal_id,
                title: rec.entry?.title,
                image: rec.entry?.images?.jpg?.image_url,
                votes: rec.votes
            }))
        );
    }
}

// Create global instance
const API = new APIManager(CONFIG, AppCache);
'''

with open("/mnt/agents/output/anime-flix/js/api.js", "w", encoding="utf-8") as f:
    f.write(api_js)

print("api.js created!")
