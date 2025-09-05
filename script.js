document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const resultsTitle = document.getElementById('results-title');
    const audioElement = document.getElementById('audio-player');
    const playerAlbumArt = document.getElementById('player-album-art');
    const playerTrackTitle = document.getElementById('player-track-title');
    const playerArtistName = document.getElementById('player-artist-name');
    const playPauseButton = document.getElementById('play-pause-button');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const progressBar = document.getElementById('progress-bar');
    const progress = document.getElementById('progress');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.getElementById('volume-icon');
    const playerFavoriteBtn = document.getElementById('player-favorite-btn');
    const favoritesLink = document.getElementById('favorites-link');
    const homeLink = document.getElementById('home-link');
    const queueLink = document.getElementById('queue-link');
    const menuButton = document.getElementById('menu-button');
    const sidebar = document.querySelector('.sidebar');
    
    let playlist = [];
    let queue = [];
    let currentIndex = 0;
    let isPlaying = false;
    let favorites = [];
    let currentTrackId = null;

    function loadFavorites() {
        const savedFavorites = localStorage.getItem('spotifyCloneFavorites');
        favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
    }

    function saveFavorites() {
        localStorage.setItem('spotifyCloneFavorites', JSON.stringify(favorites));
    }

    function showToast(message) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    window.handleDeezerResponse = function(response) {
        playlist = response.data;
        displayResults(playlist, "Resultados da Busca");
    }

    function searchTracks(query) {
        renderSkeletons();
        const oldScriptTag = document.getElementById('deezer-jsonp');
        if (oldScriptTag) oldScriptTag.remove();
        const script = document.createElement('script');
        script.id = 'deezer-jsonp';
        script.src = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&output=jsonp&callback=handleDeezerResponse`;
        script.onerror = () => { resultsContainer.innerHTML = "<p>Erro ao contatar a API.</p>"; };
        document.body.appendChild(script);
    }

    function renderSkeletons() {
        resultsTitle.textContent = "Buscando...";
        resultsContainer.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'skeleton-card';
            skeletonCard.innerHTML = `
                <div class="skeleton-image"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text skeleton-text-artist"></div>
            `;
            resultsContainer.appendChild(skeletonCard);
        }
    }

    function displayResults(tracks, title) {
        resultsTitle.textContent = title;
        resultsContainer.innerHTML = '';
        if (!tracks || tracks.length === 0) {
            resultsContainer.innerHTML = `<p>Nenhum resultado encontrado.</p>`;
            return;
        }
        tracks.forEach((track, index) => {
            const isFavorited = favorites.some(fav => fav.id === track.id);
            const trackCard = document.createElement('div');
            trackCard.className = 'track-card';
            trackCard.dataset.index = index;
            trackCard.dataset.trackId = track.id;

            trackCard.innerHTML = `
                <img src="${track.album.cover_medium}" alt="Capa do Álbum">
                <div class="track-name">${track.title}</div>
                <div class="artist-name">${track.artist.name}</div>
                <button class="options-btn"><i class="fas fa-ellipsis-v"></i></button>
                <i class="fas fa-play playing-indicator"></i>
            `;
            resultsContainer.appendChild(trackCard);
        });
        updatePlayingIndicator();
    }

    function loadTrack(index, isFromQueue = false) {
        const sourcePlaylist = isFromQueue ? queue : playlist;
        if (index < 0 || index >= sourcePlaylist.length) return;
        
        const track = sourcePlaylist[index];
        if (isFromQueue) {
            queue.shift(); 
        } else {
            currentIndex = index;
        }
        
        currentTrackId = track.id;
        audioElement.src = track.preview;
        playerAlbumArt.src = track.album.cover_medium;
        playerTrackTitle.textContent = track.title;
        playerArtistName.textContent = track.artist.name;
        totalDurationEl.textContent = "0:30";
        updatePlayerFavoriteIcon();
        playMusic();
    }

    function playMusic() {
        if (audioElement.src) {
            isPlaying = true;
            playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
            audioElement.play();
            updatePlayingIndicator();
        }
    }

    function pauseMusic() {
        isPlaying = false;
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
        audioElement.pause();
        updatePlayingIndicator();
    }

    function updatePlayingIndicator() {
        document.querySelectorAll('.track-card').forEach(card => {
            const cardTrackId = parseInt(card.dataset.trackId);
            if (isPlaying && cardTrackId === currentTrackId) {
                card.classList.add('playing');
            } else {
                card.classList.remove('playing');
            }
        });
    }

    function playNext() {
        if (queue.length > 0) {
            loadTrack(0, true);
        } else if (playlist.length > 0) {
            const nextIndex = (currentIndex + 1) % playlist.length;
            loadTrack(nextIndex, false);
        }
    }
    
    function playPrev() {
        if (playlist.length > 0) {
            const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
            loadTrack(prevIndex, false);
        }
    }

    function updateProgress() {
        if (audioElement.duration) {
            const { duration, currentTime } = audioElement;
            const progressPercent = (currentTime / duration) * 100;
            progress.style.width = `${progressPercent}%`;
            currentTimeEl.textContent = formatTime(currentTime);
        }
    }

    function setProgress(e) {
        const width = e.currentTarget.clientWidth;
        const clickX = e.offsetX;
        const duration = audioElement.duration;
        if (duration) {
            audioElement.currentTime = (clickX / width) * duration;
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function toggleFavorite(trackId) {
        const trackIndex = favorites.findIndex(fav => fav.id === trackId);
        const trackObject = playlist.find(track => track.id === trackId) || queue.find(track => track.id === trackId);

        if (trackIndex > -1) {
            favorites.splice(trackIndex, 1);
            showToast("Removida dos Favoritos.");
        } else {
            if (trackObject) {
                favorites.push(trackObject);
                showToast("Adicionada aos Favoritos!");
            }
        }
        saveFavorites();
        updateFavoriteIcons(trackId);
    }
    
    function updateFavoriteIcons(trackId) {
        const isFavorited = favorites.some(fav => fav.id === trackId);
        document.querySelectorAll(`.favorite-btn[data-track-id="${trackId}"]`).forEach(btn => {
            btn.classList.toggle('favorited', isFavorited);
            btn.innerHTML = `<i class="${isFavorited ? 'fas' : 'far'} fa-heart"></i>`;
        });
        if (trackId === currentTrackId) {
            updatePlayerFavoriteIcon();
        }
    }

    function updatePlayerFavoriteIcon() {
        const isFavorited = favorites.some(fav => fav.id === currentTrackId);
        playerFavoriteBtn.classList.toggle('favorited', isFavorited);
        playerFavoriteBtn.innerHTML = `<i class="${isFavorited ? 'fas' : 'far'} fa-heart"></i>`;
    }

    function addToQueue(trackId) {
        const trackObject = playlist.find(track => track.id === trackId);
        if (trackObject) {
            queue.push(trackObject);
            showToast("Adicionada à fila.");
        }
    }

    function showContextMenu(e) {
        closeContextMenu();
        const trackCard = e.target.closest('.track-card');
        const trackId = parseInt(trackCard.dataset.trackId);
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.top = `${e.pageY}px`;
        menu.style.left = `${e.pageX}px`;
        menu.innerHTML = `<button data-track-id="${trackId}" class="queue-btn">Adicionar à fila</button>`;
        document.body.appendChild(menu);
    }

    function closeContextMenu() {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) existingMenu.remove();
    }

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchTerm = searchInput.value.trim();
        if (searchTerm) searchTracks(searchTerm);
    });

    resultsContainer.addEventListener('click', (e) => {
        const cardImg = e.target.closest('img');
        const cardText = e.target.closest('.track-name, .artist-name');
        const favoriteButton = e.target.closest('.favorite-btn');
        const optionsButton = e.target.closest('.options-btn');

        if (optionsButton) {
            e.stopPropagation();
            showContextMenu(e);
            return;
        }
        if (favoriteButton) {
            const trackId = parseInt(favoriteButton.dataset.trackId, 10);
            toggleFavorite(trackId);
            return;
        }
        if (cardImg || cardText) {
            const card = e.target.closest('.track-card');
            const index = parseInt(card.dataset.index, 10);
            loadTrack(index, resultsTitle.textContent.includes("Fila"));
        }
    });

    playPauseButton.addEventListener('click', () => { isPlaying ? pauseMusic() : playMusic(); });
    nextButton.addEventListener('click', playNext);
    prevButton.addEventListener('click', playPrev);
    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('ended', playNext);
    progressBar.addEventListener('click', setProgress);
    volumeSlider.addEventListener('input', (e) => { audioElement.volume = e.target.value; audioElement.muted = e.target.value === '0'; });
    volumeIcon.addEventListener('click', () => { audioElement.muted = !audioElement.muted; });
    audioElement.addEventListener('volumechange', () => {
        volumeSlider.value = audioElement.muted ? 0 : audioElement.volume;
        volumeIcon.innerHTML = `<i class="fas ${audioElement.muted || audioElement.volume === 0 ? 'fa-volume-mute' : 'fa-volume-high'}"></i>`;
    });
    playerFavoriteBtn.addEventListener('click', () => { if (currentTrackId) toggleFavorite(currentTrackId); });
    favoritesLink.addEventListener('click', (e) => { e.preventDefault(); playlist = [...favorites]; displayResults(playlist, "Músicas Curtidas"); });
    homeLink.addEventListener('click', (e) => { e.preventDefault(); searchTracks("hits brasil"); });
    queueLink.addEventListener('click', (e) => { e.preventDefault(); displayResults(queue, "Sua Fila de Reprodução"); });
    menuButton.addEventListener('click', () => sidebar.classList.toggle('active'));
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.options-btn')) closeContextMenu();
        if (e.target.closest('.queue-btn')) {
            const trackId = parseInt(e.target.dataset.trackId, 10);
            addToQueue(trackId);
            closeContextMenu();
        }
        if (sidebar.classList.contains('active') && !e.target.closest('.sidebar') && !e.target.closest('#menu-button')) {
            sidebar.classList.remove('active');
        }
    });
    
    loadFavorites();
    searchTracks("hits brasil");
});