#!/bin/bash

# Ollama Setup Script for SpendWise Desktop
# This script sets up Ollama with recommended models for the application

set -e

echo "🤖 Setting up Ollama for SpendWise Desktop..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed. Please install Ollama first:"
    echo "   Visit: https://ollama.ai/download"
    exit 1
fi

# Start Ollama service if not running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "🚀 Starting Ollama service..."
    ollama serve &
    sleep 5
fi

# Pull recommended models
echo "📥 Pulling recommended models..."

echo "   Pulling Mistral 7B (recommended for categorization)..."
ollama pull mistral

echo "   Pulling LLaMA 3 8B (alternative option)..."
ollama pull llama3

echo "   Pulling Phi-3 (lightweight option)..."
ollama pull phi3

echo "✅ Ollama setup completed!"
echo ""
echo "Available models:"
ollama list

echo ""
echo "💡 Usage tips:"
echo "   - Mistral is recommended for transaction categorization"
echo "   - LLaMA 3 provides better general chat capabilities"
echo "   - Phi-3 is faster but less accurate"
echo ""
echo "🔧 To test a model: ollama run mistral"
