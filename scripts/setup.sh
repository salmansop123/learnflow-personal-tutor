#!/usr/bin/env bash
# First-time setup: frontend deps, backend venv, database, Alembic migrations

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

main() {
  log "LearnFlow setup starting..."
  echo ""

  require_node
  require_python
  ensure_env_file
  generate_secrets_if_needed
  install_frontend_dependencies
  install_backend_dependencies
  ensure_database
  ensure_alembic_initial_revision
  sync_database
  mark_setup_complete

  echo ""
  success "Setup complete!"
  log "Start full stack: npm run app"
  echo ""
}

main "$@"
