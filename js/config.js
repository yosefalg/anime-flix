
config_js = '''// ============================================
// Anime Flix - Configuration
// ============================================

const CONFIG = {
    // API Endpoints (Free, no CORS issues)
    APIS: [
        {
            name: 'Jikan',
            baseURL: 'https://api.jikan.moe/v4',
            type: 'rest',
            priority: 1,
            rateLimit: 1000, // ms between requests
            features: ['search', 'details', 'episodes', 'characters', 'top', 'seasonal']
        },
        {
            name: 'Kitsu',
            baseURL: 'https://kitsu.io/api/edge',
            type: 'rest',
            priority: 2,
            rateLimit: 500,
            features: ['search', 'details', 'trending']
        }
    ],
    
    // Cache Settings
    CACHE: {
        enabled: true,
        duration: 3600000, // 1 hour in ms
        prefix: 'animeflix_',
        maxItems: 500
    },
    
    // UI Settings
    UI: {
        itemsPerPage: 24,
        maxRetries: 3,
        retryDelay: 2000,
        defaultLanguage: 'ar',
        imagePlaceholder: 'https://via.placeholder.com/300x400/141414/e50914?text=Anime+Flix',
        trailerProxy: 'https://www.youtube.com/embed/'
    },
    
    // Categories
    CATEGORIES: [
        { id: 1, name: 'أكشن', icon: 'fa-bolt', color: '#e50914' },
        { id: 2, name: 'مغامرة', icon: 'fa-mountain', color: '#ff6b6b' },
        { id: 4, name: 'كوميديا', icon: 'fa-laugh-beam', color: '#ffd93d' },
        { id: 8, name: 'دراما', icon: 'fa-theater-masks', color: '#6bcb77' },
        { id: 10, name: 'خيال', icon: 'fa-dragon', color: '#9b59b6' },
        { id: 14, name: 'رعب', icon: 'fa-ghost', color: '#e74c3c' },
        { id: 22, name: 'رومانسية', icon: 'fa-heart', color: '#ff6b9d' },
        { id: 24, name: 'خيال علمي', icon: 'fa-rocket', color: '#3498db' },
        { id: 30, name: 'رياضة', icon: 'fa-futbol', color: '#2ecc71' },
        { id: 37, name: 'خارق للطبيعة', icon: 'fa-hat-wizard', color: '#9b59b6' }
    ],
    
    // Video Sources (Placeholder - require backend for real video)
    VIDEO_SOURCES: [
        { id: 'server1', name: 'سيرفر 1', type: 'hls' },
        { id: 'server2', name: 'سيرفر 2', type: 'mp4' },
        { id: 'server3', name: 'سيرفر 3', type: 'dash' }
    ],
    
    // Translations (Arabic fallback)
    TRANSLATIONS: {
        'Action': 'أكشن',
        'Adventure': 'مغامرة',
        'Comedy': 'كوميديا',
        'Drama': 'دراما',
        'Fantasy': 'خيال',
        'Horror': 'رعب',
        'Romance': 'رومانسية',
        'Sci-Fi': 'خيال علمي',
        'Sports': 'رياضة',
        'Supernatural': 'خارق للطبيعة',
        'Mystery': 'غموض',
        'Psychological': 'نفسي',
        'Thriller': 'إثارة',
        'Slice of Life': ' slice of life',
        'Music': 'موسيقى',
        'Mecha': 'ميكا',
        'Military': 'عسكري',
        'Historical': 'تاريخي',
        'School': 'مدرسي',
        'Shounen': 'شونين',
        'Seinen': 'سينين',
        'Shoujo': 'شوجو',
        'Josei': 'جوسي',
        'Kids': 'أطفال',
        'Demons': 'شياطين',
        'Game': 'ألعاب',
        'Harem': 'حريم',
        'Martial Arts': 'فنون قتالية',
        'Vampire': 'مصاصي دماء',
        'Yaoi': 'ياوي',
        'Yuri': 'يوري',
        'Police': 'شرطة',
        'Space': 'فضاء',
        'Super Power': 'قوى خارقة',
        'Samurai': 'ساموراي',
        'Magic': 'سحر',
        'Parody': 'محاكاة ساخرة',
        'Cars': 'سيارات',
        'Dementia': 'جنون',
        'Ecchi': 'إيتشي',
        'Hentai': 'هنتاي',
        'Award Winning': 'حائز على جوائز',
        'Gourmet': 'طعام',
        'Work Life': 'حياة العمل',
        'Suspense': 'تشويق',
        'Avant Garde': 'تجريبي',
        'Boys Love': 'Boys Love',
        'Girls Love': 'Girls Love',
        'Reverse Harem': 'Reverse Harem',
        'Survival': 'بقاء',
        'Time Travel': 'سفر عبر الزمن',
        'Isekai': 'إيسيكاي',
        'Reincarnation': 'تناسخ',
        'High Stakes Game': 'لعبة عالية المخاطر',
        'Video Game': 'لعبة فيديو',
        'Organized Crime': 'جريمة منظمة',
        'Performing Arts': 'فنون الأداء',
        'Delinquents': 'مشاغبون',
        ' Anthropomorphic': 'شخصيات حيوانية',
        'CGDCT': 'CGDCT',
        'Combat Sports': 'رياضات قتالية',
        'Crossdressing': 'تنكر',
        'Educational': 'تعليمي',
        'Gore': 'دماء',
        'Medical': 'طبيب',
        'Showbiz': 'عالم الفن',
        'Team Sports': 'رياضات فريق',
        'Racing': 'سباق',
        'Strategy Game': 'لعبة استراتيجية',
        'Pets': 'حيوانات أليفة',
        'Otaku Culture': 'ثقافة الأوتاكو'
    },
    
    // Status translations
    STATUS: {
        'Finished Airing': 'منتهي',
        'Currently Airing': 'يعرض حالياً',
        'Not yet aired': 'لم يعرض بعد',
        'Finished': 'منتهي',
        'Ongoing': 'مستمر',
        'Upcoming': 'قادم'
    },
    
    // Type translations
    TYPES: {
        'TV': 'مسلسل',
        'Movie': 'فيلم',
        'OVA': 'OVA',
        'ONA': 'ONA',
        'Special': 'خاص',
        'Music': 'موسيقى',
        'TV Short': 'مسلسل قصير',
        'CM': 'إعلان',
        'PV': 'إعلان تشويقي'
    }
};

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
'''

with open("/mnt/agents/output/anime-flix/js/config.js", "w", encoding="utf-8") as f:
    f.write(config_js)

print("config.js created!")
