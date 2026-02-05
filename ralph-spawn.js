#!/usr/bin/env node
/**
 * Ralph Spawn - Launch sub-agent for Liquid Memory development
 * Usage: node ralph-spawn.js [US-NUMBER]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = '/home/admin/clawd/projects/aigc-creative-studio';

// Read current progress
function getNextTask() {
  const progressPath = path.join(PROJECT_DIR, 'PROGRESS.md');
  const content = fs.readFileSync(progressPath, 'utf8');
  
  // Find first incomplete US (🔄 or ⏳)
  const match = content.match(/#### (🔄|⏳) (US-\d+): (.+)/);
  if (!match) return null;
  
  return {
    id: match[2],
    status: match[1] === '🔄' ? 'in_progress' : 'pending',
    title: match[3].trim()
  };
}

// Generate task prompt for specific US
function generatePrompt(usId) {
  const prompts = {
    'US-003': `You are working on Liquid Memory project at ${PROJECT_DIR}

**Current Task**: US-003 - Local File Storage and Thumbnail Generation

**Read First**:
1. agents/prd.json - Find US-003 acceptance criteria
2. IMPLEMENTATION_PLAN.md - Check current status
3. AGENTS.md - Build instructions

**US-003 Acceptance Criteria**:
- Implement drag-and-drop file upload component
- Generate thumbnails (max 300px) using canvas
- Store original images in local filesystem
- Store thumbnail paths in metadata
- Handle jpg/png/webp formats
- Show upload progress and preview
- Typecheck passes

**Implementation Steps**:
1. Create components/upload/ directory
2. Create DragDropUpload.tsx component
3. Create thumbnail generation utility (lib/thumbnail.ts)
4. Create file storage utility (lib/storage.ts)
5. Add to main page for testing
6. Run typecheck

**After completion**:
1. Update PROGRESS.md - mark US-003 complete
2. Update IMPLEMENTATION_PLAN.md
3. Commit: git add . && git commit -m "feat: US-003 implement file upload and thumbnail generation"
4. Push: git push origin master

Start now!`,

    'US-004': `You are working on Liquid Memory project at ${PROJECT_DIR}

**Current Task**: US-004 - VL API Integration for Image Analysis

**Read First**:
1. agents/prd.json - Find US-004 acceptance criteria
2. IMPLEMENTATION_PLAN.md - Check current status
3. AGENTS.md - Build instructions
4. app/api/analyze/route.ts - Existing API route

**US-004 Acceptance Criteria**:
- Send image to /api/analyze endpoint
- Parse response into structured format
- Extract 8 dimensions from PRD
- Error handling with user-friendly messages
- Loading state during analysis
- Cache results
- Typecheck passes

**Implementation Steps**:
1. Create lib/api.ts for frontend API client
2. Create hooks/useAnalyze.ts for analysis logic
3. Create components/analyze/AnalysisResult.tsx to display results
4. Integrate with upload component
5. Run typecheck

**After completion**:
1. Update PROGRESS.md - mark US-004 complete
2. Update IMPLEMENTATION_PLAN.md
3. Commit: git add . && git commit -m "feat: US-004 integrate VL API for image analysis"
4. Push: git push origin master

Start now!`,

    'default': `You are working on Liquid Memory project at ${PROJECT_DIR}

**Current Task**: ${usId}

**Read First**:
1. agents/prd.json - Find ${usId} acceptance criteria
2. IMPLEMENTATION_PLAN.md - Check current status
3. AGENTS.md - Build instructions
4. PROGRESS.md - Current progress

**Implementation**:
1. Implement the feature according to acceptance criteria
2. Run typecheck
3. Test the functionality

**After completion**:
1. Update PROGRESS.md - mark ${usId} complete
2. Update IMPLEMENTATION_PLAN.md
3. Commit with clear message
4. Push: git push origin master

Start now!`
  };

  return prompts[usId] || prompts['default'];
}

// Main
function main() {
  const usId = process.argv[2];
  
  if (!usId) {
    const nextTask = getNextTask();
    if (!nextTask) {
      console.log('✅ All tasks completed!');
      process.exit(0);
    }
    console.log(`Next task: ${nextTask.id} - ${nextTask.title}`);
    console.log('\nRun: node ralph-spawn.js ' + nextTask.id);
    process.exit(0);
  }

  const prompt = generatePrompt(usId);
  
  console.log(`🚀 Spawning sub-agent for ${usId}...`);
  console.log('\n=== TASK PROMPT ===\n');
  console.log(prompt);
  console.log('\n==================\n');
  console.log('Copy the above prompt and run:');
  console.log('  sessions_spawn with this task');
}

main();
