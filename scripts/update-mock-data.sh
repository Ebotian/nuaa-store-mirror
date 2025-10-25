#!/usr/bin/env bash
set -euo pipefail

# Simple helper to run the TypeScript indexer and write files into web/public/mock-data
# Usage: ./scripts/update-mock-data.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS_DIR="$ROOT_DIR/tools"
OUT_DIR="$ROOT_DIR/web/public/mock-data"

mkdir -p "$OUT_DIR"

echo "[*] Running indexer (tools) -> output: $OUT_DIR"

# Use the tools package script which runs tsx on indexer/build-index.ts and forward flags
npm --prefix "$TOOLS_DIR" run build:index -- --out "$OUT_DIR" --index-file files.json --categories-file categories.json --formats index,categories --pretty

echo "[*] Done. Generated files:"
ls -la "$OUT_DIR" || true

echo "[*] Tip: start the web dev server (in web/) and open http://localhost:4173/mock-data/categories.json to verify."
