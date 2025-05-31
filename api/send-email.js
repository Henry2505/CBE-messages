// File: api/send-email.js

// Allow CORS from any origin
const ALLOWED_ORIGINS = ["*"];

export default async function handler(req, res) {
  // 1) Handle CORS preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS.join(","));
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  // 2) On every response, include CORS headers
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS.join(","));
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 3) Only accept POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  // 4) Parse + validate JSON body
  let body;
  try {
    body = req.body;
  } catch (err) {
    return res.status(400).json({ message: "Invalid JSON" });
  }

  const { email, name, templateId, params } = body || {};

  if (!email || !name || typeof templateId !== "number" || !params) {
    return res
      .status(400)
      .json({ message: "Missing email, name, templateId or params" });
  }

  // 5) Send email via Brevo
  try {
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "CBE Global FX", email: "noreply@apexincomeoptions.com.ng" },
        to: [{ email, name }],
        templateId: templateId,
        params: params,
      }),
    });

    const data = await brevoResponse.json();

    if (!brevoResponse.ok) {
      // Brevo returned an error (e.g. invalid templateId, missing variable, etc.)
      return res.status(500).json({ message: "Brevo API error", details: data });
    }

    // Success
    return res.status(200).json({ message: "Email sent successfully", data });
  } catch (err) {
    // Network or unexpected failure
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}
