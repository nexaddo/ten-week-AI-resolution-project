# 10-Week AI Resolution Project

[![CI/CD Pipeline](https://github.com/nexaddo/ten-week-AI-resolution-project/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/nexaddo/ten-week-AI-resolution-project/actions/workflows/ci-cd.yml)
[![Coverage](https://img.shields.io/badge/coverage-report-blue)](https://nexaddo.github.io/ten-week-AI-resolution-project/)

This repository contains the Resolution Tracker application built as part of the
[10-week AI New Year Bootcamp](https://aidbnewyear.com/program).

## 📁 Project Structure

```
ten-week-AI-resolution-project/
├── .devcontainer/               # VS Code dev container config
├── .github/                     # GitHub workflows and copilot instructions
├── resolution-tracker/          # Main application
│   ├── client/                  # React frontend
│   ├── server/                  # Express backend
│   ├── shared/                  # Shared types and schemas
│   ├── script/                  # Utility scripts
│   ├── docs/                    # 📚 Documentation
│   ├── migrations/              # Database migrations
│   ├── docker-compose.yml       # Docker orchestration
│   ├── Dockerfile               # Container image
│   └── README.md                # Application README
├── .markdownlintrc.json         # Markdown linting rules
└── README.md                    # This file
```

## 🚀 Quick Start

### Using VS Code Dev Container (Recommended)

```bash
# Prerequisites: Docker Desktop + VS Code + Dev Containers extension
# 1. Open folder in VS Code
# 2. Click "Reopen in Container" popup
# 3. Wait 2-3 minutes for setup
# 4. Application ready at http://localhost:5173
```

See [.devcontainer/README.md](.devcontainer/README.md) for detailed instructions.

### Local Development

```bash
cd resolution-tracker
npm install
npm run dev
```

Access the application:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Database: localhost:5432

See [resolution-tracker/README.md](resolution-tracker/README.md) for detailed instructions.

## 📚 Documentation

All documentation is located in [`resolution-tracker/docs/`](resolution-tracker/docs/):

### Getting Started

- **[Documentation Index](resolution-tracker/docs/README.md)** - Start here!
- **[Local Setup](resolution-tracker/docs/SETUP_LOCAL.md)** - Development environment
- **[Dev Container Setup](.devcontainer/README.md)** - Recommended setup with Docker
- **[OAuth Setup](resolution-tracker/docs/OAUTH_SETUP.md)** - Authentication config
- **[Architecture](resolution-tracker/docs/ARCHITECTURE.md)** - System overview

### Deployment

- **[Quick Deploy](resolution-tracker/docs/DEPLOY_QUICK_START.md)** - 5-minute deployment
- **[Synology NAS](resolution-tracker/docs/SYNOLOGY_DEPLOYMENT.md)** - Full deployment guide
- **[Checklist](resolution-tracker/docs/DEPLOYMENT_CHECKLIST.md)** - Verification steps

### Database

- **[Migrations](resolution-tracker/docs/MIGRATIONS_GUIDE.md)** - Schema management
- **[Backups](resolution-tracker/docs/DATABASE_BACKUP.md)** - Backup procedures

## 📱 Resolution Tracker

The Resolution Tracker is a full-stack web application for tracking New Year's resolutions with
AI-powered insights.

### Live Reports

- **[Test Coverage Report](https://nexaddo.github.io/ten-week-AI-resolution-project/)** - Detailed
  code coverage metrics published to GitHub Pages

### ✨ Features

- 📊 Resolution tracking with milestones and check-ins
- 🤖 AI-powered insights using Claude, GPT, and Gemini
- 🧪 Prompt Playground for comparing AI model responses
- 📈 Analytics dashboard with progress visualization
- 👥 User roles (admin and standard users)
- 🔐 OAuth authentication (Google, GitHub, Apple)
- 🌓 Light/dark mode support
- 📱 Responsive design for mobile and desktop
- 🐳 Docker deployment with automated CI/CD

## 🛠️ Tech Stack

**Frontend:**

- React 18, TypeScript, Tailwind CSS, shadcn/ui, Wouter routing

**Backend:**

- Node.js, Express, TypeScript, PostgreSQL, Drizzle ORM

**AI Models:**

- Anthropic Claude, OpenAI GPT, Google Gemini

**Authentication:**

- OAuth 2.0 (Google, GitHub, Apple)

**DevOps:**

- Docker, Docker Compose, GitHub Actions CI/CD

## 📅 Progress

- **Week 1** ✅ Basic resolution tracking + OAuth authentication
- **Week 2** ✅ AI model integration + Prompt Playground
- **Week 3** ✅ Analytics dashboard + AI performance tracking
- **Week 4-10** Coming soon...

## 🗂️ Repository Organization

This monorepo contains:

- Main application in `resolution-tracker/`
- Documentation in `resolution-tracker/docs/`
- Dev container configuration in `.devcontainer/`
- Scripts for development and deployment
- Docker configuration for containerized deployment
- GitHub workflows for CI/CD automation

## 📖 Getting Started by Role

### For Local Development

1. Start with [.devcontainer/README.md](.devcontainer/README.md) for easy setup
2. Or follow [resolution-tracker/README.md](resolution-tracker/README.md) for manual setup
3. Review [Architecture](resolution-tracker/docs/ARCHITECTURE.md) for code overview
4. Check [Copilot Instructions](.github/copilot-instructions.md) for development guidelines

### For Production Deployment

1. Read [Quick Deploy](resolution-tracker/docs/DEPLOY_QUICK_START.md)
2. Follow [Synology Guide](resolution-tracker/docs/SYNOLOGY_DEPLOYMENT.md)
3. Use [Checklist](resolution-tracker/docs/DEPLOYMENT_CHECKLIST.md)

### For Database Management

1. Learn [Migrations](resolution-tracker/docs/MIGRATIONS_GUIDE.md)
2. Setup [Backups](resolution-tracker/docs/DATABASE_BACKUP.md)

## 🤝 Contributing

This is a personal learning project, but suggestions and contributions are welcome!

## 📝 License

MIT

## 🙏 Acknowledgments

- [AI New Year Bootcamp](https://aidbnewyear.com/program) - Project inspiration
- [Anthropic](https://anthropic.com), [OpenAI](https://openai.com),
  [Google AI](https://ai.google.dev) - AI models
- [shadcn/ui](https://ui.shadcn.com/) - UI components

---

**Main Application:** [resolution-tracker/](resolution-tracker/)

**Documentation:** [resolution-tracker/docs/](resolution-tracker/docs/)

**Dev Container:** [.devcontainer/](.devcontainer/)

**Get Started:** [.devcontainer/README.md](.devcontainer/README.md)
