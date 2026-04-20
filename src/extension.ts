import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  let lastEditor: vscode.TextEditor | undefined;
  let lastSelection: vscode.Selection | undefined;

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(e => {
      if (e) lastEditor = e;
    }),
    vscode.window.onDidChangeTextEditorSelection(e => {
      if (!e.selections[0].isEmpty) {
        lastEditor = e.textEditor;
        lastSelection = e.selections[0];
      }
    })
  );

  const cmd = vscode.commands.registerCommand('sendRefToTerminal.send', () => {
    const editor = vscode.window.activeTextEditor ?? lastEditor;
    if (!editor) return;

    const selection = vscode.window.activeTextEditor
      ? editor.selection
      : lastSelection;
    if (!selection || selection.isEmpty) return;

    const filePath = editor.document.uri.fsPath;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    const relativePath = workspaceFolder
      ? path.relative(workspaceFolder.uri.fsPath, filePath)
      : filePath;

    const startLine = selection.start.line + 1;
    const endLine = selection.end.line + 1;

    const ref = startLine === endLine
      ? `${relativePath}:${startLine}`
      : `${relativePath}:${startLine}-${endLine}`;

    const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal();
    terminal.show(true);
    terminal.sendText(ref, false);
  });

  context.subscriptions.push(cmd);
}

export function deactivate() {}
