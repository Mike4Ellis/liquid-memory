#!/usr/bin/env bash
set -euo pipefail

# Ralph Loop for Liquid Memory
# Usage: ./ralph-loop.sh [max_iterations]

MAX_ITERS="${1:-50}"
PROMISE='STATUS: COMPLETE'
PLAN_SENTINEL='STATUS: COMPLETE'
LOG_FILE=".ralph/ralph.log"

# Ensure we're in a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Run this inside a git repo."
  exit 1
fi

# Create log directory
mkdir -p .ralph

# Configure git author for this repo
git config user.name "Gremins"
git config user.email "gremins@liquid-memory.local"

echo "🚀 Starting Ralph loop for Liquid Memory"
echo "Max iterations: $MAX_ITERS"
echo "Log file: $LOG_FILE"
echo ""

for i in $(seq 1 "$MAX_ITERS"); do
  echo -e "\n========================================" | tee -a "$LOG_FILE"
  echo "=== Ralph iteration $i/$MAX_ITERS ===" | tee -a "$LOG_FILE"
  echo "========================================" | tee -a "$LOG_FILE"
  date | tee -a "$LOG_FILE"
  
  # Spawn sub-agent with the prompt
  echo "Spawning sub-agent..." | tee -a "$LOG_FILE"
  
  # Check for completion
  if grep -Fq "$PLAN_SENTINEL" IMPLEMENTATION_PLAN.md 2>/dev/null; then
    echo "✅ Completion detected in IMPLEMENTATION_PLAN.md" | tee -a "$LOG_FILE"
    echo "Ralph loop finished successfully!" | tee -a "$LOG_FILE"
    exit 0
  fi
  
  # Small delay between iterations
  sleep 2
done

echo "❌ Max iterations ($MAX_ITERS) reached without completion." | tee -a "$LOG_FILE"
exit 1
