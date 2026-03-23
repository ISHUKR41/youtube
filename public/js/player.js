/* ============================================
   YouTube Player Module
   Uses YouTube IFrame API with Adaptive Quality
   ============================================ */

const HookPlayer = {
    player: null,
    isReady: false,
    currentSong: null,
    hookStartTime: 0,
    playDuration: 0,
    playTimer: null,
    progressTimer: null,
    playStartTime: 0,
    isPlaying: false,
    currentQuality: 'default',
    onSongEnd: null,
    onStateChange: null,

    /**
     * Initialize the YouTube IFrame API
     */
    init() {
        return new Promise((resolve) => {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode.insertBefore(tag, firstScript);

            window.onYouTubeIframeAPIReady = () => {
                this.player = new YT.Player('youtubePlayer', {
                    height: '100%',
                    width: '100%',
                    playerVars: {
                        'autoplay': 0,
                        'controls': 0,
                        'disablekb': 1,
                        'fs': 0,
                        'iv_load_policy': 3,
                        'modestbranding': 1,
                        'rel': 0,
                        'showinfo': 0,
                        'playsinline': 1
                    },
                    events: {
                        'onReady': () => {
                            this.isReady = true;
                            console.log('🎵 YouTube Player Ready');
                            // Set initial quality based on network
                            this._applyAdaptiveQuality();
                            resolve();
                        },
                        'onStateChange': (event) => this._handleStateChange(event),
                        'onError': (event) => this._handleError(event),
                        'onPlaybackQualityChange': (event) => {
                            this.currentQuality = event.data;
                            if (this.onStateChange) {
                                this.onStateChange('qualityChange', { quality: event.data });
                            }
                        }
                    }
                });
            };
        });
    },

    /**
     * Apply adaptive quality based on network speed
     */
    _applyAdaptiveQuality() {
        const networkInfo = Utils.getNetworkQuality();
        const ytQuality = networkInfo.ytQuality;

        if (this.player && this.player.setPlaybackQuality) {
            try {
                this.player.setPlaybackQuality(ytQuality);
            } catch (e) {
                // Quality API may not always work
                console.log('Quality set attempt:', ytQuality);
            }
        }

        this.currentQuality = ytQuality;
        return networkInfo;
    },

    /**
     * Play a song by video ID
     */
    async playSong(videoId, title = '') {
        if (!this.isReady || !this.player) {
            console.error('Player not ready');
            return;
        }

        // Clear any existing timers
        this._clearTimers();

        // Re-check network quality and apply
        const networkInfo = this._applyAdaptiveQuality();

        // Get random play duration
        const durationInfo = Utils.getRandomDuration();
        this.playDuration = durationInfo.duration;

        // Store current song info
        this.currentSong = {
            videoId,
            title: title || 'Loading...',
            duration: durationInfo.duration,
            durationLabel: durationInfo.label,
            quality: networkInfo.label
        };

        // Load the video
        this.player.loadVideoById({
            videoId: videoId,
            startSeconds: 0,
            suggestedQuality: networkInfo.ytQuality
        });

        // Wait for video duration
        this._waitForDuration(videoId);
    },

    /**
     * Wait for video duration to be available, then seek to hook
     */
    _waitForDuration(videoId) {
        let attempts = 0;
        const maxAttempts = 50;

        const checkDuration = () => {
            attempts++;
            
            if (!this.player || !this.currentSong || this.currentSong.videoId !== videoId) {
                return;
            }

            const totalDuration = this.player.getDuration();
            
            if (totalDuration > 0) {
                // Got duration — estimate hook position
                this.hookStartTime = Utils.estimateHookStart(totalDuration);
                
                // Make sure we don't play past the end
                if (this.hookStartTime + this.playDuration > totalDuration) {
                    this.hookStartTime = Math.max(0, totalDuration - this.playDuration - 5);
                }

                // Update song info with title from player
                const videoData = this.player.getVideoData();
                if (videoData && videoData.title) {
                    this.currentSong.title = videoData.title;
                }
                this.currentSong.totalDuration = totalDuration;

                // Seek to hook position and play
                this.player.seekTo(this.hookStartTime, true);
                this.player.playVideo();
                this.playStartTime = Date.now();
                this.isPlaying = true;

                // Notify state change
                if (this.onStateChange) {
                    this.onStateChange('playing', this.currentSong, this.hookStartTime, this.playDuration);
                }

                // Set timer to stop after play duration
                this.playTimer = setTimeout(() => {
                    this._songDurationComplete();
                }, this.playDuration * 1000);

                // Start progress updates
                this._startProgressUpdates();

                console.log(`🎵 Playing "${this.currentSong.title}" from ${Utils.formatTime(this.hookStartTime)} for ${this.playDuration}s [${this.currentQuality}]`);
            } else if (attempts < maxAttempts) {
                setTimeout(checkDuration, 200);
            } else {
                console.error('Could not get video duration');
                this.hookStartTime = 0;
                this.player.seekTo(0, true);
                this.player.playVideo();
                this.playStartTime = Date.now();
                this.isPlaying = true;

                this.playTimer = setTimeout(() => {
                    this._songDurationComplete();
                }, this.playDuration * 1000);

                this._startProgressUpdates();
            }
        };

        setTimeout(checkDuration, 500);
    },

    /**
     * Handle YouTube player state changes
     */
    _handleStateChange(event) {
        switch (event.data) {
            case YT.PlayerState.PLAYING:
                const videoData = this.player.getVideoData();
                if (videoData && videoData.title && this.currentSong) {
                    this.currentSong.title = videoData.title;
                    if (this.onStateChange) {
                        this.onStateChange('titleUpdate', this.currentSong);
                    }
                }
                break;

            case YT.PlayerState.ENDED:
                this._songDurationComplete();
                break;

            case YT.PlayerState.PAUSED:
                break;
        }
    },

    /**
     * Handle player errors
     */
    _handleError(event) {
        const errorMessages = {
            2: 'Invalid video ID',
            5: 'HTML5 player error',
            100: 'Video not found or removed',
            101: 'Video not embeddable',
            150: 'Video not embeddable'
        };

        const message = errorMessages[event.data] || 'Unknown error';
        console.error(`Player error: ${message} (${event.data})`);
        Utils.showToast(`Error: ${message}. Skipping...`, 'error');

        setTimeout(() => {
            if (this.onSongEnd) {
                this.onSongEnd('error');
            }
        }, 1500);
    },

    /**
     * Called when the play duration for current song is complete
     */
    _songDurationComplete() {
        this._clearTimers();
        this.isPlaying = false;

        if (this.player && this.player.pauseVideo) {
            this.player.pauseVideo();
        }

        if (this.onSongEnd) {
            this.onSongEnd('complete');
        }
    },

    /**
     * Start progress update interval
     */
    _startProgressUpdates() {
        this._clearProgressTimer();
        
        this.progressTimer = setInterval(() => {
            if (!this.isPlaying || !this.player) return;

            const elapsed = (Date.now() - this.playStartTime) / 1000;
            const progress = Math.min(elapsed / this.playDuration, 1);

            if (this.onStateChange) {
                this.onStateChange('progress', {
                    elapsed,
                    duration: this.playDuration,
                    progress,
                    currentTime: this.hookStartTime + elapsed
                });
            }
        }, 200);
    },

    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (!this.player || !this.currentSong) return;

        const state = this.player.getPlayerState();

        if (state === YT.PlayerState.PLAYING) {
            this.player.pauseVideo();
            this.isPlaying = false;
            
            if (this.playTimer) {
                clearTimeout(this.playTimer);
                const elapsed = (Date.now() - this.playStartTime) / 1000;
                this.playDuration = Math.max(0, this.playDuration - elapsed);
            }
            this._clearProgressTimer();

            if (this.onStateChange) {
                this.onStateChange('paused');
            }
        } else {
            this.player.playVideo();
            this.isPlaying = true;
            this.playStartTime = Date.now();

            this.playTimer = setTimeout(() => {
                this._songDurationComplete();
            }, this.playDuration * 1000);

            this._startProgressUpdates();

            if (this.onStateChange) {
                this.onStateChange('resumed');
            }
        }
    },

    /**
     * Stop playback completely
     */
    stop() {
        this._clearTimers();
        this.isPlaying = false;
        this.currentSong = null;

        if (this.player) {
            this.player.stopVideo();
        }

        if (this.onStateChange) {
            this.onStateChange('stopped');
        }
    },

    _clearTimers() {
        if (this.playTimer) {
            clearTimeout(this.playTimer);
            this.playTimer = null;
        }
        this._clearProgressTimer();
    },

    _clearProgressTimer() {
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
    },

    getState() {
        return {
            isPlaying: this.isPlaying,
            currentSong: this.currentSong,
            hookStartTime: this.hookStartTime,
            playDuration: this.playDuration,
            quality: this.currentQuality
        };
    }
};
