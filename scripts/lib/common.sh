#!/usr/bin/env bash
# Shared helpers for LearnFlow scripts

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

BACKEND_DIR="${ROOT_DIR}/backend"
VENV_DIR="${BACKEND_DIR}/.venv"
DOCKER_DB_PORT="${DOCKER_DB_PORT:-5433}"
DOCKER_DB_URL="postgresql://postgres:postgres@localhost:${DOCKER_DB_PORT}/learnflow"

# Colors (disabled when not a tty)
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

log()    { echo -e "${BLUE}[learnflow]${NC} $*"; }
success(){ echo -e "${GREEN}[learnflow]${NC} $*"; }
warn()   { echo -e "${YELLOW}[learnflow]${NC} $*"; }
error()  { echo -e "${RED}[learnflow]${NC} $*" >&2; }

require_command() {
  local cmd="$1"
  local hint="${2:-}"
  if ! command -v "$cmd" &>/dev/null; then
    error "Required command not found: $cmd"
    [[ -n "$hint" ]] && error "$hint"
    exit 1
  fi
}

require_node() {
  require_command node "Install Node.js 18+ from https://nodejs.org"
  require_command npm
}

require_python() {
  require_command python3 "Install Python 3.11+ from https://python.org"
}

docker_compose_cmd() {
  if docker compose version &>/dev/null 2>&1; then
    echo "docker compose"
  elif command -v docker-compose &>/dev/null; then
    echo "docker-compose"
  else
    return 1
  fi
}

ensure_env_file() {
  if [[ ! -f .env.local ]]; then
    if [[ ! -f .env.example ]]; then
      error ".env.example is missing. Cannot create .env.local."
      exit 1
    fi
    cp .env.example .env.local
    success "Created .env.local from .env.example"
  fi
}

generate_secrets_if_needed() {
  if grep -q 'AUTH_SECRET=your-secret-here' .env.local 2>/dev/null; then
    local secret
    secret="$(openssl rand -base64 32)"
    sed -i "s|AUTH_SECRET=your-secret-here|AUTH_SECRET=${secret}|" .env.local
    log "Generated AUTH_SECRET"
  fi
  if grep -q 'CRON_SECRET=your-cron-secret-here' .env.local 2>/dev/null; then
    local cron
    cron="$(openssl rand -base64 32)"
    sed -i "s|CRON_SECRET=your-cron-secret-here|CRON_SECRET=${cron}|" .env.local
    log "Generated CRON_SECRET"
  fi
}

set_database_url() {
  local url="$1"
  url="${url/postgres:\/\//postgresql:\/\/}"

  if grep -q '^DATABASE_URL=' .env.local; then
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${url}|" .env.local
  else
    echo "DATABASE_URL=${url}" >> .env.local
  fi
  export DATABASE_URL="$url"
}

db_is_reachable() {
  [[ -d "$VENV_DIR" ]] || return 1
  PYTHONPATH="${BACKEND_DIR}" "${VENV_DIR}/bin/python" - <<'PY' &>/dev/null
from sqlalchemy import create_engine, text
from app.core.config import get_settings
engine = create_engine(get_settings().database_url, pool_pre_ping=True)
with engine.connect() as conn:
    conn.execute(text("SELECT 1"))
PY
}

wait_for_db() {
  local attempt=1
  local max=30
  while ! db_is_reachable; do
    if (( attempt > max )); then
      error "Database not reachable after ${max} attempts."
      return 1
    fi
    log "Waiting for database... (${attempt}/${max})"
    sleep 1
    (( attempt++ )) || true
  done
  return 0
}

start_docker_database() {
  local compose_cmd
  compose_cmd="$(docker_compose_cmd)" || return 1

  require_command docker "Install Docker to use docker-compose Postgres."

  log "Starting PostgreSQL via Docker (port ${DOCKER_DB_PORT})..."
  $compose_cmd up -d postgres

  set_database_url "$DOCKER_DB_URL"
  wait_for_db
  success "Docker PostgreSQL is ready."
  return 0
}

ensure_database() {
  ensure_env_file

  if db_is_reachable 2>/dev/null; then
    success "Database connection OK."
    return 0
  fi

  warn "Database not reachable. Attempting to start Docker Postgres..."

  if start_docker_database; then
    return 0
  fi

  error "Could not start or connect to a database."
  error "Start Postgres (docker compose up -d) and set DATABASE_URL in .env.local"
  exit 1
}

install_frontend_dependencies() {
  if [[ ! -d node_modules ]]; then
    log "Installing frontend (npm) dependencies..."
    npm install
    success "Frontend dependencies installed."
  else
    log "Frontend dependencies already installed."
  fi
}

install_backend_dependencies() {
  require_python
  if [[ ! -d "$VENV_DIR" ]]; then
    log "Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
  fi
  log "Installing backend (Python) dependencies..."
  "${VENV_DIR}/bin/pip" install -q --upgrade pip
  "${VENV_DIR}/bin/pip" install -q -r "${BACKEND_DIR}/requirements.txt"
  success "Backend dependencies installed."
}

sync_database() {
  log "Running Alembic migrations..."
  cd "$BACKEND_DIR"
  PYTHONPATH="${BACKEND_DIR}" "${VENV_DIR}/bin/alembic" upgrade head
  cd "$ROOT_DIR"
  success "Database schema is in sync."
}

ensure_alembic_initial_revision() {
  if [[ -d "${BACKEND_DIR}/alembic/versions" ]] && \
     [[ -n "$(ls -A "${BACKEND_DIR}/alembic/versions" 2>/dev/null)" ]]; then
    return 0
  fi
  log "Creating initial Alembic migration..."
  cd "$BACKEND_DIR"
  PYTHONPATH="${BACKEND_DIR}" "${VENV_DIR}/bin/alembic" revision --autogenerate -m "initial_schema"
  cd "$ROOT_DIR"
}

mark_setup_complete() {
  mkdir -p .learnflow
  date -Iseconds > .learnflow/setup-complete
}

is_setup_complete() {
  [[ -f .learnflow/setup-complete ]] && [[ -d node_modules ]] && [[ -d "$VENV_DIR" ]]
}

start_backend() {
  local pid_file="${ROOT_DIR}/.learnflow/backend.pid"
  mkdir -p .learnflow

  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    success "Backend already running (PID $(cat "$pid_file"))."
    return 0
  fi

  log "Starting FastAPI backend..."
  cd "$BACKEND_DIR"
  PYTHONPATH="${BACKEND_DIR}" nohup "${VENV_DIR}/bin/uvicorn" app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    > "${ROOT_DIR}/.learnflow/backend.log" 2>&1 &
  echo $! > "$pid_file"
  cd "$ROOT_DIR"

  local attempt=1
  while ! curl -sf "http://localhost:8000/api/v1/health" &>/dev/null; do
    if (( attempt > 30 )); then
      error "Backend failed to start. See .learnflow/backend.log"
      return 1
    fi
    sleep 1
    (( attempt++ )) || true
  done
  success "FastAPI backend ready at http://localhost:8000"
}

stop_backend() {
  local pid_file="${ROOT_DIR}/.learnflow/backend.pid"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      success "Stopped FastAPI backend (PID ${pid})."
    fi
    rm -f "$pid_file"
  fi
}
