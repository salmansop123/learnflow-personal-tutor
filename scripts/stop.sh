#!/usr/bin/env bash
# Stop FastAPI backend and local PostgreSQL

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

main() {
  log "Stopping LearnFlow services..."

  stop_backend

  if compose_cmd="$(docker_compose_cmd 2>/dev/null)"; then
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^learnflow-postgres$'; then
      log "Stopping Docker Postgres..."
      $compose_cmd down
      success "Docker Postgres stopped."
    fi
  fi

  echo ""
  success "Stop complete."
}

main "$@"
