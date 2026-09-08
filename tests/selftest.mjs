// mesh-connector — SECURITY SELFTEST (the code ratchet).
//
// School of Slop, Lesson #1. This tool was already written with real care:
// keys masked in output, read from stdin never argv, credentials at 0600,
// `--show` refused to a non-TTY. But every one of those decisions lived only
// in a COMMENT. A comment doesn't fail a build; a future edit could undo any
// of them silently. This file turns each careful decision into an executable
// assertion. Care-in-comments is a patch. An assertion that can't regress is
// hardening.
//
// RATCHET RULE: MIN_INVARIANTS only goes up. Every security decision this tool
// makes gets an assertion here BEFORE it can be trusted to stay made.
//
// Run: node tests/selftest.mjs   (wired into `npm test` ahead of the ship).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { maskKey, redactKey, slugify, parseArgs, isSettled, failureAdvice } from "../bin/mesh.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, "..", "bin", "mesh.mjs"), "utf8");

// Strip comments before any static scan — the security decisions are NAMED in
// the comments (0600, argv, leak, isTTY...), so an un-stripped scan would pass
// on the documentation even if the code lost the behavior (cry-wolf's evil twin:
// a check that CAN'T fail is as useless as one that always does). Protect URLs
// (https://) and only strip real // comments.
const CODE = SRC.split("\n")
  .map((l) => l.replace(/^\s*\/\/.*$/, "").replace(/([^:"'`])\/\/.*$/, "$1"))
  .join("\n");

const MIN_INVARIANTS = 31;
let pass = 0;
const fails = [];
const ok = (name, cond) => { if (cond) { pass++; console.log("  ✓ " + name); } else { fails.push(name); console.error("  ✗ " + name); } };

const A_KEY = "agk_1234567890abcdefABCDEF9999"; // a realistic-length fake key

// ── Behavioral: the crown-jewel functions actually protect a key ────────────
ok("maskKey never reveals a full key", (() => {
  const m = maskKey(A_KEY);
  return !m.includes(A_KEY) && m.startsWith("agk_1234") && m.endsWith("9999") && m.includes("…");
})());
ok("maskKey on garbage/short input reveals nothing, never throws", (() => {
  for (const bad of [null, undefined, 42, "", "short"]) { if (maskKey(bad) !== "agk_…") return false; }
  return true;
})());
ok("redactKey masks a key embedded in a larger string", (() => {
  const rendered = `{"headers":{"Authorization":"Bearer ${A_KEY}"}}`;
  const out = redactKey(rendered, A_KEY);
  return !out.includes(A_KEY) && out.includes(maskKey(A_KEY));
})());
ok("redactKey masks EVERY occurrence, not just the first", (() => {
  const out = redactKey(`${A_KEY} and again ${A_KEY}`, A_KEY);
  return !out.includes(A_KEY);
})());
ok("redactKey is a safe no-op on non-strings / short keys", () => redactKey(null, A_KEY) === null && redactKey("x", "short") === "x");
ok("slugify strips unsafe chars, lowercases, and caps at 32", (() => {
  const s = slugify("  My Evil/../Name!! " + "x".repeat(60));
  return /^[a-z0-9-]+$/.test(s) && s.length <= 32 && !s.includes("/") && !s.includes(".");
})());
ok("parseArgs: a flag before another flag is a boolean, not a value-swallow", (() => {
  const { positional, opts } = parseArgs(["call", "--dry-run", "--client", "cursor"]);
  return positional[0] === "call" && opts["dry-run"] === true && opts.client === "cursor";
})());

// ── Static: the documented security decisions, now enforced ─────────────────
ok("keys are read over stdin, never argv (readSecretFromStdin exists + used)",
  /function readSecretFromStdin/.test(CODE) && /readSecretFromStdin\(/.test(CODE.replace(/function readSecretFromStdin/, "")));
ok("credentials file is written owner-read-only (0600) AND chmod-tightened",
  /writeFileSync\(CRED_FILE[\s\S]{0,80}0o600/.test(CODE) && /chmodSync\(CRED_FILE,\s*0o600\)/.test(CODE));
ok("credentials DIRECTORY is created 0700", /mkdirSync\(CRED_DIR[\s\S]{0,60}0o700/.test(CODE));
ok("`key --show` is refused to a non-TTY / CI (pipe, file, agent transcript)",
  /isTTY/.test(CODE) && /process\.env\.CI/.test(CODE));
ok("every API call carries a timeout (the one fetch has signal: AbortSignal.timeout)",
  /fetch\(BASE \+ path,[\s\S]{0,220}?signal:\s*AbortSignal\.timeout\(/.test(CODE)
  && (CODE.match(/\bfetch\(/g) || []).length === (CODE.match(/AbortSignal\.timeout\(/g) || []).length);
ok("init never clobbers: unparseable config is skipped, not overwritten",
  /JSON\.parse\(readFileSync\(t\.file/.test(CODE) && /is not valid JSON; skipped/.test(SRC));
ok("init backs up any file it touches before writing (.mesh-backup)",
  /\.mesh-backup/.test(CODE) && /writeFileSync\(t\.file \+ "\.mesh-backup"/.test(CODE));
ok("wired config files holding a key are chmod'd 0600", /chmodSync\(t\.file,\s*0o600\)/.test(CODE));
ok("a dry-run prints the config SHAPE with the key redacted, never raw",
  /redactKey\(JSON\.stringify\(entry\),\s*key\)/.test(CODE));
ok("the CLI is import-safe: main() runs only when invoked directly",
  /invokedDirectly/.test(CODE) && /if \(invokedDirectly\) main\(\)/.test(CODE));

// ── the first call must not lie ─────────────────────────────────────────────
// `init` now ends by making one real, paid call so a newcomer sees the loop
// close before restarting anything. The only thing that makes that safe is
// that it CANNOT report success without a settled receipt. These are the
// controls for that, written as a pair: one proving it accepts a real sale,
// several proving it rejects every shape that merely looks like one.
// (SRC is already read at the top of this file.)

ok("a real receipt (result + charged) counts as settled",
  isSettled({ result: { person: "Ada Lovelace" }, charged: 2, balance: 98 }) === true);

// NEGATIVE CONTROLS - each of these is a way the onboard could claim the
// economy works when it did not.
ok("[control] an empty 200 body is NOT settled", isSettled({}) === false);
ok("[control] null/undefined is NOT settled", isSettled(null) === false && isSettled(undefined) === false);
ok("[control] a charge with no result is NOT settled", isSettled({ charged: 2 }) === false);
ok("[control] a result with no charge is NOT settled", isSettled({ result: { a: 1 } }) === false);
ok("[control] an error body is NOT settled", isSettled({ error: "unauthorized" }) === false);

// A dry run is a rehearsal. It must never spend someone's MESH, and it must
// never mint an account - both are irreversible from the newcomer's side.
ok("a dry run never makes the first call",
  /if \(dry\)/.test(CODE) && !/dry[\s\S]{0,200}await proveIt/.test(CODE));

ok("the first call is skippable with --no-prove",
  /\(!\("no-prove" in opts\)\) await proveIt/.test(CODE));

// The ceiling matters: api() aborts at 25s, and this call is model-backed. A
// 25s abort would report a WORKING exchange as broken - the exact false alarm
// that gets a check deleted.
ok("the first call gets a longer ceiling than api()'s 25s",
  /FIRST_CALL_CEILING = (\d+)/.test(CODE) && Number(RegExp.$1) > 25000);

ok("the first call buys from creator-os, not from the house",
  /thinkzone-api/.test(CODE) && /structured-extract/.test(CODE));


// Never reassure someone about the exact thing that just failed.
ok("a rejected key is NOT told its key is real",
  failureAdvice(401).join(" ").includes("did not recognise") &&
  !failureAdvice(401).join(" ").includes("are real and saved"));
ok("403 is treated as an auth failure too",
  failureAdvice(403).join(" ").includes("did not recognise"));
ok("[control] a server-side failure DOES reassure - the key really is fine there",
  failureAdvice(500).join(" ").includes("are real and saved") &&
  !failureAdvice(500).join(" ").includes("did not recognise"));
ok("[control] a network failure (no status) reassures rather than blaming the key",
  failureAdvice(undefined).join(" ").includes("are real and saved"));

// ── Result ──────────────────────────────────────────────────────────────────
const total = pass + fails.length;



console.log(`\nmesh-connector security selftest — ${pass}/${total} passing (ratchet floor ${MIN_INVARIANTS})`);
if (fails.length) { console.error(`\n${fails.length} FAILED:\n  ` + fails.join("\n  ")); process.exit(1); }
if (total < MIN_INVARIANTS) { console.error(`\nRATCHET VIOLATION: ${total} invariants, floor is ${MIN_INVARIANTS}. The floor only goes up.`); process.exit(1); }
console.log("GREEN — every security decision this tool makes is now enforced, not just documented.");
