#!/bin/bash

# Script to warm up Next.js development server
# This pre-compiles the most used routes to reduce first-load delays

echo "🔥 Warming up development server..."

# Wait for server to be ready
sleep 3

# Warm up critical routes
echo "Warming up /api/auth/session..."
curl -s http://localhost:3030/api/auth/session > /dev/null

echo "Warming up /api/projects..."
curl -s http://localhost:3030/api/projects > /dev/null

echo "Warming up /api/spaces..."
curl -s http://localhost:3030/api/spaces > /dev/null

echo "Warming up /api/notifications..."
curl -s http://localhost:3030/api/notifications > /dev/null

echo "Warming up /api/templates..."
curl -s http://localhost:3030/api/templates > /dev/null

echo "✅ Warmup complete! Routes are now compiled."
