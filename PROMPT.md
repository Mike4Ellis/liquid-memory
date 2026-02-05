# Ralph Building Loop - Liquid Memory

You are running a Ralph BUILDING loop for: **AIGC 创意工坊 - AI 提示词解析与管理工具**

## Goal
Implement a Next.js-based AI prompt analysis and management tool with the following capabilities:
1. Image upload and AI-powered prompt reverse-engineering
2. Local storage of creative items with thumbnail generation
3. Structured prompt editor
4. Tag system and search/filter
5. Word network visualization (D3.js)
6. SeeDream API integration for image generation

## Context Files
- `agents/prd.json` - User Stories with acceptance criteria (US-001 to US-014)
- `PRD.md` - Full product requirements document
- `AGENTS.md` - Build instructions, test commands, and operational learnings
- `IMPLEMENTATION_PLAN.md` - Current implementation status and next tasks

## Your Tasks Each Iteration

1. **Read IMPLEMENTATION_PLAN.md** - Check current status and pick the next incomplete task
2. **Read agents/prd.json** - Find the corresponding US (User Story) with acceptance criteria
3. **Investigate code** - Don't assume files don't exist; check before creating
4. **Implement** - Write/modify code to satisfy the acceptance criteria
5. **Run backpressure** - Execute test/lint/typecheck commands from AGENTS.md
6. **Update IMPLEMENTATION_PLAN.md** - Mark task complete, add notes
7. **Update AGENTS.md** - Add any new operational learnings
8. **Commit** - Use conventional commits format: `feat: US-XXX description`

## Completion Criteria
- All US-001 to US-014 marked as complete in IMPLEMENTATION_PLAN.md
- TypeScript typecheck passes
- All tests pass (if any)
- Add line `STATUS: COMPLETE` to IMPLEMENTATION_PLAN.md when done

## Important Notes
- This is an open-source personal project - no commercial constraints
- Use "Gremins" as the git commit author name
- Prioritize working software over perfect architecture
- Ask clarifying questions in IMPLEMENTATION_PLAN.md notes if blocked
