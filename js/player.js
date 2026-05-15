let player = null;

export function initPlayer(elementId, url) {
    if (player) player.dispose();
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = `<video id="anime-video" class="video-js vjs-big-play-centered" controls preload="auto"></video>`;
    player = videojs('anime-video', {
        controls: true,
        autoplay: true,
        preload: 'auto',
        sources: [{ src: url, type: 'application/x-mpegURL' }]
    });
    return player;
}

export function destroyPlayer() {
    if (player) player.dispose();
    player = null;
}
