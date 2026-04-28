import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAS_URL = "https://script.google.com/macros/s/AKfycbySdK5NIo1Al1AYyn-vY-jKzYbyVpCqYMDh1VSWZmlAyvaPmxZY0w7XxvKS4oZgAaw/exec";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Proxy route for GAS - Optimized for GAS infrastructure
  app.all("/api/gas-proxy", async (req, res) => {
    const { method, query, body } = req;
    
    try {
      // Bina URL dengan query params asal (termasuk action jika ada di search string)
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        searchParams.append(key, value as string);
      }
      
      const upstreamUrl = GAS_URL + (searchParams.toString() ? `?${searchParams.toString()}` : "");

      console.log(`[Proxy Request] ${method} ${upstreamUrl}`);

      // Gunakan fetch dengan konfigurasi yang paling stabil untuk GAS
      const response = await fetch(upstreamUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: method !== "GET" && method !== "HEAD" ? JSON.stringify(body) : undefined,
        redirect: 'follow'
      });

      const rawText = await response.text();
      console.log(`[Proxy Raw Text] ${rawText.substring(0, 300)}...`);

      if (!rawText) {
        return res.status(200).json({ ok: false, error: 'Empty response from GAS' });
      }

      // Cuba parse sebagai JSON
      try {
        const data = JSON.parse(rawText);
        return res.status(200).json(data);
      } catch (e) {
        // Jika gagal (dapat HTML error dari Google), pulangkan mesej yang user boleh faham
        if (rawText.includes("<html") || rawText.includes("Google Apps Script")) {
          return res.status(200).json({ 
            ok: false, 
            error: 'GAS_HTML_ERROR',
            message: 'Skrip GAS memulangkan ralat HTML (Mungkin logic error atau timeout).',
            raw: rawText.substring(0, 500)
          });
        }
        return res.status(200).json({ ok: false, error: 'NOT_JSON', raw: rawText });
      }
    } catch (error: any) {
      console.error("[Proxy Fatal Error]", error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

