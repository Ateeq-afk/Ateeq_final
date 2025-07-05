#!/bin/bash

# Install Supabase CLI and run migrations locally

echo "📦 Installing Supabase CLI..."
brew install supabase/tap/supabase

echo "🔗 Linking to your project..."
supabase link --project-ref pgdssjfgfbvkgbzumtzm

echo "🚀 Running migrations..."
supabase db push

echo "✅ Migrations complete!"