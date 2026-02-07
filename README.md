# 🎨 Liquid Memory

> *Where AI meets creativity. Capture, analyze, and recreate visual inspiration.*

[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-latest-black)](https://expo.dev/)

**Liquid Memory** is a cross-platform AI creative studio that helps you capture visual inspiration, extract structured prompts using vision-language models, and manage your creative library with end-to-end encryption.

---

## ✨ Features

### 🖼️ Smart Image Analysis
Upload any image and let AI extract 8-dimensional structured prompts:
- **Subject** - Main focus of the image
- **Environment** - Setting and background
- **Composition** - Framing and layout
- **Lighting** - Light sources and quality
- **Mood** - Atmosphere and feeling
- **Style** - Artistic direction
- **Camera** - Technical settings
- **Color** - Palette and tones

### 📚 Creative Library
Organize your visual inspiration with powerful tools:
- 🔍 Full-text search across prompts and tags
- 🏷️ Multi-dimensional tagging system
- 📊 Visual network of connected concepts
- 💾 Local-first with optional cloud sync

### 🔐 Privacy First
Your creativity belongs to you:
- **Local Storage** - Everything stays on your device by default
- **End-to-End Encryption** - AES-GCM encryption for cloud sync
- **Zero-Knowledge Architecture** - We can't decrypt your data
- **Anonymous Accounts** - No email required

### 📱 Cross-Platform
Seamless experience across all your devices:
- 🌐 **Web App** - Next.js with responsive design
- 📱 **iOS** - Native app with camera integration
- 🤖 **Android** - Material Design with share extensions

---

## 🚀 Quick Start

### Web Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Mobile Application

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Scan QR code with Expo Go app on physical device
```

---

## 🏗️ Architecture

```
Liquid Memory/
├── 📁 app/                    # Next.js App Router
│   ├── api/analyze           # VL API proxy endpoint
│   ├── generate/             # AI image generation
│   ├── library/              # Creative library UI
│   ├── network/              # Visual concept network
│   └── page.tsx              # Landing page
├── 📁 mobile/                 # React Native (Expo)
│   ├── screens/              # Screen components
│   ├── navigation/           # React Navigation
│   ├── lib/                  # Utilities & services
│   └── theme/                # Design tokens
├── 📁 lib/                    # Shared utilities
│   ├── storage.ts            # IndexedDB wrapper
│   ├── auth.ts               # Authentication
│   ├── sync.ts               # Cloud synchronization
│   └── encryption.ts         # E2E encryption
└── 📁 supabase/               # Database schema
    └── migrations/
```

---

## 🛠️ Tech Stack

### Web
| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Visualization | D3.js |
| Storage | IndexedDB + localforage |

### Mobile
| Category | Technology |
|----------|------------|
| Framework | Expo SDK |
| Language | TypeScript |
| Navigation | React Navigation v7 |
| Camera | expo-camera |
| Storage | expo-secure-store |
| Icons | @expo/vector-icons |

### Backend
| Category | Technology |
|----------|------------|
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Anonymous + OAuth) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |

---

## 📋 Development Roadmap

### ✅ Phase 1: Foundation
- [x] Project setup with Next.js + TypeScript
- [x] Database schema design
- [x] Core UI components

### ✅ Phase 2: Intelligence
- [x] VL API integration (Qwen-VL, Kimi)
- [x] Structured prompt editor
- [x] Natural language generation

### ✅ Phase 3: Management
- [x] Creative library with search
- [x] Tag system
- [x] Visual network graph
- [x] Import/export functionality

### ✅ Phase 4: Cloud Sync
- [x] Supabase backend
- [x] Anonymous authentication
- [x] Offline-first sync engine
- [x] End-to-end encryption

### ✅ Phase 5: Mobile
- [x] Expo project setup
- [x] Camera & gallery integration
- [x] Core features port
- [x] Share extension
- [x] Push notifications
- [x] App Store preparation

---

## 🔧 Configuration

### Environment Variables

Create `.env.local` in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# AI APIs
QWEN_API_KEY=your_qwen_key
KIMI_API_KEY=your_kimi_key
```

For mobile, create `mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing mobile development platform
- [Supabase](https://supabase.com/) for the open-source Firebase alternative
- [Vercel](https://vercel.com/) for web deployment and best practices
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

---

<p align="center">
  <strong>Made with 💜 by Gre</strong>
</p>

<p align="center">
  <a href="https://github.com/Mike4Ellis/liquid-memory">GitHub</a> •
  <a href="https://liquidmemory.app">Website</a> •
  <a href="https://twitter.com/liquidmemory">Twitter</a>
</p>
