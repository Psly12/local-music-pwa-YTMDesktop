#!/bin/bash

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
pnpm run preview:host