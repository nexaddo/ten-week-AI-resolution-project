# Setting Up OAuth for Local Development

This guide will help you set up Google, GitHub, or Apple OAuth for local development of the Resolution Tracker application.

## Prerequisites

- Local development environment running on `http://localhost:5000`
- OAuth credentials for the provider(s) you plan to use

## Step 1: Create OAuth Credentials

### Google (OIDC)

Create a Google Cloud Project and OAuth 2.0 credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable the "Google+ API"

1. Go to **Credentials** in the Google Cloud Console
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Add the following **Authorized redirect URIs**:
   - `http://localhost:5000/api/callback?provider=google`
   - `http://localhost:5000/api/callback` (fallback)
   - Add any other local URLs you'll use for testing

5. Click **Create**
6. You'll see your **Client ID** and **Client Secret** — copy these

### GitHub (OAuth)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new **OAuth App**
3. Set **Authorization callback URL** to:
   - `http://localhost:5000/api/callback?provider=github`
4. Copy the **Client ID** and **Client Secret**

### Apple (OIDC)

1. Create a **Service ID** in the Apple Developer portal
2. Enable **Sign in with Apple** for the Service ID
3. Add the callback URL:
   - `http://localhost:5000/api/callback?provider=apple`
4. Generate a **client secret JWT** for your Service ID

## Step 2: Update Your `.env` File

Create or update your `.env` file with the following:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resolutions

# Session Secret
SESSION_SECRET=your-dev-secret-key-change-in-production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here

# Apple OAuth Configuration
APPLE_CLIENT_ID=your-apple-service-id-here
APPLE_CLIENT_SECRET=your-apple-client-secret-jwt-here

# Node Environment
NODE_ENV=development

# Port
PORT=5000
```

Replace the placeholder values with your provider credentials.

## Step 3: Choose a Default Provider (Optional)

If you configure multiple providers, you can set a default:

```env
DEFAULT_AUTH_PROVIDER=google
```

## Step 4: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5000`

3. Click the login button to authenticate with your chosen provider

4. After successful authentication, you should be redirected back to the app

## Troubleshooting

### "Invalid client_id" Error
- Verify that `CLIENT_ID` matches your Google OAuth credentials exactly
- Check that the redirect URI is registered in Google Cloud Console

### "Redirect URI mismatch" Error
- Make sure `http://localhost:5000/api/callback?provider=<provider>` is added to authorized redirect URIs
- Check that your `localhost` is set up correctly (not `127.0.0.1`)

### HTTPS Required in Production
- In production, change `http://` to `https://` in your callback URLs
- Google OAuth requires HTTPS for production deployments

## Using Different OIDC Providers

To use a different OpenID Connect provider:

1. Update `ISSUER_URL` to your provider's OIDC endpoint (e.g., `https://your-provider.com/.well-known/openid-configuration`)
2. Set `CLIENT_ID` and `CLIENT_SECRET`
3. Use `provider=custom` in the callback URL or set `DEFAULT_AUTH_PROVIDER=custom`

Supported providers:
- Google (`https://accounts.google.com`)
- Apple (`https://appleid.apple.com`)
- Microsoft (`https://login.microsoftonline.com/common`)
- Any standard OpenID Connect provider

## Security Notes

- Never commit your `.env` file with real credentials to git
- Use `.env.local` for local testing (add to `.gitignore`)
- Rotate your OAuth secrets regularly
- In production, use environment variables from your hosting provider
