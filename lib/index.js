import z from "@deepseek-ai/schemastery";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { installSettingsSection, settingsNamespace } from "@deepseek-ai/dsh-settings";
import { launchEnvironmentOf } from "@deepseek-ai/dsh-launch-environment";
import { WebError } from "@deepseek-ai/dsh-web";

/** Stable id this provider registers under. Select it with `searchProvider: brave`. */
export const BRAVE_PROVIDER_ID = "brave";
/** Default credential reference name. */
export const DEFAULT_API_KEY_ENV = "BRAVE_API_KEY";
/** Default endpoint base; "/res/v1/web/search" is appended. */
export const DEFAULT_BASE_URL = "https://api.search.brave.com";
/** Optional env override for the base URL (never materialized into config). */
const BRAVE_BASE_URL_ENV = "BRAVE_SEARCH_BASE_URL";
/** Brave caps a single result page at 20 entries. */
export const BRAVE_MAX_COUNT = 20;
/** Attribution header on every request; bump with the package version. */
const USER_AGENT = "deepseek-harness-dsh-web-search-brave/0.1.0";

/** Cordis plugin name used by loader diagnostics. */
export const name = "web-search-brave";
/** The web seam this provider registers into. */
export const inject = ["web"];
/** Settings namespace carrying this provider's endpoint and key reference. */
export const WEB_SEARCH_BRAVE_SETTINGS_NAMESPACE = settingsNamespace("web-search-brave");

export const Config = z.object({
  apiKey: z.string().role("secret"),
  apiKeyEnv: z.string().role("credential-ref").default(DEFAULT_API_KEY_ENV),
  baseURL: z.string().default(DEFAULT_BASE_URL)
});

// ── cancellation helpers ────────────────────────────────────────────────────

function isAbortError(error) {
  return error instanceof DOMException && error.name === "AbortError";
}

function searchAborted(signal, fallback) {
  return new WebError("Brave search aborted", "WEB_ABORTED", {
    cause: signal?.aborted === true ? signal.reason : fallback
  });
}

function throwIfAborted(signal) {
  if (signal?.aborted === true) throw searchAborted(signal);
}

function abortable(operation, signal) {
  if (signal === void 0) return operation;
  if (signal.aborted) return Promise.reject(searchAborted(signal));
  return new Promise((resolve, reject) => {
    const onAbort = () => { reject(searchAborted(signal)); };
    signal.addEventListener("abort", onAbort, { once: true });
    operation.then((value) => {
      signal.removeEventListener("abort", onAbort);
      resolve(value);
    }, (error) => {
      signal.removeEventListener("abort", onAbort);
      reject(new Error(String(error).replace(/^Error: /u, ""), { cause: error }));
    });
  });
}
// result mapping
function looksLikeIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/u.test(value.trim());
}

export function mapBraveResponse(json) {
  const results = json?.web?.results;
  const sources = [];
  if (Array.isArray(results)) {
    for (const item of results) {
      if (item == null || typeof item !== "object") continue;
      const url = item.url;
      if (typeof url !== "string" || url.length === 0) continue;
      const source = { url };
      if (typeof item.title === "string" && item.title.length > 0) source.title = item.title;
      if (typeof item.description === "string" && item.description.length > 0) source.snippet = item.description;
      const age = typeof item.page_age === "string" ? item.page_age : typeof item.age === "string" ? item.age : void 0;
      if (age !== void 0 && looksLikeIsoDate(age)) source.publishedAt = age.trim();
      sources.push(source);
    }
  }
  return { sources, truncated: false };
}

// options resolution
async function resolveApiKeyOf(options, signal) {
  throwIfAborted(signal);
  if (options.apiKey !== void 0 && options.apiKey.length > 0) return options.apiKey;
  let resolved;
  try {
    resolved = await abortable(options.resolveApiKey?.() ?? Promise.resolve(void 0), signal);
  } catch (error) {
    if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error);
    throw new WebError("Brave search credential resolution failed: " + String(error), "WEB_PROVIDER_ERROR", { cause: error });
  }
  if (resolved !== void 0 && resolved.length > 0) return resolved;
  throw new WebError('Brave search has no API key for "' + options.apiKeyEnvName + '"; store it through the credentials service, export it in the launching environment, or set a literal "apiKey" in the web-search-brave config', "WEB_PROVIDER_CREDENTIAL_MISSING");
}

