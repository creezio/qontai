#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if git remote get-url origin >/dev/null 2>&1; then
  if ! git config user.email >/dev/null 2>&1 || ! git config user.name >/dev/null 2>&1; then
    echo >&2 "Erreur : configurez l’auteur Git dans ce dépôt, par ex."
    echo >&2 "  git config user.email \"vous@creez.io\" && git config user.name \"Votre nom\""
    exit 1
  fi
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    git add -A
    git restore --staged .env 2>/dev/null || true
    git commit -m "chore: déploiement $(date -u +%Y-%m-%dT%H:%M:%SZ)" || true
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

