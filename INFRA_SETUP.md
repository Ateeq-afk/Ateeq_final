# DesiCargo Infrastructure Setup Guide

This guide will help you set up all the required infrastructure components to run DesiCargo locally.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Redis Setup](#redis-setup)
4. [Environment Configuration](#environment-configuration)
5. [SMS Provider Setup](#sms-provider-setup)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ and npm
- Docker (for Redis) or Redis installed locally
- Supabase account (free tier works)
- SMS provider account (MSG91 or Twilio) - optional for development

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project" and fill in:
   - Project name: `desicargo-dev`
   - Database password: (save this securely)
   - Region: Choose closest to you
3. Wait for project provisioning (~2 minutes)

### 2. Get Supabase Credentials

1. Go to Project Settings → API
2. Copy these values:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key (under Project API keys) → `SUPABASE_SERVICE_ROLE_KEY`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY` (for frontend)

### 3. Run Database Migrations

```bash
# From the backend directory
cd backend
npm run migrate:up
```

This will create all required tables with proper RLS policies.

## Redis Setup

### Option 1: Using Docker (Recommended)

```bash
# Pull Redis image
docker pull redis:7-alpine

# Run Redis container
docker run -d \
  --name desicargo-redis \
  -p 6379:6379 \
  -v desicargo-redis-data:/data \
  redis:7-alpine \
  redis-server --appendonly yes

# Verify Redis is running
docker exec -it desicargo-redis redis-cli ping
# Should output: PONG
```

### Option 2: Redis Stack with GUI

```bash
# Run Redis Stack (includes RedisInsight GUI)
docker run -d \
  --name redis-stack \
  -p 6379:6379 \
  -p 8001:8001 \
  -v redis-stack-data:/data \
  redis/redis-stack:latest

# Access RedisInsight at http://localhost:8001
```

### Option 3: Using Homebrew (macOS)

```bash
brew install redis
brew services start redis
```

### Option 4: Using apt (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Environment Configuration

### Backend Configuration

1. Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit `backend/.env` with your actual values:

```env
# Supabase (from Supabase dashboard)
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Server
PORT=4000
NODE_ENV=development

# Security
JWT_SECRET=generate_a_random_32_char_string_here

# Redis (if using Docker as shown above)
REDIS_URL=redis://localhost:6379

# SMS Provider (for development, keep as mock)
SMS_PRIMARY_PROVIDER=mock
SMS_FALLBACK_PROVIDER=mock

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Frontend Configuration

1. Copy the example environment file:
```bash
cd .. # Go to project root
cp .env.example .env
```

2. Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_API_URL=http://localhost:4000
```

## SMS Provider Setup

### For Development
Keep `SMS_PRIMARY_PROVIDER=mock` in your `.env`. OTPs will be logged to the console.

### For Production - MSG91 (Recommended for India)

1. Sign up at [https://msg91.com](https://msg91.com)
2. Get your API key from Dashboard → API
3. Create an OTP template and get the template ID
4. Update your `.env`:

```env
SMS_PRIMARY_PROVIDER=msg91
MSG91_API_KEY=your_api_key_here
MSG91_SENDER_ID=DSCRGO
MSG91_OTP_TEMPLATE_ID=your_template_id_here
```

### For Production - Twilio (International)

1. Sign up at [https://www.twilio.com](https://www.twilio.com)
2. Get credentials from Console Dashboard
3. Buy a phone number from Twilio
4. Update your `.env`:

```env
SMS_PRIMARY_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+1234567890
```

## Running the Application

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..
npm install
```

### 2. Start Services

```bash
# Terminal 1: Start Redis (if using Docker)
docker start desicargo-redis

# Terminal 2: Start backend server
cd backend
npm run dev

# Terminal 3: Start frontend dev server
npm run dev
```

### 3. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Redis GUI (if using Redis Stack): http://localhost:8001

## Testing OTP Login

1. Go to http://localhost:5173/signin
2. Click on "Mobile OTP" tab
3. Enter a phone number (e.g., +919876543210)
4. Click "Send OTP"
5. Check backend console for the OTP (in development mode)
6. Enter the OTP and click "Verify & Sign In"

## Troubleshooting

### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis
# or
redis-cli ping

# Check Redis logs
docker logs desicargo-redis

# Test Redis connection
redis-cli -h localhost -p 6379 ping
```

### Supabase Connection Issues

1. Verify your Supabase project is active
2. Check if the service role key is correct (not the anon key)
3. Ensure your IP is not blocked in Supabase dashboard

### SMS Not Sending

1. Check SMS provider credentials
2. Verify account has sufficient balance
3. Check backend logs for specific errors
4. For MSG91, ensure template is approved
5. For Twilio, verify phone number is verified

### Common Issues

1. **Port already in use**:
   ```bash
   # Find process using port
   lsof -i :4000  # or :6379 for Redis
   # Kill the process
   kill -9 <PID>
   ```

2. **Docker permissions**:
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

3. **Node version issues**:
   ```bash
   # Use nvm to switch Node versions
   nvm use 18
   ```

## Production Deployment

For production deployment, consider:

1. **Redis**: Use managed Redis services like:
   - Upstash Redis
   - Redis Cloud
   - AWS ElastiCache
   - Railway Redis

2. **Environment Variables**: Use secure secret management:
   - Vercel Environment Variables
   - AWS Secrets Manager
   - HashiCorp Vault

3. **SMS Provider**: Ensure production API keys and sufficient credits

4. **Security**:
   - Use strong JWT secrets (32+ characters)
   - Enable Redis password authentication
   - Use HTTPS for all endpoints
   - Implement rate limiting

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Redis Documentation](https://redis.io/documentation)
- [MSG91 API Documentation](https://docs.msg91.com/)
- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Docker Documentation](https://docs.docker.com/)