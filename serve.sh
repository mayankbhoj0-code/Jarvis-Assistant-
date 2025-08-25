#!/usr/bin/env bash

PORT=${PORT:-5173}
DIR=${1:-.}

echo "Starting local server at http://localhost:${PORT} (serving ${DIR})"
python3 -m http.server "${PORT}" --directory "${DIR}"

