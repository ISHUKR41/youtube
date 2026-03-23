# 🎵 YouTube Hook Player

A modern, professional web application that plays YouTube songs from their **hook** (the catchiest part) with random durations. Built with vanilla JavaScript and designed for optimal performance.

![YouTube Hook Player](https://img.shields.io/badge/Status-Production%20Ready-success)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)

## ✨ Features

- 🎯 **Hook Detection**: Automatically plays songs from their most engaging part
- ⏱️ **Smart Duration**: Randomized play times (50-60s most common, with variations)
- 📶 **Adaptive Quality**: Automatically adjusts video quality based on your internet speed
- 📝 **Playlist Support**: Add entire YouTube playlists at once
- 🎨 **Modern UI**: Professional, animated interface inspired by Vercel, Apple, and GitHub
- 🎮 **Full Controls**: Play, pause, skip, shuffle functionality
- 📊 **Statistics**: Track songs played, total time, and queue size
- ⌨️ **Keyboard Shortcuts**: Space to play/pause, arrows to navigate
- 🌐 **Responsive**: Works perfectly on desktop, tablet, and mobile

## 🎲 Duration Distribution

Songs are played with the following probability distribution:
- **50%** → 50-60 seconds
- **10%** → 10-15 seconds
- **10%** → 20-30 seconds
- **10%** → 30-40 seconds
- **10%** → 40-50 seconds
- **10%** → 80-95 seconds

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/ISHUKR41/youtube.git
   cd youtube
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📦 Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ISHUKR41/youtube)

### Option 2: Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **For production deployment**
   ```bash
   vercel --prod
   ```

### Option 3: GitHub Integration

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect settings from `vercel.json`
5. Click "Deploy"

## 📁 Project Structure

```
youtube/
├── public/              # Frontend assets
│   ├── css/
│   │   └── styles.css   # Professional UI styles
│   ├── js/
│   │   ├── app.js       # Main application controller
│   │   ├── player.js    # YouTube player module
│   │   └── utils.js     # Utility functions & quality detection
│   └── index.html       # Main HTML file
├── server/
│   └── server.js        # Express server (API endpoints)
├── package.json         # Dependencies
├── vercel.json          # Vercel configuration
└── README.md            # Documentation
```

## 🔧 Configuration

### Vercel Configuration (`vercel.json`)

The project includes a pre-configured `vercel.json` that:
- Builds the Express server as a serverless function
- Routes static assets (CSS, JS)
- Routes API endpoints
- Handles all other routes through the server

### Environment Variables

No environment variables required! The app uses:
- YouTube IFrame API (no API key needed)
- Client-side video playback
- Network Information API for adaptive quality

## 🎨 UI/UX Features

- **Glass Morphism**: Modern glassmorphic cards with backdrop blur
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Dark Theme**: Premium dark mode with purple/pink gradients
- **Particle Background**: Animated particles for visual appeal
- **Toast Notifications**: Non-intrusive feedback messages
- **Progress Indicators**: Real-time playback progress
- **Equalizer Animation**: Visual feedback for currently playing song

## 📶 Adaptive Quality System

The player automatically detects and adjusts video quality:

| Connection Type | Video Quality |
|----------------|---------------|
| 5G / Fast      | 720p          |
| 4G / Good      | 480p          |
| 3G / Medium    | 360p          |
| 2G / Slow      | 144p          |

The system uses:
1. **Network Information API** (primary method)
2. **Connection speed test** (fallback)
3. **Dynamic adjustment** when network changes

## 🎯 How It Works

1. **Paste URL**: Add a YouTube video or playlist URL
2. **Hook Detection**: The app estimates the hook position (typically 25-35% into the song)
3. **Random Duration**: A random play duration is selected from the distribution
4. **Quality Selection**: Video quality is chosen based on your connection speed
5. **Playback**: Song starts from the hook and plays for the selected duration
6. **Auto-Next**: Automatically moves to the next song in queue

## ⌨️ Keyboard Shortcuts

- `Space` - Play/Pause
- `→` (Right Arrow) - Next song
- `←` (Left Arrow) - Previous song

## 🛠️ Technologies Used

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Express.js, Node.js
- **APIs**: YouTube IFrame API, Network Information API
- **Deployment**: Vercel (Serverless Functions)
- **Fonts**: Outfit, Inter (Google Fonts)

## 📱 Browser Support

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Opera

## 🔒 Privacy & Security

- No data collection or tracking
- No cookies stored
- Client-side processing only
- No user authentication required
- Direct YouTube API usage (no proxy)

## 🐛 Troubleshooting

### Video won't load
- Check if the video is embeddable
- Try a different video
- Ensure internet connection is stable

### Quality not adjusting
- Your browser may not support Network Information API
- The app will fallback to default 480p quality

### Playlist not loading
- Some playlists may be private or restricted
- Try copying individual video URLs instead

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- YouTube IFrame API for video playback
- Vercel for hosting and deployment
- The amazing open-source community

## 📞 Support

If you encounter any issues or have questions:
1. Check the Troubleshooting section above
2. Open an issue on GitHub
3. Review the code - it's well-commented!

---

**Made with ❤️ for music lovers**

🎵 Enjoy discovering the best parts of your favorite songs! 🎵
