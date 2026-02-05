#!/usr/bin/env node
/**
 * Ralph Auto - Automatic task detection and execution for Liquid Memory
 * This script checks PROGRESS.md and automatically starts next US development
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = '/home/admin/clawd/projects/aigc-creative-studio';
const PROGRESS_PATH = path.join(PROJECT_DIR, 'PROGRESS.md');

// Read current progress
function getCurrentStatus() {
  const content = fs.readFileSync(PROGRESS_PATH, 'utf8');
  
  // Count completed
  const completed = (content.match(/#### ✅ US-/g) || []).length;
  const inProgress = (content.match(/#### 🔄 US-/g) || []).length;
  const pending = (content.match(/#### ⏳ US-/g) || []).length;
  
  // Find next task
  const nextMatch = content.match(/#### (🔄|⏳) (US-\d+): (.+)/);
  const nextTask = nextMatch ? {
    id: nextMatch[2],
    status: nextMatch[1] === '🔄' ? 'in_progress' : 'pending',
    title: nextMatch[3].trim()
  } : null;
  
  return { completed, inProgress, pending, total: 14, nextTask };
}

// Check if git has uncommitted changes
function hasUncommittedChanges() {
  try {
    const result = require('child_process').execSync('git status --porcelain', { 
      cwd: PROJECT_DIR,
      encoding: 'utf8'
    });
    return result.trim().length > 0;
  } catch (e) {
    return false;
  }
}

// Main
function main() {
  const status = getCurrentStatus();
  
  console.log('=== Ralph Auto Status Check ===');
  console.log(`Progress: ${status.completed}/${status.total} US completed (${Math.round(status.completed/status.total*100)}%)`);
  console.log(`In Progress: ${status.inProgress}, Pending: ${status.pending}`);
  
  if (status.completed === status.total) {
    console.log('\n✅ ALL TASKS COMPLETE!');
    console.log('Add STATUS: COMPLETE to IMPLEMENTATION_PLAN.md');
    return { action: 'COMPLETE', message: 'All US completed!' };
  }
  
  if (!status.nextTask) {
    console.log('\n⚠️ No next task found');
    return { action: 'WAIT', message: 'No task found' };
  }
  
  console.log(`\nNext Task: ${status.nextTask.id} - ${status.nextTask.title}`);
  
  // Check for uncommitted changes
  if (hasUncommittedChanges()) {
    console.log('\n⚠️ Uncommitted changes detected - commit first!');
    return { 
      action: 'COMMIT', 
      usId: status.nextTask.id,
      message: `Commit changes for ${status.nextTask.id}` 
    };
  }
  
  // Ready to start next task
  console.log(`\n🚀 Ready to start ${status.nextTask.id}`);
  return { 
    action: 'START', 
    usId: status.nextTask.id,
    title: status.nextTask.title,
    message: `Start developing ${status.nextTask.id}: ${status.nextTask.title}` 
  };
}

const result = main();
console.log('\n=== ACTION ===');
console.log(result.action);
console.log(result.message);

// Export for use by other scripts
module.exports = { main, getCurrentStatus };
