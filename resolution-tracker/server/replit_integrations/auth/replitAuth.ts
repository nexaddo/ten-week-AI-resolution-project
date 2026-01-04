import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    // Detect which OAuth provider is configured
    const hasReplitConfig = process.env.REPL_ID && !process.env.CLIENT_ID;
    const hasGoogleConfig = process.env.CLIENT_ID && process.env.CLIENT_SECRET;
    
    let issuerUrl = process.env.ISSUER_URL;
    let clientId = process.env.CLIENT_ID || process.env.REPL_ID;
    
    // Auto-detect issuer URL based on configuration
    if (!issuerUrl) {
      if (hasGoogleConfig) {
        issuerUrl = "https://accounts.google.com";
        console.log("🔐 Using Google OAuth");
      } else if (hasReplitConfig) {
        issuerUrl = "https://replit.com/oidc";
        console.log("🔐 Using Replit OAuth");
      }
    }
    
    // Return early if client ID is not set (development mode without OAuth)
    if (!clientId) {
      console.warn("⚠️  No OAuth configuration found - authentication disabled.");
      console.info("💡 To enable OAuth:");
      console.info("   - For Google Auth: Set CLIENT_ID, CLIENT_SECRET, and ISSUER_URL in .env");
      console.info("   - For Replit Auth: Set REPL_ID in .env");
      console.info("   - See OAUTH_SETUP.md for detailed instructions");
      return null;
    }
    
    if (!issuerUrl) {
      console.error("❌ ISSUER_URL not set. Please configure your OAuth provider.");
      return null;
    }
    
    try {
      return await client.discovery(
        new URL(issuerUrl),
        clientId
      );
    } catch (error) {
      console.error(`❌ Failed to discover OIDC configuration from ${issuerUrl}:`, error);
      return null;
    }
  },
  { maxAge: 3600 * 1000 }
);

export function getSession(): RequestHandler {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });

  return sessionMiddleware;
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  // Skip OAuth setup if credentials are not configured
  if (!config) {
    console.log("ℹ️  Running in development mode without OAuth authentication");
    return;
  }

  console.log("✅ OAuth authentication enabled");

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (req: any) => {
    const domain = req.hostname;
    const protocol = req.protocol; // will be http or https
    const port = req.get('host'); // includes port if not default
    
    // Construct callback URL: for localhost use http, for others use https
    let callbackURL: string;
    if (domain === 'localhost' || domain === '127.0.0.1') {
      // Local development - use http with full host:port
      callbackURL = `http://${port}/api/callback`;
    } else {
      // Production - use https
      callbackURL = `https://${domain}/api/callback`;
    }
    
    const strategyName = `oidc:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.set(strategyName, callbackURL);
      console.log(`✓ Strategy registered: ${strategyName} → ${callbackURL}`);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req);
    const strategyName = `oidc:${req.hostname}`;
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req);
    const strategyName = `oidc:${req.hostname}`;
    passport.authenticate(strategyName, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      const clientId = process.env.CLIENT_ID || process.env.REPL_ID;
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: clientId!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // If OAuth is not configured, allow all requests in development mode
  if (!process.env.CLIENT_ID && !process.env.REPL_ID) {
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

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    if (!config) {
      return next();
    }
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
