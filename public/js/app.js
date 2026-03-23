/* ============================================
   Main Application Controller
   Queue management, UI updates, interactions
   ============================================ */

const App = {
    queue: [],
    currentIndex: -1,
    isShuffleOn: false,
    networkCheckInterval: null,
    stats: {
        songsPlayed: 0,
        totalListenTime: 0
    },

    /**
     * Initialize the application
     */
    async init() {
        console.log('🎵 Hook Player Starting...');

        // Create background particles
        Utils.createParticles();

        // Initialize network monitoring
        this._initNetworkMonitor();

        // Initialize YouTube player
        await HookPlayer.init();

        // Set up event handlers
        this._setupEventListeners();

        // Set up player callbacks
        HookPlayer.onSongEnd = (reason) => this._onSongEnd(reason);
        HookPlayer.onStateChange = (state, data, hookTime, duration) => {
            this._onPlayerStateChange(state, data, hookTime, duration);
        };

        // Setup intersection observer for reveal animations
        this._setupRevealAnimations();

        Utils.showToast('Hook Player ready! Paste a YouTube URL 🎶', 'success');
    },

    /**
     * Initialize network quality monitoring
     */
    _initNetworkMonitor() {
        // Initial check
        Utils.updateNetworkBadge();

        // Monitor network changes
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            conn.addEventListener('change', () => {
                const info = Utils.updateNetworkBadge();
                Utils.showToast(`Network: ${info.label}`, 'info');
            });
        }

        // Also listen for online/offline events
        window.addEventListener('online', () => {
            Utils.updateNetworkBadge();
            Utils.showToast('Back online! 🌐', 'success');
        });

        window.addEventListener('offline', () => {
            Utils.updateNetworkBadge();
            Utils.showToast('You are offline', 'warning');
        });

        // Periodic check every 30 seconds
        this.networkCheckInterval = setInterval(() => {
            Utils.updateNetworkBadge();
        }, 30000);
    },

    /**
     * Setup intersection observer for reveal animations
     */
    _setupRevealAnimations() {
        const sections = document.querySelectorAll('.reveal-section');
        if (sections.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        });

        sections.forEach(section => observer.observe(section));
    },

    /**
     * Set up all DOM event listeners
     */
    _setupEventListeners() {
        const urlInput = document.getElementById('urlInput');
        
        // URL Input — Enter key
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this._handleUrlSubmit();
            }
        });

        // URL Input — Paste event (auto-submit)
        urlInput.addEventListener('paste', () => {
            setTimeout(() => {
                this._handleUrlSubmit();
            }, 100);
        });

        // Add button
        document.getElementById('addButton').addEventListener('click', () => {
            this._handleUrlSubmit();
        });

        // Play/Pause
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            HookPlayer.togglePlayPause();
        });

        // Next
        document.getElementById('nextBtn').addEventListener('click', () => {
            this.playNext();
        });

        // Previous
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.playPrevious();
        });

        // Shuffle
        document.getElementById('shuffleBtn').addEventListener('click', () => {
            this.toggleShuffle();
        });

        // Clear queue
        document.getElementById('clearQueueBtn').addEventListener('click', () => {
            this.clearQueue();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target === urlInput) return;

            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    HookPlayer.togglePlayPause();
                    break;
                case 'ArrowRight':
                    this.playNext();
                    break;
                case 'ArrowLeft':
                    this.playPrevious();
                    break;
                case 'KeyS':
                    this.toggleShuffle();
                    break;
            }
        });
    },

    /**
     * Handle URL submission
     */
    async _handleUrlSubmit() {
        const input = document.getElementById('urlInput');
        const url = input.value.trim();

        if (!url) {
            Utils.showToast('Please paste a YouTube URL', 'warning');
            return;
        }

        const parsed = Utils.parseYouTubeUrl(url);

        if (!parsed.type) {
            Utils.showToast('Invalid YouTube URL. Please check and try again.', 'error');
            return;
        }

        if (parsed.type === 'playlist' && parsed.playlistId) {
            this._handlePlaylist(parsed.playlistId, parsed.videoId);
        } else if (parsed.videoId) {
            this._addToQueue(parsed.videoId);
            Utils.showToast('Song added to queue! 🎵', 'success');

            if (!HookPlayer.isPlaying && this.currentIndex === -1) {
                this.currentIndex = this.queue.length - 1;
                this._playCurrent();
            }
        }

        input.value = '';
        input.focus();
    },

    /**
     * Handle playlist URL
     */
    async _handlePlaylist(playlistId, firstVideoId) {
        Utils.showToast('Loading playlist... 📋', 'info');

        try {
            const tempDiv = document.createElement('div');
            tempDiv.id = 'tempPlaylistPlayer';
            tempDiv.style.display = 'none';
            document.body.appendChild(tempDiv);

            const tempPlayer = new YT.Player('tempPlaylistPlayer', {
                height: '1',
                width: '1',
                playerVars: {
                    'list': playlistId,
                    'listType': 'playlist'
                },
                events: {
                    'onReady': (event) => {
                        setTimeout(() => {
                            try {
                                const playlist = event.target.getPlaylist();
                                if (playlist && playlist.length > 0) {
                                    playlist.forEach(videoId => {
                                        this._addToQueue(videoId);
                                    });

                                    Utils.showToast(`Added ${playlist.length} songs from playlist! 🎶`, 'success');

                                    if (!HookPlayer.isPlaying && this.currentIndex === -1) {
                                        this.currentIndex = this.queue.length - playlist.length;
                                        this._playCurrent();
                                    }
                                } else {
                                    Utils.showToast('Could not load playlist. Try adding songs individually.', 'warning');
                                }
                            } catch (e) {
                                console.error('Playlist load error:', e);
                                if (firstVideoId) {
                                    this._addToQueue(firstVideoId);
                                    Utils.showToast('Added 1 song from playlist link', 'info');
                                    if (!HookPlayer.isPlaying && this.currentIndex === -1) {
                                        this.currentIndex = this.queue.length - 1;
                                        this._playCurrent();
                                    }
                                }
                            }

                            event.target.destroy();
                            const el = document.getElementById('tempPlaylistPlayer');
                            if (el) el.remove();
                        }, 2000);
                    },
                    'onError': () => {
                        if (firstVideoId) {
                            this._addToQueue(firstVideoId);
                            Utils.showToast('Playlist not loadable. Added 1 song.', 'warning');
                            if (!HookPlayer.isPlaying && this.currentIndex === -1) {
                                this.currentIndex = this.queue.length - 1;
                                this._playCurrent();
                            }
                        }
                        const el = document.getElementById('tempPlaylistPlayer');
                        if (el) el.remove();
                    }
                }
            });
        } catch (error) {
            console.error('Playlist error:', error);
            if (firstVideoId) {
                this._addToQueue(firstVideoId);
                Utils.showToast('Added 1 song', 'info');
            }
        }
    },

    /**
     * Add a video ID to the queue
     */
    _addToQueue(videoId) {
        const song = {
            id: Utils.generateId(),
            videoId: videoId,
            title: `Song ${this.queue.length + 1}`,
            thumbnail: Utils.getThumbnail(videoId),
            addedAt: Date.now()
        };

        this.queue.push(song);
        this._renderQueue();
        this._updateStats();
    },

    /**
     * Play the current song in queue
     */
    _playCurrent() {
        if (this.currentIndex < 0 || this.currentIndex >= this.queue.length) {
            return;
        }

        const song = this.queue[this.currentIndex];
        
        // Show player section
        document.getElementById('playerSection').classList.add('active');
        document.getElementById('playerOverlay').classList.add('hidden');

        // Play the song
        HookPlayer.playSong(song.videoId, song.title);

        // Update queue UI
        this._renderQueue();
    },

    /**
     * Play next song in queue
     */
    playNext() {
        if (this.queue.length === 0) return;

        if (this.isShuffleOn) {
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * this.queue.length);
            } while (nextIndex === this.currentIndex && this.queue.length > 1);
            this.currentIndex = nextIndex;
        } else {
            this.currentIndex = (this.currentIndex + 1) % this.queue.length;
        }

        this._playCurrent();
    },

    /**
     * Play previous song in queue
     */
    playPrevious() {
        if (this.queue.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
        this._playCurrent();
    },

    /**
     * Toggle shuffle mode
     */
    toggleShuffle() {
        this.isShuffleOn = !this.isShuffleOn;
        const btn = document.getElementById('shuffleBtn');
        btn.classList.toggle('active', this.isShuffleOn);
        Utils.showToast(this.isShuffleOn ? 'Shuffle ON 🔀' : 'Shuffle OFF', 'info');
    },

    /**
     * Clear the entire queue
     */
    clearQueue() {
        HookPlayer.stop();
        this.queue = [];
        this.currentIndex = -1;

        document.getElementById('playerSection').classList.remove('active');
        document.getElementById('playerOverlay').classList.remove('hidden');

        this._renderQueue();
        this._updateStats();
        this._updateVisualizer(false);
        Utils.showToast('Queue cleared', 'info');
    },

    /**
     * Remove a song from queue by ID
     */
    _removeSong(songId) {
        const index = this.queue.findIndex(s => s.id === songId);
        if (index === -1) return;

        if (index === this.currentIndex) {
            this.queue.splice(index, 1);
            if (this.queue.length > 0) {
                this.currentIndex = Math.min(this.currentIndex, this.queue.length - 1);
                this._playCurrent();
            } else {
                this.currentIndex = -1;
                HookPlayer.stop();
                document.getElementById('playerSection').classList.remove('active');
                this._updateVisualizer(false);
            }
        } else {
            this.queue.splice(index, 1);
            if (index < this.currentIndex) {
                this.currentIndex--;
            }
        }

        this._renderQueue();
        this._updateStats();
    },

    /**
     * Play a specific song from queue
     */
    _playSongAtIndex(index) {
        this.currentIndex = index;
        this._playCurrent();
    },

    /**
     * Update audio visualizer state
     */
    _updateVisualizer(playing) {
        const viz = document.getElementById('audioVisualizer');
        if (!viz) return;
        
        if (playing) {
            viz.classList.remove('paused');
        } else {
            viz.classList.add('paused');
        }
    },

    /**
     * Called when a song ends
     */
    _onSongEnd(reason) {
        this.stats.songsPlayed++;
        this._updateVisualizer(false);
        
        document.getElementById('progressFill').style.width = '100%';
        document.getElementById('progressGlow').style.width = '100%';

        setTimeout(() => {
            if (this.queue.length > 0) {
                this.playNext();
            }
        }, 800);
    },

    /**
     * Handle player state changes
     */
    _onPlayerStateChange(state, data, hookTime, duration) {
        switch (state) {
            case 'playing':
                document.getElementById('songTitle').textContent = data.title;
                document.getElementById('hookInfo').innerHTML = 
                    `<span class="meta-icon">🎯</span> Hook: ${Utils.formatTime(hookTime)}`;
                document.getElementById('playDuration').innerHTML = 
                    `<span class="meta-icon">⏱</span> Duration: ${data.durationLabel}`;
                document.getElementById('durationBadge').textContent = data.durationLabel;
                document.getElementById('endTime').textContent = Utils.formatTime(duration);
                
                // Update quality display
                if (data.quality) {
                    document.getElementById('qualityInfo').innerHTML = 
                        `<span class="meta-icon">📶</span> Quality: ${data.quality}`;
                }

                document.getElementById('playIcon').style.display = 'none';
                document.getElementById('pauseIcon').style.display = 'block';

                this._updateVisualizer(true);

                if (this.currentIndex >= 0 && this.currentIndex < this.queue.length) {
                    this.queue[this.currentIndex].title = data.title;
                    this._renderQueue();
                }
                break;

            case 'titleUpdate':
                document.getElementById('songTitle').textContent = data.title;
                if (this.currentIndex >= 0 && this.currentIndex < this.queue.length) {
                    this.queue[this.currentIndex].title = data.title;
                    this._renderQueue();
                }
                break;

            case 'progress':
                const progress = data.progress * 100;
                document.getElementById('progressFill').style.width = `${progress}%`;
                document.getElementById('progressGlow').style.width = `${progress}%`;
                document.getElementById('currentTime').textContent = Utils.formatTime(data.elapsed);
                
                this.stats.totalListenTime = Math.floor(
                    (this.stats.songsPlayed > 0 ? this.stats.totalListenTime : 0) + 0.2
                );
                this._updateStats();
                break;

            case 'paused':
                document.getElementById('playIcon').style.display = 'block';
                document.getElementById('pauseIcon').style.display = 'none';
                this._updateVisualizer(false);
                break;

            case 'resumed':
                document.getElementById('playIcon').style.display = 'none';
                document.getElementById('pauseIcon').style.display = 'block';
                this._updateVisualizer(true);
                break;

            case 'stopped':
                document.getElementById('playIcon').style.display = 'block';
                document.getElementById('pauseIcon').style.display = 'none';
                document.getElementById('progressFill').style.width = '0%';
                document.getElementById('progressGlow').style.width = '0%';
                document.getElementById('currentTime').textContent = '0:00';
                this._updateVisualizer(false);
                break;

            case 'qualityChange':
                if (data && data.quality) {
                    const qualityLabels = {
                        'small': '240p',
                        'medium': '360p',
                        'large': '480p',
                        'hd720': '720p HD',
                        'hd1080': '1080p Full HD',
                        'highres': '4K+',
                        'default': 'Auto'
                    };
                    const label = qualityLabels[data.quality] || data.quality;
                    document.getElementById('qualityInfo').innerHTML = 
                        `<span class="meta-icon">📶</span> ${label}`;
                }
                break;
        }
    },

    /**
     * Render the queue list
     */
    _renderQueue() {
        const list = document.getElementById('queueList');

        if (this.queue.length === 0) {
            list.innerHTML = `
                <div class="queue-empty">
                    <div class="empty-icon">🎵</div>
                    <p>Queue is empty</p>
                    <p class="empty-hint">Paste a YouTube URL above to add songs</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.queue.map((song, index) => `
            <div class="queue-item ${index === this.currentIndex ? 'active' : ''}" 
                 data-index="${index}"
                 onclick="App._playSongAtIndex(${index})">
                <div class="queue-item-number">
                    ${index === this.currentIndex ? 
                        '<div class="equalizer"><div class="eq-bar"></div><div class="eq-bar"></div><div class="eq-bar"></div><div class="eq-bar"></div><div class="eq-bar"></div></div>' 
                        : index + 1}
                </div>
                <img class="queue-item-thumb" 
                     src="${song.thumbnail}" 
                     alt=""
                     loading="lazy"
                     onerror="this.style.display='none'">
                <div class="queue-item-info">
                    <div class="queue-item-title">${this._escapeHtml(song.title)}</div>
                    <div class="queue-item-duration">${song.videoId}</div>
                </div>
                <button class="queue-item-remove" 
                        onclick="event.stopPropagation(); App._removeSong('${song.id}')"
                        title="Remove">×</button>
            </div>
        `).join('');

        document.getElementById('queueCount').textContent = `${this.queue.length} song${this.queue.length !== 1 ? 's' : ''}`;
    },

    /**
     * Update stats display
     */
    _updateStats() {
        const totalPlayedEl = document.getElementById('totalPlayed');
        const queueSizeEl = document.getElementById('queueSize');
        
        // Use animated counters for numbers
        Utils.animateCounter(totalPlayedEl, this.stats.songsPlayed);
        Utils.animateCounter(queueSizeEl, this.queue.length);
        
        document.getElementById('totalTime').textContent = Utils.formatTotalTime(Math.floor(this.stats.totalListenTime));
    },

    /**
     * Escape HTML to prevent XSS
     */
    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
