# CONTAINER contract — mesh-connector

Declared in `_hq/containers.manifest.json` (`id: mesh-connector`, class `compute`)
and enforced by `_hq/ops/container-check.mjs`.

## What this image is

The Glama-release container for the zero-dependency stdio↔HTTP bridge that also
ships in the Claude Desktop `.mcpb` (`mcpb/server/index.js`). MeshMarket itself is
a hosted remote endpoint — *nothing to install* is the whole pitch — but Glama's
quality evaluation runs against a buildable release, and this bridge is the honest
containerization of it: stdin JSON-RPC → `market.meshtool.ai/mcp` → stdout.

## Secrets: none baked, none required

`MESHMARKET_AGENT_KEY` is **optional** and injected at runtime. Keyless works for
browsing and `mesh_signup`, exactly like every other door into the mesh, so the
image ships with no credential and needs none to start. Nothing in the build
context is copied except `mcpb/server/index.js`; `.dockerignore` keeps the rest of
the context out, with secret patterns in the recursive `**/` form (R5) because a
bare `.env` matches only the context root and misses nested copies.

## State

Stateless. No volume, no database, no local writes. A restart loses nothing.

## Build and run

    docker build -t mesh-connector .
    docker run --rm -i mesh-connector

`index.js` is present at BOTH `/app/index.js` and `/app/mcpb/server/index.js` on
purpose: Glama's build form supplies its own CMD, and a runner that starts
`mcp-proxy -- node <path>` against a path that does not exist inside the image
does not fail loudly — node exits and the proxy waits forever. That cost a
12-minute hang on 2026-07-29; two copies is the cheap fix.

## Why this file exists

`containers.manifest.json` declared this contract and the file was absent, so
R2 was red. The container was found UNDECLARED on 2026-09-11 by the repo-universe
fix to R1 — it had a Dockerfile and appeared nowhere in the manifest, so the rule
meant to catch it could not see it.
