import type { WebSearchProvider, WebSearchRequest, WebSearchResult } from '@deepseek-ai/dsh-web';

/** Stable provider id: choose it with `searchProvider: brave`. */
export declare const BRAVE_PROVIDER_ID = 'brave';
/** Default credential reference name. */
export declare const DEFAULT_API_KEY_ENV = 'BRAVE_API_KEY';
/** Default endpoint base; "/res/v1/web/search" is appended. */
export declare const DEFAULT_BASE_URL = 'https://api.search.brave.com';
/** Brave caps a single result page at 20 entries. */
export declare const BRAVE_MAX_COUNT = 20;

export interface BraveProviderOptions {
  apiKey?: string;
  apiKeyEnvName: string;
  resolveApiKey?: () => Promise<string | undefined>;
  baseURL: string;
}

export declare class BraveSearchProvider implements WebSearchProvider {
  readonly id: 'brave';
  constructor(resolveOptions: () => BraveProviderOptions);
  available(): boolean;
  search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult>;
}

/** Pure mapping from a raw Brave Search API response body to the seam result. */
export declare function mapBraveResponse(json: unknown): WebSearchResult;

/** Cordis plugin name. */
export declare const name = 'web-search-brave';
/** The web seam this provider registers into. */
export declare const inject: ['web'];

declare function apply(ctx: any, config: Record<string, unknown>): void;
export { apply };
