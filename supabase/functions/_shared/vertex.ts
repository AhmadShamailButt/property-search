// Vertex AI helpers for Supabase Edge Functions (Deno).
//
// Auth: signs an RS256 JWT with the service account's private key,
// exchanges it at oauth2.googleapis.com/token for an access token,
// caches in module scope until ~60s before expiry.
//
// Required env vars:
//   GCP_SERVICE_ACCOUNT_JSON  - full service-account JSON (string)
//   GCP_PROJECT_ID            - GCP project id
//   GCP_LOCATION              - e.g. "us-central1"

const EMBED_MODEL = "gemini-embedding-001";
const CHAT_MODEL_PRIMARY = "gemini-2.5-flash";
const CHAT_MODEL_FALLBACK = "gemini-2.0-flash";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

let cachedToken: { token: string; expiresAt: number } | null = null;
let cachedKey: CryptoKey | null = null;
let cachedSA: ServiceAccount | null = null;

function getServiceAccount(): ServiceAccount {
  if (cachedSA) return cachedSA;
  const raw = Deno.env.get("GCP_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("GCP_SERVICE_ACCOUNT_JSON not set");
  cachedSA = JSON.parse(raw) as ServiceAccount;
  return cachedSA;
}

function getProject(): string {
  const v = Deno.env.get("GCP_PROJECT_ID");
  if (!v) throw new Error("GCP_PROJECT_ID not set");
  return v;
}

function getLocation(): string {
  return Deno.env.get("GCP_LOCATION") ?? "us-central1";
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function b64urlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === "string"
    ? new TextEncoder().encode(input)
    : input;
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function importKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const sa = getServiceAccount();
  cachedKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return cachedKey;
}

export async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const sa = getServiceAccount();
  const tokenUri = sa.token_uri ?? "https://oauth2.googleapis.com/token";

  const header = b64urlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64urlEncode(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const key = await importKey();
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${b64urlEncode(new Uint8Array(sig))}`;

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in,
  };
  return cachedToken.token;
}

export type EmbedTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export async function embedText(
  content: string,
  taskType: EmbedTaskType,
): Promise<number[]> {
  const project = getProject();
  const location = getLocation();
  const token = await getAccessToken();

  const url =
    `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${EMBED_MODEL}:predict`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instances: [{ task_type: taskType, content }],
      parameters: { outputDimensionality: 768 },
    }),
  });
  if (!res.ok) {
    throw new Error(`embed failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json() as {
    predictions: Array<{ embeddings: { values: number[] } }>;
  };
  const vec = data.predictions?.[0]?.embeddings?.values;
  if (!Array.isArray(vec)) throw new Error("embed response missing values");
  return vec;
}

export type ChatHistory = {
  role: "user" | "assistant";
  text: string;
  property_ids?: string[];
}[];

export async function generateChat(
  systemPrompt: string,
  userMessage: string,
  contextBlocks: string[],
  history: ChatHistory = [],
): Promise<string> {
  const project = getProject();
  const location = getLocation();
  const token = await getAccessToken();

  const contents: Array<{ role: string; parts: { text: string }[] }> = [];

  for (const m of history.slice(-10)) {
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    });
  }

  const contextText = contextBlocks.length
    ? `\n\nRelevant properties:\n${contextBlocks.join("\n\n")}`
    : "";
  contents.push({
    role: "user",
    parts: [{ text: `${userMessage}${contextText}` }],
  });

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
  };

  const callModel = async (model: string) => {
    const url =
      `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;
    return await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  let res = await callModel(CHAT_MODEL_PRIMARY);
  if (res.status === 404 || res.status === 403) {
    res = await callModel(CHAT_MODEL_FALLBACK);
  }
  if (!res.ok) {
    throw new Error(`chat failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "")
    .join("") ?? "";
  return text.trim();
}
