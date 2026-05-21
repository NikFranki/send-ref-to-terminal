# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run compile       # compile TypeScript → out/
npm run watch         # watch mode for development
vsce package          # package as .vsix for distribution
code --install-extension send-ref-to-terminal-x.x.x.vsix  # local install
```

There are no tests in this project. Debug by pressing **F5** in VS Code, which launches an Extension Development Host with the extension loaded (runs `npm run compile` first via `preLaunchTask`).

## Architecture

Single-file extension: all logic lives in `src/extension.ts`, compiled to `out/extension.js`.

**Three registered providers/commands in `activate()`:**

1. **`FileRefTerminalLinkProvider`** — makes `path/file.ext:10-20` patterns in the terminal clickable. The regex matches relative paths that resolve to real files in the workspace; clicking opens the file at the specified line range.

2. **`AddToTerminalActionProvider`** — registers a code action (lightbulb) on all language files that triggers `sendRefToTerminal.send`.

3. **`sendRefToTerminal.send`** command — sends a `relativePath:startLine-endLine` reference for the current selection to the active terminal. Tracks `lastEditor`/`lastSelection` via event listeners to handle the case where focus moves to the terminal before the command fires.

4. **`sendRefToTerminal.sendFile`** command — sends just the relative file path (no line numbers) to the terminal. Triggered from the Explorer context menu or editor title tab right-click.

**Reference format:** `src/extension.ts:10-20` (multi-line), `src/extension.ts:10` (single line), or `src/extension.ts` (whole file). All paths are workspace-relative.

## Publishing

Bump `version` in `package.json`, then:

```bash
vsce package                    # generates .vsix
# Upload .vsix at marketplace.visualstudio.com/manage
```

Publisher ID is `Franki` — must match the Marketplace publisher account. Version numbers cannot be reused.
