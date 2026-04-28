// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';

let isActive = true;
let isTemporarilyDisabled = false;
let statusBarItem: vscode.StatusBarItem | undefined;

/**
 * Pastes content from clipboard without stuttering
 *
 * Temporarily disables stuttering, performs the paste operation,
 * and then restores the previous stuttering state.
 */
export async function pasteWithoutStuttering() {
  const wasActive = isActive;

  // Temporarily disable stuttering
  isActive = false;

  try {
    // Execute the native paste command
    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
  } finally {
    // Restore the previous stuttering state
    isActive = wasActive;

    // Update status bar if needed
    if (statusBarItem) {
      statusBarItem.text = isActive ? "$(check) Stuttering" : "$(x) Stuttering";
    }
  }
}

/**
 * Sets the reference to the status bar item
 *
 * @param item The status bar item to reference
 */
export function setStatusBarItem(item: vscode.StatusBarItem) {
  statusBarItem = item;
}

/**
 * Toggles the stuttering extension on/off
 *
 * If the extension is active, it will be deactivated, and vice versa.
 * Updates the status bar item and shows a notification message.
 */
export function toggleStuttering() {
  if (isActive) {
    disableStuttering();
  } else {
    enableStuttering();
  }
}

/**
 * Enables the stuttering extension
 *
 * Sets the extension to active state, updates the status bar item,
 * and shows an activation notification message.
 */
export function enableStuttering() {
  isActive = true;
  if (statusBarItem) {
    statusBarItem.text = "$(check) Stuttering";
  }
  vscode.window.showInformationMessage('Stuttering extension activated.');
}

/**
 * Disables the stuttering extension
 *
 * Sets the extension to inactive state, updates the status bar item,
 * and shows a deactivation notification message.
 */
export function disableStuttering() {
  isActive = false;
  if (statusBarItem) {
    statusBarItem.text = "$(x) Stuttering";
  }
  vscode.window.showInformationMessage('Stuttering extension deactivated.');
}

/**
 * Checks if the stuttering extension is active
 *
 * This function determines whether stuttering transformations should be applied
 * to text changes. It returns false if the extension is completely disabled
 * or if it's temporarily disabled (until the next change).
 *
 * @returns true if stuttering should be applied, false otherwise
 */
export function isStutteringActive(): boolean {
  return isActive;
}

/**
 * Checks if stuttering is temporarily disabled
 *
 * This function checks the temporary disable flag that's set when
 * the user wants to make changes without stuttering transformations
 * but doesn't want to completely disable the extension.
 *
 * @returns true if stuttering is temporarily disabled, false otherwise
 */
export function isStutteringTemporarilyDisabled(): boolean {
  return isTemporarilyDisabled;
}

/**
 * Temporarily disables stuttering until the next change
 *
 * Sets a flag that prevents stuttering transformations from being applied
 * to text changes. The temporary disable will be automatically cleared
 * after the next non-empty change is made.
 *
 * This is useful when you need to type something without stuttering
 * transformations but don't want to completely disable the extension.
 *
 * Updates the status bar to show the temporarily disabled state and
 * shows an information message to the user.
 */
export function disableTemporarily() {
  isTemporarilyDisabled = true;

  if (statusBarItem) {
    statusBarItem.text = "$(alert) Stuttering (temporarily disabled)";
  }

  vscode.window.showInformationMessage('Stuttering temporarily disabled until next change.');
}

/**
 * Re-enables stuttering after temporary disable
 *
 * Clears the temporary disable flag, allowing stuttering transformations
 * to be applied again. This function is called automatically after any
 * text change when stuttering was temporarily disabled.
 *
 * Updates the status bar to reflect the current state of the extension
 * (active or inactive).
 */
export function reenableAfterTemporaryDisable() {
  isTemporarilyDisabled = false;

  if (statusBarItem) {
    statusBarItem.text = isActive ? "$(check) Stuttering" : "$(x) Stuttering";
  }
}