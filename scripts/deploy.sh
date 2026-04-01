#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if git remote get-url origin >/dev/null 2>&1; then
  GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-$(git config user.name 2>/dev/null || true)}"
  GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-$(git config user.email 2>/dev/null || true)}"
  if [[ -z "${GIT_AUTHOR_NAME}" ]]; then GIT_AUTHOR_NAME="qontai-deploy"; fi
  if [[ -z "${GIT_AUTHOR_EMAIL}" ]]; then GIT_AUTHOR_EMAIL="qontai-deploy@localhost"; fi

  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    git add -A
    git restore --staged .env 2>/dev/null || true
    git -c user.name="$GIT_AUTHOR_NAME" -c user.email="$GIT_AUTHOR_EMAIL" \
      commit -m "chore: déploiement $(date -u +%Y-%m-%dT%H:%M:%SZ)" || true
  fi
  git push origin "$BRANCH"
fi

export GIT_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
export GIT_REF="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
export GIT_BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker compose build --build-arg "GIT_COMMIT=$GIT_COMMIT" --build-arg "GIT_REF=$GIT_REF" --build-arg "GIT_BUILD_TIME=$GIT_BUILD_TIME"
docker compose up -d
echo "OK — poussé sur origin, image construite avec $GIT_COMMIT"
echo "    http://127.0.0.1:3014 (NPM → qontai.creez.io)"

