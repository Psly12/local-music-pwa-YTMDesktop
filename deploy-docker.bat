@echo off
REM Docker Deployment Script for Local Music PWA (Windows)

echo 🐳 Docker Deployment for Local Music PWA
echo ========================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker not found. Please install Docker Desktop first:
    echo    https://docs.docker.com/desktop/windows/
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo ✅ Docker is available and running
echo.

if "%1"=="simple" goto simple
if "%1"=="compose" goto compose
if "%1"=="status" goto status
if "%1"=="logs" goto logs
if "%1"=="cleanup" goto cleanup
if "%1"=="help" goto help

:menu
echo Select deployment method:
echo 1) Simple Docker deployment
echo 2) Docker Compose deployment
echo 3) Show status
echo 4) Show logs
echo 5) Cleanup
echo 6) Help
echo.
set /p choice="Enter choice [1-6]: "

if "%choice%"=="1" goto simple
if "%choice%"=="2" goto compose
if "%choice%"=="3" goto status
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto cleanup
if "%choice%"=="6" goto help
echo ❌ Invalid choice
goto menu

:simple
echo.
echo 🏗️ Building Docker image...
docker build -t local-music-pwa:latest .
if %errorlevel% neq 0 (
    echo ❌ Docker build failed
    pause
    exit /b 1
)

echo ✅ Docker image built successfully
echo.
echo 🔄 Stopping existing container (if any)...
docker stop local-music-pwa >nul 2>&1
docker rm local-music-pwa >nul 2>&1

echo 🚀 Starting container...
docker run -d --name local-music-pwa --restart unless-stopped -p 4173:4173 local-music-pwa:latest

if %errorlevel% neq 0 (
    echo ❌ Failed to start container
    pause
    exit /b 1
)

goto status

:compose
echo.
echo 🚀 Starting with Docker Compose...
if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml not found
    pause
    exit /b 1
)
docker-compose up -d
goto status

:status
echo.
echo 📊 Container Status:
docker ps --filter "name=local-music-pwa" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
echo 🌐 Access your app at:
echo    Local:   http://localhost:4173
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do echo    Network: http://%%b:4173
)
echo.
echo 📋 Useful commands:
echo    View logs:     docker logs -f local-music-pwa
echo    Stop:          docker stop local-music-pwa
echo    Remove:        docker rm local-music-pwa
echo    Shell access:  docker exec -it local-music-pwa sh
goto end

:logs
echo 📋 Container logs (press Ctrl+C to exit):
docker logs -f local-music-pwa
goto end

:cleanup
echo 🧹 Cleaning up Docker resources...
docker stop local-music-pwa >nul 2>&1
docker rm local-music-pwa >nul 2>&1
docker image prune -f >nul 2>&1
echo ✅ Cleanup complete
goto end

:help
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   simple     Deploy with simple Docker run
echo   compose    Deploy using Docker Compose
echo   status     Show container status
echo   logs       Show container logs
echo   cleanup    Stop container and cleanup resources
echo   help       Show this help message
echo.
echo Default: Interactive menu
goto end

:end
if "%1"=="" pause