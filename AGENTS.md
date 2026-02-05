# AGENTS.md - Build Instructions for Liquid Memory

## Project Overview
- **Name**: Liquid Memory (AIGC 创意工坊)
- **Tech Stack**: Next.js 14 + TypeScript + Tailwind CSS + Zustand + IndexedDB
- **Repository**: https://github.com/Mike4Ellis/liquid-memory

## Development Environment Setup

### Initial Setup
```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

### Backpressure Commands (Run after each change)
```bash
# TypeScript type checking
npm run typecheck

# Linting
npm run lint

# Build verification
npm run build
```

## Git Configuration
- **Author Name**: Gremins
- **Commit Style**: Conventional Commits
- **Branch**: master (main development branch)

## Project Structure
```
app/                 # Next.js App Router pages
components/          # React components
lib/                 # Utilities and helpers
stores/              # Zustand state stores
public/              # Static assets
agents/              # PRD and planning files
```

## Key Dependencies
- next: ^14.x
- react: ^18.x
- typescript: ^5.x
- tailwindcss: ^3.x
- zustand: ^4.x
- localforage: ^1.x
- framer-motion: ^10.x
- d3: ^7.x
- lucide-react: ^0.x

## Operational Learnings
(Add notes here as we discover things during development)

### US-001: Project Initialization
- Use `npx create-next-app@latest` with App Router
- Configure Tailwind with custom color tokens from PRD
- Set up dark mode as default (Liquid Memory theme)

### US-002: Backend API Proxy
- Create `app/api/analyze/route.ts` for VL API proxy
- Store API keys in `.env.local` (never commit)
- Support both Qwen3-VL and Kimi-k2.5 models

### US-003: File Storage
- Use File System Access API when available
- Fallback to IndexedDB for thumbnails
- Original images stored in user-selected directory

## Common Issues & Solutions
(To be filled as we encounter issues)
