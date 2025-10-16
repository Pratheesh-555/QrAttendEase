# QrAttendEase - Quick Deployment Script (PowerShell)
# This script helps you deploy updates to production

Write-Host "🚀 QrAttendEase Deployment Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Step 1: Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

Write-Host "🔍 Step 2: Checking for uncommitted changes..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ([string]::IsNullOrEmpty($gitStatus)) {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
} else {
    Write-Host "⚠️  You have uncommitted changes:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $commit = Read-Host "Do you want to commit and push? (y/n)"
    if ($commit -eq 'y' -or $commit -eq 'Y') {
        $commitMsg = Read-Host "Enter commit message"
        git add .
        git commit -m "$commitMsg"
        git push origin main
        Write-Host "✅ Changes pushed to GitHub" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Skipping commit. Deploy will use last committed version." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📡 Step 3: Checking deployment status..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend (Render):" -ForegroundColor Cyan
Write-Host "  URL: https://attendease-yu7r.onrender.com"
Write-Host "  Status: Testing..." -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "https://attendease-yu7r.onrender.com/api" -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "  ✅ Backend is responding (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "  ✅ Backend is responding (404 expected for root API)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Backend might be sleeping (Render free tier)" -ForegroundColor Yellow
        Write-Host "     First request will take 30-60 seconds to wake up" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Frontend (Netlify):" -ForegroundColor Cyan
Write-Host "  URL: https://attendeaze.netlify.app"
Write-Host "  ✅ Will auto-deploy from GitHub push" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 Step 4: Environment Variables Checklist" -ForegroundColor Yellow
Write-Host ""
Write-Host "Netlify Environment Variables:" -ForegroundColor Cyan
Write-Host "  - VITE_API_URL = https://attendease-yu7r.onrender.com/api"
Write-Host "  - VITE_GOOGLE_CLIENT_ID = (your Google OAuth ID)"
Write-Host ""
Write-Host "Render Environment Variables:" -ForegroundColor Cyan
Write-Host "  - MONGODB_URI = (your MongoDB connection string)"
Write-Host "  - PORT = 5000"
Write-Host "  - NODE_ENV = production"
Write-Host "  - ALLOWED_ORIGINS = https://attendeaze.netlify.app,http://localhost:5173"
Write-Host ""

Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Your application:" -ForegroundColor Cyan
Write-Host "   Frontend: https://attendeaze.netlify.app" -ForegroundColor White
Write-Host "   Backend:  https://attendease-yu7r.onrender.com" -ForegroundColor White
Write-Host ""
Write-Host "⏱️  Note: Changes will be live in 2-3 minutes" -ForegroundColor Gray
Write-Host "   - Netlify: Auto-deploys on git push" -ForegroundColor Gray
Write-Host "   - Render: Auto-deploys on git push (to server/ folder)" -ForegroundColor Gray
