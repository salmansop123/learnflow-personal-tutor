#!/usr/bin/env bash
# Start only the FastAPI backend (requires Postgres + DATABASE_URL in .env.local).
# Usage: npm run dev:backend

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

require_python
ensure_env_file
install_backend_dependencies
ensure_database
sync_database
start_backend

success "Backend running at http://localhost:8000"
log "Run the frontend separately: npm run dev"
