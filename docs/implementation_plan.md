# Implementation Plan - Website Security Upgrade

This plan implements critical security updates to protect API endpoints, storage files, user credentials, and prevent common web vulnerabilities (XSS, CSRF, Clickjacking, Brute-Force).

---

## User Review Required

> [!IMPORTANT]
> - We are introducing a `SYNC_SECRET` key for authentication of the mobile app sync endpoints. You will need to configure `SYNC_SECRET` in your server's production environment variables.
> - Password hashing iterations are being upgraded from 1,000 to 600,000 (OWASP standard). A backward-compatible parser is introduced so existing users (e.g. `1000` iterations) can still log in without resetting passwords.

---

## Proposed Changes

### 1. API Protection for Mobile App Sync Router
Protecting the database sync endpoints from unauthorized access by external users.

#### [MODIFY] [env.ts](file:///c:/Users/mosma/OneDrive/Desktop/GoMyCode/my%20personal%20projects/styly%20pannel/server/_core/env.ts)
- Add `syncSecret`:
  ```typescript
  syncSecret: process.env.SYNC_SECRET || "default-local-sync-secret-key-12345",
  ```

#### [MODIFY] [trpc.ts](file:///c:/Users/mosma/OneDrive/Desktop/GoMyCode/my%20personal%20projects/styly%20pannel/server/_core/trpc.ts)
- Create `syncProcedure` middleware that verifies the `x-sync-token` header matches `ENV.syncSecret`:
  ```typescript
  export const syncProcedure = t.procedure.use(
    t.middleware(async opts => {
      const token = opts.ctx.req.headers['x-sync-token'];
      if (!token || token !== ENV.syncSecret) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or missing sync token" });
      }
      return opts.next();
    })
  );
  ```

#### [MODIFY] [routers.ts](file:///c:/Users/mosma/OneDrive/Desktop/GoMyCode/my%20personal%20projects/styly%20pannel/server/routers.ts)
- In the `sync` router, change the procedure for `user`, `brand`, `product`, and `order` from `publicProcedure` to `syncProcedure`.

---

### 2. Storage Proxy Authentication
Preventing unauthenticated requests from accessing signed URLs for user storage objects.

#### [MODIFY] [storageProxy.ts](file:///c:/Users/mosma/OneDrive/Desktop/GoMyCode/my%20personal%20projects/styly%20pannel/server/_core/storageProxy.ts)
- Import `sdk` and add auth verification using `sdk.authenticateRequest(req)` before fetching signed URLs. If unauthorized, return `401 Unauthorized`.

---

### 3. HTTP Security Headers & CORS Setup
Implementing defense-in-depth security policies in Express.

#### [MODIFY] [index.ts](file:///c:/Users/mosma/OneDrive/Desktop/GoMyCode/my%20personal%20projects/styly%20pannel/server/_core/index.ts)
- Add middleware setting key security headers:
  - `X-Frame-Options: DENY` (prevents Clickjacking)
  - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS)
  - `Content-Security-Policy` (CSP) restricting frame-ancestors, object-src, and limiting script-src origins.
- Set up custom CORS middleware to allow only requests from local domain (or configured production origins) for API endpoints.

#### [MODIFY] [cookies.ts](file:///c:/Users/mosma/OneDrive/Desktop/GoMyCode/my%20personal%20projects/styly%20pannel/server/_core/cookies.ts)
- Change `sameSite` to `"lax"` in all environments (instead of `"none"` on HTTPS) since cross-site cookie transmission is not required. This protects against CSRF attacks.

---

### 4. Advanced Password Hashing
Improving brute-force resistance of local database credentials.

#### [MODIFY] [authHelpers.ts](file:///c:/Users/mosma/OneDrive/Desktop/GoMyCode/my%20personal%20projects/styly%20pannel/server/authHelpers.ts)
- Update `hashPassword` to use 600,000 PBKDF2 iterations and prefix the returned string as `pbkdf2:600000:salt:hash`.
- Update `verifyPassword` to check the format:
  - If it starts with `pbkdf2:`, parse iterations dynamically.
  - If it is standard `salt:hash`, verify using legacy `1000` iterations.

---

### 5. Rate Limiting for Auth Endpoints
Preventing brute-force attacks on sign-in, sign-up, and OAuth callback endpoints.

#### [NEW] [rateLimiter.ts](file:///c:/Users/mosma/OneDrive/Desktop/GoMyCode/my%20personal%20projects/styly%20pannel/server/_core/rateLimiter.ts)
- Implement an in-memory token bucket rate limiter middleware to limit requests based on client IP addresses (e.g., maximum 5 login/signup requests per minute).

#### [MODIFY] [index.ts](file:///c:/Users/mosma/OneDrive/Desktop/GoMyCode/my%20personal%20projects/styly%20pannel/server/_core/index.ts)
- Apply the rate limiter middleware to auth routers.

---

## Verification Plan

### Automated Tests
- Run type safety compile test: `pnpm check`.
- Verify server unit/integration tests: `pnpm test`.

### Manual Verification
- **Sync endpoints**: Try calling `sync.user` without headers. Verify it gets rejected with `401 UNAUTHORIZED`. Add correct header `x-sync-token` and verify it succeeds.
- **Storage proxy**: Access `/manus-storage/test-file` without cookie. Verify it returns `401`. Log in and access again; verify redirect works.
- **Password Compatibility**: Verify you can still sign in using existing user accounts (legacy 1000 iterations). Create a new user, verify their hash contains `pbkdf2:600000:`, and verify they can log in.
- **Security Headers**: Perform a curl request (e.g., `curl -I http://localhost:3000/`) and verify the presence of HSTS, CSP, and X-Frame-Options headers.
