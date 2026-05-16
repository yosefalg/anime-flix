
player_js = '''// ============================================
// Anime Flix - Video Player Manager
// ============================================

class PlayerManager {
    constructor(config) {
        this.config = config;
        this.player = null;
        this.currentSource = null;
        this.retryCount = 0;
        this.maxRetries = 3;
    }
    
    // Initialize player
    init(videoElementId) {
        const element = document.getElementById(videoElementId);
        if (!element) return null;
        
        // Dispose existing player
        if (this.player) {
            this.player.dispose();
            this.player = null;
        }
        
        // Create new player
        this.player = videojs(element, {
            controls: true,
            autoplay: false,
            preload: 'auto',
            fluid: true,
            responsive: true,
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            controlBar: {
                children: [
                    'playToggle',
                    'volumePanel',
                    'currentTimeDisplay',
                    'timeDivider',
                    'durationDisplay',
                    'progressControl',
                    'liveDisplay',
                    'seekToLive',
                    'remainingTimeDisplay',
                    'customControlSpacer',
                    'playbackRateMenuButton',
                    'chaptersButton',
                    'descriptionsButton',
                    'subsCapsButton',
                    'audioTrackButton',
                    'fullscreenToggle'
                ]
            },
            html5: {
                vhs: {
                    overrideNative: true,
                    limitRenditionByPlayerDimensions: true,
                    useDevicePixelRatio: true
                }
            }
        });
        
        // Add error handling
        this.player.on('error', () => {
            this._handleError();
        });
        
        // Add retry on stalled
        this.player.on('stalled', () => {
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`[Player] Retry attempt ${this.retryCount}`);
                this.player.src(this.currentSource);
                this.player.play();
            }
        });
        
        return this.player;
    }
    
    // Load video source
    load(source, type = 'video/mp4') {
        if (!this.player) return;
        
        this.currentSource = source;
        this.retryCount = 0;
        
        // Reset player
        this.player.pause();
        this.player.currentTime(0);
        
        // Set source
        this.player.src({
            src: source,
            type: type
        });
        
        // Try to play
        const playPromise = this.player.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn('[Player] Autoplay prevented:', error);
            });
        }
    }
    
    // Load HLS stream
    loadHLS(source) {
        this.load(source, 'application/x-mpegURL');
    }
    
    // Load DASH stream
    loadDASH(source) {
        this.load(source, 'application/dash+xml');
    }
    
    // Load MP4
    loadMP4(source) {
        this.load(source, 'video/mp4');
    }
    
    // Handle player errors
    _handleError() {
        const error = this.player.error();
        if (!error) return;
        
        console.error('[Player] Error:', error);
        
        let message = 'حدث خطأ في تشغيل الفيديو';
        
        switch (error.code) {
            case 1:
                message = 'تم إلغاء تشغيل الفيديو';
                break;
            case 2:
                message = 'خطأ في الاتصال بالشبكة. جاري إعادة المحاولة...';
                if (this.retryCount < this.maxRetries) {
                    setTimeout(() => {
                        this.retryCount++;
                        this.player.src(this.currentSource);
                        this.player.play();
                    }, 3000);
                }
                break;
            case 3:
                message = 'خطأ في فك تشفير الفيديو. جرب سيرفر آخر.';
                break;
            case 4:
                message = 'الفيديو غير مدعوم. جرب سيرفر آخر.';
                break;
        }
        
        UI.showToast(message, 'error');
    }
    
    // Switch to placeholder (no video available)
    showPlaceholder(title = 'المشغل جاهز') {
        if (this.player) {
            this.player.pause();
            this.player.src('');
        }
        
        const placeholder = document.getElementById('video-placeholder');
        const videoElement = document.getElementById('anime-player');
        
        if (placeholder) placeholder.classList.remove('hidden');
        if (videoElement) videoElement.style.display = 'none';
    }
    
    // Hide placeholder and show player
    hidePlaceholder() {
        const placeholder = document.getElementById('video-placeholder');
        const videoElement = document.getElementById('anime-player');
        
        if (placeholder) placeholder.classList.add('hidden');
        if (videoElement) videoElement.style.display = 'block';
    }
    
    // Play episode (with fallback logic)
    async playEpisode(anime, episodeNumber, serverId = 'server1') {
        this.hidePlaceholder();
        
        // Initialize player if needed
        if (!this.player) {
            this.init('anime-player');
        }
        
        UI.showToast(`جاري تحميل الحلقة ${episodeNumber}...`, 'info');
        
        // Try to find video URL
        // NOTE: Real video URLs require backend proxy. This is a demo structure.
        const videoUrl = await this._getVideoUrl(anime, episodeNumber, serverId);
        
        if (videoUrl) {
            this.load(videoUrl);
            UI.showToast(`تشغيل الحلقة ${episodeNumber}`, 'success');
        } else {
            this.showPlaceholder();
            UI.showToast('رابط الفيديو غير متاح. يتطلب سيرفر Backend.', 'error');
        }
        
        // Update episode UI
        document.querySelectorAll('.episode-item').forEach((item, index) => {
            item.classList.toggle('active', index + 1 === episodeNumber);
        });
        
        document.getElementById('ep-current').textContent = `الحلقة ${episodeNumber}`;
    }
    
    // Get video URL (placeholder - requires backend for real implementation)
    async _getVideoUrl(anime, episode, serverId) {
        // This is where you'd integrate with video APIs
        // Currently returns null as real video URLs require:
        // 1. Backend proxy server (Node.js/Python)
        // 2. API keys for video providers
        // 3. CORS handling
        
        // For demo purposes, you can add a test MP4 here:
        // return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        
        console.log(`[Player] Requesting video for anime ${anime.id}, episode ${episode}, server ${serverId}`);
        
        // Try multiple sources
        const sources = [
            // Add your video API endpoints here
            // { url: `https://your-api.com/watch/${anime.id}/${episode}`, type: 'hls' },
        ];
        
        for (const source of sources) {
            try {
                const response = await fetch(source.url, { method: 'HEAD', mode: 'no-cors' });
                // If we get here, the URL might be valid
                return source.url;
            } catch (e) {
                continue;
            }
        }
        
        return null;
    }
    
    // Change server
    async changeServer(anime, episode, serverId) {
        const server = this.config.VIDEO_SOURCES.find(s => s.id === serverId);
        if (!server) return;
        
        UI.showToast(`التبديل إلى ${server.name}...`, 'info');
        await this.playEpisode(anime, episode, serverId);
    }
    
    // Destroy player
    destroy() {
        if (this.player) {
            this.player.dispose();
            this.player = null;
        }
        this.currentSource = null;
        this.retryCount = 0;
    }
    
    // Get current time
    getCurrentTime() {
        return this.player ? this.player.currentTime() : 0;
    }
    
    // Set current time
    setCurrentTime(time) {
        if (this.player) {
            this.player.currentTime(time);
        }
    }
    
    // Check if playing
    isPlaying() {
        return this.player ? !this.player.paused() : false;
    }
}

// Create global instance
const Player = new PlayerManager(CONFIG);
'''

with open("/mnt/agents/output/anime-flix/js/player.js", "w", encoding="utf-8") as f:
    f.write(player_js)

print("player.js created!")
