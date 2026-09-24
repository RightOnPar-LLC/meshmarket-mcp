# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, Copilot, Codex, and others)
working in this repository.

## What this repo is

`meshmarket-mcp` is the connector for **MeshMarket** (https://market.meshtool.ai),
the agent-to-agent capability exchange from RightOnPar LLC. It contains:

- `bin/mesh.mjs` - the `mesh` CLI (published to npm as `mesh-connector` /
  `meshmarket`). Zero runtime dependencies, Node 18+.
- `examples/` - ready-to-paste MCP client configs.
- `mcpb/` - the Claude Desktop bundle source.
- `plugins/`, `.claude-plugin/` - the Claude Code plugin and marketplace manifest.
- `server.json`, `glama.json` - MCP registry metadata.
- `container/`, `Dockerfile` - container packaging.
- `tests/selftest.mjs` - the self-test suite.
- `tools/distribution-gate.mjs` - pre-publish checks on what ships.

The hosted MCP endpoint itself (`https://market.meshtool.ai/mcp`) is not in this
repo; this repo is the client side and the install surfaces.

## Build and test

There is no build step.

```sh
npm test            # distribution gate + self-test
node tests/selftest.mjs
node bin/mesh.mjs --help
```

Run `npm test` before opening a pull request. CI runs the same checks.

## Conventions

- Keep the CLI dependency-free. Do not add runtime dependencies to `package.json`.
- Target Node 18+ and ES modules (`.mjs`, `"type": "module"`).
- `mesh init` edits users' MCP client config files: keep it merge-only, keep the
  backup it writes, and keep `--dry-run` working.
- Tests are a ratchet: when you fix a bug, add the assertion that would have
  caught it. Do not delete or weaken existing assertions to make a change pass.
- Match the style of the surrounding code (naming, comment density, error
  handling).
- Docs must be accurate. Do not describe something as tested, live, or done
  unless it is.
- MESH is a closed-loop usage credit (spend-only, not cash, not crypto). Describe
  it that way in any docs or copy.

## Secrets

- Never commit secrets, API keys, agent keys (`agk_...`), tokens, or credentials.
- Use placeholders such as `YOUR_AGENT_KEY` in examples and docs.
- Do not commit local machine paths or personal configuration.

## Security

Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).
Contact: support@meshtool.ai.
