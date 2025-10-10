#!/bin/bash

echo "🔍 QR AttendEase - Pre-Presentation Checklist"
echo "=============================================="
echo ""

# Check if node_modules exists
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "  ✅ Frontend dependencies installed"
else
    echo "  ❌ Frontend dependencies missing - Run: npm install"
fi

if [ -d "server/node_modules" ]; then
    echo "  ✅ Backend dependencies installed"
else
    echo "  ❌ Backend dependencies missing - Run: cd server && npm install"
fi

echo ""
echo "✓ Checking environment..."
if [ -f ".env" ]; then
    echo "  ✅ .env file exists"
else
    echo "  ⚠️  .env file missing (optional for demo)"
fi

echo ""
echo "✓ Checking key files..."
files=(
    "src/components/StudentDashboard.jsx"
    "src/components/FacultyDashboard.jsx"
    "src/api/classApi.js"
    "server/index.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file missing"
    fi
done

echo ""
echo "📋 To start the application:"
echo "  1. Terminal 1: cd server && npm start"
echo "  2. Terminal 2: npm run dev"
echo "  3. Open http://localhost:5173"
echo ""
echo "🎬 Ready for presentation!"
