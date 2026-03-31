/** Única URL oficial do webhook n8n para leads (destino real do POST). */
export const OFFICIAL_LEAD_N8N_WEBHOOK_URL =
  "http://host.docker.internal:5678/webhook/consorcio" as const;

/**
 * Em dev: path no mesmo host do Vite; o proxy em vite.config encaminha para
 * N8N_WEBHOOK_TARGET preservando /webhook/consorcio → URL oficial acima.
 */
export const LEAD_WEBHOOK_DEV_PATH = "/webhook/consorcio" as const;
