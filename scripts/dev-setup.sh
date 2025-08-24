#!/bin/bash

echo "Setting up Cone Counter development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "Node.js version: $(node -v)"

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "Docker is available"
    DOCKER_AVAILABLE=true
else
    echo "Docker not found - you can still develop locally"
    DOCKER_AVAILABLE=false
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create data directory
echo "Creating data directory..."
mkdir -p data

echo "Development environment setup complete!"
echo ""
echo "Development options:"
echo ""
echo "Option 1: Local development (two terminals required)"
echo "  Terminal 1: npm run dev (backend on port 3000)"
echo "  Terminal 2: cd frontend && npm start (frontend on port 3001)"
echo ""
echo "Option 2: Docker development (single command)"
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "  docker-compose up -d"
    echo "  Access at http://localhost:3000"
else
    echo "  (Docker not available)"
fi
echo ""
echo "Option 3: Production build"
echo "  cd frontend && npm run build"
echo "  docker build -t alexschladetsch/cone-counter:latest ."
echo ""
echo "Happy coding!"
