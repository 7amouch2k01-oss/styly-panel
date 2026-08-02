import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  // Redirect /admin requests on consumer port to the admin port (3001) in development
  app.use((req, res, next) => {
    if (
      process.env.APP_TYPE !== "admin" &&
      (req.originalUrl === "/admin" || req.originalUrl.startsWith("/admin/"))
    ) {
      const host = req.headers.host || "localhost";
      const hostname = host.split(":")[0];
      return res.redirect(`http://${hostname}:3001${req.originalUrl}`);
    }
    next();
  });

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const htmlFile = process.env.APP_TYPE === "admin" ? "admin.html" : "index.html";
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        htmlFile
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      // If we are admin, transform targeting admin-main.tsx
      template = template.replace(
        `src="/src/admin-main.tsx"`,
        `src="/src/admin-main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));
  
  // Intercept /admin on consumer port in production to serve admin.html
  app.use((req, res, next) => {
    if (
      process.env.APP_TYPE !== "admin" &&
      (req.originalUrl === "/admin" || req.originalUrl.startsWith("/admin/"))
    ) {
      return res.sendFile(path.resolve(distPath, "admin.html"));
    }
    next();
  });

  // fall through to index.html/admin.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const htmlFile = process.env.APP_TYPE === "admin" ? "admin.html" : "index.html";
    res.sendFile(path.resolve(distPath, htmlFile));
  });
}
