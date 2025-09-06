#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import { platform } from 'os'
import { join } from 'path'

const currentPlatform = platform()
const isWindows = currentPlatform === 'win32'
const isMac = currentPlatform === 'darwin'
const isLinux = currentPlatform === 'linux'

console.log(`🚀 Setting up deployment for ${currentPlatform}...`)

// Check Node.js version
try {
	const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim()
	const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0])
	
	if (majorVersion < 22) {
		console.warn(`⚠️  Warning: Node.js ${nodeVersion} detected. This app requires Node.js 22+`)
		console.warn('   Please upgrade Node.js: https://nodejs.org/')
	} else {
		console.log(`✅ Node.js ${nodeVersion} (compatible)`)
	}
} catch (error) {
	console.error('❌ Node.js not found. Please install Node.js 22+')
	process.exit(1)
}

// Check for pnpm
try {
	const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim()
	console.log(`✅ pnpm ${pnpmVersion} (compatible)`)
} catch (error) {
	console.error('❌ pnpm not found. Installing pnpm...')
	try {
		execSync('npm install -g pnpm', { stdio: 'inherit' })
		console.log('✅ pnpm installed successfully')
	} catch (installError) {
		console.error('❌ Failed to install pnpm. Please install manually:')
		console.error('   npm install -g pnpm')
		process.exit(1)
	}
}

// Platform-specific checks
if (isWindows) {
	console.log('🪟 Windows deployment setup')
	
	// Check if running in PowerShell or Command Prompt
	try {
		execSync('powershell -Command "Get-Host"', { stdio: 'pipe' })
		console.log('✅ PowerShell available')
	} catch (error) {
		console.warn('⚠️  PowerShell not available, some features may be limited')
	}
	
} else if (isMac) {
	console.log('🍎 macOS deployment setup')
	
	// Check for Xcode Command Line Tools (needed for some native dependencies)
	try {
		execSync('xcode-select -p', { stdio: 'pipe' })
		console.log('✅ Xcode Command Line Tools available')
	} catch (error) {
		console.warn('⚠️  Xcode Command Line Tools not found. Install with:')
		console.warn('   xcode-select --install')
	}
	
} else if (isLinux) {
	console.log('🐧 Linux deployment setup')
	
	// Check for common build tools
	try {
		execSync('which gcc', { stdio: 'pipe' })
		console.log('✅ Build tools available')
	} catch (error) {
		console.warn('⚠️  Build tools not found. Install with:')
		console.warn('   sudo apt-get install build-essential (Ubuntu/Debian)')
		console.warn('   sudo yum groupinstall "Development Tools" (CentOS/RHEL)')
	}
}

// Create deployment configuration
const deployConfig = {
	platform: currentPlatform,
	timestamp: new Date().toISOString(),
	nodeVersion: process.version,
	buildMode: 'production',
	features: {
		ytmIntegration: true,
		pwa: true,
		fileSystemAccess: true,
		networkAccess: true
	}
}

writeFileSync(
	join(process.cwd(), 'deploy-config.json'),
	JSON.stringify(deployConfig, null, 2)
)

console.log('✅ Deployment configuration created')

// Create platform-specific startup scripts
createStartupScripts()

console.log('🎉 Deployment setup complete!')
console.log('')
console.log('Next steps:')
console.log('1. Run: pnpm run deploy:build')
console.log('2. Run: pnpm run deploy:local')
console.log('3. Open http://localhost:4173 in your browser')

function createStartupScripts() {
	// Windows batch file
	if (isWindows) {
		const windowsScript = `@echo off
echo Starting Local Music PWA...
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js not found. Please install Node.js 22+
    pause
    exit /b 1
)

REM Check if pnpm is available
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: pnpm not found. Installing pnpm...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo Error: Failed to install pnpm
        pause
        exit /b 1
    )
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    pnpm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Build and start the application
echo Building application...
pnpm run build
if %errorlevel% neq 0 (
    echo Error: Build failed
    pause
    exit /b 1
)

echo Starting server...
echo Open http://localhost:4173 in your browser
pnpm run preview:host

pause`

		writeFileSync(join(process.cwd(), 'start-windows.bat'), windowsScript)
		console.log('✅ Windows startup script created (start-windows.bat)')
	}

	// macOS/Linux shell script
	const shellScript = `#!/bin/bash

echo "Starting Local Music PWA..."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found. Please install Node.js 22+"
    exit 1
fi

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "Error: pnpm not found. Installing pnpm..."
    npm install -g pnpm
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install pnpm"
        exit 1
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    pnpm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies"
        exit 1
    fi
fi

# Build and start the application
echo "Building application..."
pnpm run build
if [ $? -ne 0 ]; then
    echo "Error: Build failed"
    exit 1
fi

echo "Starting server..."
echo "Open http://localhost:4173 in your browser"
pnpm run preview:host`

	writeFileSync(join(process.cwd(), 'start-unix.sh'), shellScript)
	
	// Make shell script executable on Unix systems
	if (!isWindows) {
		try {
			execSync('chmod +x start-unix.sh')
			console.log('✅ Unix startup script created (start-unix.sh)')
		} catch (error) {
			console.warn('⚠️  Could not make start-unix.sh executable')
		}
	}
}