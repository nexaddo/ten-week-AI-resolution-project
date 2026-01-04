# OAuth Configuration Summary

## ✅ Current Setup

Your application now supports **both Replit Auth and Google Auth**!

### Google OAuth (Currently Active)
- **Status**: ✅ Enabled and running
- **Client ID**: Configured in `.env`
- **ISSUER_URL**: `https://accounts.google.com`
- **Server**: Running on `http://localhost:5000`

### Replit Auth (Available for deployment)
- **Status**: Available (not active locally)
- **Activation**: Set `REPL_ID` in `.env` or environment variables
- **Use Case**: For deploying to Replit.com

## 📋 Environment Variables

### Current `.env` Configuration:

```env
# Google OAuth
ISSUER_URL=https://accounts.google.com
CLIENT_ID=your-client-id-here
CLIENT_SECRET=your-client-secret-here

# For Replit deployment, use instead:
# REPL_ID=your-replit-id

# Required for both:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resolutions
SESSION_SECRET=dev-session-secret-change-in-production
```

## 🔄 How It Works

The application automatically detects which OAuth provider to use:

1. **Google OAuth** is used if:
   - `CLIENT_ID` and `CLIENT_SECRET` are set
   - `ISSUER_URL` is set to `https://accounts.google.com`

2. **Replit Auth** is used if:
   - `REPL_ID` is set
   - `CLIENT_ID` is NOT set

3. **Development Mode** (no OAuth) if:
   - Neither `CLIENT_ID` nor `REPL_ID` are set

## 🧪 Testing OAuth Locally

1. **Application is running on**: `http://localhost:5000`
2. **Callback URL**: `http://localhost:5000/api/callback`
3. **Login Route**: `/api/login`
4. **Logout Route**: `/api/logout`

## 🚀 Switching Between OAuth Providers

### To use Replit Auth instead of Google:

```env
# Comment out or remove these:
# CLIENT_ID=...
# CLIENT_SECRET=...
# ISSUER_URL=...

# Add this:
REPL_ID=your-replit-project-id
```

### To return to Google Auth:

```env
ISSUER_URL=https://accounts.google.com
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret

# Comment out:
# REPL_ID=...
```

## 📝 Important Notes

⚠️ **Security**: The `.env` file contains sensitive credentials:
- **Never commit** `.env` to Git
- **Never share** `CLIENT_SECRET` publicly
- For production, use secure environment variable management

## 🔧 Adding New OIDC Providers

To add support for other OIDC providers (Microsoft, GitHub, etc.):

1. Set `ISSUER_URL` to your provider's OIDC discovery endpoint
2. Set `CLIENT_ID` and `CLIENT_SECRET`
3. Add the callback URL to your provider's configuration
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
