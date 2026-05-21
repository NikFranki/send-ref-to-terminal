# Send File Reference to Terminal

A VS Code extension for sending file/folder references to the terminal — designed for use with AI tools like **Claude Code** that accept `file:line` format as context.

## What it does

When you select code and trigger the command, the extension writes a reference like `src/extension.ts:10-20` directly into the active terminal — without pressing Enter, so you can append more context before submitting.

It also makes those references **clickable in the terminal**: any `path/file.ext:10-20` pattern becomes a link that opens the file at that line range.

## Usage

### Send a code selection

Select code in the editor, then:
- Press `Ctrl+Shift+Alt+R`, or
- Right-click → **Add to Terminal**

Outputs: `src/extension.ts:10-20`

### Send a file

Right-click a file in the Explorer or the editor tab → **Send File to Terminal**

Outputs: `src/extension.ts`

### Send a folder

Right-click a folder in the Explorer → **Send Folder to Terminal**

Outputs: `src/components`

### Click a reference in the terminal

Any `path/file.ext:line` pattern printed in the terminal becomes a clickable link — click to jump to that file and line in the editor.

## Keybinding

| Key | Action |
|-----|--------|
| `Ctrl+Shift+Alt+R` | Send selected code reference to terminal |
