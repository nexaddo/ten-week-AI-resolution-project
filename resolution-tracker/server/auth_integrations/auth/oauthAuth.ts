import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import { Strategy as GitHubStrategy, type Profile as GitHubProfile } from "passport-github2";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import rateLimit from "express-rate-limit";
import { doubleCsrf } from "csrf-csrf";

const sessionTtlMs = 7 * 24 * 60 * 60 * 1000; // 1 week
const sessionTtlSeconds = Math.floor(sessionTtlMs / 1000);

type OidcProvider = "google" | "apple" | "custom";
type OAuthProvider = OidcProvider | "github";

const legacyIssuerUrl = process.env.ISSUER_URL;
const legacyClientId = process.env.CLIENT_ID;
const legacyClientSecret = process.env.CLIENT_SECRET;

function resolveLegacyProvider(): OidcProvider | null {
  if (!legacyClientId) {
    return null;
  }

  if (legacyIssuerUrl === "https://accounts.google.com") {
    return "google";
  }

  if (legacyIssuerUrl === "https://appleid.apple.com") {
    return "apple";
  }

  if (legacyIssuerUrl) {
    return "custom";
  }

  return null;
}

function isOidcProvider(provider: OAuthProvider): provider is OidcProvider {
  return provider !== "github";
}

type OidcProviderConfig = {
  issuerUrl?: string;
  clientId?: string;
  clientSecret?: string;
  label: string;
  requiresSecret: boolean;
  scopes?: string;
  accessTypeOffline?: boolean;
};

function getOidcProviderConfig(provider: OidcProvider): OidcProviderConfig {
  const legacyProvider = resolveLegacyProvider();

  switch (provider) {
    case "google":
      return {
        issuerUrl: "https://accounts.google.com",
        clientId:
          process.env.GOOGLE_CLIENT_ID ||
          (legacyProvider === "google" ? legacyClientId : undefined),
        clientSecret:
          process.env.GOOGLE_CLIENT_SECRET ||
          (legacyProvider === "google" ? legacyClientSecret : undefined),
        label: "Google",
        requiresSecret: true,
        scopes: "openid email profile",
        accessTypeOffline: true,
      };
    case "apple":
      return {
        issuerUrl: "https://appleid.apple.com",
        clientId:
          process.env.APPLE_CLIENT_ID ||
          (legacyProvider === "apple" ? legacyClientId : undefined),
        clientSecret:
          process.env.APPLE_CLIENT_SECRET ||
          (legacyProvider === "apple" ? legacyClientSecret : undefined),
        label: "Apple",
        requiresSecret: true,
        scopes: "openid email name",
      };
    case "custom":
      return {
        issuerUrl: legacyProvider === "custom" ? legacyIssuerUrl : undefined,
        clientId: legacyProvider === "custom" ? legacyClientId : undefined,
        clientSecret: legacyProvider === "custom" ? legacyClientSecret : undefined,
        label: "Custom",
        requiresSecret: true,
        scopes: "openid email profile offline_access",
      };
  }
}

function isOidcProviderConfigured(provider: OidcProvider): boolean {
  const config = getOidcProviderConfig(provider);
  if (!config.clientId || !config.issuerUrl) {
    return false;
  }

  if (config.requiresSecret && !config.clientSecret) {
    return false;
  }

  return true;
}

function getConfiguredProviders(): Set<OAuthProvider> {
  const providers = new Set<OAuthProvider>();

  (['google', 'apple', 'custom'] as OidcProvider[]).forEach((provider) => {
    if (isOidcProviderConfigured(provider)) {
      providers.add(provider);
    }
  });

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.add("github");
  }

  return providers;
}

function resolveProvider(input?: unknown): OAuthProvider | null {
  const raw = Array.isArray(input)
    ? input[0]
    : typeof input === "string"
      ? input
      : null;
  const normalized = raw?.toLowerCase();

  if (normalized === "google" || normalized === "apple" || normalized === "custom" || normalized === "github") {
    return normalized;
  }

  const configured = getConfiguredProviders();
  const preferred = process.env.DEFAULT_AUTH_PROVIDER?.toLowerCase();
  if (preferred && configured.has(preferred as OAuthProvider)) {
    return preferred as OAuthProvider;
  }

  if (configured.has("google")) return "google";
  if (configured.has("apple")) return "apple";
  if (configured.has("github")) return "github";
  if (configured.has("custom")) return "custom";

  return null;
}

