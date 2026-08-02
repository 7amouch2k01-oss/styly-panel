import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { createRateLimiter } from "./rateLimiter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "..", "public", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

import { initDb } from "../db";

async function startServer() {
  // Initialize the database (create tables + seed) before handling any requests
  await initDb();

  const app = express();
  const server = createServer(app);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Set HTTP security headers
  app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'; object-src 'none';"
    );
    next();
  });

  // CORS middleware — allows localhost in dev, and the configured APP_ORIGIN in production
  const allowedOrigins = new Set([
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    ...(process.env.APP_ORIGIN ? [process.env.APP_ORIGIN] : []),
  ]);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.has(origin)) {
      if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-sync-token, Cookie, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
    } else {
      next();
    }
  });

  const authRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests max
    message: "Too many authentication attempts. Please try again in a minute."
  });

  app.use("/api/trpc/auth.signIn", authRateLimiter);
  app.use("/api/trpc/auth.signUp", authRateLimiter);
  app.use("/api/oauth/callback", authRateLimiter);

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // ── File Upload endpoint ──────────────────────────────────────
  app.use("/uploads", express.static(UPLOADS_DIR));
  app.post("/api/upload", async (req, res) => {
    try {
      const multer = (await import("multer")).default;
      
      const isS3Configured = 
        process.env.AWS_ACCESS_KEY_ID && 
        process.env.AWS_SECRET_ACCESS_KEY && 
        process.env.AWS_S3_BUCKET;

      if (isS3Configured) {
        console.log("[Storage] S3 environment variables detected. Uploading to S3...");
        const storage = multer.memoryStorage();
        const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } }).single("image");
        
        upload(req, res, async (err) => {
          if (err) return res.status(400).json({ error: err.message });
          const file = (req as any).file;
          if (!file) return res.status(400).json({ error: "No file uploaded" });

          try {
            const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
            const s3Client = new S3Client({
              region: process.env.AWS_REGION || "us-east-1",
              credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
              },
            });

            const ext = path.extname(file.originalname) || ".jpg";
            const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
            const key = `uploads/${filename}`;

            await s3Client.send(
              new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET!,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
              })
            );

            const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
            console.log(`[Storage] Uploaded to S3 successfully: ${url}`);
            res.json({ url });
          } catch (s3Err: any) {
            console.error("[Storage] S3 Upload failed:", s3Err);
            res.status(500).json({ error: "S3 Upload failed", detail: s3Err.message });
          }
        });
      } else {
        console.log("[Storage] Local configuration active. Uploading to disk...");
        const storage = multer.diskStorage({
          destination: UPLOADS_DIR,
          filename: (_, file, cb) => {
            const ext = path.extname(file.originalname) || ".jpg";
            cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
          },
        });
        const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } }).single("image");
        upload(req, res, (err) => {
          if (err) return res.status(400).json({ error: err.message });
          const file = (req as any).file;
          if (!file) return res.status(400).json({ error: "No file uploaded" });
          res.json({ url: `/uploads/${file.filename}` });
        });
      }
    } catch (e: any) {
      res.status(500).json({ error: "Upload failed", detail: e.message });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const defaultPort = process.env.APP_TYPE === "admin" ? "3001" : "3000";
  const preferredPort = parseInt(process.env.PORT || defaultPort);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/ (${process.env.APP_TYPE || 'consumer'} mode)`);
  });
}

startServer().catch(console.error);
