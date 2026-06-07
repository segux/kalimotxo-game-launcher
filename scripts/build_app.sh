#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
source .venv/bin/activate
pip install -q py2app pywebview
rm -rf build dist
python setup_macos.py py2app
echo "Built: dist/Kalimotxo.app"
echo "Runtime Wine still downloads to ~/.kalimotxo on first run"
