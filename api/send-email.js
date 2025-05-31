// File: api/send-email.js

// Allow CORS from any origin
const ALLOWED_ORIGINS = ["*"];

export default async function handler(req, res) {
  // 1. Handle CORS preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS.join(","));
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end(); // No Content
  }

  // 2. All responses (for non-OPTIONS) must include CORS headers
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS.join(","));
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 3. Only accept POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  // 4. Parse and validate request body
  let body;
  try {
    body = req.body;
  } catch (err) {
    return res.status(400).json({ message: "Invalid JSON" });
  }

  const { email, name } = body || {};

  if (!email || !name) {
    return res.status(400).json({ message: "Missing email or name" });
  }

  // 5. Send email via Brevo
  try {
    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: "Bullion Exchange",
          email: "noreply@apexincomeoptions.com.ng"
        },
        to: [{ email, name }],
        templateId: 4,       // Your Brevo template ID
        params: { NAME: name }
      })
    });

    const data = await brevoRes.json();

    if (!brevoRes.ok) {
      // Brevo returned an error—forward it
      return res.status(500).json({ message: "Brevo API error", details: data });
    }

    // Success
    return res.status(200).json({ message: "Email sent successfully", data });
  } catch (err) {
    // Network or unexpected error
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}
