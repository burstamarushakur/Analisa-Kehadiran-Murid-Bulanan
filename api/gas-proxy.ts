import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const GAS_URL = "https://script.google.com/macros/s/AKfycbySdK5NIo1Al1AYyn-vY-jKzYbyVpCqYMDh1VSWZmlAyvaPmxZY0w7XxvKS4oZgAaw/exec";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      return res.status(200).end();
    }

    let fetchUrl = GAS_URL;
    let fetchOptions: RequestInit = {
      redirect: "follow",
    };

    if (req.method === "GET") {
      const qs = new URLSearchParams(req.query as Record<string, string>).toString();
      if (qs) {
        fetchUrl += `?${qs}`;
      }
      fetchOptions.method = "GET";
    } else if (req.method === "POST") {
      // For POST, simply forward the action in query if it sits there, 
      // but usually GAS needs the body as JSON.
      const action = req.query.action || req.body?.action;
      if (action) {
        fetchUrl += `?action=${action}`;
      }
      fetchOptions.method = "POST";
      fetchOptions.headers = {
        "Content-Type": "application/json",
      };
      
      // If req.body is already an object, stringify it
      fetchOptions.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    } else {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const response = await fetch(fetchUrl, fetchOptions);
    const rawText = await response.text();

    let data;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (e) {
      console.error("GAS_NOT_JSON:", rawText.substring(0, 500));
      return res.status(200).json({
        ok: false,
        error: "GAS_NOT_JSON",
        raw: rawText.substring(0, 500),
      });
    }

    // Return the successful JSON response
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("API Proxy Error:", error);
    return res.status(500).json({
      ok: false,
      error: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
}
