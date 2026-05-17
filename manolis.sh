#!/usr/bin/env bash
set -euo pipefail

# ── Constants ──────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTAINER_NAME="manolis-postgres"
DB_IMAGE="postgres:16-alpine"
VOLUME_NAME="manolis-pgdata"
DEV_PORT=3000
PID_FILE="$PROJECT_DIR/.manolis-dev.pid"
LOG_FILE="$PROJECT_DIR/.manolis-dev.log"
ADMIN_HASH='$2a$10$KWqh3.pFb0uiRMXpo4NzS.InzfoBVnVCw0dmDT6oNWWboG3H2meei'

# ── Colors ─────────────────────────────────────────────────
if [ -t 1 ]; then
  GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
  CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
else
  GREEN=''; RED=''; YELLOW=''; CYAN=''; BOLD=''; DIM=''; NC=''
fi

# ── Output helpers ─────────────────────────────────────────
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
info() { echo -e "${CYAN}[INFO]${NC} $1"; }
header() { echo -e "\n${BOLD}$1${NC}"; }

# ── Utility functions ──────────────────────────────────────
source_env() {
  if [ -f "$PROJECT_DIR/.env" ]; then
    set -a; source "$PROJECT_DIR/.env"; set +a
  fi
}

is_docker_installed() {
  command -v docker &>/dev/null
}

is_container_running() {
  docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER_NAME}$"
}

is_port_in_use() {
  ss -tlnp 2>/dev/null | grep -q ":${1} "
}

wait_for_postgres() {
  info "Waiting for database..."
  local attempts=0
  while [ $attempts -lt 15 ]; do
    if docker exec "$CONTAINER_NAME" pg_isready -U manolis &>/dev/null; then
      return 0
    fi
    sleep 2
    attempts=$((attempts + 1))
    echo -n "."
  done
  echo ""
  err "Database did not become ready in time."
  return 1
}

get_pid_on_port() {
  ss -tlnp 2>/dev/null | grep ":${1} " | grep -oP 'pid=\K[0-9]+' | head -1
}

# ── Operations ─────────────────────────────────────────────

do_start() {
  header "Starting Manolis Booking..."

  # 1. Docker
  if ! is_docker_installed; then
    err "Docker is not installed. Please install Docker first."
    echo "  → https://docs.docker.com/get-docker/"
    return 1
  fi

  if is_container_running; then
    ok "Database is already running."
  else
    info "Creating data volume..."
    docker volume create "$VOLUME_NAME" &>/dev/null || true

    info "Starting database container..."
    if ! docker run -d \
      --name "$CONTAINER_NAME" \
      -e POSTGRES_USER=manolis \
      -e POSTGRES_PASSWORD=manolis123 \
      -e POSTGRES_DB=manolis_booking \
      -v "$VOLUME_NAME":/var/lib/postgresql/data \
      -p 5432:5432 \
      "$DB_IMAGE" &>/dev/null; then
      err "Failed to start database container."
      return 1
    fi

    wait_for_postgres
    ok "Database started."
  fi

  # 2. Dev server
  if is_port_in_use $DEV_PORT; then
    warn "Port $DEV_PORT is already in use."
    warn "Use menu option 3 (Kill port $DEV_PORT) or stop it manually."
    return 1
  fi

  if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    info "Installing dependencies..."
    (cd "$PROJECT_DIR" && npm install --silent)
  fi

  info "Starting dev server..."
  source_env
  cd "$PROJECT_DIR"
  nohup npm run dev > "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"

  # Wait for server to respond
  local attempts=0
  while [ $attempts -lt 20 ]; do
    if curl -s -o /dev/null http://localhost:$DEV_PORT 2>/dev/null; then
      break
    fi
    sleep 1
    attempts=$((attempts + 1))
  done

  if is_port_in_use $DEV_PORT; then
    ok "Dev server started."
    echo ""
    ok "App is running at: ${BOLD}http://localhost:$DEV_PORT${NC}"
    echo ""
    info "Login: admin / admin123"
    info "Logs: $LOG_FILE"
  else
    err "Dev server failed to start. Check $LOG_FILE"
    return 1
  fi
}

