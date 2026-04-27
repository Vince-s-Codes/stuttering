// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';

let isActive = true;
let statusBarItem: vscode.StatusBarItem | undefined;

/**
 * Set the status bar item reference
 */
export function setStatusBarItem(item: vscode.StatusBarItem) {
  statusBarItem = item;
}

/**
 * Toggle the stuttering extension on/off
 */
export function toggleStuttering() {
  isActive = !isActive;
  if (statusBarItem) {
    statusBarItem.text = isActive ? "$(check) Stuttering" : "$(x) Stuttering";
  }
  vscode.window.showInformationMessage(`Stuttering extension ${isActive ? 'activated' : 'deactivated'}.`);
}

/**
 * Check if the stuttering extension is active
 */
export function isStutteringActive(): boolean {
  return isActive;
}