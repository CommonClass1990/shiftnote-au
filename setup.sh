#!/usr/bin/env bash
set -e

echo "============================================================================"
echo "  ShiftNote AU - Automated Standalone Installation Wizard"
echo "============================================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js (>= 18) from https://nodejs.org"
    exit 1
fi

echo "[1/4] Found Node.js $(node -v) - OK."

if [ ! -f ".env.local" ]; then
    echo "[2/4] Initializing .env.local..."
    cp .env.example .env.local
    echo "      Created .env.local with default local demo settings."
else
    echo "[2/4] Found existing .env.local - OK."
fi

echo "[3/4] Installing project dependencies..."
npm install

echo "[4/4] Compiling optimized standalone production build..."
npm run build

echo ""
echo "============================================================================"
echo "  SUCCESS! ShiftNote AU is installed and ready to run."
echo "============================================================================"
echo "Run './run.sh' or 'npm run demo' anytime to start."
echo ""
read -p "Would you like to launch ShiftNote AU now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./run.sh
fi

