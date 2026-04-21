import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface FileRefLinkData {
  relativePath: string;
  startLine: number;
  endLine: number;
}

class FileRefTerminalLinkProvider implements vscode.TerminalLinkProvider<vscode.TerminalLink & { data: FileRefLinkData }> {
  // matches: some/path/file.ext  or  some/path/file.ext:10  or  some/path/file.ext:10-20
  private static readonly PATTERN = /([\w.\-/\\]+\.[a-zA-Z0-9]+)(?::(\d+)(?:-(\d+))?)?/g;

  async provideTerminalLinks(context: vscode.TerminalLinkContext): Promise<Array<vscode.TerminalLink & { data: FileRefLinkData }>> {
    const links: Array<vscode.TerminalLink & { data: FileRefLinkData }> = [];
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) return links;

    const pattern = new RegExp(FileRefTerminalLinkProvider.PATTERN.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(context.line)) !== null) {
      const [full, relativePath, startStr, endStr] = match;

      const exists = folders.some(f =>
        fs.existsSync(path.join(f.uri.fsPath, relativePath))
      );
      if (!exists) continue;

      const startLine = startStr ? parseInt(startStr) - 1 : 0;
      const endLine = endStr ? parseInt(endStr) - 1 : startLine;
      const lineLabel = startStr
        ? (endLine > startLine ? `${startLine + 1}-${endLine + 1}` : `${startLine + 1}`)
        : '';

      const folder = folders.find(f => fs.existsSync(path.join(f.uri.fsPath, relativePath)))!;
      const absPath = path.join(folder.uri.fsPath, relativePath);

      links.push({
        startIndex: match.index,
        length: full.length,
        tooltip: lineLabel ? `${absPath} (${lineLabel})` : absPath,
        data: { relativePath, startLine, endLine }
      });
    }
    return links;
  }

  handleTerminalLink(link: vscode.TerminalLink & { data: FileRefLinkData }): void {
    const { relativePath, startLine, endLine } = link.data;
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) return;

    const folder = folders.find(f => fs.existsSync(path.join(f.uri.fsPath, relativePath)));
    if (!folder) return;

    const uri = vscode.Uri.file(path.join(folder.uri.fsPath, relativePath));
    vscode.window.showTextDocument(uri, {
      selection: new vscode.Range(startLine, 0, endLine, Number.MAX_SAFE_INTEGER),
      preserveFocus: false
    });
  }
}

class AddToTerminalActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(_document: vscode.TextDocument, _range: vscode.Range): vscode.CodeAction[] {
    const action = new vscode.CodeAction('Add to Terminal', vscode.CodeActionKind.QuickFix);
    action.command = { command: 'sendRefToTerminal.send', title: 'Add to Terminal' };
    return [action];
  }
}

function getRelativePath(filePath: string): string {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return path.basename(filePath);
  const folder = folders.find(f => filePath.startsWith(f.uri.fsPath));
  return folder ? path.relative(folder.uri.fsPath, filePath) : path.basename(filePath);
}

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

  context.subscriptions.push(
    vscode.window.registerTerminalLinkProvider(new FileRefTerminalLinkProvider())
  );

  const fileCmd = vscode.commands.registerCommand('sendRefToTerminal.sendFile', (uri: vscode.Uri) => {
    const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
    if (!targetUri) return;

    const ref = getRelativePath(targetUri.fsPath);
    const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal();
    terminal.show(false);
    terminal.sendText(ref, false);
  });

  context.subscriptions.push(fileCmd);

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('*', new AddToTerminalActionProvider())
  );

  const cmd = vscode.commands.registerCommand('sendRefToTerminal.send', () => {
    const editor = vscode.window.activeTextEditor ?? lastEditor;
    if (!editor) return;

    const selection = vscode.window.activeTextEditor ? editor.selection : lastSelection;
    const relativePath = getRelativePath(editor.document.uri.fsPath);

    let ref: string;
    if (!selection || selection.isEmpty) {
      ref = `${relativePath}:${editor.selection.active.line + 1}`;
    } else {
      const startLine = selection.start.line + 1;
      const endLine = selection.end.line + 1;
      ref = startLine === endLine
        ? `${relativePath}:${startLine}`
        : `${relativePath}:${startLine}-${endLine}`;
    }

    const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal();
    terminal.show(false);
    terminal.sendText(ref, false);
  });

  context.subscriptions.push(cmd);
}

export function deactivate() {}