do_stop() {
  header "Stopping Manolis Booking..."

  # 1. Dev server
  if [ -f "$PID_FILE" ]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      info "Stopping dev server (PID $pid)..."
      kill "$pid" 2>/dev/null || true
      sleep 2
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi

  # Also kill any remaining next dev process
  if is_port_in_use $DEV_PORT; then
    local pid
    pid=$(get_pid_on_port $DEV_PORT)
    if [ -n "$pid" ]; then
      info "Killing remaining process on port $DEV_PORT (PID $pid)..."
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi

  # 2. Docker
  if is_container_running; then
    info "Stopping database..."
    docker stop "$CONTAINER_NAME" &>/dev/null
    docker rm "$CONTAINER_NAME" &>/dev/null
  fi

  ok "Everything stopped."
}

do_kill_port() {
  header "Killing process on port $DEV_PORT..."

  if ! is_port_in_use $DEV_PORT; then
    ok "Port $DEV_PORT is already free."
    return 0
  fi

  local pid
  pid=$(get_pid_on_port $DEV_PORT)
  if [ -n "$pid" ]; then
    info "Found process $pid on port $DEV_PORT. Killing..."
    kill -9 "$pid" 2>/dev/null || true
    sleep 1
    if is_port_in_use $DEV_PORT; then
      err "Could not kill the process. Try: sudo kill -9 $pid"
    else
      ok "Port $DEV_PORT is now free."
    fi
  else
    warn "Port is in use but could not find PID. Try: sudo fuser -k $DEV_PORT/tcp"
  fi
}

do_init_db() {
  header "Initializing Database..."

  # Start container if not running
  if ! is_container_running; then
    info "Database not running. Starting it..."
    if ! is_docker_installed; then
      err "Docker is not installed."
      return 1
    fi
    docker volume create "$VOLUME_NAME" &>/dev/null || true
    docker run -d \
      --name "$CONTAINER_NAME" \
      -e POSTGRES_USER=manolis \
      -e POSTGRES_PASSWORD=manolis123 \
      -e POSTGRES_DB=manolis_booking \
      -v "$VOLUME_NAME":/var/lib/postgresql/data \
      -p 5432:5432 \
      "$DB_IMAGE" &>/dev/null || true
    wait_for_postgres
  fi

  # Push schema
  info "Creating database tables..."
  source_env
  (cd "$PROJECT_DIR" && npm run db:push --silent 2>&1) || {
    err "Failed to push schema. Check your .env file."
    return 1
  }
  ok "Tables created."

  # Seed admin user via psql inside the container
  info "Creating admin user..."
  docker exec "$CONTAINER_NAME" psql -U manolis -d manolis_booking -c "
    INSERT INTO users (id, username, password_hash, email, full_name, role, created_at)
    SELECT gen_random_uuid(), 'admin', '${ADMIN_HASH}', 'admin@manolis.booking', 'System Admin', 'admin', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
  " &>/dev/null

  ok "Admin user ready."
  echo ""
  echo -e "  ${BOLD}Username:${NC} admin"
  echo -e "  ${BOLD}Password:${NC} admin123"
  echo ""
  ok "Database initialized."
}

do_status() {
  header "Manolis Booking — Status"
  echo ""

  # Docker
  if is_docker_installed; then
    if is_container_running; then
      ok "Database: running"
    else
      warn "Database: stopped"
    fi
  else
    err "Docker: not installed"
  fi

  # Dev server
  if is_port_in_use $DEV_PORT; then
    local pid
    pid=$(get_pid_on_port $DEV_PORT)
    ok "Dev server: running (PID ${pid:-?}) on port $DEV_PORT"
  else
    warn "Dev server: stopped"
  fi

  # .env
  if [ -f "$PROJECT_DIR/.env" ]; then
    ok "Config (.env): found"
  else
    err "Config (.env): missing"
  fi

  # node_modules
  if [ -d "$PROJECT_DIR/node_modules" ]; then
    ok "Dependencies: installed"
  else
    warn "Dependencies: not installed (run npm install)"
  fi

  echo ""
  if is_container_running && is_port_in_use $DEV_PORT; then
    ok "App is live at ${BOLD}http://localhost:$DEV_PORT${NC}"
  else
    info "Use option 1 (Start) to get going."
  fi
}

