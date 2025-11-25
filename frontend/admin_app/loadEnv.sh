# loadEnv.sh — POSIX‑strict, must be sourced
#   . ./loadEnv.sh            # use existing $NODE_ENV
#   . ./loadEnv.sh staging    # override

# optional positional override
if [ "$#" -gt 0 ]; then
  NODE_ENV="$1"
fi

# directory the script lives in (works whether sourced or executed)
case "$0" in
  /*) SCRIPT_DIR=$(dirname "$0") ;;
  *)  SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd) ;;
esac

set -a  # auto‑export every assignment
[ -f "$SCRIPT_DIR/.env" ] && . "$SCRIPT_DIR/.env"
if [ -n "${NODE_ENV:-}" ] && [ -f "$SCRIPT_DIR/.env.$NODE_ENV" ]; then
  . "$SCRIPT_DIR/.env.$NODE_ENV"
fi
set +a
