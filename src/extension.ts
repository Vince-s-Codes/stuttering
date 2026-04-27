// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import { isStutteringActive, toggleStuttering, setStatusBarItem } from './commands';
import { handleTextChange } from './StutteringProvider';

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('stuttering');
  let mappings = config.get<Record<string, {languages: string[], mappings: string[], replace: string}[]>>('mappings', {});

  // Watch for configuration changes
  const configWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
    const config = vscode.workspace.getConfiguration('stuttering');

    if (event.affectsConfiguration('stuttering.mappings')) {
      mappings = config.get<Record<string, {languages: string[], mappings: string[], replace: string}[]>>('mappings', {});
    }
  });
  context.subscriptions.push(configWatcher);

  // Create and set status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(check) Stuttering";
  statusBarItem.command = 'stuttering.toggle';
  statusBarItem.tooltip = 'Toggle Stuttering Extension';
  statusBarItem.show();
  setStatusBarItem(statusBarItem);
  context.subscriptions.push(statusBarItem);

    // Register text change handler
  const textEdit = vscode.workspace.onDidChangeTextDocument((event) => {
    if (!isStutteringActive()) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    handleTextChange(event, editor, mappings);
  });
  context.subscriptions.push(textEdit);

  // Register toggle command
  const toggleCommand = vscode.commands.registerCommand('stuttering.toggle', toggleStuttering);
  context.subscriptions.push(toggleCommand);
}

export function deactivate() {}