# Deployment Guide

This guide will help you deploy the Local Music PWA on Windows, macOS, and Linux systems.

## System Requirements

- **Node.js 22+** (required)
- **pnpm** (will be installed automatically if not present)
- **Modern web browser** (Chrome/Edge/Firefox/Safari)
- **YouTube Music Desktop** (optional, for YTM integration)

## Quick Start

### Automatic Setup (Recommended)

1. **Download the project**
   ```bash
   git clone https://github.com/your-username/local-music-pwa.git
   cd local-music-pwa
   ```

2. **Run the setup script**
   ```bash
   npm run deploy:setup
   ```

3. **Build and deploy**
   ```bash
   npm run deploy:local
   ```

4. **Open your browser**
   - Navigate to `http://localhost:4173`
   - The app is now running locally!

### Platform-Specific Instructions

#### Windows 🪟

1. **Prerequisites**
   - Install [Node.js 22+](https://nodejs.org/) from the official website
   - Optionally install [Git](https://git-scm.com/) for cloning the repository

2. **Easy Method - Use the batch file**
   - Double-click `start-windows.bat` (created after running setup)
   - The script will handle everything automatically

3. **Manual Method**
   ```cmd
   # Open Command Prompt or PowerShell as Administrator
   npm install -g pnpm
   pnpm install
   pnpm run build
   pnpm run preview:host
   ```

4. **Network Access (for mobile devices)**
   - Windows Firewall may block network access
   - Allow Node.js through Windows Firewall when prompted
   - Find your IP: `ipconfig` in Command Prompt
   - Access from mobile: `http://YOUR_IP:4173`

#### macOS 🍎

1. **Prerequisites**
   - Install [Node.js 22+](https://nodejs.org/) from the official website
   - Install Xcode Command Line Tools: `xcode-select --install`

2. **Easy Method - Use the shell script**
   ```bash
   chmod +x start-unix.sh
   ./start-unix.sh
   ```

3. **Manual Method**
   ```bash
   npm install -g pnpm
   pnpm install
   pnpm run build
   pnpm run preview:host
   ```

4. **Network Access (for mobile devices)**
   - macOS Firewall should allow local network access
   - Find your IP: `ifconfig | grep "inet "` in Terminal
   - Access from mobile: `http://YOUR_IP:4173`

#### Linux 🐧

1. **Prerequisites**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install nodejs npm build-essential
   
   # CentOS/RHEL/Fedora
   sudo dnf install nodejs npm gcc gcc-c++ make
   
   # Arch Linux
   sudo pacman -S nodejs npm base-devel
   ```

2. **Easy Method - Use the shell script**
   ```bash
   chmod +x start-unix.sh
   ./start-unix.sh
   ```

3. **Manual Method**
   ```bash
   npm install -g pnpm
   pnpm install
   pnpm run build
   pnpm run preview:host
   ```

## Production Deployment

### Static File Hosting

The app builds to static files that can be hosted on any web server:

1. **Build for production**
   ```bash
   pnpm run build:prod
   ```

2. **Deploy the `build` folder** to your web server:
   - **Netlify**: Drag and drop the `build` folder
   - **Vercel**: Connect your GitHub repository
   - **GitHub Pages**: Upload to `gh-pages` branch
   - **Apache/Nginx**: Copy files to web root

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:22-alpine
   WORKDIR /app
   COPY package*.json pnpm-lock.yaml ./
   RUN npm install -g pnpm && pnpm install --frozen-lockfile
   COPY . .
   RUN pnpm run build
   EXPOSE 4173
   CMD ["pnpm", "run", "preview:host"]
   ```

2. **Build and run**
   ```bash
   docker build -t local-music-pwa .
   docker run -p 4173:4173 local-music-pwa
   ```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Network configuration
VITE_HOST=0.0.0.0
VITE_PORT=4173

# YouTube Music Desktop integration
VITE_YTM_DEFAULT_HOST=127.0.0.1
VITE_YTM_DEFAULT_PORT=9863

# PWA configuration
VITE_APP_NAME="Local Music PWA"
VITE_APP_SHORT_NAME="Music PWA"
```

### Vite Configuration

The app includes optimized Vite configuration for deployment:

- **Static file optimization**
- **Minification and compression**
- **Progressive Web App features**
- **Network host binding**

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Use different port
   pnpm run preview -- --port 3000
   ```

2. **Node.js version too old**
   ```bash
   # Check version
   node --version
   
   # Update Node.js from https://nodejs.org/
   ```

3. **Permission denied (Unix systems)**
   ```bash
   # Fix script permissions
   chmod +x start-unix.sh
   
   # Or run with sudo
   sudo pnpm run preview:host
   ```

4. **Windows Firewall blocking**
   - Allow Node.js through Windows Firewall
   - Or temporarily disable Windows Firewall for testing

5. **Build fails**
   ```bash
   # Clear cache and reinstall
   pnpm run install:clean
   pnpm run build
   ```

### Network Access Issues

1. **Find your local IP address**
   - Windows: `ipconfig`
   - macOS/Linux: `ifconfig` or `ip addr show`

2. **Test connectivity**
   ```bash
   # From another device
   ping YOUR_IP_ADDRESS
   
   # Test port access
   telnet YOUR_IP_ADDRESS 4173
   ```

3. **Firewall configuration**
   - Ensure port 4173 is open
   - Allow Node.js through firewall
   - Check router/network settings

## YouTube Music Desktop Integration

### Setup YTM Desktop

1. **Install YouTube Music Desktop**
   - Download from [th-ch/youtube-music](https://github.com/th-ch/youtube-music)

2. **Enable Remote Control API**
   - Open YTM Desktop settings
   - Navigate to "Integrations"
   - Enable "Remote Control API"
   - Note the host and port (usually 127.0.0.1:9863)

3. **Configure in the app**
   - Open Local Music PWA settings
   - Enable "YouTube Music Desktop Integration"
   - Enter the host and port
   - Click "Connect" and approve in YTM Desktop

### Network YTM Access

For mobile access to YTM Desktop:

1. **Configure YTM Desktop for network access**
   - Change bind address to `0.0.0.0` in YTM Desktop settings

2. **Update firewall rules**
   - Allow port 9863 through your firewall
   - Allow YTM Desktop through Windows Firewall

3. **Configure in mobile app**
   - Use your computer's IP address instead of 127.0.0.1
   - Port remains 9863

## Security Considerations

### Local Network Access

- The app serves on all network interfaces (`0.0.0.0`)
- Ensure your network is trusted
- Consider using VPN for remote access

### HTTPS Configuration

For production deployment with HTTPS:

1. **Generate SSL certificates**
   ```bash
   # Self-signed for testing
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

2. **Configure Vite for HTTPS**
   ```javascript
   // vite.config.ts
   export default {
     server: {
       https: {
         key: fs.readFileSync('key.pem'),
         cert: fs.readFileSync('cert.pem')
       }
     }
   }
   ```

## Performance Optimization

### Build Optimization

The production build includes:

- **Code splitting** for faster loading
- **Tree shaking** to remove unused code
- **Minification** for smaller bundle size
- **Compression** (gzip/brotli) support
- **Service worker** for offline functionality

### Runtime Performance

- **Virtual scrolling** for large music libraries
- **Lazy loading** for images and components
- **Efficient state management** with Svelte stores
- **Optimized audio processing** with Web Audio API

## Support

### Getting Help

1. **Check the logs**
   - Browser Developer Tools (F12)
   - Console errors and network requests

2. **Report issues**
   - GitHub Issues: [Repository Issues](https://github.com/your-username/local-music-pwa/issues)
   - Include system information and error logs

3. **Community**
   - Discord/Discussions for community support
   - Stack Overflow for technical questions

### System Information

For support requests, include:

```bash
# System info
node --version
npm --version
pnpm --version

# OS information
# Windows: winver
# macOS: sw_vers
# Linux: lsb_release -a

# Browser information (from DevTools)
navigator.userAgent
```

## Updates

### Keeping Up to Date

```bash
# Pull latest changes
git pull origin main

# Update dependencies
pnpm update

# Rebuild
pnpm run build:prod
```

### Version Management

The app includes automatic version checking and update notifications when new versions are available.