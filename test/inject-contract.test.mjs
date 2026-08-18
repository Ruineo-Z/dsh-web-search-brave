import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJsonUrl = new URL("../package.json", import.meta.url);
const clientUrl = new URL("../lib/client.js", import.meta.url);
const serverUrl = new URL("../lib/index.js", import.meta.url);

test("client runtime waits for Cordis service names", async () => {
  const source = await readFile(clientUrl, "utf8");
  const match = source.match(/var inject = \[([\s\S]*?)\];\s*exports\.apply/);

  assert.ok(match, "client runtime inject array was not found");
  assert.deepEqual(
    Array.from(match[1].matchAll(/"([^"]+)"/g), (item) => item[1]),
    ["slots", "locale", "connection", "remote", "settingsScope"],
  );
});

test("package metadata keeps client module package dependencies", async () => {
  const manifest = JSON.parse(await readFile(packageJsonUrl, "utf8"));

  assert.deepEqual(manifest.dsh.client.inject, [
    "@deepseek-ai/dsh-client-connection",
    "@deepseek-ai/dsh-client-runtime",
    "@deepseek-ai/dsh-client-ui-settings",
    "@deepseek-ai/dsh-api-remotes",
  ]);
});

test("server User-Agent matches the package version", async () => {
  const manifest = JSON.parse(await readFile(packageJsonUrl, "utf8"));
  const source = await readFile(serverUrl, "utf8");

  assert.match(
    source,
    new RegExp(`deepseek-harness-dsh-web-search-brave/${manifest.version}`),
  );
});