export class BraveSearchProvider {
  constructor(resolveOptions) { this._resolveOptions = resolveOptions; }
  get id() { return BRAVE_PROVIDER_ID; }
  available() {
    const options = this._resolveOptions();
    return ((options.apiKey?.length ?? 0) > 0 || options.resolveApiKey !== void 0) && URL.canParse(options.baseURL);
  }
  async search(request, signal) {
    const options = this._resolveOptions();
    const apiKey = await resolveApiKeyOf(options, signal);
    throwIfAborted(signal);
    const params = new URLSearchParams({ q: request.query });
    if (request.maxResults != null && Number.isInteger(request.maxResults) && request.maxResults > 0) {
      params.set("count", String(Math.min(request.maxResults, BRAVE_MAX_COUNT)));
    }
    const endpoint = options.baseURL.replace(/\/+$/u, "") + "/res/v1/web/search?" + params.toString();
    let response;
    try {
      response = await fetch(endpoint, {
        method: "GET",
        signal,
        headers: {
          // Both headers are sent: Authorization: Bearer is the current docs,
          // X-Subscription-Token is the legacy header some plans still require.
          authorization: "Bearer " + apiKey,
          "x-subscription-token": apiKey,
          accept: "application/json",
          "user-agent": USER_AGENT
        }
      });
    } catch (error) {
      if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error);
      throw new WebError("Brave search request failed: " + String(error), "WEB_PROVIDER_ERROR", { cause: error });
    }
    if (!response.ok) {
      let message = "Brave API error (HTTP " + response.status + ")";
      try {
        const parsed = await response.json();
        const detail = typeof parsed.error === "string" ? parsed.error : parsed.error?.message ?? parsed.message;
        if (detail !== void 0 && detail.length > 0) message = detail;
      } catch { /* keep the HTTP fallback */ }
      throw new WebError(message, "WEB_PROVIDER_ERROR");
    }
    try {
      return mapBraveResponse(await response.json());
    } catch (error) {
      if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error);
      if (error instanceof WebError) throw error;
      throw new WebError("Brave returned an unprocessable response body: " + String(error), "WEB_PROVIDER_ERROR", { cause: error });
    }
  }
}

function resolveOptions(ctx, config) {
  const apiKeyEnv = credentialRef(config.apiKeyEnv ?? DEFAULT_API_KEY_ENV);
  const literalApiKey = config.apiKey !== void 0 && config.apiKey.length > 0 ? config.apiKey : void 0;
  return {
    ...(literalApiKey === void 0 ? {} : { apiKey: literalApiKey }),
    apiKeyEnvName: config.apiKeyEnv ?? DEFAULT_API_KEY_ENV,
    resolveApiKey: async () => {
      const credentials = ctx.get("credentials");
      if (credentials !== void 0) return (await credentials.resolve(apiKeyEnv))?.value;
      const ambient = launchEnvironmentOf(ctx).get(apiKeyEnv);
      return ambient !== void 0 && ambient.value.length > 0 ? ambient.value : void 0;
    },
    baseURL: config.baseURL ?? launchEnvironmentOf(ctx).get(BRAVE_BASE_URL_ENV)?.value ?? DEFAULT_BASE_URL
  };
}

export function apply(ctx, config) {
  let current = () => config;
  installSettingsSection(ctx, WEB_SEARCH_BRAVE_SETTINGS_NAMESPACE, Config, config, {
    setSource: (source) => { current = source; },
    onChange: () => {}
  });
  ctx.web.registerSearchProvider(new BraveSearchProvider(() => resolveOptions(ctx, current())));
}
