#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ -f .env ]]; then
  set -a
  source ./.env
  set +a
fi

: "${DATABASE_URL:?DATABASE_URL must be set}"

cargo run --example seed_admin
