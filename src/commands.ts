// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';

let isActive = true;
let isTemporarilyDisabled = false;
let statusBarItem: vscode.StatusBarItem | undefined;
let stutteringConfig: {
  statusBar: {
    show: boolean;
    icon: boolean;
    enabledText: string;
    disabledText: string;
    enabled: {
      background: string;
      foreground: string;
      customForeground: string;
    };
    disabled: {
      background: string;
      foreground: string;
      customForeground: string;
    };
  };
} | undefined;

// Function to update status bar appearance
export function updateStatusBar(): void {
  if (!statusBarItem || !stutteringConfig) {
    return;
  }

  const statusBarConfig = stutteringConfig.statusBar;

  // Handle temporarily disabled state
  if (isTemporarilyDisabled) {
    const icon = statusBarConfig.icon ? "$(alert) " : "";
    statusBarItem.text = icon + (statusBarConfig.enabledText || "");
    statusBarItem.tooltip = 'Stuttering temporarily disabled until next change';
    statusBarItem.show();
    return;
  }

  const isActiveState = isActive;

  // Show/hide status bar
  if (statusBarConfig.show) {
    // Set text with optional icon
    const icon = statusBarConfig.icon ? (isActiveState ? "$(check) " : "$(x) ") : "";
    const text = isActiveState ? statusBarConfig.enabledText : statusBarConfig.disabledText;
    statusBarItem.text = icon + text;

    // Set tooltip and command
    statusBarItem.tooltip = 'Toggle Stuttering Extension';
    statusBarItem.command = {
      command: 'stuttering.toggle',
      title: 'Toggle Stuttering'
    };

    // Set colors based on configuration
    const colorConfig = isActiveState ? statusBarConfig.enabled : statusBarConfig.disabled;

    // Reset to default first
    statusBarItem.backgroundColor = undefined;
    statusBarItem.color = undefined;

    // Apply background color
    if (colorConfig.background === 'prominent') {
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
    } else if (colorConfig.background === 'error') {
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else if (colorConfig.background === 'warning') {
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }

    // Apply foreground color
    if (colorConfig.foreground === 'prominent') {
      statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
    } else if (colorConfig.foreground === 'error') {
      statusBarItem.color = new vscode.ThemeColor('statusBarItem.errorForeground');
    } else if (colorConfig.foreground === 'warning') {
      statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');
    } else if (colorConfig.foreground === 'custom' && colorConfig.customForeground) {
      statusBarItem.color = colorConfig.customForeground;
    }

    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
}

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

    // Update status bar
    updateStatusBar();
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
 * Updates the stuttering configuration
 *
 * @param config The stuttering configuration object
 */
export function updateStutteringConfig(config: {
  statusBar: {
    show: boolean;
    icon: boolean;
    enabledText: string;
    disabledText: string;
    enabled: {
      background: string;
      foreground: string;
      customForeground: string;
    };
    disabled: {
      background: string;
      foreground: string;
      customForeground: string;
    };
  };
}) {
  stutteringConfig = config;
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
  updateStatusBar();
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
  updateStatusBar();
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

  updateStatusBar();

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

  updateStatusBar();
}