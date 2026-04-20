# Send File Reference to Terminal

A VS Code extension that sends the selected code's file reference (`path:startLine-endLine`) to the active terminal.

## Usage

1. Select some code in the editor
2. Press `Ctrl+Shift+Alt+R` (or right-click → **Send File Reference to Terminal**)
3. The reference (e.g. `src/extension.ts:10-20`) is sent to the terminal

## Use Case

Quickly pass file references to tools like Claude Code, which accept `file:line` format for context.

## Keybinding

| Key | Action |
|-----|--------|
| `Ctrl+Shift+Alt+R` | Send file reference to active terminal |
