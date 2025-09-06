# Windows Installation Guide 🪟

This guide will help you install and run Local Music PWA on Windows systems.

## Prerequisites

### Required Software

1. **Node.js 22+**
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose the LTS version (recommended)
   - Select "Add to PATH" during installation

2. **Git** (optional, for cloning repository)
   - Download from [git-scm.com](https://git-scm.com/)
   - Use default settings during installation

## Installation Methods

### Method 1: Automatic Setup (Recommended)

1. **Download the project**
   - Option A: Download ZIP from GitHub and extract
   - Option B: Clone with Git:
     ```cmd
     git clone https://github.com/Psly12/local-music-pwa-YTMDesktop.git
     cd local-music-pwa-YTMDesktop
     ```

2. **Run the setup script**
   - Open Command Prompt or PowerShell in the project folder
   - Run:
     ```cmd
     npm run deploy:setup
     ```

3. **Start the application**
   - Double-click `start-windows.bat`
   - OR run in Command Prompt:
     ```cmd
     npm run deploy:local
     ```

4. **Access the app**
   - Open your browser to `http://localhost:4173`

### Method 2: Manual Installation

1. **Install pnpm** (package manager)
   ```cmd
   npm install -g pnpm
   ```

2. **Install dependencies**
   ```cmd
   pnpm install
   ```

3. **Build the application**
   ```cmd
   pnpm run build
   ```

4. **Start the server**
   ```cmd
   pnpm run preview:host
   ```

## Windows-Specific Configuration

### Windows Firewall

When first running the app, Windows Firewall may prompt you:

1. **Allow Node.js through firewall** when prompted
2. Check both "Private networks" and "Public networks" for full functionality
3. If you missed the prompt:
   - Go to Windows Security → Firewall & network protection
   - Click "Allow an app through firewall"
   - Find Node.js and ensure both checkboxes are enabled

### PowerShell Execution Policy

If you encounter execution policy errors:

1. **Open PowerShell as Administrator**
2. **Run the following command**:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. **Type "Y" when prompted**

### Network Access for Mobile Devices

1. **Find your computer's IP address**:
   ```cmd
   ipconfig
   ```
   Look for "IPv4 Address" under your active network adapter

2. **Access from mobile device**:
   - Connect mobile to same WiFi network
   - Open browser on mobile
   - Navigate to `http://YOUR_IP_ADDRESS:4173`

### YouTube Music Desktop Integration

1. **Install YouTube Music Desktop**
   - Download from [th-ch/youtube-music releases](https://github.com/th-ch/youtube-music/releases)
   - Choose the Windows installer (.exe)

2. **Configure YTM Desktop**
   - Open YouTube Music Desktop
   - Click Settings (gear icon)
   - Go to "Integrations" section
   - Enable "Remote Control API"
   - Note the host (127.0.0.1) and port (9863)

3. **Connect from Local Music PWA**
   - Open Local Music PWA in browser
   - Go to Settings
   - Enable "YouTube Music Desktop Integration"
   - Enter host: `127.0.0.1` and port: `9863`
   - Click "Connect"
   - Approve the connection in YTM Desktop when prompted

## Troubleshooting Windows Issues

### Node.js Not Found

```cmd
'node' is not recognized as an internal or external command
```

**Solution:**
1. Reinstall Node.js from [nodejs.org](https://nodejs.org/)
2. Ensure "Add to PATH" is checked during installation
3. Restart Command Prompt/PowerShell
4. Verify with: `node --version`

### Port Already in Use

```cmd
Error: listen EADDRINUSE: address already in use :::4173
```

**Solution:**
1. Find what's using the port:
   ```cmd
   netstat -ano | findstr :4173
   ```
2. Kill the process:
   ```cmd
   taskkill /PID <process_id> /F
   ```
3. Or use a different port:
   ```cmd
   pnpm run preview -- --port 3000
   ```

### Permission Denied

```cmd
EACCES: permission denied
```

**Solution:**
1. Run Command Prompt as Administrator
2. Or change to a folder where you have write permissions
3. Ensure antivirus isn't blocking Node.js

### Windows Defender Blocking

If Windows Defender blocks the application:

1. **Add folder to exclusions**:
   - Windows Security → Virus & threat protection
   - Manage settings under "Virus & threat protection settings"
   - Add exclusion → Folder
   - Select your project folder

### Slow Installation/Build

If installation or build is very slow:

1. **Disable Windows Defender real-time protection temporarily**
2. **Use Windows Subsystem for Linux (WSL)**:
   ```cmd
   wsl --install
   # Then follow Linux installation guide in WSL
   ```

## Performance Optimization

### For Better Performance

1. **Close unnecessary applications**
2. **Add project folder to Windows Defender exclusions**
3. **Use SSD storage for better I/O performance**
4. **Ensure adequate RAM (4GB+ recommended)**

### Background Processes

To run the app in the background:

1. **Create a scheduled task**:
   - Open Task Scheduler
   - Create Basic Task
   - Set trigger (at startup, login, etc.)
   - Set action to start your batch file

2. **Or use PM2** (process manager):
   ```cmd
   npm install -g pm2
   pm2 start "pnpm run preview:host" --name "local-music-pwa"
   pm2 startup
   pm2 save
   ```

## Updating

### Update the Application

1. **Pull latest changes** (if using Git):
   ```cmd
   git pull origin main
   ```

2. **Update dependencies**:
   ```cmd
   pnpm update
   ```

3. **Rebuild**:
   ```cmd
   pnpm run build
   ```

### Update Node.js

1. Download the latest version from [nodejs.org](https://nodejs.org/)
2. Run the installer (it will update automatically)
3. Verify the update: `node --version`

## Advanced Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_HOST=0.0.0.0
VITE_PORT=4173
VITE_YTM_DEFAULT_HOST=127.0.0.1
VITE_YTM_DEFAULT_PORT=9863
```

### Windows Service

To run as a Windows service:

1. **Install node-windows**:
   ```cmd
   npm install -g node-windows
   ```

2. **Create service script**:
   ```javascript
   // service.js
   var Service = require('node-windows').Service;
   var svc = new Service({
     name:'Local Music PWA',
     description: 'Local Music PWA Server',
     script: 'C:\\path\\to\\your\\app\\server.js'
   });
   
   svc.on('install', function(){
     svc.start();
   });
   
   svc.install();
   ```

3. **Install service**:
   ```cmd
   node service.js
   ```

## Support

### Getting Help

1. **Check Windows Event Viewer** for system errors
2. **Run Windows Network Diagnostics** if network issues persist
3. **Join our Discord** for community support
4. **Report issues** on GitHub with Windows version info

### System Information

When reporting issues, include:

```cmd
# Windows version
winver

# Node.js version
node --version

# Network configuration
ipconfig /all

# PowerShell version
$PSVersionTable.PSVersion
```

---

**Next Steps:** Once installed, see the main [README.md](./README.md) for usage instructions and the [Deployment Guide](./DEPLOYMENT.md) for advanced configuration.