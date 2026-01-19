# Resolution Tracker

A full-stack TypeScript application for tracking New Year's resolutions with AI-powered insights. Built with React, Express, PostgreSQL, and integrated with multiple AI models (Claude, GPT, Gemini) for intelligent progress analysis.

## ✨ Features

- 📊 **Resolution Management** - Create, track, and manage your goals
- 📝 **Check-ins** - Log progress with detailed notes
- 🤖 **AI-Powered Insights** - Multi-model analysis (Claude, GPT, Gemini)
- 📈 **Progress Analytics** - Visualize your journey with charts
- 🧪 **Prompt Playground** - Test and compare AI model outputs
- 📊 **AI Analytics Dashboard** - Compare model performance and costs
- 🔐 **OAuth Authentication** - Google, GitHub, Apple sign-in
- 📱 **Responsive Design** - Works on desktop and mobile
- 🌓 **Dark Mode** - Easy on the eyes

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

Access at `http://localhost:5000`

For detailed local setup, see [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md)

### Deploy to Synology NAS

```bash
# Build application
npm run build

# Deploy with Docker Compose
# See quick start guide for full commands
```

See [docs/DEPLOY_QUICK_START.md](docs/DEPLOY_QUICK_START.md) for deployment instructions.

## 📚 Documentation

### Getting Started
- **[Local Setup](docs/SETUP_LOCAL.md)** - Set up development environment
- **[OAuth Setup](docs/OAUTH_SETUP.md)** - Configure authentication providers
- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and structure

### Deployment
- **[Quick Start Deployment](docs/DEPLOY_QUICK_START.md)** - Deploy in 5 minutes
- **[Synology NAS Guide](docs/SYNOLOGY_DEPLOYMENT.md)** - Complete deployment guide
- **[Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)** - Pre/post deployment steps

### Database
- **[Migrations Guide](docs/MIGRATIONS_GUIDE.md)** - Database schema management
- **[Database Backup](docs/DATABASE_BACKUP.md)** - Backup and restore procedures

### Development
- **[Design Guidelines](docs/design_guidelines.md)** - UI/UX standards
- **[OAuth Configuration](docs/OAUTH_CONFIG_SUMMARY.md)** - OAuth implementation details

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Wouter** - Client-side routing
- **TanStack Query** - Server state management
- **Recharts** - Data visualization
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Drizzle ORM** - Database toolkit
- **Zod** - Schema validation

### AI Integration
- **Anthropic Claude** - Sonnet 4.5
- **OpenAI GPT** - GPT-4o
- **Google Gemini** - Gemini Pro

### Authentication
- **Replit Auth** - OAuth provider
- **Express Session** - Session management

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **tsx** - TypeScript execution

## 📦 Project Structure

```
resolution-tracker/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and helpers
│   └── index.html
├── server/              # Express backend
│   ├── ai/              # AI service layer
│   │   ├── providers/   # AI model integrations
│   │   ├── orchestrator.ts
│   │   └── promptTester.ts
│   ├── replit_integrations/  # OAuth authentication
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data access layer
│   └── index.ts         # Server entry point
├── shared/              # Shared code
│   ├── schema.ts        # Database schema (Drizzle)
│   └── models/          # Type definitions
├── script/              # Utility scripts
│   ├── dev.ts           # Development server
│   ├── build.ts         # Production build
│   ├── migrate.ts       # Database migrations
│   ├── backup-db.ts     # Database backup
│   ├── restore-db.ts    # Database restore
│   └── seed-data.ts     # Sample data seeding
├── docs/                # Documentation
├── docker-compose.yml   # Docker orchestration
├── Dockerfile           # Container image
└── drizzle.config.ts    # ORM configuration
```

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts
- `sessions` - Authentication sessions
- `resolutions` - User goals
- `milestones` - Resolution checkpoints
- `check_ins` - Progress updates

### AI Tables
- `ai_insights` - AI-generated analysis
- `ai_model_usage` - Performance metrics
- `prompt_tests` - Prompt experiments
- `prompt_test_results` - Model comparison data

## 🔑 Environment Variables

Required for local development:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/resolutions

# Server
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-session-secret

# OAuth (Replit Auth)
REPLIT_AUTH_DOMAIN=https://auth.replit.com
REPLIT_CLIENT_ID=your-client-id
REPLIT_CLIENT_SECRET=your-client-secret

# AI Models
ANTHROPIC_API_KEY=sk-ant-your-key
OPENAI_API_KEY=sk-your-key
GOOGLE_AI_API_KEY=your-key

# AI Configuration
AI_STRATEGY=all  # all, rotate, or single
AI_ENABLE_ANALYSIS=true
```

See [.env.example](.env.example) for all options.

## 📜 Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run check        # TypeScript type checking
```

### Build
```bash
npm run build        # Build for production
npm start            # Start production server
```

### Database
```bash
npm run db:push              # Safe schema push (with backup)
npm run db:push:unsafe       # Direct schema push
npm run db:migrate:generate  # Generate migration files
npm run db:migrate           # Run migrations
npm run db:backup            # Backup database
npm run db:restore           # Restore from backup
npm run db:seed              # Seed sample data
```

### Docker
```bash
npm run docker:up       # Start containers
npm run docker:down     # Stop containers
npm run docker:logs     # View logs
npm run docker:rebuild  # Rebuild and restart
```

## 🤖 AI Features

### Check-in Analysis
When you create a check-in, all three AI models analyze your progress:
- **Insight** - Understanding of your current state
- **Suggestion** - Actionable next steps
- **Sentiment** - Emotional tone analysis

### Prompt Playground
Test custom prompts across all models:
- Side-by-side comparison
- Performance metrics (latency, tokens, cost)
- Rating system (1-5 stars)
- Previous test history

### AI Analytics Dashboard
Compare model performance:
- Response time charts
- Cost distribution
- Token usage
- Success rates
- Model-specific insights

## 🔒 Security

- OAuth 2.0 authentication
- Session-based authorization
- User-scoped data access
- Environment variable secrets
- Rate limiting on API endpoints
- Database foreign key constraints
- Input validation with Zod

## 🧪 Testing

The application includes:
- TypeScript type checking (`npm run check`)
- Health check endpoint (`/api/health`)
- Database connectivity checks
- AI provider initialization tests

## 📊 Performance

- Async AI analysis (non-blocking)
- Real-time polling for results
- Database connection pooling
- Optimized Docker images (Alpine Linux)
- Built-in health checks

## 🤝 Contributing

This is a personal project for the 10-week AI New Year Bootcamp, but suggestions and improvements are welcome!

## 📝 License

MIT

## 🙏 Acknowledgments

- Built as part of the [AI New Year Bootcamp](https://aidbnewyear.com/program)
- Uses [Replit Auth](https://replit.com) for authentication
- Powered by Anthropic Claude, OpenAI GPT, and Google Gemini
- UI components from [shadcn/ui](https://ui.shadcn.com/)

## 📞 Support

- Check the [documentation](docs/)
- Review [deployment checklist](docs/DEPLOYMENT_CHECKLIST.md)
- Check server logs for errors
- Verify environment variables

## 🗺️ Roadmap

Week 1: ✅ Basic resolution tracking + OAuth
Week 2: ✅ AI model integration + Prompt Playground
Week 3-10: More features coming!

---

Built with ❤️ for the 10-week AI resolution challenge
