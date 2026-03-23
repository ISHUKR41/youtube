/* ============================================
   Utility Functions
   ============================================ */

const Utils = {
    /**
     * Parse YouTube URL and extract video ID and playlist ID
     */
    parseYouTubeUrl(url) {
        const result = {
            type: null,
            videoId: null,
            playlistId: null
        };

        try {
            let urlStr = url.trim();
            
            // Add protocol if missing
            if (!urlStr.startsWith('http')) {
                urlStr = 'https://' + urlStr;
            }

            const urlObj = new URL(urlStr);
            const hostname = urlObj.hostname.replace('www.', '');

            // Check for playlist
            const listParam = urlObj.searchParams.get('list');
            if (listParam) {
                result.playlistId = listParam;
                result.type = 'playlist';
            }

            // Extract video ID based on URL format
            if (hostname === 'youtu.be') {
                result.videoId = urlObj.pathname.slice(1).split('/')[0];
                result.type = result.type || 'video';
            } else if (hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'music.youtube.com') {
                // Standard watch URL
                const vParam = urlObj.searchParams.get('v');
                if (vParam) {
                    result.videoId = vParam;
                    result.type = result.type || 'video';
                }

                // Embed/v format
                const embedMatch = urlObj.pathname.match(/\/(embed|v)\/([^/?]+)/);
                if (embedMatch) {
                    result.videoId = embedMatch[2];
                    result.type = result.type || 'video';
                }

                // Shorts format
                const shortsMatch = urlObj.pathname.match(/\/shorts\/([^/?]+)/);
                if (shortsMatch) {
                    result.videoId = shortsMatch[1];
                    result.type = result.type || 'video';
                }

                // Playlist-only URL (no video)
                if (!result.videoId && result.playlistId) {
                    result.type = 'playlist';
                }
            }
        } catch (e) {
            console.error('URL parse error:', e);
        }

        return result;
    },

    /**
     * Get random play duration based on weighted probability
     * 50% → 50-60 seconds
     * 10% → 10-15 seconds
     * 10% → 20-30 seconds
     * 10% → 30-40 seconds
     * 10% → 40-50 seconds
     * 10% → 80-95 seconds
     */
    getRandomDuration() {
        const rand = Math.random() * 100;

        if (rand < 50) {
            const duration = 50 + Math.floor(Math.random() * 11); // 50-60
            return { duration, label: `${duration}s` };
        }
        if (rand < 60) {
            const duration = 10 + Math.floor(Math.random() * 6); // 10-15
            return { duration, label: `${duration}s` };
        }
        if (rand < 70) {
            const duration = 20 + Math.floor(Math.random() * 11); // 20-30
            return { duration, label: `${duration}s` };
        }
        if (rand < 80) {
            const duration = 30 + Math.floor(Math.random() * 11); // 30-40
            return { duration, label: `${duration}s` };
        }
        if (rand < 90) {
            const duration = 40 + Math.floor(Math.random() * 11); // 40-50
            return { duration, label: `${duration}s` };
        }
        const duration = 80 + Math.floor(Math.random() * 16); // 80-95
        return { duration, label: `${duration}s` };
    },

    /**
     * Estimate hook/chorus start time based on song duration
     * Most songs follow patterns:
     * - Short songs (<2 min): Hook at ~25% of duration
     * - Medium songs (2-4 min): Hook at ~30-35% (~45-80s)
     * - Long songs (>4 min): Hook at ~25% (~60-90s)
     * Adding some randomness to keep it varied
     */
    estimateHookStart(totalDurationSeconds) {
        let hookTime;
        const randomOffset = Math.floor(Math.random() * 10) - 5; // ±5 seconds randomness

        if (totalDurationSeconds < 120) {
            // Short song: hook around 25-35%
            hookTime = Math.floor(totalDurationSeconds * 0.3);
        } else if (totalDurationSeconds < 240) {
            // Medium song (2-4 min): hook typically around 45-80 seconds
            hookTime = 45 + Math.floor(Math.random() * 25);
        } else if (totalDurationSeconds < 360) {
            // Long song (4-6 min): hook typically around 60-90 seconds
            hookTime = 55 + Math.floor(Math.random() * 30);
        } else {
            // Very long song (>6 min): hook typically around 70-120 seconds
            hookTime = 65 + Math.floor(Math.random() * 40);
        }

        hookTime = Math.max(0, hookTime + randomOffset);
        
        // Make sure hook isn't too close to the end
        if (hookTime > totalDurationSeconds - 30) {
            hookTime = Math.max(0, totalDurationSeconds * 0.25);
        }

        return Math.floor(hookTime);
    },

    /**
     * Format seconds to mm:ss
     */
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Format seconds to mm:ss for total time
     */
    formatTotalTime(totalSeconds) {
        if (totalSeconds < 60) return `${totalSeconds}s`;
        const mins = Math.floor(totalSeconds / 60);
        const secs = Math.floor(totalSeconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Show a toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
        container.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Get YouTube thumbnail URL from video ID
     */
    getThumbnail(videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    },

    /**
     * Generate a unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    /**
     * Create animated background particles
     */
    createParticles() {
        const container = document.getElementById('bgParticles');
        const colors = [
            'rgba(139, 92, 246, 0.3)',
            'rgba(236, 72, 153, 0.2)',
            'rgba(79, 172, 254, 0.2)',
            'rgba(245, 158, 11, 0.15)',
            'rgba(16, 185, 129, 0.2)'
        ];

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = Math.random() * 6 + 2;
            const color = colors[Math.floor(Math.random() * colors.length)];

            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                left: ${Math.random() * 100}%;
                animation-duration: ${15 + Math.random() * 20}s;
                animation-delay: ${Math.random() * 10}s;
            `;

            container.appendChild(particle);
        }
    },

    /**
     * Detect network speed and return appropriate video quality
     * Returns quality setting for YouTube player
     */
    async detectVideoQuality() {
        try {
            // Check if Network Information API is available
            if ('connection' in navigator) {
                const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                const effectiveType = connection?.effectiveType;

                // Map connection type to quality
                const qualityMap = {
                    'slow-2g': 'small',      // 144p
                    '2g': 'small',           // 144p
                    '3g': 'medium',          // 360p
                    '4g': 'large',           // 480p
                    '5g': 'hd720'            // 720p
                };

                if (effectiveType && qualityMap[effectiveType]) {
                    console.log(`📶 Network: ${effectiveType} → Quality: ${qualityMap[effectiveType]}`);
                    return qualityMap[effectiveType];
                }
            }

            // Fallback: Test download speed
            const startTime = Date.now();
            const response = await fetch('https://www.youtube.com/favicon.ico?' + Math.random(), {
                cache: 'no-store'
            });
            await response.blob();
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Estimate based on download time
            if (duration < 100) return 'hd720';      // Fast connection
            if (duration < 200) return 'large';      // Good connection
            if (duration < 400) return 'medium';     // Medium connection
            return 'small';                          // Slow connection
        } catch (error) {
            console.warn('Quality detection failed, using default');
            return 'large'; // Default to 480p
        }
    },

    /**
     * Monitor network changes and update quality
     */
    onNetworkChange(callback) {
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection) {
                connection.addEventListener('change', async () => {
                    const quality = await this.detectVideoQuality();
                    callback(quality);
                });
            }
        }
    }
};