do_deploy() {
  header "Deploy to Vercel"
  echo ""
  info "This will guide you through deploying Manolis Booking to Vercel."
  echo ""

  # Check Vercel CLI
  if ! command -v vercel &>/dev/null; then
    warn "Vercel CLI is not installed."
    echo ""
    read -r -p "Install it now? [y/N]: " answer
    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
      npm i -g vercel
    else
      err "Cannot deploy without Vercel CLI. Run: npm i -g vercel"
      return 1
    fi
  fi

  echo ""
  info "Step 1: Linking project to Vercel..."
  echo "  Vercel will ask a few questions. Accept the defaults."
  echo ""
  (cd "$PROJECT_DIR" && vercel)

  echo ""
  info "Step 2: Important — set these environment variables in the Vercel dashboard:"
  echo ""
  echo "  Go to your project → Settings → Environment Variables"
  echo ""
  echo -e "  ${BOLD}POSTGRES_URL${NC}    = your production Postgres connection string"
  echo -e "  ${BOLD}AUTH_SECRET${NC}     = a random secret (run: openssl rand -base64 32)"
  echo -e "  ${BOLD}AUTH_URL${NC}        = your Vercel app URL (e.g. https://manolis-booking.vercel.app)"
  echo ""
  info "Step 3: Push database schema to your production DB:"
  echo "  After setting POSTGRES_URL, run from your terminal:"
  echo "    POSTGRES_URL='your-production-url' npm run db:push"
  echo "    Then seed the admin user (option 4 in this script won't work for a remote DB)."
  echo ""
  info "Step 4: Deploy to production:"
  echo "    ./node_modules/.bin/vercel --prod"
  echo ""
  ok "Guide complete. Follow the steps above to finish deployment."
}

# ── Startup guards ─────────────────────────────────────────

# Check we're in the project root
if [ ! -f "$PROJECT_DIR/package.json" ]; then
  err "package.json not found. Run this script from the manolis-booking directory."
  exit 1
fi

# Check node/npm
if ! command -v node &>/dev/null; then
  err "Node.js is not installed. Install it first: https://nodejs.org/"
  exit 1
fi

if ! command -v npm &>/dev/null; then
  err "npm is not installed. It should come with Node.js."
  exit 1
fi

# Offer npm install if needed
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
  warn "Dependencies not installed."
  read -r -p "Run npm install now? [Y/n]: " answer
  if [ "$answer" != "n" ] && [ "$answer" != "N" ]; then
    (cd "$PROJECT_DIR" && npm install)
  fi
fi

# Clean exit on Ctrl+C
trap 'echo ""; ok "Bye!"; exit 0' SIGINT

# ── Menu ───────────────────────────────────────────────────
while true; do
  echo ""
  echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}║${NC}    ${CYAN}MANOLIS BOOKING${NC} — Management Console    ${BOLD}║${NC}"
  echo -e "${BOLD}╠══════════════════════════════════════════╣${NC}"
  echo -e "${BOLD}║${NC}  ${GREEN}1${NC}) Start app                           ${BOLD}║${NC}"
  echo -e "${BOLD}║${NC}  ${GREEN}2${NC}) Stop app                            ${BOLD}║${NC}"
  echo -e "${BOLD}║${NC}  ${GREEN}3${NC}) Kill port $DEV_PORT                       ${BOLD}║${NC}"
  echo -e "${BOLD}║${NC}  ${GREEN}4${NC}) Initialize database                  ${BOLD}║${NC}"
  echo -e "${BOLD}║${NC}  ${GREEN}5${NC}) Show status                          ${BOLD}║${NC}"
  echo -e "${BOLD}║${NC}  ${GREEN}6${NC}) Deploy to Vercel                     ${BOLD}║${NC}"
  echo -e "${BOLD}║${NC}  ${RED}0${NC}) Exit                                 ${BOLD}║${NC}"
  echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
  echo ""

  read -r -p "Choose [0-6]: " choice
  echo ""

  case "$choice" in
    1) do_start ;;
    2) do_stop ;;
    3) do_kill_port ;;
    4) do_init_db ;;
    5) do_status ;;
    6) do_deploy ;;
    0) ok "Bye!"; exit 0 ;;
    *) warn "Pick a number from 0 to 6." ;;
  esac

  echo ""
  read -n 1 -s -r -p "Press any key to continue..."
done
