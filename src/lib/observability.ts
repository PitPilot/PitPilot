type Severity = "info" | "warning" | "error" | "critical";

type OpsAlert = {
  source: string;
  severity: Severity;
  title: string;
  message: string;
  details?: Record<string, unknown>;
};

function getOpsWebhookUrl() {
  const value = process.env.OPS_ALERT_WEBHOOK_URL?.trim();
  return value && value.length > 0 ? value : null;
}

export async function sendOpsAlert(alert: OpsAlert) {
  const webhookUrl = getOpsWebhookUrl();
  if (!webhookUrl) return;

  const body = {
    timestamp: new Date().toISOString(),
    ...alert,
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.error(
      "Failed to deliver ops alert:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

export async function reportError(params: {
  source: string;
  title: string;
  error: unknown;
  details?: Record<string, unknown>;
  severity?: Severity;
}) {
  const message =
    params.error instanceof Error
      ? params.error.message
      : typeof params.error === "string"
      ? params.error
      : "Unknown error";

  console.error(`[${params.source}] ${params.title}: ${message}`, params.details ?? {});

  await sendOpsAlert({
    source: params.source,
    severity: params.severity ?? "error",
    title: params.title,
    message,
    details: params.details,
  });
}
