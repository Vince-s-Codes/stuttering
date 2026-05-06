// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import {
  disableStuttering,
  disableTemporarily,
  enableStuttering,
  setStatusBarItem,
  pasteWithoutStuttering,
  isStutteringActive,
  toggleStuttering,
  updateStatusBar,
  updateStutteringConfig
} from './commands';
import { handleTextChange } from './StutteringProvider';
import { clearAllCaches } from './cache';
import { setLogLevel, LogLevel, LogLevelType } from './log';

export function activate(context: vscode.ExtensionContext) {
  // Initialize configuration
  let stutteringConfig = getStutteringConfig();

  function getStutteringConfig() {
    const config = vscode.workspace.getConfiguration('stuttering');

    // Set the log level
    const logLevel = config.get<string>('logLevel', 'none');
    let levelValue: LogLevelType = LogLevel.NONE;

    switch (logLevel) {
      case 'none': levelValue = LogLevel.NONE; break;
      case 'error': levelValue = LogLevel.ERROR; break;
      case 'warning': levelValue = LogLevel.WARNING; break;
      case 'note': levelValue = LogLevel.NOTE; break;
      case 'debug': levelValue = LogLevel.DEBUG; break;
    }

    setLogLevel(levelValue);

    return {
      mappings: config.get<Record<string, {languages: string[], mappings: string[], replace: string}[]>>('mappings', {}),
      processMultiLine: config.get<boolean>('processMultiLine', false),
      escape: config.get<boolean>('escape', true),
      escapeCharacter: config.get<string>('escapeCharacter', "'"),
      smartClose: config.get<boolean>('smartClose', true),
      positionMarker: config.get<boolean>('positionMarker', true),
      positionMarkerCharacter: config.get<string>('positionMarkerCharacter', "$"),
      statusBar: config.get('statusBar', {
        show: true,
        icon: true,
        enabledText: 'Stuttering',
        disabledText: 'Stuttering',
        enabled: {
          background: 'default',
          foreground: 'default',
          customForeground: ''
        },
        disabled: {
          background: 'default',
          foreground: 'default',
          customForeground: ''
        }
      })
    };
  }

  // Watch for configuration changes
  const configWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('stuttering')) {
      stutteringConfig = getStutteringConfig();
      updateStutteringConfig(stutteringConfig);
      updateStatusBar();
      // Clear caches when mappings configuration changes
      clearAllCaches();
    }
  });
  context.subscriptions.push(configWatcher);

  // Create and set status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  setStatusBarItem(statusBarItem);
  context.subscriptions.push(statusBarItem);

  // Initial update
  updateStutteringConfig(stutteringConfig);
  updateStatusBar();

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
    handleTextChange(event, editor, stutteringConfig);
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