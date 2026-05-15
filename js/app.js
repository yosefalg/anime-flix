import { fetchTrending, searchAnime, getAnimeInfo, getWatchUrl } from './api.js';
import { renderAnimeCards, showLoader, hideLoader, showModal, hideModal } from './ui.js';
import { initPlayer, destroyPlayer } from './player.js';

let currentAnimeId = null;
let currentEpisodes = [];

// بناء الهيكل الأساسي للصفحة
function buildUI() {
    const header = document.getElementById('header');
    header.innerHTML = `
        <nav class="navbar">
            <div class="logo"><i class="fas fa-crown"></i> أنيمي فليكس</div>
            <div class="search-area">
                <input type="text" id="searchInput" placeholder="ابحث عن أنمي...">
                <button id="searchBtn" class="btn"><i class="fas fa-search"></i></button>
            </div>
            <button id="favoritesBtn" class="btn-outline"><i class="fas fa-heart"></i> مفضلتي</button>
        </nav>
    `;
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container">
            <div class="section-title"><i class="fas fa-fire"></i> الأكثر مشاهدة</div>
            <div id="trendingGrid" class="anime-grid"></div>
            <div class="section-title"><i class="fas fa-robot"></i> البحث الذكي (AI)</div>
            <div style="background:#1a1a2a; border-radius:30px; padding:1.5rem; text-align:center; margin-bottom:2rem;">
                <p>صف لي الأنمي الذي تريد:</p>
                <div style="display:flex; gap:1rem; margin-top:1rem; flex-wrap:wrap; justify-content:center;">
                    <input type="text" id="aiQuery" style="flex:2; min-width:200px; padding:0.8rem; border-radius:40px; border:none; background:#2a2a3a; color:white;" placeholder="مثال: أنمي عن مغامرات في عالم سحري">
                    <button id="aiSearchBtn" class="btn">بحث ذكي <i class="fas fa-magic"></i></button>
                </div>
                <div id="aiResults" style="margin-top:1.5rem;"></div>
            </div>
        </div>
    `;
    const footer = document.getElementById('footer');
    footer.innerHTML = `<div style="text-align:center; padding:2rem; color:#777;">© 2026 أنيمي فليكس - منصة عالمية مفتوحة المصدر</div>`;
    
    // ربط الأحداث
    document.getElementById('searchBtn').addEventListener('click', () => handleSearch());
    document.getElementById('aiSearchBtn').addEventListener('click', () => handleAISearch());
    document.getElementById('searchInput').addEventListener('keypress', (e) => { if(e.key === 'Enter') handleSearch(); });
}

async function handleSearch() {
    const query = document.getElementById('searchInput').value;
    if(!query) return;
    showLoader();
    const results = await searchAnime(query);
    const grid = document.getElementById('trendingGrid');
    renderAnimeCards(grid, results.slice(0,24));
    attachCardEvents();
    hideLoader();
}

async function handleAISearch() {
    const query = document.getElementById('aiQuery').value;
    if(!query) return;
    const resultsDiv = document.getElementById('aiResults');
    resultsDiv.innerHTML = '<div class="spinner" style="margin:auto;"></div>';
    const all = await fetchTrending();
    const keywords = query.toLowerCase().split(' ');
    const matched = all.filter(anime => {
        const title = (anime.title || '').toLowerCase();
        return keywords.some(k => title.includes(k));
    }).slice(0,12);
    if(matched.length === 0) {
        resultsDiv.innerHTML = '<p>لم يتم العثور على نتائج. جرب وصفاً آخر.</p>';
        return;
    }
    const tempContainer = document.createElement('div');
    tempContainer.className = 'anime-grid';
    renderAnimeCards(tempContainer, matched);
    resultsDiv.innerHTML = '';
    resultsDiv.appendChild(tempContainer);
    attachCardEvents(tempContainer);
}

function attachCardEvents(container = document) {
    container.querySelectorAll('.anime-card').forEach(card => {
        card.removeEventListener('click', card._listener);
        const handler = async () => {
            const id = card.dataset.id;
            if(id) await openAnimeModal(id);
        };
        card.addEventListener('click', handler);
        card._listener = handler;
    });
}

async function openAnimeModal(animeId) {
    showLoader();
    const info = await getAnimeInfo(animeId);
    currentAnimeId = animeId;
    currentEpisodes = info.episodes || [];
    const modal = document.getElementById('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <div style="display:flex; justify-content:space-between; padding:1rem; border-bottom:1px solid #a855f7;">
                <h3>${info.title || 'عنوان'}</h3>
                <button id="closeModalBtn" style="background:none; font-size:1.8rem;">&times;</button>
            </div>
            <div id="playerContainer"></div>
            <div id="serverSwitcher" style="padding:0.5rem 1rem;"></div>
            <div id="episodesContainer" class="episode-list"></div>
        </div>
    `;
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        destroyPlayer();
        hideModal();
    });
    renderEpisodes(currentEpisodes);
    showModal();
    hideLoader();
    if(currentEpisodes.length > 0) playEpisode(currentEpisodes[0].id || currentEpisodes[0].episodeId);
}

function renderEpisodes(episodes) {
    const container = document.getElementById('episodesContainer');
    container.innerHTML = episodes.map((ep, idx) => `
        <div class="ep-btn" data-ep-id="${ep.id || ep.episodeId || idx}">${ep.number || idx+1}</div>
    `).join('');
    document.querySelectorAll('.ep-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.ep-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const epId = btn.dataset.epId;
            await playEpisode(epId);
        });
    });
}

async function playEpisode(episodeId) {
    const url = await getWatchUrl(episodeId);
    if(url) {
        initPlayer('playerContainer', url);
    } else {
        document.getElementById('playerContainer').innerHTML = '<div style="padding:2rem; text-align:center;">فشل تحميل الفيديو. حاول لاحقاً أو اختر سيرفراً آخر.</div>';
    }
}

// بدء التشغيل
window.onload = async () => {
    buildUI();
    showLoader();
    const trending = await fetchTrending();
    const grid = document.getElementById('trendingGrid');
    renderAnimeCards(grid, trending.slice(0,24));
    attachCardEvents();
    hideLoader();
};
