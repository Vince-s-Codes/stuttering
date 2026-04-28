// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import { disableStuttering, disableTemporarily, enableStuttering, isStutteringActive, toggleStuttering, setStatusBarItem, pasteWithoutStuttering } from './commands';
import { handleTextChange } from './StutteringProvider';
import { clearAllCaches } from './cache';

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('stuttering');
  let mappings = config.get<Record<string, {languages: string[], mappings: string[], replace: string}[]>>('mappings', {});

  // Watch for configuration changes
  const configWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
    const config = vscode.workspace.getConfiguration('stuttering');

    if (event.affectsConfiguration('stuttering.mappings')) {
      mappings = config.get<Record<string, {languages: string[], mappings: string[], replace: string}[]>>('mappings', {});
      // Clear caches when mappings configuration changes
      clearAllCaches();
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
    if(!isStutteringActive()) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    // Process the text change
    handleTextChange(event, editor, mappings);
  });
  context.subscriptions.push(textEdit);

      // Register commands
  const toggleCommand = vscode.commands.registerCommand('stuttering.toggle', toggleStuttering);
  const enableCommand = vscode.commands.registerCommand('stuttering.enable', enableStuttering);
  const disableCommand = vscode.commands.registerCommand('stuttering.disable', disableStuttering);
  const pasteCommand = vscode.commands.registerCommand('stuttering.pasteWithoutStuttering', pasteWithoutStuttering);
  const tempDisableCommand = vscode.commands.registerCommand('stuttering.disableTemporarily', disableTemporarily);

  context.subscriptions.push(toggleCommand, enableCommand, disableCommand, pasteCommand, tempDisableCommand);
}

export function deactivate() {}