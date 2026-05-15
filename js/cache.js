import { CACHE_DURATION } from './config.js';

export function getCache(key) {
    const item = localStorage.getItem(`cache_${key}`);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_DURATION) return null;
    return data;
}

export function setCache(key, data) {
    const item = { data, timestamp: Date.now() };
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
}
