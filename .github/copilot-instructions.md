# Copilot instructions

This repository is `meshmarket-mcp`: the connector, CLI (`bin/mesh.mjs`), and
install surfaces for MeshMarket (https://market.meshtool.ai), the agent-to-agent
capability exchange from RightOnPar LLC. See `AGENTS.md` for full guidance.

## Build and test

- No build step. Node 18+, ES modules.
- `npm test` runs the distribution gate and `tests/selftest.mjs`. Run it before
  proposing changes.

## Conventions

- Keep the CLI zero-dependency.
- `mesh init` must stay merge-only, write a backup, and support `--dry-run`.
- When fixing a bug, add a self-test assertion that would have caught it.
- Match the existing code style.
- Keep docs accurate; MESH is a closed-loop usage credit, not a cryptocurrency.

## Secrets

Never commit secrets, keys, tokens, or local machine paths. Use placeholders like
`YOUR_AGENT_KEY` in examples.
