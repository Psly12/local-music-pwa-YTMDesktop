#!/bin/bash

# Docker Deployment Script for Local Music PWA
# This script handles Docker deployment for all platforms

set -e  # Exit on any error

echo "🐳 Docker Deployment for Local Music PWA"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is available and running"

# Function to build and run with Docker
deploy_with_docker() {
    local deployment_type=$1
    
    echo ""
    echo "🏗️  Building Docker image..."
    docker build -t local-music-pwa:latest .
    
    if [ $? -ne 0 ]; then
        echo "❌ Docker build failed"
        exit 1
    fi
    
    echo "✅ Docker image built successfully"
    
    # Stop existing container if running
    echo "🔄 Stopping existing container (if any)..."
    docker stop local-music-pwa 2>/dev/null || true
    docker rm local-music-pwa 2>/dev/null || true
    
    case $deployment_type in
        "simple")
            echo "🚀 Starting container in simple mode..."
            docker run -d \
                --name local-music-pwa \
                --restart unless-stopped \
                -p 4173:4173 \
                local-music-pwa:latest
            ;;
        "dev")
            echo "🚀 Starting container in development mode..."
            docker run -it --rm \
                --name local-music-pwa-dev \
                -p 4173:4173 \
                -v "$(pwd):/app" \
                local-music-pwa:latest
            ;;
        "compose")
            echo "🚀 Starting with Docker Compose..."
            if [ ! -f "docker-compose.yml" ]; then
                echo "❌ docker-compose.yml not found"
                exit 1
            fi
            docker-compose up -d
            ;;
        *)
            echo "❌ Unknown deployment type: $deployment_type"
            exit 1
            ;;
    esac
}

# Function to show running status
show_status() {
    echo ""
    echo "📊 Container Status:"
    docker ps --filter "name=local-music-pwa" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "🌐 Access your app at:"
    echo "   Local:   http://localhost:4173"
    echo "   Network: http://$(hostname -I | awk '{print $1}'):4173"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs:     docker logs -f local-music-pwa"
    echo "   Stop:          docker stop local-music-pwa"
    echo "   Remove:        docker rm local-music-pwa"
    echo "   Shell access:  docker exec -it local-music-pwa sh"
}

# Function to cleanup
cleanup() {
    echo "🧹 Cleaning up Docker resources..."
    docker stop local-music-pwa 2>/dev/null || true
    docker rm local-music-pwa 2>/dev/null || true
    docker image prune -f
    echo "✅ Cleanup complete"
}

# Function to show logs
show_logs() {
    echo "📋 Container logs (press Ctrl+C to exit):"
    docker logs -f local-music-pwa
}

# Main menu
case "${1:-menu}" in
    "simple"|"s")
        deploy_with_docker "simple"
        show_status
        ;;
    "dev"|"d")
        deploy_with_docker "dev"
        ;;
    "compose"|"c")
        deploy_with_docker "compose"
        show_status
        ;;
    "status"|"st")
        show_status
        ;;
    "logs"|"l")
        show_logs
        ;;
    "cleanup"|"clean")
        cleanup
        ;;
    "help"|"h")
        echo "Usage: $0 [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  simple, s     Deploy with simple Docker run"
        echo "  dev, d        Deploy in development mode with volume mount"
        echo "  compose, c    Deploy using Docker Compose"
        echo "  status, st    Show container status"
        echo "  logs, l       Show container logs"
        echo "  cleanup       Stop container and cleanup resources"
        echo "  help, h       Show this help message"
        echo ""
        echo "Default: simple deployment"
        ;;
    "menu"|*)
        echo "Select deployment method:"
        echo "1) Simple Docker deployment"
        echo "2) Development mode (with hot reload)"
        echo "3) Docker Compose deployment"
        echo "4) Show status"
        echo "5) Show logs"
        echo "6) Cleanup"
        echo "7) Help"
        echo ""
        read -p "Enter choice [1-7]: " choice
        
        case $choice in
            1) deploy_with_docker "simple" && show_status ;;
            2) deploy_with_docker "dev" ;;
            3) deploy_with_docker "compose" && show_status ;;
            4) show_status ;;
            5) show_logs ;;
            6) cleanup ;;
            7) $0 help ;;
            *) echo "❌ Invalid choice" ;;
        esac
        ;;
esac