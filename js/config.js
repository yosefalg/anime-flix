export const API_SOURCES = [
    {
        name: 'Consumet (Gogo)',
        base: 'https://api.consumet.org/anime/gogoanime',
        trending: '/top-airing',
        search: '/search?keyw=',
        info: '/info/',
        watch: '/watch/',
        priority: 1
    },
    {
        name: 'Anify',
        base: 'https://api.anify.tv',
        trending: '/trending',
        search: '/search?query=',
        info: '/info/',
        watch: '/watch/',
        priority: 2
    },
    {
        name: 'Jikan (Info only)',
        base: 'https://api.jikan.moe/v4',
        trending: '/top/anime',
        search: '/anime?q=',
        info: '/anime/',
        priority: 3
    }
];

export const CACHE_DURATION = 3600000; // ساعة
