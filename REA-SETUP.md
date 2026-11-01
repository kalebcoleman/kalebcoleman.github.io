# REA in this project

This project configures [REA](https://github.com/morluto/rea) 6.8.0 as an MCP server for Codex, Claude Code, OpenCode, and Antigravity's project configuration. It also includes the matching REA skill for clients that discover project skills.

Install Node.js and npm, open this folder as a trusted project, and restart the coding agent. The first connection downloads the pinned REA and Node 24 packages into npm's cache; subsequent connections reuse that cache. Claude Code may ask you to approve the project MCP server. Codex loads project configuration only for trusted projects. The server is available in new sessions, not already-running sessions.

- Codex: `.codex/config.toml`
- Claude Code: `.mcp.json` and `.claude/skills/`
- OpenCode: `opencode.json` and `.agents/skills/`
- Antigravity CLI: `.agents/mcp_config.json` and `.agents/skills/`

The standalone Antigravity application may require adding the same `rea` entry from `.agents/mcp_config.json` to its MCP settings through Settings → Customizations → Installed MCP Servers → Open MCP Config. See [Google's instructions](https://developers.google.com/knowledge/mcp).

Check the configuration from this folder with `codex mcp list`, `claude mcp list`, or `opencode debug config --standalone`. OpenCode 2 may list its background service's servers separately from the project configuration. REA provides JavaScript analysis without an additional native engine. Native binary analysis and some other targets require separate tools, such as Ghidra, and their configuration; see [REA's setup guide](https://github.com/morluto/rea/blob/main/docs/installation.md).
