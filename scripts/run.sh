#!/usr/bin/env bash
# Alias for start-dev.sh (backward compatible)
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/start-dev.sh" "$@"
