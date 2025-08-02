#!/bin/bash

# MangasManga Mapper Deployment Script
echo "🚀 Starting deployment process..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build client
echo "🔨 Building client..."
cd client
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build client"
    exit 1
fi

cd ..

# Check environment files
echo "🔍 Checking environment configuration..."

if [ ! -f "server/.env" ]; then
    echo "⚠️  Warning: server/.env not found. Please copy server/.env.example and configure it."
fi

if [ ! -f "client/.env" ]; then
    echo "⚠️  Warning: client/.env not found. Please copy client/.env.example and configure it."
fi

echo "✅ Build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your environment variables in server/.env and client/.env"
echo "2. Set up your Supabase database using database/schema.sql"
echo "3. Start the development servers with: npm run dev"
echo "4. Access the application at: http://localhost:3000"
echo ""
echo "🌐 For production deployment:"
echo "- Frontend: Deploy the client/dist folder to Vercel/Netlify"
echo "- Backend: Deploy the server folder to Railway/Render"
echo "- Set production environment variables in your deployment platform"