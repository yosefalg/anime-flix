import { API_SOURCES, CACHE_DURATION } from './config.js';
import { getCache, setCache } from './cache.js';

export async function fetchWithFallback(endpoint, type = 'trending', query = '') {
    for (const src of API_SOURCES) {
        let url = '';
        if (type === 'trending') url = src.base + src.trending;
        else if (type === 'search') url = src.base + src.search + encodeURIComponent(query);
        else if (type === 'info') url = src.base + src.info + endpoint;
        else if (type === 'watch') url = src.base + src.watch + endpoint;
        else continue;
        
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            console.log(`نجح المصدر: ${src.name}`);
            return data;
        } catch (err) {
            console.warn(`فشل ${src.name}: ${err.message}`);
        }
    }
    throw new Error('جميع المصادر فشلت');
}

export async function fetchTrending() {
    const cached = getCache('trending');
    if (cached) return cached;
    const data = await fetchWithFallback('', 'trending');
    const results = data.results || data.data || [];
    setCache('trending', results);
    return results;
}

export async function searchAnime(query) {
    const data = await fetchWithFallback('', 'search', query);
    return data.results || data.data || [];
}

export async function getAnimeInfo(animeId) {
    return await fetchWithFallback(animeId, 'info');
}

export async function getWatchUrl(episodeId) {
    const data = await fetchWithFallback(episodeId, 'watch');
    const sources = data.sources || [];
    const valid = sources.find(s => s.url && s.url.startsWith('http'));
    return valid ? valid.url : null;
}
