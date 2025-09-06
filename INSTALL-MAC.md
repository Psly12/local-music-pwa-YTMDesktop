# macOS Installation Guide 🍎

This guide will help you install and run Local Music PWA on macOS systems.

## Prerequisites

### Required Software

1. **Node.js 22+**
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose the macOS installer
   - Or install via Homebrew: `brew install node`

2. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

3. **Homebrew** (recommended package manager)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

## Installation Methods

### Method 1: Using Homebrew (Recommended)

1. **Install Node.js**
   ```bash
   brew install node@22
   brew link node@22 --force
   ```

2. **Clone the repository**
   ```bash
   git clone https://github.com/Psly12/local-music-pwa-YTMDesktop.git
   cd local-music-pwa-YTMDesktop
   ```

3. **Run automatic setup**
   ```bash
   npm run deploy:setup
   ```

4. **Start the application**
   ```bash
   ./start-unix.sh
   ```

### Method 2: Manual Installation

1. **Download and extract** the project from GitHub

2. **Open Terminal** in the project folder

3. **Install dependencies**
   ```bash
   npm install -g pnpm
   pnpm install
   ```

4. **Build and start**
   ```bash
   pnpm run build
   pnpm run preview:host
   ```

## macOS-Specific Configuration

### Gatekeeper and Security

When first running the app, macOS may show security warnings:

1. **Allow Terminal/Node.js network access** when prompted
2. If blocked by Gatekeeper:
   - System Preferences → Security & Privacy
   - Click "Allow Anyway" next to the blocked application

### Network Access

macOS typically allows local network access by default:

1. **Find your Mac's IP address**:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Access from mobile devices**:
   - Connect to same WiFi network
   - Navigate to `http://YOUR_IP:4173`

### Firewall Configuration

If macOS Firewall is enabled:

1. **System Preferences → Security & Privacy → Firewall**
2. **Click "Firewall Options"**
3. **Add Node.js** and allow incoming connections

## YouTube Music Desktop Integration

### Install YTM Desktop

1. **Using Homebrew** (recommended):
   ```bash
   brew install --cask youtube-music
   ```