const getOidcConfig = memoize(
  async (provider: OidcProvider) => {
    const providerConfig = getOidcProviderConfig(provider);

    if (!providerConfig.clientId) {
      return null;
    }

    if (!providerConfig.issuerUrl) {
      console.error(`❌ ISSUER_URL not set for ${providerConfig.label} OAuth.`);
      return null;
    }

    if (providerConfig.requiresSecret && !providerConfig.clientSecret) {
      console.error(`❌ CLIENT_SECRET not set for ${providerConfig.label} OAuth.`);
      return null;
    }

    try {
      console.log(`🔐 Using ${providerConfig.label} OAuth`);
      return await client.discovery(
        new URL(providerConfig.issuerUrl),
        providerConfig.clientId,
        providerConfig.clientSecret
      );
    } catch (error) {
      console.error(`❌ Failed to discover OIDC configuration from ${providerConfig.issuerUrl}:`, error);
      return null;
    }
  },
  {
    maxAge: 3600 * 1000,
    normalizer: (args) => args[0],
  }
);

export function getSession(): RequestHandler {
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtlMs,
    tableName: "sessions",
  });
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtlMs,
    },
  });

  return sessionMiddleware;
}

type UserClaims = {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  first_name?: string;
  last_name?: string;
  picture?: string;
  profile_image_url?: string;
  exp?: number;
  [key: string]: unknown;
};

function updateUserSession(
  user: any,
  claims: UserClaims,
  accessToken?: string,
  refreshToken?: string,
  provider?: OAuthProvider
) {
  user.claims = claims;
  user.access_token = accessToken;
  user.refresh_token = refreshToken;
  user.expires_at = claims?.exp ?? Math.floor(Date.now() / 1000) + sessionTtlSeconds;
  user.auth_provider = provider;
}

function splitName(name?: string): { firstName?: string; lastName?: string } {
  if (!name) {
    return {};
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0] };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function extractUserFromClaims(claims: UserClaims) {
  const nameParts = splitName(claims.name);

  return {
    id: claims.sub!,
    email: claims.email,
    firstName: claims.first_name || claims.given_name || nameParts.firstName,
    lastName: claims.last_name || claims.family_name || nameParts.lastName,
    profileImageUrl: claims.profile_image_url || claims.picture,
  };
}

async function upsertUser(claims: UserClaims) {
  if (!claims.sub) {
    return;
  }

  await authStorage.upsertUser(extractUserFromClaims(claims));
}

