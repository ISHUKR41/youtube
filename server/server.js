const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files with proper MIME types and caching
app.use(express.static(path.join(__dirname, '..', 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
        // Cache static assets for 1 hour
        if (!filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
    }
}));

// API: Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// API: Parse YouTube URL  
app.post('/api/parse-url', (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        const result = parseYouTubeUrl(url);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to parse URL' });
    }
});

// API: Playlist info endpoint
app.get('/api/playlist-info/:playlistId', async (req, res) => {
    try {
        const { playlistId } = req.params;
        res.json({ 
            playlistId,
            message: 'Playlist loaded via YouTube IFrame API on client side'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch playlist info' });
    }
});

// Serve main page for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// YouTube URL Parser
function parseYouTubeUrl(url) {
    const result = {
        type: null,
        videoId: null,
        playlistId: null,
        timestamp: null
    };

    try {
        let urlObj;
        try {
            urlObj = new URL(url);
        } catch {
            urlObj = new URL('https://' + url);
        }

        const hostname = urlObj.hostname.replace('www.', '');

        const listParam = urlObj.searchParams.get('list');
        if (listParam) {
            result.playlistId = listParam;
            result.type = 'playlist';
        }

        if (hostname === 'youtu.be') {
            result.videoId = urlObj.pathname.slice(1);
            result.type = result.type || 'video';
        } else if (['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(hostname)) {
            const vParam = urlObj.searchParams.get('v');
            if (vParam) {
                result.videoId = vParam;
                result.type = result.type || 'video';
            }

            const embedMatch = urlObj.pathname.match(/\/(embed|v)\/([^/?]+)/);
            if (embedMatch) {
                result.videoId = embedMatch[2];
                result.type = result.type || 'video';
            }

            const shortsMatch = urlObj.pathname.match(/\/shorts\/([^/?]+)/);
            if (shortsMatch) {
                result.videoId = shortsMatch[1];
                result.type = result.type || 'video';
            }
        }

        const tParam = urlObj.searchParams.get('t');
        if (tParam) {
            result.timestamp = parseInt(tParam);
        }
    } catch (error) {
        result.error = 'Invalid YouTube URL';
    }

    return result;
}

// Export for Vercel serverless
module.exports = app;

// Start server locally
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`
    ╔══════════════════════════════════════════╗
    ║   🎵 Hook Player Server Running 🎵      ║
    ║                                          ║
    ║   Local:   http://localhost:${PORT}          ║
    ╚══════════════════════════════════════════╝
        `);
    });
}
