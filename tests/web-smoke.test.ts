import assert from "node:assert/strict";
import { test } from "node:test";
import { startWebServer } from "../src/commands/web.ts";

test("local web UI serves the Codex page and its SVG icon", async () => {
  const { server, url } = await startWebServer({ hostName: "codex", port: 0 });
  try {
    const pageResponse = await fetch(url);
    assert.equal(pageResponse.status, 200);
    const page = await pageResponse.text();
    assert.match(page, /Agentic Load Skill/);
    assert.match(page, /src="\/logo\.svg"/);
    assert.match(page, /href="\/logo\.svg"/);

    const iconResponse = await fetch(`${url}/logo.svg`);
    assert.equal(iconResponse.status, 200);
    assert.match(iconResponse.headers.get("content-type") ?? "", /image\/svg\+xml/);
    assert.match(await iconResponse.text(), /<svg\s/);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
