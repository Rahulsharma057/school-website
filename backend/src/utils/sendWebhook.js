// Best-effort webhook POST with a short timeout — never throws, since a
// slow or broken third-party endpoint (Slack, Discord, Zapier, etc.)
// should never block or fail a form submission response.
const sendWebhook = async (url, payload) => {
  if (!url) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    console.error("sendWebhook failed:", err.message);
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = sendWebhook;