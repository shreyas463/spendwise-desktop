#!/bin/bash

# SpendWise Desktop Build Script
# This script builds the application for production

set -e

echo "🔨 Building SpendWise Desktop for Production..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf dist-electron/
rm -rf build/

# Build frontend
echo "⚛️  Building frontend..."
npm run build:vite

# Build Electron
echo "🖥️  Building Electron application..."
npm run build:electron

echo "✅ Build completed successfully!"
echo "📦 Distribution files are in the 'dist' directory"
