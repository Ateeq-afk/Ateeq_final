#!/bin/bash

# Test Payment API endpoints

echo "Testing Payment API endpoints..."
echo "================================"

# Base URL
BASE_URL="http://localhost:4000/api"

# Test authentication token (replace with actual token)
AUTH_TOKEN="your-auth-token-here"

# 1. Get Payment Modes
echo -e "\n1. Testing GET /payments/modes"
curl -X GET "$BASE_URL/payments/modes" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

# 2. Create a Payment
echo -e "\n2. Testing POST /payments"
curl -X POST "$BASE_URL/payments" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_mode_id": "cash-mode-id",
    "amount": 5000,
    "payment_date": "2024-01-15",
    "payer_name": "Test Customer",
    "payer_type": "customer",
    "purpose": "booking_payment",
    "description": "Payment for booking LR001"
  }' | jq '.'

# 3. Get All Payments
echo -e "\n3. Testing GET /payments"
curl -X GET "$BASE_URL/payments" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

# 4. Get Outstanding Amounts
echo -e "\n4. Testing GET /payments/outstanding"
curl -X GET "$BASE_URL/payments/outstanding" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

# 5. Get Payment Dashboard Data
echo -e "\n5. Testing GET /payments/dashboard"
curl -X GET "$BASE_URL/payments/dashboard" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\nPayment API tests completed!"