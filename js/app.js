
app_js = '''// ============================================
// Anime Flix - Main Application
// ============================================

class AnimeFlixApp {
    constructor() {
        this.currentPage = 1;
        this.currentSection = 'home';
        this.currentGenre = null;
        this.searchQuery = '';
        this.isLoading = false;
        this.init();
    }
    
    async init() {
        this._setupEventListeners();
        this._setup3DBackground();
        this._createParticles();
        
        // Render categories
        UI.renderCategories();
        
        // Load initial data
        await this.loadHomePage();
        
        // Hide loading screen
        UI.hideLoading();
        
        // Update stats
        UI.updateHeroStats(50000, 2500000, 150000);
        
        console.log('[App] Anime Flix initialized successfully');
    }
    
    // ==================== EVENT LISTENERS ====================
    
    _setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.navigateTo(section);
                
                // Update active state
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
        
        // Mobile menu
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.getElementById('nav-links').classList.toggle('active');
            });
        }
        
        // Search toggle
        const searchToggle = document.getElementById('search-toggle');
        if (searchToggle) {
            searchToggle.addEventListener('click', () => {
                document.getElementById('search-overlay').classList.add('active');
                document.getElementById('search-input').focus();
            });
        }
        
        // Search close
        const searchClose = document.getElementById('search-close');
        if (searchClose) {
            searchClose.addEventListener('click', () => this.closeSearch());
        }
        
        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 500);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
        }
        
        // Search button
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const input = document.getElementById('search-input');
                if (input) this.handleSearch(input.value);
            });
        }
        
        // Search filters
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                
                const input = document.getElementById('search-input');
                if (input && input.value) {
                    this.handleSearch(input.value, chip.dataset.filter);
                }
            });
        });
        
        // Modal close
        const modalClose = document.getElementById('modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => UI.closeModal());
        }
        
        // Close modal on overlay click
        const modalOverlay = document.getElementById('anime-modal');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) UI.closeModal();
            });
        }
        
        // Modal tabs
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`tab-${tabName}`).classList.add('active');
            });
        });
        
        // Favorite button
        const favoriteBtn = document.getElementById('favorite-btn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => {
                if (UI.currentAnime) {
                    UI.toggleFavorite(UI.currentAnime);
                }
            });
        }
        
        // Share button
        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                if (UI.currentAnime) {
                    const url = `${window.location.origin}${window.location.pathname}?anime=${UI.currentAnime.id}`;
                    navigator.clipboard.writeText(url).then(() => {
                        UI.showToast('تم نسخ الرابط!', 'success');
                    });
                }
            });
        }
        
        // Episode controls
        const prevEp = document.getElementById('prev-ep');
        const nextEp = document.getElementById('next-ep');
        
        if (prevEp) {
            prevEp.addEventListener('click', () => {
                if (UI.currentEpisode > 1) {
                    this.playEpisode(UI.currentEpisode - 1);
                }
            });
        }
        
        if (nextEp) {
            nextEp.addEventListener('click', () => {
                this.playEpisode(UI.currentEpisode + 1);
            });
        }
        
        // Hero buttons
        const heroExplore = document.getElementById('hero-explore');
        if (heroExplore) {
            heroExplore.addEventListener('click', () => {
                document.getElementById('trending-section').scrollIntoView({ behavior: 'smooth' });
            });
        }
        
        const heroSearch = document.getElementById('hero-search');
        if (heroSearch) {
            heroSearch.addEventListener('click', () => {
                document.getElementById('search-overlay').classList.add('active');
                document.getElementById('search-input').focus();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                UI.closeModal();
                this.closeSearch();
            }
        });
        
        // View all buttons
        document.querySelectorAll('.view-all-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                this.navigateTo(section);
            });
        });
    }
    
    // ==================== 3D BACKGROUND ====================
    
    _setup3DBackground() {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        let mouse = { x: 0, y: 0 };
        
        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        
        const createParticles = () => {
            particles = [];
            const count = Math.min(50, Math.floor(width / 30));
            
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: Math.random() * 3 + 1,
                    speedX: (Math.random() - 0.5) * 0.5,
                    speedY: (Math.random() - 0.5) * 0.5,
                    color: Math.random() > 0.5 ? 'rgba(229, 9, 20, ' : 'rgba(255, 107, 107, ',
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        };
        
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            particles.forEach(p => {
                // Move
                p.x += p.speedX;
                p.y += p.speedY;
                
                // Mouse interaction
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 150) {
                    p.x -= dx * 0.01;
                    p.y -= dy * 0.01;
                }
                
                // Wrap around
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;
                
                // Draw
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color + p.opacity + ')';
                ctx.fill();
            });
            
            // Draw connections
            particles.forEach((p1, i) => {
                particles.slice(i + 1).forEach(p2 => {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(229, 9, 20, ${0.1 * (1 - dist / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });
            
            requestAnimationFrame(animate);
        };
        
        window.addEventListener('resize', () => {
            resize();
            createParticles();
        });
        
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        
        resize();
        createParticles();
        animate();
    }
    
    _createParticles() {
        // CSS particles as fallback/enhancement
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
            document.body.appendChild(particle);
        }
    }
    
    // ==================== NAVIGATION ====================
    
    navigateTo(section) {
        this.currentSection = section;
        this.currentPage = 1;
        
        switch (section) {
            case 'home':
                this.loadHomePage();
                break;
            case 'trending':
                this.loadTrendingPage();
                break;
            case 'movies':
                this.loadMoviesPage();
                break;
            case 'favorites':
                UI.renderFavorites();
                break;
            case 'history':
                UI.renderHistory();
                break;
            default:
                this.loadHomePage();
        }
        
        // Close mobile menu
        document.getElementById('nav-links').classList.remove('active');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // ==================== PAGE LOADERS ====================
    
    async loadHomePage() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        // Show skeleton loading
        document.getElementById('trending-grid').innerHTML = 
            '<div class="skeleton" style="height: 300px;"></div>'.repeat(6);
        document.getElementById('top-grid').innerHTML = 
            '<div class="skeleton" style="height: 300px;"></div>'.repeat(6);
        document.getElementById('movies-grid').innerHTML = 
            '<div class="skeleton" style="height: 300px;"></div>'.repeat(6);
        document.getElementById('upcoming-grid').innerHTML = 
            '<div class="skeleton" style="height: 300px;"></div>'.repeat(6);
        
        try {
            // Load all sections in parallel
            const [trending, top, movies, upcoming] = await Promise.all([
                API.getSeasonalAnime(null, null, 1).catch(() => ({ data: [] })),
                API.getTopAnime(1, 12).catch(() => ({ data: [] })),
                API.getMovies(1).catch(() => ({ data: [] })),
                API.getUpcomingAnime(1).catch(() => ({ data: [] }))
            ]);
            
            UI.renderAnimeGrid(trending.data, 'trending-grid');
            UI.renderAnimeGrid(top.data, 'top-grid');
            UI.renderAnimeGrid(movies.data, 'movies-grid');
            UI.renderAnimeGrid(upcoming.data, 'upcoming-grid');
            
        } catch (error) {
            console.error('[App] Error loading home page:', error);
            UI.showToast('فشل تحميل بعض البيانات', 'error');
        } finally {
            this.isLoading = false;
        }
    }
    
    async loadTrendingPage() {
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <section class="anime-section" style="padding-top: 100px;">
                <div class="section-header">
                    <h2 class="section-title">الأكثر شهرة</h2>
                </div>
                <div class="anime-grid" id="trending-page-grid"></div>
                <div class="pagination" id="trending-pagination"></div>
            </section>
        `;
        
        await this._loadPaginatedGrid(
            (page) => API.getTopAnime(page, 24),
            'trending-page-grid',
            'trending-pagination',
            'App.loadTrendingPageNumber'
        );
    }
    
    async loadMoviesPage() {
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <section class="anime-section" style="padding-top: 100px;">
                <div class="section-header">
                    <h2 class="section-title">أفلام الأنمي</h2>
                </div>
                <div class="anime-grid" id="movies-page-grid"></div>
                <div class="pagination" id="movies-pagination"></div>
            </section>
        `;
        
        await this._loadPaginatedGrid(
            (page) => API.getMovies(page),
            'movies-page-grid',
            'movies-pagination',
            'App.loadMoviesPageNumber'
        );
    }
    
    async _loadPaginatedGrid(fetchFn, gridId, paginationId, callbackName) {
        if (this.isLoading) return;
        this.isLoading = true;
        
        document.getElementById(gridId).innerHTML = 
            '<div class="skeleton" style="height: 300px;"></div>'.repeat(8);
        
        try {
            const result = await fetchFn(this.currentPage);
            UI.renderAnimeGrid(result.data, gridId);
            UI.renderPagination(
                this.currentPage,
                result.pagination?.has_next_page || false,
                result.pagination?.last_visible_page || this.currentPage + 1,
                callbackName
            );
        } catch (error) {
            console.error('[App] Pagination error:', error);
            UI.showToast('فشل تحميل البيانات', 'error');
        } finally {
            this.isLoading = false;
        }
    }
    
    async loadTrendingPageNumber(page) {
        this.currentPage = page;
        await this.loadTrendingPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    async loadMoviesPageNumber(page) {
        this.currentPage = page;
        await this.loadMoviesPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // ==================== SEARCH ====================
    
    async handleSearch(query, type = 'all') {
        if (!query || query.trim().length < 2) {
            document.getElementById('search-results').innerHTML = '';
            return;
        }
        
        this.searchQuery = query;
        
        const container = document.getElementById('search-results');
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="anime-loader" style="justify-content: center;">
                    <div class="circle"></div>
                    <div class="circle"></div>
                    <div class="circle"></div>
                </div>
                <p style="color: var(--text-secondary); margin-top: 20px;">جاري البحث...</p>
            </div>
        `;
        
        try {
            const results = await API.searchAnime(query, 1, type);
            UI.renderSearchResults(results.data);
        } catch (error) {
            console.error('[App] Search error:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 15px; display: block; color: var(--primary);"></i>
                    <p>فشل البحث. حاول مرة أخرى.</p>
                </div>
            `;
        }
    }
    
    closeSearch() {
        document.getElementById('search-overlay').classList.remove('active');
        document.getElementById('search-input').value = '';
        document.getElementById('search-results').innerHTML = '';
    }
    
    // ==================== ANIME DETAILS ====================
    
    async openAnime(animeId) {
        UI.showLoading();
        
        try {
            const anime = await API.getAnimeDetails(animeId);
            UI.openModal(anime);
        } catch (error) {
            console.error('[App] Error opening anime:', error);
            UI.showToast('فشل تحميل تفاصيل الأنمي', 'error');
        } finally {
            UI.hideLoading();
        }
    }
    
    // ==================== EPISODES & PLAYER ====================
    
    async playEpisode(episodeNumber) {
        if (!UI.currentAnime) return;
        
        UI.currentEpisode = episodeNumber;
        await Player.playEpisode(UI.currentAnime, episodeNumber);
    }
    
    async switchServer(serverId) {
        if (!UI.currentAnime) return;
        
        // Update active state
        document.querySelectorAll('.server-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.server === serverId);
        });
        
        await Player.changeServer(UI.currentAnime, UI.currentEpisode, serverId);
    }
    
    // ==================== GENRE FILTER ====================
    
    async filterByGenre(genreId, genreName) {
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <section class="anime-section" style="padding-top: 100px;">
                <div class="section-header">
                    <h2 class="section-title">تصنيف: ${genreName}</h2>
                </div>
                <div class="anime-grid" id="genre-grid"></div>
                <div class="pagination" id="genre-pagination"></div>
            </section>
        `;
        
        this.currentGenre = genreId;
        this.currentPage = 1;
        
        await this._loadPaginatedGrid(
            (page) => API.getAnimeByGenre(genreId, page),
            'genre-grid',
            'genre-pagination',
            'App.loadGenrePageNumber'
        );
    }
    
    async loadGenrePageNumber(page) {
        this.currentPage = page;
        await this.filterByGenre(this.currentGenre, '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // ==================== URL PARAMS ====================
    
    _checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const animeId = params.get('anime');
        
        if (animeId) {
            this.openAnime(parseInt(animeId));
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.App = new AnimeFlixApp();
    
    // Check URL params after init
    setTimeout(() => {
        window.App._checkUrlParams();
    }, 1500);
});
'''

with open("/mnt/agents/output/anime-flix/js/app.js", "w", encoding="utf-8") as f:
    f.write(app_js)

print("app.js created!")
