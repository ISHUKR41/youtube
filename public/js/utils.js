/* ============================================
   Utility Functions
   Network detection, duration logic, particles
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
     * Updated ranges:
     * 50% → 50–60 seconds (random within range)
     * 10% → 10–15 seconds
     * 10% → 20–30 seconds
     * 10% → 30–40 seconds
     * 10% → 40–50 seconds
     * 10% → 80–95 seconds (1min 20s to 1min 35s)
     */
    getRandomDuration() {
        const rand = Math.random() * 100;
        
        if (rand < 50) {
            const dur = this._randomInt(50, 60);
            return { duration: dur, label: `${dur}s` };
        }
        if (rand < 60) {
            const dur = this._randomInt(10, 15);
            return { duration: dur, label: `${dur}s` };
        }
        if (rand < 70) {
            const dur = this._randomInt(20, 30);
            return { duration: dur, label: `${dur}s` };
        }
        if (rand < 80) {
            const dur = this._randomInt(30, 40);
            return { duration: dur, label: `${dur}s` };
        }
        if (rand < 90) {
            const dur = this._randomInt(40, 50);
            return { duration: dur, label: `${dur}s` };
        }
        // 10% → 80-95 seconds (1min 20s to 1min 35s)
        const dur = this._randomInt(80, 95);
        const mins = Math.floor(dur / 60);
        const secs = dur % 60;
        return { duration: dur, label: `${mins}:${secs.toString().padStart(2, '0')}` };
    },

    /**
     * Random integer between min and max (inclusive)
     */
    _randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Estimate hook/chorus start time based on song duration
     * Smarter estimation based on typical song structures:
     * - Intro → Verse 1 → Chorus (hook) typically at 25-35% of duration
     * - Short songs: earlier hooks
     * - Long songs: hooks around 60-90s mark
     */
    estimateHookStart(totalDurationSeconds) {
        let hookTime;
        const randomOffset = this._randomInt(-5, 5);

        if (totalDurationSeconds < 120) {
            // Short song (<2 min): hook around 25-35%
            hookTime = Math.floor(totalDurationSeconds * (0.25 + Math.random() * 0.1));
        } else if (totalDurationSeconds < 240) {
            // Medium song (2-4 min): hook typically around 45-75 seconds
            hookTime = 45 + this._randomInt(0, 30);
        } else if (totalDurationSeconds < 360) {
            // Long song (4-6 min): hook typically around 55-85 seconds
            hookTime = 55 + this._randomInt(0, 30);
        } else {
            // Very long song (>6 min): hook around 65-110 seconds
            hookTime = 65 + this._randomInt(0, 45);
        }

        hookTime = Math.max(0, hookTime + randomOffset);
        
        // Make sure hook isn't too close to the end
        if (hookTime > totalDurationSeconds - 30) {
            hookTime = Math.max(0, Math.floor(totalDurationSeconds * 0.25));
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
     * Format seconds to display-friendly string
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
     * Create animated background particles — organic floating dots
     */
    createParticles() {
        const container = document.getElementById('bgParticles');
        const colors = [
            'rgba(124, 58, 237, 0.25)',
            'rgba(236, 72, 153, 0.15)',
            'rgba(6, 182, 212, 0.15)',
            'rgba(245, 158, 11, 0.1)',
            'rgba(16, 185, 129, 0.12)'
        ];

        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = Math.random() * 4 + 1.5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                left: ${Math.random() * 100}%;
                animation-duration: ${20 + Math.random() * 25}s;
                animation-delay: ${Math.random() * 15}s;
            `;
            
            container.appendChild(particle);
        }
    },

    /**
     * Detect network quality using navigator.connection API
     * Returns: { quality: 'fast'|'medium'|'slow'|'offline', label: string, ytQuality: string }
     */
    getNetworkQuality() {
        // Check if offline
        if (!navigator.onLine) {
            return { quality: 'offline', label: 'Offline', ytQuality: 'small' };
        }

        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (!conn) {
            // API not available — assume medium
            return { quality: 'medium', label: 'Auto', ytQuality: 'default' };
        }

        const downlink = conn.downlink; // Mbps
        const effectiveType = conn.effectiveType; // '4g', '3g', '2g', 'slow-2g'

        if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 0.5) {
            return { quality: 'slow', label: '2G · Low', ytQuality: 'small' };
        }
        if (effectiveType === '3g' || downlink < 2) {
            return { quality: 'slow', label: '3G · Medium', ytQuality: 'medium' };
        }
        if (downlink < 5) {
            return { quality: 'medium', label: '4G · HD', ytQuality: 'large' };
        }
        if (downlink < 10) {
            return { quality: 'fast', label: 'Fast · HD', ytQuality: 'hd720' };
        }
        return { quality: 'fast', label: 'Ultra · Full HD', ytQuality: 'hd1080' };
    },

    /**
     * Update network badge UI
     */
    updateNetworkBadge() {
        const info = this.getNetworkQuality();
        const dot = document.getElementById('networkDot');
        const text = document.getElementById('networkText');

        if (!dot || !text) return info;

        // Reset classes
        dot.className = 'network-dot';
        
        if (info.quality === 'slow') {
            dot.classList.add('slow');
        } else if (info.quality === 'offline') {
            dot.classList.add('offline');
        }

        text.textContent = info.label;
        return info;
    },

    /**
     * Animate a number counter (for stats)
     */
    animateCounter(element, targetValue, duration = 400) {
        const startValue = parseInt(element.textContent) || 0;
        if (startValue === targetValue) return;

        const startTime = performance.now();
        const diff = targetValue - startValue;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startValue + diff * eased);
            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }
};
