# OAuth Configuration Summary

## ✅ Current Setup

Your application now supports **Google, GitHub, Apple, and Replit Auth**.

### Google OAuth (OIDC)
- **Status**: ✅ Available
- **Client ID**: `GOOGLE_CLIENT_ID`
- **Issuer**: `https://accounts.google.com`

### GitHub OAuth
- **Status**: ✅ Available
- **Client ID**: `GITHUB_CLIENT_ID`
- **Callback**: `http://localhost:5000/api/callback?provider=github`

### Apple OAuth (OIDC)
- **Status**: ✅ Available
- **Client ID**: `APPLE_CLIENT_ID`
- **Issuer**: `https://appleid.apple.com`

### Replit Auth (Available for deployment)
- **Status**: Available (not active locally)
- **Activation**: Set `REPL_ID` in `.env` or environment variables
- **Use Case**: For deploying to Replit.com

## 📋 Environment Variables

### Current `.env` Configuration:

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

# Replit deployment
# REPL_ID=your-replit-id

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

1. **Application is running on**: `http://localhost:5000`
2. **Callback URL**: `http://localhost:5000/api/callback?provider=<provider>`
3. **Login Route**: `/api/login?provider=<provider>`
4. **Logout Route**: `/api/logout?provider=<provider>`

## 🚀 Switching Between OAuth Providers

### To use Replit Auth instead of Google:

```env
# Comment out or remove these:
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...

# Add this:
REPL_ID=your-replit-project-id
```

### To return to Google Auth:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Comment out:
# REPL_ID=...
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
