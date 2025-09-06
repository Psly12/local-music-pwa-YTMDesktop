# Local Music PWA

🎵 **Lightweight music player that runs in your browser with YouTube Music Desktop integration**

Play your local audio files without a native app, using just your browser. Complete with Dark/Light theme support, artwork-based UI coloring, animations, and seamless YouTube Music Desktop integration.

[![Deploy Status](https://img.shields.io/badge/deploy-ready-brightgreen)](./DEPLOYMENT.md)
[![Node.js](https://img.shields.io/badge/Node.js-22+-brightgreen)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](#deployment)

## ✨ Features

- 🎶 **Local Music Playback** - Play audio files directly from your device
- 🎯 **YouTube Music Desktop Integration** - Control YTM Desktop remotely
- 🌙 **Dark/Light Theme** - Automatic theme switching with custom colors
- 🎨 **Dynamic UI Colors** - Extract colors from album artwork
- 📱 **Progressive Web App** - Install and use offline
- 🔄 **Real-time Sync** - Live updates from YouTube Music Desktop
- 📂 **File System Access** - Modern browser file handling
- 🖱️ **Touch Friendly** - Optimized for mobile and touch devices

## 🚀 Quick Start

### Automatic Deployment (Recommended)

1. **Clone and setup**
   ```bash
   git clone https://github.com/Psly12/local-music-pwa-YTMDesktop.git
   cd local-music-pwa-YTMDesktop
   npm run deploy:setup
   ```

2. **Launch the app**
   ```bash
   npm run deploy:local
   ```

3. **Open in browser**
   - Navigate to `http://localhost:4173`
   - Install as PWA for best experience

### Platform-Specific Quick Start

#### Windows 🪟
```cmd
# After setup, double-click:
start-windows.bat
```

#### macOS/Linux 🍎🐧
```bash
# After setup, run:
./start-unix.sh
```

## 📋 Requirements

- **Node.js 22+** (required)
- **Modern browser** (Chrome, Edge, Firefox, Safari)
- **YouTube Music Desktop** (optional, for YTM integration)

## 🔧 Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Start with network access (for mobile testing)
pnpm run dev:host

# Build for production
pnpm run build:prod

# Run tests
pnpm test
```

## 📱 Mobile Access

Access from your phone on the same WiFi network:

1. **Find your computer's IP address**
   - Windows: `ipconfig`
   - macOS/Linux: `ifconfig`

2. **Open on mobile**
   - Navigate to `http://YOUR_IP:4173`
   - Add to home screen for app-like experience

## 🎵 YouTube Music Desktop Integration

1. **Install YTM Desktop**
   - Download from [th-ch/youtube-music](https://github.com/th-ch/youtube-music)

2. **Enable API**
   - Open YTM Desktop → Settings → Integrations
   - Enable "Remote Control API"

3. **Connect**
   - Open Local Music PWA → Settings
   - Enable YouTube Music Desktop Integration
   - Click Connect and approve in YTM Desktop

## 🌐 Browser Compatibility

| Feature | Chrome/Edge | Firefox | Safari |
|---------|-------------|---------|--------|
| Local Files | ✅ Native | ⚠️ Copy to IndexedDB | ⚠️ Copy to IndexedDB |
| PWA Install | ✅ | ✅ | ✅ |
| YTM Integration | ✅ | ✅ | ✅ |
| File System Access | ✅ | ❌ | ❌ |

## 📖 Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - Comprehensive setup instructions
- **[Configuration](./docs/configuration.md)** - Advanced configuration options
- **[API Documentation](./docs/api.md)** - YTM Desktop API integration
- **[Contributing](./CONTRIBUTING.md)** - Development and contribution guide

## 🔒 Privacy

- **No data collection** - Everything runs locally in your browser
- **No external analytics** - Your music library stays private
- **Optional YTM integration** - Only connects to your local YTM Desktop instance

## 🐛 Troubleshooting

### Common Issues

1. **Node.js version error**
   ```bash
   node --version  # Should be 22+
   # Update from https://nodejs.org/
   ```

2. **Port already in use**
   ```bash
   pnpm run preview -- --port 3000
   ```

3. **Network access blocked**
   - Check firewall settings
   - Allow Node.js through firewall

4. **YTM connection fails**
   - Ensure YTM Desktop is running
   - Check API is enabled in settings
   - Verify host/port configuration

See the full [Troubleshooting Guide](./DEPLOYMENT.md#troubleshooting) for more solutions.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [YouTube Music Desktop](https://github.com/th-ch/youtube-music) for the amazing desktop app
- [SvelteKit](https://kit.svelte.dev/) for the fantastic framework
- [Material Design](https://material.io/) for the design system
- All contributors who helped improve this project

---

**Need help?** Check the [Deployment Guide](./DEPLOYMENT.md) or [open an issue](https://github.com/Psly12/local-music-pwa-YTMDesktop/issues).