#!/bin/bash

# Netlify Build Script for QR AttendEase
# This ensures environment variables are properly set during build

echo "🚀 Starting QR AttendEase Build..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Check if environment variables are set
if [ -z "$VITE_GOOGLE_CLIENT_ID" ]; then
  echo "⚠️  WARNING: VITE_GOOGLE_CLIENT_ID not set!"
  echo "Please set it in Netlify Environment Variables"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the project
echo "🔨 Building project..."
npm run build

# Verify build output
if [ -d "dist" ]; then
  echo "✅ Build successful!"
  echo "📊 Build output:"
  ls -lh dist/
  du -sh dist/
else
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

echo "🎉 Build complete and ready for deployment!"
