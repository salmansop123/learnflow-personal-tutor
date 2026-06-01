#!/usr/bin/env bash
# Start the full LearnFlow dev stack with one command:
#   PostgreSQL (if needed) → FastAPI backend → Next.js frontend
#
# Usage:
#   bash scripts/start-dev.sh
#   npm run dev:all

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

cleanup() {
  log "Shutting down..."
  stop_backend
  exit 0
}

trap cleanup SIGINT SIGTERM

main() {
  log "LearnFlow dev stack starting..."
  echo ""

  require_node
  require_python

  if ! is_setup_complete; then
    warn "First run detected — running setup..."
    bash "${SCRIPT_DIR}/setup.sh"
    echo ""
  else
    ensure_env_file
    install_frontend_dependencies
    install_backend_dependencies
    ensure_database
    sync_database
  fi

  start_backend

  echo ""
  success "All services ready."
  log "Frontend:  http://localhost:3000"
  log "Backend:   http://localhost:8000"
  log "API docs:  http://localhost:8000/docs"
  log "Press Ctrl+C to stop backend and exit."
  echo ""

  exec npm run dev
}

main "$@"
