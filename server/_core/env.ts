export const ENV = {
  appId: process.env.VITE_APP_ID || "local-dev-app-id",
  cookieSecret: process.env.JWT_SECRET || "dev-jwt-secret-key-must-be-long-enough-to-be-secure-12345",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  syncSecret: process.env.SYNC_SECRET || "default-local-sync-secret-key-12345",
};
