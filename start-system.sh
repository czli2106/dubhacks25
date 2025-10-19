#!/bin/bash
# File: start-system.sh
# Startup script for the complete AI PM system

echo "🚀 Starting AI PM System..."
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the ai-pm root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Dependencies check passed"

# Install Next.js dependencies
echo "📦 Installing Next.js dependencies..."
npm install

# Check environment variables
echo "🔧 Checking environment variables..."

if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Creating template..."
    cat > .env.local << EOF
# GitHub Token for API access
GITHUB_TOKEN=your_github_token_here

# OpenAI API Key for AI analysis
OPENAI_API_KEY=your_openai_api_key_here

EOF
    echo "📝 Please edit .env.local and add your API keys"
    echo "   - Get GitHub token: https://github.com/settings/tokens"
    echo "   - Get OpenAI API key: https://platform.openai.com/api-keys"
    echo ""
    echo "Press Enter when you've added your API keys..."
    read
fi

# Start Next.js frontend
echo "🔧 Starting Next.js frontend..."
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 5

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running at http://localhost:3000"
else
    echo "❌ Frontend failed to start. Check the logs above."
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 AI PM System is now running!"
echo "================================"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
