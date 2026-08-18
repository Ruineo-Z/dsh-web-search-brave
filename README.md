# @dsh-local/dsh-web-search-brave

Brave Search provider for the DeepSeek Harness web capability seam (`ctx.web`).
Registers a `web_search` backend with id `brave` calling the
[Brave Search API](https://brave.com/search/api/) (`GET /res/v1/web/search`).

## Install into the web profile

```sh
dsh plugin --profile web add github:Ruineo-Z/dsh-web-search-brave
```

## Register and switch provider

Edit `~/.dsh/profiles/web/cordis.patch.yml`:

```yaml
- id: web
  config:
    searchProvider: brave

- insert:
    - id: web-search-brave
      name: '@dsh-local/dsh-web-search-brave'
      config:
        apiKeyEnv: BRAVE_API_KEY
        # baseURL: https://api.search.brave.com
```

Store the key in `~/.dsh/.credentials.yaml` (or export `BRAVE_API_KEY`),
then restart `dsh web`. The tool keeps working across restarts; settings are
read per search.

## Settings namespace

```yaml
web-search-brave:
  apiKeyEnv: BRAVE_API_KEY
  baseURL: https://api.search.brave.com
```

| Key        | Default | Meaning |
|------------|---------|---------|
| `apiKey`   | —       | Literal API key in config (not recommended; prefer `apiKeyEnv`) |
| `apiKeyEnv`| `BRAVE_API_KEY` | Credential reference resolved via `ctx.credentials` |
| `baseURL`  | `https://api.search.brave.com` | API base; env `BRAVE_SEARCH_BASE_URL` overrides |

## Mapping

- `sources` ← Brave `web.results[]`: `url` / `title` / `description` (as snippet)
- `publishedAt` ← `page_age` or `age` only when the value is an ISO-ish date
- No free-form answer text is trusted as `content`
- `request.maxResults` is forwarded as `count` (≤ 20) to save payload; the
  seam still enforces the final cap