#!/bin/bash

# QrAttendEase - Quick Deployment Script
# This script helps you deploy updates to production

echo "🚀 QrAttendEase Deployment Script"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this from the project root."
    exit 1
fi

echo "📦 Step 1: Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors and try again."
    exit 1
fi

echo "✅ Build successful!"
echo ""

echo "🔍 Step 2: Checking for uncommitted changes..."
if git diff-index --quiet HEAD --; then
    echo "✅ No uncommitted changes"
else
    echo "⚠️  You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Do you want to commit and push? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_msg
        git add .
        git commit -m "$commit_msg"
        git push origin main
        echo "✅ Changes pushed to GitHub"
    else
        echo "⚠️  Skipping commit. Deploy will use last committed version."
    fi
fi

echo ""
echo "📡 Step 3: Checking deployment status..."
echo ""
echo "Backend (Render):"
echo "  URL: https://attendease-yu7r.onrender.com"
echo "  Status: Testing..."

if curl -s -o /dev/null -w "%{http_code}" https://attendease-yu7r.onrender.com/api | grep -q "404\|200"; then
    echo "  ✅ Backend is responding"
else
    echo "  ⚠️  Backend might be sleeping (Render free tier)"
    echo "     First request will take 30-60 seconds to wake up"
fi

echo ""
echo "Frontend (Netlify):"
echo "  URL: https://attendeaze.netlify.app"
echo "  ✅ Will auto-deploy from GitHub push"

echo ""
echo "🎯 Step 4: Environment Variables Checklist"
echo ""
echo "Netlify Environment Variables:"
echo "  - VITE_API_URL = https://attendease-yu7r.onrender.com/api"
echo "  - VITE_GOOGLE_CLIENT_ID = (your Google OAuth ID)"
echo ""
echo "Render Environment Variables:"
echo "  - MONGODB_URI = (your MongoDB connection string)"
echo "  - PORT = 5000"
echo "  - NODE_ENV = production"
echo "  - ALLOWED_ORIGINS = https://attendeaze.netlify.app,http://localhost:5173"
echo ""

echo "✅ Deployment Complete!"
echo ""
echo "🔗 Your application:"
echo "   Frontend: https://attendeaze.netlify.app"
echo "   Backend:  https://attendease-yu7r.onrender.com"
echo ""
echo "⏱️  Note: Changes will be live in 2-3 minutes"
echo "   - Netlify: Auto-deploys on git push"
echo "   - Render: Auto-deploys on git push (to server/ folder)"
