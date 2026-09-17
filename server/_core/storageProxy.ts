import type { Express, Request, Response } from "express";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  const serveStoredObject = async (req: Request, res: Response) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      // Stream the object through the app origin instead of returning a signed
      // redirect. Some employee browsers/WebViews reject or lose the signed
      // cross-origin redirect, which made logos and avatars appear to work only
      // for the manager's browser.
      const imageResp = await fetch(url);
      if (!imageResp.ok) {
        console.error(`[StorageProxy] object fetch failed: ${imageResp.status}`);
        res.status(502).send("Stored image is unavailable");
        return;
      }
      const contentType = imageResp.headers.get("content-type") || "application/octet-stream";
      const bytes = Buffer.from(await imageResp.arrayBuffer());
      res.status(200).set({
        "Content-Type": contentType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      }).send(bytes);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  };

  // Keep the original path for backward compatibility, and expose a dedicated
  // application-owned path for public deployments that intercept /manus-storage.
  app.get("/manus-storage/*", serveStoredObject);
  app.get("/api/media/*", serveStoredObject);
}
