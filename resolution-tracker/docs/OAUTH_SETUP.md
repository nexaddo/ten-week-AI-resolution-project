# Setting Up Google OAuth for Local Development

This guide will help you set up Google OAuth 2.0 for local development of the Resolution Tracker application.

## Prerequisites

- Google Cloud Project with OAuth 2.0 credentials
- Local development environment running on `http://localhost:5000`

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable the "Google+ API"

## Step 2: Create OAuth 2.0 Credentials

1. Go to **Credentials** in the Google Cloud Console
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Add the following **Authorized redirect URIs**:
   - `http://localhost:5000/api/callback`
   - `http://localhost:5000/auth/callback` (alternative)
   - Add any other local URLs you'll use for testing

5. Click **Create**
6. You'll see your **Client ID** and **Client Secret** — copy these

## Step 3: Update Your `.env` File

Create or update your `.env` file with the following:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resolutions

# Session Secret
SESSION_SECRET=your-dev-secret-key-change-in-production

# Google OAuth Configuration
ISSUER_URL=https://accounts.google.com
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
CLIENT_ID=your-client-id-here

# Node Environment
NODE_ENV=development

# Port
PORT=5000
```

Replace:
- `your-client-id-here` with your OAuth Client ID
- `your-client-secret-here` with your OAuth Client Secret

## Step 4: Update the OIDC Configuration

The application will automatically use Google's OIDC endpoint when you set the `ISSUER_URL` and `CLIENT_ID` environment variables.

## Step 5: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5000`

3. Click the login button to authenticate with Google

4. After successful authentication, you should be redirected back to the app

## Troubleshooting

### "Invalid client_id" Error
- Verify that `CLIENT_ID` matches your Google OAuth credentials exactly
- Check that the redirect URI is registered in Google Cloud Console

### "Redirect URI mismatch" Error
- Make sure `http://localhost:5000/api/callback` is added to authorized redirect URIs
- Check that your `localhost` is set up correctly (not `127.0.0.1`)

### HTTPS Required in Production
- In production, change `http://` to `https://` in your callback URLs
- Google OAuth requires HTTPS for production deployments

## Using Different OIDC Providers

To use a different OpenID Connect provider:

1. Update `ISSUER_URL` to your provider's OIDC endpoint (e.g., `https://your-provider.com/.well-known/openid-configuration`)
2. Set `CLIENT_ID` to your provider's client ID
3. The application will automatically discover the provider's endpoints

Supported providers:
- Google (`https://accounts.google.com`)
- Microsoft (`https://login.microsoftonline.com/common`)
- GitHub (via `https://github.com/login/oauth`)
- Any standard OpenID Connect provider

## Security Notes

- Never commit your `.env` file with real credentials to git
- Use `.env.local` for local testing (add to `.gitignore`)
- Rotate your OAuth secrets regularly
- In production, use environment variables from your hosting provider