2. **Manual Download**:
   - Visit [th-ch/youtube-music releases](https://github.com/th-ch/youtube-music/releases)
   - Download the macOS `.dmg` file
   - Drag to Applications folder

### Configure YTM Desktop

1. **Launch YouTube Music Desktop**
2. **Open Preferences** (Cmd+,)
3. **Go to "Integrations"**
4. **Enable "Remote Control API"**
5. **Note the settings**: usually `127.0.0.1:9863`

### Connect from PWA

1. **Open Local Music PWA** in browser
2. **Go to Settings**
3. **Enable YouTube Music Desktop Integration**
4. **Enter connection details**:
   - Host: `127.0.0.1`
   - Port: `9863`
5. **Click Connect** and approve in YTM Desktop

## Shell and Terminal Setup

### Using Different Shells

The app works with all popular shells:

#### Bash (default on older macOS)
```bash
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.bash_profile
source ~/.bash_profile
```

#### Zsh (default on macOS 10.15+)
```zsh
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

#### Fish Shell
```fish
set -U fish_user_paths /opt/homebrew/bin $fish_user_paths
```

### Terminal Alternatives

- **iTerm2**: Enhanced terminal with better features
- **Hyper**: Electron-based terminal
- **Alacritty**: GPU-accelerated terminal

## Troubleshooting macOS Issues

### Node.js Not Found

```bash
command not found: node
```

**Solution:**
```bash
# Check if Homebrew installed Node in different location
ls /opt/homebrew/bin/node
ls /usr/local/bin/node

# Add to PATH
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Permission Denied

```bash
EACCES: permission denied
```

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use a Node version manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
```

### Port Already in Use

```bash
Error: listen EADDRINUSE :::4173
```

**Solution:**
```bash
# Find process using port
lsof -ti:4173

# Kill the process
kill -9 $(lsof -ti:4173)

# Or use different port
pnpm run preview -- --port 3000
```

### Xcode Command Line Tools Issues

```bash
xcode-select: error: tool 'xcodebuild' requires Xcode
```

**Solution:**
```bash
# Install Command Line Tools
xcode-select --install

# Accept license
sudo xcodebuild -license accept

# Reset if needed
sudo xcode-select --reset
```

### Homebrew Issues

If Homebrew commands fail:

```bash
# Update Homebrew
brew update

# Fix common issues
brew doctor

# Reinstall if needed (Intel Macs)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# For Apple Silicon Macs, ensure correct path
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
```

## Performance Optimization

### For Apple Silicon (M1/M2/M3) Macs

1. **Use native ARM Node.js**:
   ```bash
   # Check architecture
   uname -m
   # Should show "arm64" for Apple Silicon
   
   # Verify Node.js architecture
   node -p "process.arch"
   # Should show "arm64"
   ```

2. **Install native dependencies**:
   ```bash
   # Clear cache and reinstall
   pnpm store prune
   pnpm install --force
   ```

### For Intel Macs

1. **Ensure x64 Node.js** for compatibility
2. **Consider using Rosetta 2** for some dependencies if needed

### Memory and CPU Optimization

1. **Monitor with Activity Monitor**
2. **Close unnecessary applications**
3. **Use `pnpm` instead of `npm`** for faster installs
4. **Enable npm cache**:
   ```bash
   npm config set cache ~/.npm-cache --global
   ```

## Development Setup

### VS Code Configuration

1. **Install recommended extensions**:
   ```bash
   code --install-extension svelte.svelte-vscode
   code --install-extension ms-vscode.vscode-typescript-next
   ```

2. **Configure VS Code settings**:
   ```json
   {
     "typescript.preferences.includePackageJsonAutoImports": "on",
     "svelte.enable-ts-plugin": true
   }
   ```

### Git Configuration

```bash
# Set up Git if not already configured
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Configure line endings
git config --global core.autocrlf input
```

## Automation and Scripts

### LaunchAgent for Auto-start

Create `~/Library/LaunchAgents/com.localmusicpwa.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.localmusicpwa</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/path/to/your/app/start-unix.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load with:
```bash
launchctl load ~/Library/LaunchAgents/com.localmusicpwa.plist
```

### Menu Bar App

For a native menu bar experience, consider creating a simple Swift wrapper or using tools like:

- **Platypus**: Create native Mac apps from scripts
- **Electron**: For cross-platform native app wrapper

## Updating

### Update the Application

```bash
# Using Git
git pull origin main
pnpm update
pnpm run build

# Or download new release
curl -L -o latest.zip https://github.com/repo/archive/main.zip
unzip latest.zip
```

### Update Node.js

```bash
# Using Homebrew
brew upgrade node

# Or using Node Version Manager (nvm)
nvm install node --reinstall-packages-from=current
nvm alias default node
```

### Update Homebrew Packages

```bash
# Update Homebrew itself
brew update

# Upgrade all packages
brew upgrade

# Update specific package
brew upgrade youtube-music
```

## Advanced Configuration

### Environment Variables

Add to your shell profile (`~/.zshrc` or `~/.bash_profile`):

```bash
# Local Music PWA Configuration
export VITE_HOST=0.0.0.0
export VITE_PORT=4173
export VITE_YTM_DEFAULT_HOST=127.0.0.1
export VITE_YTM_DEFAULT_PORT=9863
```

### SSL/HTTPS Configuration

For HTTPS access (useful for PWA features):

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update vite config to use HTTPS
# See DEPLOYMENT.md for configuration details
```

## Support

### macOS-Specific Help

1. **Check Console.app** for system logs
2. **Use Activity Monitor** to check resource usage
3. **Network Utility** for network diagnostics
4. **System Information** (Apple menu → About This Mac → System Report)

### System Information for Bug Reports

```bash
# macOS version
sw_vers

# Hardware info
system_profiler SPHardwareDataType

# Node.js and npm versions
node --version && npm --version

# Architecture
uname -m

# Homebrew info
brew --version
```

---

**Next Steps:** Once installed, see the main [README.md](./README.md) for usage instructions and the [Deployment Guide](./DEPLOYMENT.md) for advanced configuration.