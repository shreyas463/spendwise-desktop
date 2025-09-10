#!/bin/bash

# SpendWise Desktop Development Script
# This script sets up and starts the development environment

set -e

echo "🚀 Starting SpendWise Desktop Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Ollama is running (optional)
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama is not running. LLM features will not be available."
    echo "   To start Ollama: ollama serve"
    echo "   To pull a model: ollama pull mistral"
fi

# Start database services
echo "📊 Starting database services..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U spendwise -d spendwise_dev; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ Database is ready!"

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start the development environment
echo "🎯 Starting development servers..."
echo "   Frontend: http://localhost:5173"
echo "   Database: localhost:5432"
echo "   pgAdmin: http://localhost:8080 (admin@spendwise.com / admin123)"
echo ""
echo "Press Ctrl+C to stop all services"

# Start frontend in development mode
npm run dev
