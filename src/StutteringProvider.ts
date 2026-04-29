// Copyright (c) 2026 Vince's Codes
// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import {
  getClosingCharacter,
  getLanguageMappings,
  getReplacements,
  getIndent,
  fixReplacement,
  insertAtIndex,
  removeAtIndex
} from './utilities';
import { isExtensionChange, markExtensionChange } from './cache';
import { isStutteringTemporarilyDisabled, reenableAfterTemporaryDisable } from './commands';

interface StutteringConfig {
  mappings: Record<string, {languages: string[], mappings: string[], replace: string}[]>;
  processMultiLine: boolean;
  escape: boolean;
  escapeCharacter: string;
  smartClose: boolean;
  positionMarker: boolean;
  positionMarkerCharacter: string;
}

/**
 * Handles text document changes for stuttering functionality
 *
 * @param event The text document change event
 * @param editor The text editor where the change occurred
 * @param mappings The language mappings configuration for stuttering patterns
 * @returns A promise that resolves when all edits are complete
 */
export function handleTextChange(
  event: vscode.TextDocumentChangeEvent,
  editor: vscode.TextEditor,
  config: StutteringConfig
) {
  const document = event.document;
  const changes = event.contentChanges;
  const reason = event.reason;
  const {
    mappings,
    processMultiLine,
    escape,
    escapeCharacter,
    smartClose,
    positionMarker,
    positionMarkerCharacter
  } = config;

  // Only process user-initiated changes
  if (reason === vscode.TextDocumentChangeReason.Undo ||
      reason === vscode.TextDocumentChangeReason.Redo ||
      changes.length === 0) {
    return;
  }

  // Filter out changes made by this extension or empty changes
  const userChanges = changes.filter(change => {
    // Skip empty changes
    if (change.text.length === 0) {
      return false;
    }

    // If multi-line processing is disabled, skip changes that span multiple lines
    if (!processMultiLine) {
      const startPos = document.positionAt(change.rangeOffset);
      const endPos = document.positionAt(change.rangeOffset + change.text.length + 1);

      if (startPos.character === 0 && startPos.line !== endPos.line) {
        return false;
      }
    }

    // Skip changes made by this extension
    return !isExtensionChange(document, new vscode.Range(
      document.positionAt(change.rangeOffset),
      document.positionAt(change.rangeOffset + change.text.length)
    ), change.text);
  });

  if (userChanges.length === 0 || isStutteringTemporarilyDisabled()) {
    // If there are no user changes but stuttering was temporarily disabled,
    // re-enable it after any change (even if filtered out)
    reenableAfterTemporaryDisable();
    return;
  }

  // Get mappings for the current language and determine the maximum previous text length to check
  const { matchingMappings, maxPreviousLength } = getLanguageMappings(mappings, document.languageId);

  if (Object.keys(matchingMappings).length === 0) {
    return; // No mappings for this language
  }

  // Process each user-made change
  const editPromises = userChanges.map(change => {
    return new Promise<void>((resolve) => {
      const text = change.text;
      let baseOffset = change.rangeOffset;

      // Get the indentation of the current line
      const indent = getIndent(document, baseOffset);

      // Extract the previous text based on the biggest size from the mappings
      let previousText = document.getText(new vscode.Range(
        document.positionAt(Math.max(0, baseOffset - maxPreviousLength)),
        document.positionAt(baseOffset)
      ));

      let closingChar = getClosingCharacter(editor, change.rangeOffset);
      let replacement = {replacement: '', index: 0};

      // Process each character in the text
      for (let i = 0; i < text.length; i++) {
        const currentChar = text[i];
        const previous = previousText + replacement.replacement;

        if (smartClose && [')', ']', '}'].includes(currentChar)) {
          replacement = insertAtIndex(replacement, (closingChar === null ? currentChar : closingChar), positionMarker, positionMarkerCharacter);
          closingChar = null;
        } else if (Object.keys(matchingMappings).includes(currentChar)) {
          const sequence = matchingMappings[currentChar];

          if (sequence) {
            let matched = false;
            const replacements = getReplacements(currentChar, sequence, document.languageId);

            for (const rep of replacements) {
              if (previous.endsWith(rep.previous)) {
                const fromReplacement = Math.min(rep.previous.length, replacement.index);
                const fromPrevious = rep.previous.length - fromReplacement;
                const fixedReplacement = fixReplacement(rep.replacement, indent);

                replacement = removeAtIndex(replacement, fromReplacement);
                replacement = insertAtIndex(replacement, fixedReplacement, positionMarker, positionMarkerCharacter);
                if (fromPrevious > 0) {
                  previousText = previousText.slice(0, -fromPrevious);
                  baseOffset -= fromPrevious;
                }
                matched = true;
                break;
              } else if (escape && previous.endsWith(rep.previous + escapeCharacter)) {
                const fromReplacement = Math.min(escapeCharacter.length, replacement.index);
                const fromPrevious = escapeCharacter.length - fromReplacement;

                replacement = removeAtIndex(replacement, fromReplacement);
                replacement = insertAtIndex(replacement, (sequence.replace ? sequence.replace : currentChar), positionMarker, positionMarkerCharacter);
                if (fromPrevious > 0) {
                  previousText = previousText.slice(0, -fromPrevious);
                  baseOffset -= fromPrevious;
                }
                matched = true;
                break;
              }
            }
            if (!matched) {
              replacement = insertAtIndex(replacement, (sequence.replace ? sequence.replace : currentChar), positionMarker, positionMarkerCharacter);
            }
          } else {
            replacement = insertAtIndex(replacement, currentChar, positionMarker, positionMarkerCharacter);
          }
        } else {
          replacement = insertAtIndex(replacement, currentChar, positionMarker, positionMarkerCharacter);
        }
      }

      if (baseOffset !== change.rangeOffset || replacement.replacement !== text) {
        editor.edit(editBuilder => {
          const editRange = new vscode.Range(
            document.positionAt(baseOffset),
            document.positionAt(change.rangeOffset + text.length)
          );

          editBuilder.replace(editRange, replacement.replacement);
          markExtensionChange(document, editRange, replacement.replacement);
        }).then(() => {
          if (positionMarker && replacement.index !== replacement.replacement.length) {
            // Move cursor to the position marker index
            const cursorPosition = document.positionAt(baseOffset + replacement.index);

            editor.selection = new vscode.Selection(cursorPosition, cursorPosition);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  });

  // Wait for all edits to complete
  return Promise.all(editPromises);
}