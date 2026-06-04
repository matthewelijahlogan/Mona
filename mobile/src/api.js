import { Platform } from "react-native";

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const hostedBaseUrl = "https://mona-cancer-api.onrender.com";
const fallbackBaseUrls = Platform.select({
  android: [
    "http://127.0.0.1:8001",
    "http://10.0.2.2:8001",
    "http://localhost:8001",
  ],
  ios: ["http://localhost:8001", "http://127.0.0.1:8001"],
  default: ["http://localhost:8001"],
});

const candidateBaseUrls = [
  configuredBaseUrl,
  hostedBaseUrl,
  ...(fallbackBaseUrls || []),
]
  .filter(Boolean)
  .map((value) => value.replace(/\/+$/, ""))
  .filter((value, index, items) => items.indexOf(value) === index);

let resolvedBaseUrl = candidateBaseUrls[0];
let hasResolvedBaseUrl = Boolean(configuredBaseUrl);

export function getTurboBaseUrl() {
  return resolvedBaseUrl || candidateBaseUrls[0] || "http://127.0.0.1:8001";
}

async function parseResponse(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function fetchFromBaseUrl(baseUrl, path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const payload = await parseResponse(response);

  if (!response.ok) {
    const detail =
      typeof payload?.detail === "string"
        ? payload.detail
        : typeof payload === "string"
          ? payload
          : JSON.stringify(payload);
    throw new Error(`${response.status} ${detail || "Request failed"}`);
  }

  return payload;
}

async function fetchTurboJson(path, init) {
  const errors = [];
  const urlsToTry = hasResolvedBaseUrl ? [resolvedBaseUrl] : candidateBaseUrls;

  for (const baseUrl of urlsToTry) {
    try {
      const payload = await fetchFromBaseUrl(baseUrl, path, init);
      resolvedBaseUrl = baseUrl;
      hasResolvedBaseUrl = true;
      return payload;
    } catch (error) {
      errors.push(`${baseUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (hasResolvedBaseUrl && resolvedBaseUrl) {
    hasResolvedBaseUrl = false;
    return fetchTurboJson(path, init);
  }

  throw new Error(
    `Turbo backend unavailable. Tried ${errors.join(" | ")}. Start the local backend and use adb reverse or a LAN URL.`,
  );
}

export function fetchTurboStatus() {
  return fetchTurboJson("/status");
}

export function predictTurboCompound(cancerType, features) {
  return fetchTurboJson("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cancer_type: cancerType, features }),
  });
}

export function fetchLeaderboard(cancerType, limit = 10) {
  const params = new URLSearchParams();
  if (cancerType) {
    params.set("cancer_type", cancerType);
  }
  params.set("limit", String(limit));

  return fetchTurboJson(`/leaderboard?${params.toString()}`);
}

export function submitLeaderboardRecipe({
  recipeName,
  submittedBy,
  cancerType,
  elements,
}) {
  return fetchTurboJson("/leaderboard/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipe_name: recipeName,
      submitted_by: submittedBy,
      cancer_type: cancerType,
      elements,
    }),
  });
}