function buildGithubClaims(profile: GitHubProfile): UserClaims {
  const primaryEmail = profile.emails?.[0]?.value;
  const displayName = profile.displayName || profile.username || "";
  const nameParts = splitName(displayName);

  return {
    sub: `github:${profile.id}`,
    email: primaryEmail,
    name: displayName,
    given_name: nameParts.firstName,
    family_name: nameParts.lastName,
    picture: profile.photos?.[0]?.value,
  };
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Add CSRF protection for session cookies
  const { doubleCsrfProtection } = doubleCsrf({
    getSecret: () => process.env.SESSION_SECRET || "default-csrf-secret-change-in-production",
    getSessionIdentifier: (req) => req.session?.id || "",
    cookieName: "__Host-psifi.x-csrf-token",
    cookieOptions: {
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
    size: 64,
    ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  });

  // Apply CSRF protection to all routes
  app.use(doubleCsrfProtection);

  app.use(passport.initialize());
  app.use(passport.session());

  const configuredProviders = getConfiguredProviders();

  // Skip OAuth setup if credentials are not configured
  if (configuredProviders.size === 0) {
    console.log("ℹ️  Running in development mode without OAuth authentication");
    return;
  }

  console.log("✅ OAuth authentication enabled");

  const createVerifyOidc = (provider: OidcProvider): VerifyFunction =>
    async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user = {};
      const claims = tokens.claims() as UserClaims;
      updateUserSession(user, claims, tokens.access_token, tokens.refresh_token, provider);
      await upsertUser(claims);
      verified(null, user);
    };

  const verifyGithub = async (
    accessToken: string,
    _refreshToken: string,
    profile: GitHubProfile,
    done: passport.AuthenticateCallback
  ) => {
    const user = {};
    const claims = buildGithubClaims(profile);
    updateUserSession(user, claims, accessToken, undefined, "github");
    await upsertUser(claims);
    done(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  const getCallbackURL = (req: any, provider: OAuthProvider) => {
    const domain = req.hostname;
    const port = req.get("host");
    const isLocalhost = domain === "localhost" || domain === "127.0.0.1";
    const protocol = isLocalhost ? "http" : "https";

    if (provider === "github") {
      return `${protocol}://${port}/api/callback/github`;
    }

    return `${protocol}://${port}/api/callback?provider=${provider}`;
  };

  const ensureOidcStrategy = async (req: any, provider: OidcProvider) => {
    const config = await getOidcConfig(provider);
    if (!config) {
      return null;
    }

    const strategyName = `oidc:${provider}:${req.hostname}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          callbackURL: getCallbackURL(req, provider),
        },
        createVerifyOidc(provider)
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
      console.log(`✓ Strategy registered: ${strategyName}`);
    }

    return strategyName;
  };

  const ensureGithubStrategy = (req: any) => {
    const strategyName = `github:${req.hostname}`;
    if (!registeredStrategies.has(strategyName)) {
      const callbackURL = getCallbackURL(req, "github");
      const strategy = new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
          callbackURL,
        },
        verifyGithub
      );
      passport.use(strategyName, strategy);
      registeredStrategies.add(strategyName);
      console.log(`✓ Strategy registered: ${strategyName}`);
    }

    return strategyName;
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Rate limiter for authentication routes to prevent brute force attacks
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // strict limit for auth endpoints
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many authentication attempts, please try again later.",
  });

  app.get("/api/login", authLimiter, async (req, res, next) => {
    const provider = resolveProvider(req.query.provider);
    if (!provider) {
      return res.status(400).json({ message: "No OAuth providers configured." });
    }

    if (provider === "github") {
      const strategyName = ensureGithubStrategy(req);
      return passport.authenticate(strategyName, {
        scope: ["read:user", "user:email"],
      })(req, res, next);
    }

    const strategyName = await ensureOidcStrategy(req, provider);
    if (!strategyName) {
      return res.status(400).json({ message: `${provider} OAuth is not configured.` });
    }

    const providerConfig = getOidcProviderConfig(provider);
    const authOptions: any = {
      prompt: "login consent",
      scope: (providerConfig.scopes || "openid email profile").split(" "),
    };
    if (providerConfig.accessTypeOffline) {
      authOptions.access_type = "offline";
    }

    return passport.authenticate(strategyName, authOptions)(req, res, next);
  });

  app.get("/api/callback/github", authLimiter, (req, res, next) => {
    const strategyName = ensureGithubStrategy(req);
    return passport.authenticate(strategyName, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login?provider=github",
    })(req, res, next);
  });

  app.get("/api/callback", authLimiter, async (req, res, next) => {
    const provider = resolveProvider(req.query.provider);
    if (!provider) {
      return res.redirect("/api/login");
    }

    if (provider === "github") {
      return res.redirect("/api/callback/github");
    }

    const strategyName = await ensureOidcStrategy(req, provider);
    if (!strategyName) {
      return res.redirect("/api/login");
    }

    return passport.authenticate(strategyName, {
      successReturnToOrRedirect: "/",
      failureRedirect: `/api/login?provider=${provider}`,
    })(req, res, next);
  });

  app.get("/api/logout", authLimiter, async (req, res) => {
    const provider = resolveProvider(req.query.provider);
    req.logout(async () => {
      if (!provider || provider === "github") {
        return res.redirect("/");
      }

      const config = await getOidcConfig(provider);
      if (!config) {
        return res.redirect("/");
      }

      const providerConfig = getOidcProviderConfig(provider);
      const clientId = providerConfig.clientId;
      if (!clientId) {
        return res.redirect("/");
      }

      try {
        return res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: clientId,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      } catch (error) {
        return res.redirect("/");
      }
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // If OAuth is not configured, provide a mock user for development mode
  if (getConfiguredProviders().size === 0) {
    // Create a mock user object for development
    req.user = {
      claims: {
        sub: process.env.DEV_USER_ID || "dev-user",
        email: process.env.DEV_USER_EMAIL || "dev@localhost",
        name: "Development User",
        given_name: "Development",
        family_name: "User",
      },
      access_token: "dev-token",
      expires_at: Math.floor(Date.now() / 1000) + sessionTtlSeconds,
      auth_provider: "development",
    } as any;
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const provider = user.auth_provider as OAuthProvider | undefined;
  if (!provider || !isOidcProvider(provider)) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig(provider);
    if (!config) {
      return next();
    }
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse.claims() as UserClaims, tokenResponse.access_token, tokenResponse.refresh_token, provider);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
