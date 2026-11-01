import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

function run(args) {
  return execFileSync(process.execPath, [join(HERE, "certify.mjs"), ...args], {
    encoding: "utf8",
  });
}

test("certificate.md matches certify.mjs", () => {
  const out = run(["--check"]);
  assert.match(out, /certificate\.md is up to date/);
});

test("key numbers are stable", () => {
  const out = run(["--check"]);
  assert.match(out, /need 1201 N/);
  assert.match(out, /ion10 0\.60 N/);
  assert.match(out, /Pneed 400 kW/);
  assert.match(out, /breakdown area 13\.4 m²/);
  assert.match(out, /runtime 0\.96 s/);
  assert.match(out, /carnot 0\.0135/);
  assert.match(out, /magic squares 7040/);
  assert.match(out, /global dev 1\.9e-6/);
  assert.match(out, /frame dragging 1\.0e-6 mas\/yr/);
});
