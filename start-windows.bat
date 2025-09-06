@echo off
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

pause