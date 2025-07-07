#!/bin/bash

echo "🧪 Testing Billing API..."

# Start the backend in the background
echo "📡 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Test the billing API
echo "🔍 Testing billing test endpoint..."
curl -s http://localhost:4000/api/billing/test | json_pp

# Clean up
echo "🧹 Stopping backend server..."
kill $BACKEND_PID

echo "✅ Test completed!"