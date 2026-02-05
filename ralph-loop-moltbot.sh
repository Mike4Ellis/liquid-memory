#!/usr/bin/env bash
set -euo pipefail

# Ralph Loop for Moltbot Environment
# Usage: ./ralph-loop-moltbot.sh [max_iterations]

MAX_ITERS="${1:-50}"
PLAN_SENTINEL='STATUS: COMPLETE'
LOG_FILE=".ralph/ralph.log"
PROJECT_DIR="/home/admin/clawd/projects/aigc-creative-studio"

echo "🚀 Ralph Loop for Liquid Memory (Moltbot Edition)"
echo "Max iterations: $MAX_ITERS"
echo "Project: $PROJECT_DIR"
echo ""

for i in $(seq 1 "$MAX_ITERS"); do
  echo -e "\n========================================"
  echo "=== Ralph iteration $i/$MAX_ITERS ==="
  echo "========================================"
  date
  
  # Check for completion
  if grep -Fq "$PLAN_SENTINEL" "$PROJECT_DIR/IMPLEMENTATION_PLAN.md" 2>/dev/null; then
    echo "✅ Completion detected! All tasks done."
    exit 0
  fi
  
  # Find next incomplete US from PROGRESS.md
  NEXT_US=$(grep -E "^#### (🔄|⏳) US-" "$PROJECT_DIR/PROGRESS.md" | head -1 | grep -oE "US-[0-9]+" || echo "")
  
  if [ -z "$NEXT_US" ]; then
    echo "✅ No more incomplete tasks found!"
    exit 0
  fi
  
  echo "Next task: $NEXT_US"
  echo ""
  echo "⚠️  Please run the following command in a separate session to continue:"
  echo ""
  echo "  sessions_spawn with task for $NEXT_US"
  echo ""
  echo "Or manually implement and update PROGRESS.md"
  
  # Wait for user to complete this iteration
  read -p "Press Enter when $NEXT_US is complete (or Ctrl+C to stop)..."
done

echo "❌ Max iterations ($MAX_ITERS) reached."
exit 1
