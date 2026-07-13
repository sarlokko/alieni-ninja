#!/bin/bash
# Ridistribuisce il gioco su surge.sh
# Richiede: npm install -g surge && surge login (una volta)
set -e
cd "$(dirname "$0")/../public"
surge . https://alieni-ninja-game.surge.sh
echo "Online: https://alieni-ninja-game.surge.sh/game.html"
