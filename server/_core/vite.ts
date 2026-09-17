import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    // The WebDev proxy exposes the app on a public HTTPS host, while Vite's
    // default HMR client advertises localhost:5173. That endpoint is not
    // reachable from the browser and produces a noisy websocket error on
    // every route. File changes are still picked up on refresh/restart.
    hmr: false,
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
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      // Even with hmr disabled, Vite injects /@vite/client during HTML
      // transformation. In the public WebDev proxy that client attempts a
      // websocket against an unreachable local endpoint, so strip it from
      // the HTML served to browsers.
      const page = (await vite.transformIndexHtml(url, template))
        // Remove any form Vite may use for its client module, including
        // preload/module variants, so stale browsers cannot reconnect HMR.
        .replace(/<script[^>]*vite\/client[^>]*><\/script>/gi, "")
        .replace(/<link[^>]*vite\/client[^>]*>/gi, "")
        .replace(/<script[^>]*src=["'][^"']*\/\@vite\/client[^"']*["'][^>]*><\/script>/gi, "");
      res.status(200)
        .set({ "Content-Type": "text/html", "Cache-Control": "no-store, no-cache, must-revalidate" })
        .end(page);
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

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
