
ui_js = '''// ============================================
// Anime Flix - UI Manager
// ============================================

class UIManager {
    constructor(config) {
        this.config = config;
        this.currentAnime = null;
        this.currentEpisode = 1;
        this.favorites = this._loadFavorites();
        this.history = this._loadHistory();
    }
    
    // ==================== LOADING ====================
    
    showLoading() {
        const loader = document.getElementById('loading-screen');
        if (loader) loader.classList.remove('hidden');
    }
    
    hideLoading() {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 1000);
        }
    }
    
    // ==================== TOASTS ====================
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    // ==================== ANIME CARDS ====================
    
    renderAnimeCard(anime) {
        if (!anime) return '';
        
        const isFav = this.isFavorite(anime.id);
        
        return `
            <div class="anime-card" data-id="${anime.id}" onclick="App.openAnime(${anime.id})">
                <div class="card-image">
                    <img src="${anime.image}" alt="${anime.title}" loading="lazy" onerror="this.src='${this.config.UI.imagePlaceholder}'">
                    <div class="card-rating">
                        <i class="fas fa-star"></i> ${anime.score || 'N/A'}
                    </div>
                    ${anime.type ? `<div class="card-badge">${anime.type}</div>` : ''}
                    <div class="card-overlay">
                        <button class="play-btn" onclick="event.stopPropagation(); App.openAnime(${anime.id})">
                            <i class="fas fa-play"></i>
                        </button>
                        <div class="card-title-overlay">${anime.title}</div>
                    </div>
                </div>
                <div class="card-info">
                    <h3 class="card-title">${anime.title}</h3>
                    <div class="card-meta">
                        <span><i class="fas fa-tv"></i> ${anime.episodes || '?'} حلقة</span>
                        <span><i class="fas fa-calendar"></i> ${anime.year || '?'}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderAnimeGrid(animeList, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (!animeList || animeList.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <i class="fas fa-film" style="font-size: 3rem; margin-bottom: 20px; display: block;"></i>
                    <p>لا توجد نتائج متاحة</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = animeList.map(anime => this.renderAnimeCard(anime)).join('');
    }
    
    // ==================== CATEGORIES ====================
    
    renderCategories() {
        const container = document.getElementById('categories-grid');
        if (!container) return;
        
        container.innerHTML = this.config.CATEGORIES.map(cat => `
            <div class="category-card" data-genre="${cat.id}" onclick="App.filterByGenre(${cat.id}, '${cat.name}')">
                <i class="fas ${cat.icon}" style="color: ${cat.color}"></i>
                <span>${cat.name}</span>
            </div>
        `).join('');
    }
    
    // ==================== MODAL ====================
    
    openModal(anime) {
        this.currentAnime = anime;
        this.currentEpisode = 1;
        
        const modal = document.getElementById('anime-modal');
        if (!modal) return;
        
        // Fill basic info
        document.getElementById('modal-image').src = anime.image;
        document.getElementById('modal-title').textContent = anime.title;
        document.getElementById('modal-score').innerHTML = `<i class="fas fa-star"></i> ${anime.score || 'N/A'}`;
        document.getElementById('modal-year').textContent = anime.year || '?';
        document.getElementById('modal-type').textContent = anime.type || 'TV';
        document.getElementById('modal-status').textContent = anime.status || 'غير معروف';
        document.getElementById('modal-synopsis').textContent = anime.synopsis || 'لا يوجد وصف متاح.';
        document.getElementById('modal-genres').textContent = anime.genres?.join('، ') || 'غير محدد';
        document.getElementById('modal-episodes').textContent = anime.episodes || 'غير معروف';
        document.getElementById('modal-duration').textContent = anime.duration || 'غير معروف';
        document.getElementById('modal-studio').textContent = anime.studios?.join('، ') || 'غير معروف';
        document.getElementById('modal-rating').textContent = anime.rating || 'غير معروف';
        
        // Update favorite button
        this._updateFavoriteButton();
        
        // Reset tabs
        this._switchTab('overview');
        
        // Show placeholder, hide player initially
        const placeholder = document.getElementById('video-placeholder');
        const player = document.getElementById('anime-player');
        if (placeholder) placeholder.classList.remove('hidden');
        if (player) player.style.display = 'none';
        
        // Generate server buttons
        this._renderServerButtons();
        
        // Load episodes
        this._loadEpisodes(anime.id);
        
        // Load characters
        this._loadCharacters(anime.id);
        
        // Load trailer
        this._loadTrailer(anime);
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Add to history
        this.addToHistory(anime);
    }
    
    closeModal() {
        const modal = document.getElementById('anime-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Stop video
        if (window.playerInstance) {
            window.playerInstance.dispose();
            window.playerInstance = null;
        }
    }
    
    _switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
    }
    
    _renderServerButtons() {
        const container = document.getElementById('server-buttons');
        if (!container) return;
        
        container.innerHTML = this.config.VIDEO_SOURCES.map((server, index) => `
            <button class="server-btn ${index === 0 ? 'active' : ''}" data-server="${server.id}" onclick="App.switchServer('${server.id}')">
                ${server.name}
            </button>
        `).join('');
    }
    
    async _loadEpisodes(animeId) {
        const container = document.getElementById('episodes-list');
        if (!container) return;
        
        container.innerHTML = '<div class="skeleton" style="height: 50px; grid-column: 1/-1;"></div>';
        
        try {
            const episodes = await API.getEpisodes(animeId);
            
            if (!episodes || episodes.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 30px; color: var(--text-secondary);">
                        <i class="fas fa-list" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        <p>قائمة الحلقات غير متاحة</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = episodes.map((ep, index) => `
                <div class="episode-item ${index === 0 ? 'active' : ''}" data-ep="${ep.mal_id || index + 1}" onclick="App.playEpisode(${index + 1})">
                    <span class="ep-number">${ep.mal_id || index + 1}</span>
                    <span class="ep-title">${ep.title || `الحلقة ${index + 1}`}</span>
                </div>
            `).join('');
            
        } catch (error) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 30px; color: var(--text-secondary);">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px; display: block; color: var(--primary);"></i>
                    <p>فشل تحميل الحلقات</p>
                </div>
            `;
        }
    }
    
    async _loadCharacters(animeId) {
        const container = document.getElementById('characters-grid');
        if (!container) return;
        
        container.innerHTML = '<div class="skeleton" style="height: 100px; width: 100px; border-radius: 50%;"></div>'.repeat(6);
        
        try {
            const characters = await API.getCharacters(animeId);
            
            if (!characters || characters.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 30px; color: var(--text-secondary);">
                        <p>لا توجد شخصيات متاحة</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = characters.slice(0, 20).map(char => `
                <div class="character-card">
                    <img src="${char.image || this.config.UI.imagePlaceholder}" alt="${char.name}" onerror="this.src='${this.config.UI.imagePlaceholder}'">
                    <span>${char.name}</span>
                    <small style="color: var(--text-muted); font-size: 0.7rem;">${char.role || ''}</small>
                </div>
            `).join('');
            
        } catch (error) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 30px; color: var(--text-secondary);">
                    <p>فشل تحميل الشخصيات</p>
                </div>
            `;
        }
    }
    
    _loadTrailer(anime) {
        const container = document.getElementById('trailer-container');
        if (!container) return;
        
        if (anime.trailer) {
            container.innerHTML = `
                <iframe src="${anime.trailer}" 
                        title="Trailer" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                </iframe>
            `;
        } else {
            container.innerHTML = `
                <div class="no-trailer">
                    <i class="fas fa-video-slash"></i>
                    <p>لا يوجد إعلان متاح</p>
                </div>
            `;
        }
    }
    
    // ==================== FAVORITES ====================
    
    _loadFavorites() {
        try {
            const data = localStorage.getItem('animeflix_favorites');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }
    
    _saveFavorites() {
        localStorage.setItem('animeflix_favorites', JSON.stringify(this.favorites));
    }
    
    isFavorite(animeId) {
        return this.favorites.some(f => f.id === animeId);
    }
    
    toggleFavorite(anime) {
        const index = this.favorites.findIndex(f => f.id === anime.id);
        
        if (index >= 0) {
            this.favorites.splice(index, 1);
            this.showToast('تم الإزالة من المفضلة', 'info');
        } else {
            this.favorites.push({
                id: anime.id,
                title: anime.title,
                image: anime.image,
                score: anime.score,
                addedAt: Date.now()
            });
            this.showToast('تمت الإضافة للمفضلة', 'success');
        }
        
        this._saveFavorites();
        this._updateFavoriteButton();
    }
    
    _updateFavoriteButton() {
        const btn = document.getElementById('favorite-btn');
        if (!btn || !this.currentAnime) return;
        
        const isFav = this.isFavorite(this.currentAnime.id);
        btn.classList.toggle('active', isFav);
        btn.innerHTML = isFav 
            ? '<i class="fas fa-heart"></i> في المفضلة'
            : '<i class="far fa-heart"></i> إضافة للمفضلة';
    }
    
    renderFavorites() {
        const container = document.getElementById('main-content');
        if (!container) return;
        
        // Clear sections
        container.innerHTML = `
            <section class="anime-section" style="padding-top: 100px;">
                <div class="section-header">
                    <h2 class="section-title">المفضلة</h2>
                </div>
                <div class="anime-grid" id="favorites-grid"></div>
            </section>
        `;
        
        const grid = document.getElementById('favorites-grid');
        
        if (this.favorites.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <i class="far fa-heart" style="font-size: 3rem; margin-bottom: 20px; display: block;"></i>
                    <p>لا توجد أنميات في المفضلة</p>
                </div>
            `;
            return;
        }
        
        // Convert favorites to anime format
        const animeList = this.favorites.map(f => ({
            id: f.id,
            title: f.title,
            image: f.image,
            score: f.score,
            episodes: '?',
            year: '?',
            type: 'TV',
            genres: []
        }));
        
        this.renderAnimeGrid(animeList, 'favorites-grid');
    }
    
    // ==================== HISTORY ====================
    
    _loadHistory() {
        try {
            const data = localStorage.getItem('animeflix_history');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }
    
    _saveHistory() {
        // Keep only last 100 items
        if (this.history.length > 100) {
            this.history = this.history.slice(-100);
        }
        localStorage.setItem('animeflix_history', JSON.stringify(this.history));
    }
    
    addToHistory(anime) {
        // Remove if exists
        this.history = this.history.filter(h => h.id !== anime.id);
        
        // Add to end
        this.history.push({
            id: anime.id,
            title: anime.title,
            image: anime.image,
            score: anime.score,
            watchedAt: Date.now()
        });
        
        this._saveHistory();
    }
    
    renderHistory() {
        const container = document.getElementById('main-content');
        if (!container) return;
        
        container.innerHTML = `
            <section class="anime-section" style="padding-top: 100px;">
                <div class="section-header">
                    <h2 class="section-title">سجل المشاهدة</h2>
                </div>
                <div class="anime-grid" id="history-grid"></div>
            </section>
        `;
        
        const grid = document.getElementById('history-grid');
        
        if (this.history.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <i class="fas fa-clock" style="font-size: 3rem; margin-bottom: 20px; display: block;"></i>
                    <p>لم تشاهد أي أنمي بعد</p>
                </div>
            `;
            return;
        }
        
        // Reverse to show newest first
        const animeList = [...this.history].reverse().map(h => ({
            id: h.id,
            title: h.title,
            image: h.image,
            score: h.score,
            episodes: '?',
            year: '?',
            type: 'TV',
            genres: []
        }));
        
        this.renderAnimeGrid(animeList, 'history-grid');
    }
    
    // ==================== SEARCH RESULTS ====================
    
    renderSearchResults(results) {
        const container = document.getElementById('search-results');
        if (!container) return;
        
        if (!results || results.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 15px; display: block;"></i>
                    <p>لا توجد نتائج</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = results.map(anime => `
            <div class="search-result-card" onclick="App.openAnime(${anime.id}); App.closeSearch();">
                <img src="${anime.image}" alt="${anime.title}" onerror="this.src='${this.config.UI.imagePlaceholder}'">
                <div class="search-result-info">
                    <h4>${anime.title}</h4>
                    <p>${anime.synopsis ? anime.synopsis.substring(0, 100) + '...' : 'لا يوجد وصف'}</p>
                    <div style="margin-top: 8px; display: flex; gap: 10px; font-size: 0.8rem; color: var(--text-muted);">
                        <span><i class="fas fa-star"></i> ${anime.score || 'N/A'}</span>
                        <span><i class="fas fa-tv"></i> ${anime.type || 'TV'}</span>
                        <span><i class="fas fa-calendar"></i> ${anime.year || '?'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // ==================== PAGINATION ====================
    
    renderPagination(currentPage, hasNextPage, totalPages, callback) {
        const container = document.getElementById('pagination');
        if (!container) return;
        
        let html = '';
        
        // Previous
        html += `<button class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="${callback}(${currentPage - 1})"><i class="fas fa-chevron-right"></i></button>`;
        
        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages || currentPage + 2, currentPage + 2);
        
        if (startPage > 1) {
            html += `<button class="page-btn" onclick="${callback}(1)">1</button>`;
            if (startPage > 2) html += `<span style="color: var(--text-muted); padding: 10px;">...</span>`;
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="${callback}(${i})">${i}</button>`;
        }
        
        if (endPage < (totalPages || endPage)) {
            if (endPage < (totalPages || endPage) - 1) html += `<span style="color: var(--text-muted); padding: 10px;">...</span>`;
            html += `<button class="page-btn" onclick="${callback}(${totalPages || endPage + 1})">${totalPages || endPage + 1}</button>`;
        }
        
        // Next
        html += `<button class="page-btn" ${!hasNextPage ? 'disabled' : ''} onclick="${callback}(${currentPage + 1})"><i class="fas fa-chevron-left"></i></button>`;
        
        container.innerHTML = html;
    }
    
    // ==================== HERO STATS ====================
    
    updateHeroStats(animeCount, episodeCount, userCount) {
        const animateNumber = (elementId, target) => {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            const duration = 2000;
            const start = 0;
            const startTime = performance.now();
            
            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(start + (target - start) * easeOut);
                
                element.textContent = current.toLocaleString();
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            };
            
            requestAnimationFrame(update);
        };
        
        animateNumber('stat-anime', animeCount);
        animateNumber('stat-episodes', episodeCount);
        animateNumber('stat-users', userCount);
    }
}

// Create global instance
const UI = new UIManager(CONFIG);
'''

with open("/mnt/agents/output/anime-flix/js/ui.js", "w", encoding="utf-8") as f:
    f.write(ui_js)

print("ui.js created!")
