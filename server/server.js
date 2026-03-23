const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API: Parse YouTube URL and extract video ID(s)
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

// API: Get playlist videos using YouTube oEmbed (no API key needed)
app.get('/api/playlist-info/:playlistId', async (req, res) => {
    try {
        const { playlistId } = req.params;
        res.json({ 
            playlistId,
            message: 'Playlist will be loaded via YouTube IFrame API on the client side'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch playlist info' });
    }
});

// Serve main page for all routes
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
        // Handle various YouTube URL formats
        let urlObj;
        try {
            urlObj = new URL(url);
        } catch {
            // Try adding https if missing
            urlObj = new URL('https://' + url);
        }

        const hostname = urlObj.hostname.replace('www.', '');

        // Check for playlist
        const listParam = urlObj.searchParams.get('list');
        if (listParam) {
            result.playlistId = listParam;
            result.type = 'playlist';
        }

        // Check for video ID
        if (hostname === 'youtu.be') {
            result.videoId = urlObj.pathname.slice(1);
            result.type = result.type || 'video';
        } else if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
            const vParam = urlObj.searchParams.get('v');
            if (vParam) {
                result.videoId = vParam;
                result.type = result.type || 'video';
            }
            
            // Check for /embed/ or /v/ format
            const embedMatch = urlObj.pathname.match(/\/(embed|v)\/([^/?]+)/);
            if (embedMatch) {
                result.videoId = embedMatch[2];
                result.type = result.type || 'video';
            }

            // Check for /shorts/ format
            const shortsMatch = urlObj.pathname.match(/\/shorts\/([^/?]+)/);
            if (shortsMatch) {
                result.videoId = shortsMatch[1];
                result.type = result.type || 'video';
            }
        }

        // Get timestamp if present
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

// Start server only when running locally (not on Vercel)
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`
    ╔══════════════════════════════════════════╗
    ║   🎵 YouTube Hook Player Server 🎵      ║
    ║                                          ║
    ║   Server running on port ${PORT}            ║
    ║   Local:   http://localhost:${PORT}          ║
    ║   Network: http://0.0.0.0:${PORT}           ║
    ║                                          ║
    ╚══════════════════════════════════════════╝
        `);
    });
}
