export function renderAnimeCards(container, animeList) {
    if (!container) return;
    container.innerHTML = animeList.map(anime => `
        <div class="anime-card" data-id="${anime.id || anime.animeId || anime.mal_id}">
            <img src="${anime.image || anime.img || 'https://placehold.co/200x300'}" alt="${anime.title}" onerror="this.src='https://placehold.co/200x300'">
            <h3>${anime.title}</h3>
        </div>
    `).join('');
}

export function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.remove('hide');
}
export function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hide');
}
export function showModal() {
    document.getElementById('modal').classList.add('active');
}
export function hideModal() {
    document.getElementById('modal').classList.remove('active');
}
