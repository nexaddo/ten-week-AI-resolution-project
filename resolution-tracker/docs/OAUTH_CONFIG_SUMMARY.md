# OAuth Configuration Summary

## ✅ Current Setup

Your application now supports **Google, GitHub, and Apple Auth**.

### Google OAuth (OIDC)

- **Status**: ✅ Available
- **Client ID**: `GOOGLE_CLIENT_ID`
- **Issuer**: `https://accounts.google.com`
- **Callback**: `/api/callback?provider=google`

### GitHub OAuth

- **Status**: ✅ Available
- **Client ID**: `GITHUB_CLIENT_ID`
- **Callback**: `/api/callback/github`

### Apple OAuth (OIDC)

- **Status**: ✅ Available
- **Client ID**: `APPLE_CLIENT_ID`
- **Issuer**: `https://appleid.apple.com`
- **Callback**: `/api/callback?provider=apple`

## 📋 Environment Variables

### Current `.env` Configuration

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here

# Apple OAuth
APPLE_CLIENT_ID=your-apple-service-id-here
APPLE_CLIENT_SECRET=your-apple-client-secret-jwt-here

# Optional default provider
# DEFAULT_AUTH_PROVIDER=google

# Required for all:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resolutions
SESSION_SECRET=dev-session-secret-change-in-production
```

## 🔄 How It Works

The application automatically detects which OAuth provider(s) are available and
uses the `provider` query param or `DEFAULT_AUTH_PROVIDER` to choose one.

## 🧪 Testing OAuth Locally

1. **Direct dev** (`npm run dev`): app on `http://localhost:5000`
2. **Docker dev** (`docker compose up`): app on `http://localhost:5002` (mapped to 5000 inside)
3. **Callback URLs** (use the port matching your setup):
   - Google: `http://localhost:<port>/api/callback?provider=google`
   - GitHub: `http://localhost:<port>/api/callback/github`
   - Apple: `http://localhost:<port>/api/callback?provider=apple`
4. **Login Route**: `/api/login?provider=<provider>`
5. **Logout Route**: `/api/logout?provider=<provider>`

## 🚀 Switching Between OAuth Providers

### To use only Google

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Comment out others:
# GITHUB_CLIENT_ID=...
# GITHUB_CLIENT_SECRET=...
```

### To use only GitHub

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Comment out others:
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
```

## 📝 Important Notes

⚠️ **Security**: The `.env` file contains sensitive credentials:

- **Never commit** `.env` to Git
- **Never share** `CLIENT_SECRET` publicly
- For production, use secure environment variable management

## 🔧 Adding New OIDC Providers

To add support for other OIDC providers (Microsoft, etc.):

1. Set `ISSUER_URL` to your provider's OIDC discovery endpoint
2. Set `CLIENT_ID` and `CLIENT_SECRET`
3. Use `provider=custom` in the callback URL or set `DEFAULT_AUTH_PROVIDER=custom`
4. The app will automatically discover and use the provider

Example:

```env
ISSUER_URL=https://login.microsoftonline.com/common
CLIENT_ID=your-microsoft-client-id
CLIENT_SECRET=your-microsoft-secret
```

## ✨ Features

- ✅ Automatic provider detection
- ✅ Session management with PostgreSQL
- ✅ Token refresh support
- ✅ Development mode without OAuth
- ✅ Multi-provider support
- ✅ Secure cookie-based sessions
- ✅ Docker/reverse-proxy support via `HOST` env var
