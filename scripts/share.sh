#!/usr/bin/env bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Ensure Next.js is reachable on port 3000
if ! curl -s -o /dev/null -I http://localhost:3000 2>/dev/null; then
  echo ""
  echo "⚠️  Notice: Next.js does not appear to be running on port 3000 yet."
  echo "👉 In another terminal window, make sure to start it with: npm run dev"
  echo ""
fi

echo "⚡ Starting public link for FootyLive..."
echo "📌 Look for the https://*.trycloudflare.com link below to share with anyone:"
echo ""

"${DIR}/bin/cloudflared" tunnel --url http://localhost:3000
