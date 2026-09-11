# mesh-connector — container contract

**Class: `compute`.** Stateless. A stdio↔HTTP bridge: JSON-RPC in on stdin, out to
`market.meshtool.ai/mcp`, results back on stdout. Killing it loses nothing — there
is no local state to lose.

## Why it exists at all

MeshMarket is a hosted remote endpoint; "nothing to install" is the pitch. This
image exists because Glama's quality evaluation runs against a buildable release,
and this bridge is the honest containerization of that pitch — not a second
implementation of the market.

## What goes in

| | |
|---|---|
| Build context | the repo root |
| Copies | `mcpb/server/index.js` only, to two paths (see below) |
| Base | `node:22-alpine` — zero dependencies, no `npm install`, no lockfile to rot |

The file is copied to **both** `./index.js` and `./mcpb/server/index.js` on
purpose. Glama's build form supplies its own `CMD`, and a runner starting
`mcp-proxy -- node <path>` against a path that is absent inside the image does
not fail loudly: node exits, the proxy waits forever. That cost 12 minutes of
hang on 2026-07-29. Either CMD shape now works.

## Secrets

**None are baked, and none are required.** `MESHMARKET_AGENT_KEY` is optional and
injected at RUNTIME for paid calls; keyless works for browsing and `mesh_signup`,
the same as every other door into the mesh. The only `ENV` in the image is
`MESH_MCP_URL`, a public endpoint.

## Rules it satisfies

- **R4/R5** — `.dockerignore` at the context root, secret patterns in the `**/` form.
- **R6** — narrow explicit `COPY` only. No `COPY . .`. This, not `.dockerignore`,
  is the real protection.
- **R7** — no secret-shaped literal in any `ENV`/`ARG` default.
