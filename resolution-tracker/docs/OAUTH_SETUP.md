# Setting Up OAuth for Local Development

This guide will help you set up Google, GitHub, or Apple OAuth for local development of the Resolution Tracker application.

## Important: Separate OAuth Apps for GitHub

**GitHub only allows ONE callback URL per OAuth app.** You must create separate apps:
- **Development app**: Callback `http://localhost:5000/api/auth/github/callback`
- **Production app**: Callback `https://yourdomain.com/api/auth/github/callback`

Google and Apple support multiple callback URLs, so you can use the same app for both environments.

## Prerequisites

- Local development environment running on `http://localhost:5000`
- OAuth credentials for the provider(s) you plan to use

## Step 1: Create OAuth Credentials

### Google (OIDC) - Supports Multiple Callbacks

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
4. Choose **Web application**
5. Add **Authorized redirect URIs** (can add both):
   - `http://localhost:5000/api/auth/google/callback` (dev)
   - `https://yourdomain.com/api/auth/google/callback` (prod)
6. Copy your **Client ID** and **Client Secret**

### GitHub (OAuth) - ONE Callback Only!

**Create TWO separate OAuth apps:**

**Development App:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new **OAuth App**
3. Set **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
4. Copy the **Client ID** and **Client Secret** for your `.env` file

**Production App:**
1. Create another **OAuth App**
2. Set **Authorization callback URL**: `https://yourdomain.com/api/auth/github/callback`
3. Copy credentials for your production `.env` file

### Apple (OIDC) - Supports Multiple Callbacks

1. Create a **Service ID** in the Apple Developer portal
2. Enable **Sign in with Apple**
3. Add callback URLs (can add both):
   - `http://localhost:5000/api/auth/apple/callback`
   - `https://yourdomain.com/api/auth/apple/callback`
4. Generate a **client secret JWT**

## Step 2: Update Your `.env` File

### Local Development (`.env`)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resolutions

# Session Secret
SESSION_SECRET=your-dev-secret-key-change-in-production

# Google OAuth (can use same credentials as production)
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# GitHub OAuth (use DEVELOPMENT app credentials)
GITHUB_CLIENT_ID=your-github-DEV-client-id
GITHUB_CLIENT_SECRET=your-github-DEV-client-secret

# Apple OAuth (can use same credentials as production)
APPLE_CLIENT_ID=your-apple-service-id-here
APPLE_CLIENT_SECRET=your-apple-client-secret-jwt-here

# Node Environment
NODE_ENV=development
PORT=5000
```

### Production (`.env` on NAS)

```env
# Server
HOST=resolutions.yourdomain.com

# Google OAuth (same as dev, or separate prod app)
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# GitHub OAuth (use PRODUCTION app credentials - different from dev!)
GITHUB_CLIENT_ID=your-github-PROD-client-id
GITHUB_CLIENT_SECRET=your-github-PROD-client-secret

# Apple OAuth (same as dev, or separate prod app)
APPLE_CLIENT_ID=your-apple-service-id-here
APPLE_CLIENT_SECRET=your-apple-client-secret-jwt-here
```

## Step 3: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5000`

3. Click the login button to authenticate with your chosen provider

4. After successful authentication, you should be redirected back to the app

## Troubleshooting

### "Invalid client_id" Error
- Verify credentials match your OAuth app exactly
- Check that you're using the correct app (dev vs prod)

### "Redirect URI mismatch" Error
- Check callback URL matches exactly what's configured in OAuth provider
- GitHub: Must be exact match (no query params)
- Google: `http://localhost:5000/api/auth/google/callback`
- GitHub: `http://localhost:5000/api/auth/github/callback`

### OAuth Not Working Behind Reverse Proxy
- Ensure `HOST` environment variable is set correctly
- Add custom headers in reverse proxy:
  - `X-Forwarded-Proto: https`
  - `X-Forwarded-Host: yourdomain.com`
- Express must have `trust proxy` enabled (already configured)

### HTTPS Required in Production
- Production OAuth requires HTTPS
- Use Synology reverse proxy with Let's Encrypt certificate

## Callback URL Summary

| Provider | Development | Production |
|----------|-------------|------------|
| Google | `http://localhost:5000/api/auth/google/callback` | `https://yourdomain.com/api/auth/google/callback` |
| GitHub | `http://localhost:5000/api/auth/github/callback` | `https://yourdomain.com/api/auth/github/callback` |
| Apple | `http://localhost:5000/api/auth/apple/callback` | `https://yourdomain.com/api/auth/apple/callback` |

## Security Notes

- Never commit your `.env` file with real credentials to git
- Use separate GitHub OAuth apps for dev/prod
- Rotate your OAuth secrets regularly
- Always use HTTPS in production
