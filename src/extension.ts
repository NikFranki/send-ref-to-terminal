import * as vscode from 'vscode';
import * as path from 'path';

interface FileRefLinkData {
  uri: vscode.Uri;
  startLine: number;
  endLine: number;
}

class FileRefTerminalLinkProvider implements vscode.TerminalLinkProvider<vscode.TerminalLink & { data: FileRefLinkData }> {
  // matches: filename.ext:10  or  filename.ext:10-20
  private static readonly PATTERN = /([^\s/\\]+\.[a-zA-Z0-9]+):(\d+)(?:-(\d+))?/g;

  async provideTerminalLinks(context: vscode.TerminalLinkContext): Promise<Array<vscode.TerminalLink & { data: FileRefLinkData }>> {
    const links: Array<vscode.TerminalLink & { data: FileRefLinkData }> = [];
    const pattern = new RegExp(FileRefTerminalLinkProvider.PATTERN.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(context.line)) !== null) {
      const [full, fileName, startStr, endStr] = match;
      const results = await vscode.workspace.findFiles(`**/${fileName}`, '**/node_modules/**', 5);
      if (results.length === 0) continue;

      const startLine = parseInt(startStr) - 1;
      const endLine = endStr ? parseInt(endStr) - 1 : startLine;

      const lineLabel = endLine > startLine ? `${startLine + 1}-${endLine + 1}` : `${startLine + 1}`;
      links.push({
        startIndex: match.index,
        length: full.length,
        tooltip: `${results[0].fsPath} (${lineLabel})`,
        data: { uri: results[0], startLine, endLine }
      });
    }
    return links;
  }

  handleTerminalLink(link: vscode.TerminalLink & { data: FileRefLinkData }): void {
    const { uri, startLine, endLine } = link.data;
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

    const ref = path.basename(targetUri.fsPath);
    const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal();
    terminal.show(true);
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
    const filePath = editor.document.uri.fsPath;
    const fileName = path.basename(filePath);

    let ref: string;
    if (!selection || selection.isEmpty) {
      ref = `${fileName}:${editor.selection.active.line + 1}`;
    } else {
      const startLine = selection.start.line + 1;
      const endLine = selection.end.line + 1;
      ref = startLine === endLine
        ? `${fileName}:${startLine}`
        : `${fileName}:${startLine}-${endLine}`;
    }

    const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal();
    terminal.show(true);
    terminal.sendText(ref, false);
  });

  context.subscriptions.push(cmd);
}

export function deactivate() {}
